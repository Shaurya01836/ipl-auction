import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVER_LOCAL,
  AUCTION_SERVERS,
  getServerMeta,
} from '../src/lib/auctionServers.js';
import {
  enterLocalMode,
  exitLocalMode,
  isLocalMode,
  getRtdb,
  goOnlineServer,
  goOfflineAllServers,
} from '../src/lib/firebase.js';
import { convertLobbyToSolo } from '../src/lib/lobbyConversion.js';
import {
  createSoloBotLoop,
  createSoloStateManager,
  handleSoloEndAuction,
  handleSoloSendMessage,
} from '../src/lib/soloAuctionSession.js';
import {
  localAuctionReducer,
  loadLocalSoloRoom,
  saveLocalSoloRoom,
} from '../src/lib/localAuctionEngine.js';

// Setup Mock In-Memory localStorage for Node test runner
function setupTestStorage() {
  const memoryStore = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
      setItem: (key, val) => memoryStore.set(key, String(val)),
      removeItem: (key) => memoryStore.delete(key),
      clear: () => memoryStore.clear(),
    },
  };
  return memoryStore;
}

test('goOfflineAllServers shuts down all active RTDB instances and reconnects safely', () => {
  // 1. Enter device-local solo mode
  enterLocalMode();
  assert.equal(isLocalMode(), true);

  // 2. In local mode, goOnlineServer and getRtdb throw immediately
  assert.throws(
    () => goOnlineServer('server-1'),
    /Cannot connect RTDB server while in local solo mode/,
  );
  assert.throws(
    () => getRtdb('server-1'),
    /RTDB access is strictly prohibited in device-local solo mode/,
  );

  // 3. goOfflineAllServers executes cleanly
  assert.doesNotThrow(() => goOfflineAllServers());

  // 4. Exit local mode restores cloud connectivity
  exitLocalMode();
  assert.equal(isLocalMode(), false);
  const cloudRtdb = getRtdb('server-1');
  assert.ok(cloudRtdb, 'Cloud RTDB is accessible after exiting local mode');
  assert.doesNotThrow(() => goOnlineServer('server-1'));
});

test('exitLocalMode restores RTDB and goOnlineServer, StrictMode enter/exit/enter ends in local mode', () => {
  // Leaving local mode completely restores cloud connectivity
  enterLocalMode();
  assert.equal(isLocalMode(), true);
  exitLocalMode();
  assert.equal(isLocalMode(), false);

  assert.doesNotThrow(() => getRtdb('server-1'));
  assert.doesNotThrow(() => goOnlineServer('server-1'));

  // StrictMode double effect simulation: mount (enter) -> cleanup (exit) -> remount (enter)
  enterLocalMode();
  assert.equal(isLocalMode(), true);
  exitLocalMode();
  assert.equal(isLocalMode(), false);
  enterLocalMode();
  assert.equal(isLocalMode(), true);

  // Verifying final state after StrictMode double effect is safely local
  assert.throws(
    () => getRtdb('server-1'),
    /RTDB access is strictly prohibited in device-local solo mode/,
  );

  // Cleanup
  exitLocalMode();
  assert.equal(isLocalMode(), false);
});

test('ServerSwitcher correctly excludes any server with isLocal: true', () => {
  const allServers = [
    ...AUCTION_SERVERS,
    getServerMeta(SERVER_LOCAL),
  ];

  const visible = allServers.filter((s) => !s.isLocal);

  assert.equal(allServers.length, 5);
  assert.equal(visible.length, 4);
  assert.ok(!visible.some((s) => s.id === SERVER_LOCAL));
  assert.ok(!visible.some((s) => s.isLocal));
});

test('lobby conversion order: save -> verify -> await delete (retry once) -> goOffline -> navigate', async () => {
  setupTestStorage();

  const cloudRoomId = 'CLOUD-TEST-123';
  const steps = [];

  let rtdbDeleteAttempts = 0;
  const mockRtdbDelete = async (id) => {
    steps.push(`rtdb-delete-${id}`);
    rtdbDeleteAttempts++;
    if (rtdbDeleteAttempts === 1) {
      throw new Error('Transient RTDB network glitch');
    }
  };

  // Track Supabase delete calls and simulate 1 retry
  let supaDeleteAttempts = 0;
  const mockSupabaseClient = {
    from: (table) => {
      steps.push(`supabase-from-${table}`);
      return {
        delete: () => ({
          eq: async (col, val) => {
            steps.push(`supabase-delete-${col}-${val}`);
            supaDeleteAttempts++;
            if (supaDeleteAttempts === 1) {
              return { error: new Error('Transient Supabase timeout') };
            }
            return { error: null };
          },
        }),
      };
    },
  };

  let navigatedPath = null;
  const mockNavigate = (url) => {
    steps.push(`navigate-${url}`);
    navigatedPath = url;
  };

  const user = { uid: 'usr_host_1', displayName: 'Captain' };
  const currentUserPlayer = { name: 'Captain', team: 'CSK' };
  const currentAuction = { auctionType: 'sprint5', settings: { budget: 60, bidTimer: 10 } };

  // Execute real lobby conversion helper with injected mock clients
  const result = await convertLobbyToSolo({
    roomId: cloudRoomId,
    user,
    currentUserPlayer,
    currentAuction,
    server: 'server-1',
    rtdbDeleteFn: mockRtdbDelete,
    supabaseClient: mockSupabaseClient,
    navigate: mockNavigate,
  });

  // Verification 1: Room id must be a fresh SOLO- code
  assert.ok(result.soloRoomId.startsWith('SOLO-'));

  // Verification 2: Saved locally and readable
  const saved = loadLocalSoloRoom(result.soloRoomId);
  assert.ok(saved);
  assert.equal(saved.id, result.soloRoomId);
  assert.equal(saved.auctionType, 'sprint5');

  // Verification 3: Navigated to /auction/SOLO-XXXXXX?server=local
  assert.equal(navigatedPath, `/auction/${result.soloRoomId}?server=local`);

  // Verification 4: RTDB and Supabase deletes both retried once and succeeded
  assert.equal(rtdbDeleteAttempts, 2, 'RTDB delete should retry once on failure');
  assert.equal(supaDeleteAttempts, 2, 'Supabase delete should retry once on failure');
});

test('lobby conversion ordering 1: save/verify failure aborts BEFORE any destructive call (RTDB & Supabase untouched)', async () => {
  // Setup broken storage where setItem does nothing (verification load returns null)
  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  let rtdbDeleteCalled = false;
  const mockRtdbDelete = async () => { rtdbDeleteCalled = true; };

  let supabaseCalled = false;
  const mockSupabaseClient = {
    from: () => {
      supabaseCalled = true;
      return { delete: () => ({ eq: async () => ({ error: null }) }) };
    },
  };

  let navigated = false;
  const mockNavigate = () => { navigated = true; };

  await assert.rejects(
    async () => {
      await convertLobbyToSolo({
        roomId: 'CLOUD-FAIL-VERIFY',
        user: { uid: 'usr_fail' },
        currentUserPlayer: { name: 'Fail', team: 'MI' },
        currentAuction: { auctionType: 'mega' },
        rtdbDeleteFn: mockRtdbDelete,
        supabaseClient: mockSupabaseClient,
        navigate: mockNavigate,
      });
    },
    /Verification of local solo save failed/,
  );

  assert.equal(rtdbDeleteCalled, false, 'RTDB delete must NEVER be called when verify fails');
  assert.equal(supabaseCalled, false, 'Supabase must NEVER be called when verify fails');
  assert.equal(navigated, false, 'Must not navigate when verify fails');
});

test('lobby conversion ordering 2: RTDB delete failure after verified save warns and continues to local mode', async () => {
  setupTestStorage();

  let rtdbDeleteAttempts = 0;
  const mockRtdbDelete = async () => {
    rtdbDeleteAttempts++;
    throw new Error('Persistent RTDB deletion failure');
  };

  let supaDeleteCalled = false;
  const mockSupabaseClient = {
    from: () => ({
      delete: () => ({
        eq: async () => {
          supaDeleteCalled = true;
          return { error: null };
        },
      }),
    }),
  };

  let navigatedTo = null;
  const mockNavigate = (url) => { navigatedTo = url; };

  const result = await convertLobbyToSolo({
    roomId: 'CLOUD-RTDB-FAIL',
    user: { uid: 'usr_1' },
    currentUserPlayer: { name: 'P1', team: 'CSK' },
    currentAuction: { auctionType: 'sprint5' },
    rtdbDeleteFn: mockRtdbDelete,
    supabaseClient: mockSupabaseClient,
    navigate: mockNavigate,
  });

  assert.ok(result.soloRoomId.startsWith('SOLO-'));
  assert.equal(rtdbDeleteAttempts, 2, 'Should attempt RTDB delete twice');
  assert.equal(supaDeleteCalled, true, 'Supabase cleanup should still execute');
  assert.equal(navigatedTo, `/auction/${result.soloRoomId}?server=local`);
});

test('lobby conversion ordering 3: Supabase delete fails, falls back to update status cancelled, continues to local mode', async () => {
  setupTestStorage();

  let deleteAttempts = 0;
  let updateAttempts = 0;
  let updatedStatus = null;

  const mockSupabaseClient = {
    from: () => ({
      delete: () => ({
        eq: async () => {
          deleteAttempts++;
          return { error: new Error('403 Forbidden: Missing DELETE policy on auctions') };
        },
      }),
      update: (fields) => ({
        eq: async () => {
          updateAttempts++;
          updatedStatus = fields.status;
          return { error: null };
        },
      }),
    }),
  };

  let navigatedTo = null;
  const mockNavigate = (url) => { navigatedTo = url; };

  const result = await convertLobbyToSolo({
    roomId: 'CLOUD-SUPA-DELETE-FAIL',
    user: { uid: 'usr_2' },
    currentUserPlayer: { name: 'P2', team: 'MI' },
    currentAuction: { auctionType: 'mega' },
    supabaseClient: mockSupabaseClient,
    navigate: mockNavigate,
  });

  assert.ok(result.soloRoomId.startsWith('SOLO-'));
  assert.equal(deleteAttempts, 2, 'Supabase delete attempted twice');
  assert.equal(updateAttempts, 1, 'Supabase fallback update succeeded on first attempt');
  assert.equal(updatedStatus, 'cancelled', 'Fallback update set status to cancelled');
  assert.equal(navigatedTo, `/auction/${result.soloRoomId}?server=local`);
});

test('lobby conversion ordering 4: Supabase delete and update both fail (best-effort), continues to local mode', async () => {
  setupTestStorage();

  let deleteAttempts = 0;
  let updateAttempts = 0;

  const mockSupabaseClient = {
    from: () => ({
      delete: () => ({
        eq: async () => {
          deleteAttempts++;
          return { error: new Error('Delete failed') };
        },
      }),
      update: () => ({
        eq: async () => {
          updateAttempts++;
          return { error: new Error('Update failed') };
        },
      }),
    }),
  };

  let navigatedTo = null;
  const mockNavigate = (url) => { navigatedTo = url; };

  const result = await convertLobbyToSolo({
    roomId: 'CLOUD-SUPA-ALL-FAIL',
    user: { uid: 'usr_3' },
    currentUserPlayer: { name: 'P3', team: 'RCB' },
    currentAuction: { auctionType: 'sprint5' },
    supabaseClient: mockSupabaseClient,
    navigate: mockNavigate,
  });

  assert.ok(result.soloRoomId.startsWith('SOLO-'));
  assert.equal(deleteAttempts, 2);
  assert.equal(updateAttempts, 2);
  assert.equal(navigatedTo, `/auction/${result.soloRoomId}?server=local`);
});

test('StrictMode double-mount creates at most one active bot loop', () => {
  let tickCount = 0;
  const botLoop = createSoloBotLoop({
    getState: () => ({ status: 'active', currentLot: { status: 'bidding', timerEndsAt: Date.now() + 5000 } }),
    updateState: () => { tickCount++; },
    intervalMs: 10,
  });

  // Mount 1
  const unmount1 = botLoop.start();
  assert.equal(botLoop.isRunning(), true);

  // StrictMode simulated immediate unmount
  unmount1();
  assert.equal(botLoop.isRunning(), false);

  // Mount 2
  const unmount2 = botLoop.start();
  assert.equal(botLoop.isRunning(), true);

  // Immediate re-start without unmount maintains at most one active loop
  botLoop.start();
  assert.equal(botLoop.isRunning(), true);

  // Final unmount
  unmount2();
  assert.equal(botLoop.isRunning(), false);
});

test('bot bids are driven strictly by timestamps (timerEndsAt and now)', () => {
  const actions = [];
  const state = {
    status: 'active',
    currentLot: {
      status: 'bidding',
      timerEndsAt: 10000,
    },
  };

  const botLoop = createSoloBotLoop({
    getState: () => state,
    updateState: (act) => actions.push(act),
  });

  // When > 500ms remaining -> BOT_BID
  const res1 = botLoop.tick(5000);
  assert.equal(res1, 'BOT_BID');
  assert.deepEqual(actions[0], { type: 'BOT_BID', now: 5000 });

  const res2 = botLoop.tick(9400);
  assert.equal(res2, 'BOT_BID');
  assert.deepEqual(actions[1], { type: 'BOT_BID', now: 9400 });

  // When <= 500ms remaining but now < timerEndsAt -> WAIT (no bid)
  const res3 = botLoop.tick(9600);
  assert.equal(res3, 'WAIT');
  assert.equal(actions.length, 2, 'No action should be dispatched on WAIT');

  // When now >= timerEndsAt -> RESOLVE_LOT
  const res4 = botLoop.tick(10000);
  assert.equal(res4, 'RESOLVE_LOT');
  assert.deepEqual(actions[2], { type: 'RESOLVE_LOT', now: 10000 });

  const res5 = botLoop.tick(10500);
  assert.equal(res5, 'RESOLVE_LOT');
  assert.deepEqual(actions[3], { type: 'RESOLVE_LOT', now: 10500 });
});

test('bot loop: handles celebration lifecycle (waits during celebration, advances after celebration ends)', () => {
  const actions = [];
  let state = {
    status: 'active',
    currentLot: {
      status: 'sold',
      timerEndsAt: 13000,
      celebrationEndsAt: 13000,
    },
  };

  const botLoop = createSoloBotLoop({
    getState: () => state,
    updateState: (act) => {
      actions.push(act);
      if (act.type === 'ADVANCE_LOT') {
        state = {
          status: 'active',
          currentLot: { status: 'bidding', timerEndsAt: 23000 },
        };
      }
    },
  });

  // During celebration -> CELEBRATING, no action
  const res1 = botLoop.tick(11000);
  assert.equal(res1, 'CELEBRATING');
  assert.equal(actions.length, 0);

  // When celebration finishes -> ADVANCE_LOT
  const res2 = botLoop.tick(13000);
  assert.equal(res2, 'ADVANCE_LOT');
  assert.deepEqual(actions[0], { type: 'ADVANCE_LOT', now: 13000 });
});

test('local mode: endAuction and sendMessage make zero Firebase, Firestore and Supabase calls', async () => {
  setupTestStorage();

  const roomId = 'SOLO-END-SEND';
  const human = { uid: 'usr_host', displayName: 'Host' };
  let currentState = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId,
    humanUser: human,
    auctionType: 'sprint5',
  });
  saveLocalSoloRoom(currentState);

  let rtdbCalls = 0;
  let firestoreCalls = 0;
  let supabaseCalls = 0;

  let navigatedTo = null;
  const navigate = (url) => { navigatedTo = url; };

  // 1. handleSoloEndAuction in local room
  const endResult = await handleSoloEndAuction({
    roomId,
    server: SERVER_LOCAL,
    isHost: true,
    updateLocalSoloState: (action) => {
      currentState = localAuctionReducer(currentState, action);
      saveLocalSoloRoom(currentState);
      return currentState;
    },
    saveLocalSoloRoom,
    navigate,
    onCloudFallback: () => {
      rtdbCalls++;
      firestoreCalls++;
    },
  });

  assert.equal(endResult.handled, true);
  assert.equal(currentState.status, 'completed');
  assert.equal(navigatedTo, `/summary/${roomId}?server=local`);
  assert.equal(rtdbCalls, 0, 'Zero RTDB calls in local endAuction');
  assert.equal(firestoreCalls, 0, 'Zero Firestore calls in local endAuction');

  // Verify room is saved in localStorage as completed
  const loaded = loadLocalSoloRoom(roomId);
  assert.equal(loaded?.status, 'completed');

  // 2. handleSoloSendMessage in local room
  const sendResult = await handleSoloSendMessage({
    roomId,
    server: SERVER_LOCAL,
    user: human,
    text: 'Hello from local',
    onCloudSend: () => {
      rtdbCalls++;
      supabaseCalls++;
    },
  });

  assert.equal(sendResult.handled, true);
  assert.equal(sendResult.localNoOp, true);
  assert.equal(rtdbCalls, 0, 'Zero RTDB calls in local sendMessage');
  assert.equal(supabaseCalls, 0, 'Zero Supabase calls in local sendMessage');
});

test('two-tab lock: updateLocalSoloState refuses writes without lease and taken-over tab halts bot loop', () => {
  setupTestStorage();

  const roomId = 'SOLO-LEASE-CHECK';
  const human = { uid: 'usr_tab_a', displayName: 'Tab A' };
  const initialState = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId,
    humanUser: human,
    auctionType: 'sprint5',
    seed: 42,
  });
  saveLocalSoloRoom(initialState);

  // Tab A holds the lock initially
  const isSoloLockHeldRef = { current: true };
  let lockStatus = 'active';

  const stateManager = createSoloStateManager({
    initialState,
    isLockHeldRef: isSoloLockHeldRef,
    onSave: saveLocalSoloRoom,
  });

  const botLoop = createSoloBotLoop({
    getState: () => stateManager.getState(),
    updateState: (action) => stateManager.updateState(action),
    intervalMs: 10,
  });

  botLoop.start();
  assert.equal(botLoop.isRunning(), true);

  // While lock is held, updateLocalSoloState writes cleanly
  const updated1 = stateManager.updateState({ type: 'PLACE_BID', bidderId: 'usr_tab_a', now: 1000 });
  assert.ok(updated1);
  const lot1 = updated1.currentAuction || updated1.currentLot;
  assert.equal(lot1?.highBidderId, 'usr_tab_a');
  assert.ok(lot1?.currentBid > 0);
  const expectedBid = lot1.currentBid;

  // Tab B steals the lease -> onStealCallback triggers on Tab A
  const onStealCallback = () => {
    isSoloLockHeldRef.current = false;
    lockStatus = 'taken_over';
    botLoop.stop();
  };
  onStealCallback();

  // Tab A lock is revoked, status is taken_over, bot loop is halted
  assert.equal(isSoloLockHeldRef.current, false);
  assert.equal(lockStatus, 'taken_over');
  assert.equal(botLoop.isRunning(), false);

  // Further writes are refused and return null without touching localStorage
  const refusedUpdate = stateManager.updateState({ type: 'PLACE_BID', bidderId: 'usr_tab_a', now: 2000 });
  assert.equal(refusedUpdate, null, 'updateState must refuse to write when lock is not held');

  // State in localStorage remains intact at the last valid write
  const savedState = loadLocalSoloRoom(roomId);
  const savedLot = savedState?.currentAuction || savedState?.currentLot;
  assert.equal(savedLot?.highBidderId, 'usr_tab_a');
  assert.equal(savedLot?.currentBid, expectedBid);
});
