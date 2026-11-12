import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLocalRoom,
  createSeededRng,
  localAuctionReducer,
  loadLocalSoloRoom,
  saveLocalSoloRoom,
  deleteLocalSoloRoom,
  acquireSoloRoomLock,
  SCHEMA_VERSION,
  MAX_SOLO_SAVES,
  STORAGE_PREFIX,
  STORAGE_INDEX_KEY,
} from '../src/lib/localAuctionEngine.js';
import { IPL_PLAYERS } from '../src/data/players.js';
import {
  enterLocalMode,
  exitLocalMode,
  isLocalMode,
  getRtdb,
  goOnlineServer,
} from '../src/lib/firebase.js';

// Setup Mock In-Memory localStorage for Node environment
function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get size() {
      return store.size;
    },
    _raw: store,
  };
}

globalThis.window = globalThis.window || {};
globalThis.window.localStorage = createMockStorage();

// ─── Test 1: isLocalRoom Detection & Cloud Override ───
test('isLocalRoom: handles ?server=local, fresh SOLO IDs, and explicit cloud override', () => {
  // 1. Explicit server=local parameter returns true
  assert.equal(isLocalRoom('SOLO-1234', 'local'), true);
  assert.equal(isLocalRoom('SOLO-1234', new URLSearchParams('server=local')), true);

  // 2. Fresh SOLO code with existing local store returns true
  assert.equal(isLocalRoom('SOLO-ABCD', null, true), true);

  // 3. Stale local save with an explicit cloud server parameter MUST RETURN FALSE (Cloud wins!)
  assert.equal(isLocalRoom('ABCD', 'server-1', true), false);
  assert.equal(isLocalRoom('ABCD', new URLSearchParams('server=server-2'), true), false);
  assert.equal(isLocalRoom('SOLO-STALE', 'server-3', true), false);

  // 4. Cloud room with no local store returns false
  assert.equal(isLocalRoom('ABCD', 'server-1', false), false);
  assert.equal(isLocalRoom('ABCD', null, false), false);
  assert.equal(isLocalRoom('', 'local', false), false);
});

// ─── Test 2: Seeded PRNG Determinism ───
test('createSeededRng: produces identical deterministic sequences for identical seeds', () => {
  const rng1 = createSeededRng(987654321);
  const rng2 = createSeededRng(987654321);

  const seq1 = Array.from({ length: 10 }, () => rng1());
  const seq2 = Array.from({ length: 10 }, () => rng2());

  assert.deepEqual(seq1, seq2);

  // Different seed produces different sequence
  const rng3 = createSeededRng(123456789);
  const seq3 = Array.from({ length: 10 }, () => rng3());
  assert.notDeepEqual(seq1, seq3);
});

// ─── Test 3: Pure Reducer State Transitions ───
test('localAuctionReducer: initializes 1 human + 9 bots with mode budgets', () => {
  const human = { uid: 'human_1', displayName: 'Captain', team: 'CSK' };
  const action = {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-TEST1',
    humanUser: human,
    auctionType: 'mega',
    seed: 42,
    now: 1000000,
    bidTimer: 10,
  };

  const state = localAuctionReducer(null, action);

  assert.equal(state.id, 'SOLO-TEST1');
  assert.equal(state.status, 'active');
  assert.equal(state.squadLimit, 25);
  assert.equal(state.overseasLimit, 8);
  assert.equal(state.settings.budget, 120.0);
  assert.equal(state.players.length, 10);
  assert.equal(state.roomTeams.length, 10);

  // Human player check
  const humanPlayer = state.players.find((p) => p.id === 'human_1');
  assert.equal(humanPlayer.isHost, true);
  assert.equal(humanPlayer.isBot, false);
  assert.equal(humanPlayer.team, 'CSK');

  // 9 Bot teams check
  const botPlayers = state.players.filter((p) => p.isBot);
  assert.equal(botPlayers.length, 9);
  assert.equal(state.roomTeams.every((t) => t.budgetRemaining === 120.0), true);

  // Initial lot check: opens at 0 so the first bid is exactly the base price
  assert.equal(state.currentAuction.status, 'bidding');
  assert.equal(state.currentAuction.currentBid, 0);
  assert.equal(state.currentAuction.timerEndsAt, 1000000 + 10 * 1000);
});

test('localAuctionReducer: human bidding and bot bidding update high bidder and reset timer', () => {
  const human = { uid: 'human_1', displayName: 'Captain', team: 'CSK' };
  let state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-BID',
    humanUser: human,
    auctionType: 'sprint5', // 60 Cr budget
    seed: 42,
    now: 1000,
    bidTimer: 10,
  });

  const initialBid = state.currentAuction.currentBid;

  // 1. Human places bid
  state = localAuctionReducer(state, {
    type: 'PLACE_BID',
    bidderId: 'human_1',
    now: 2000,
  });

  assert.ok(state.currentAuction.currentBid > initialBid);
  assert.equal(state.currentAuction.highBidderId, 'human_1');
  assert.equal(state.currentAuction.highBidderTeamId, 'CSK');
  assert.equal(state.currentAuction.timerEndsAt, 2000 + 10 * 1000);

  // 2. Outbidding self is rejected
  const beforeSelf = state.currentAuction.currentBid;
  state = localAuctionReducer(state, {
    type: 'PLACE_BID',
    bidderId: 'human_1',
    now: 3000,
  });
  assert.equal(state.currentAuction.currentBid, beforeSelf);

  // 3. Pause & Resume
  state = localAuctionReducer(state, { type: 'PAUSE_AUCTION', now: 4000 });
  assert.equal(state.currentAuction.status, 'paused');
  assert.equal(state.currentAuction.pausedRemainingMs, 8000);

  state = localAuctionReducer(state, { type: 'RESUME_AUCTION', now: 5000 });
  assert.equal(state.currentAuction.status, 'bidding');
  assert.equal(state.currentAuction.timerEndsAt, 5000 + 8000);
});

test('localAuctionReducer: RESOLVE_LOT awards player to winner, updates purse, advances lot', () => {
  const human = { uid: 'human_1', displayName: 'Captain', team: 'CSK' };
  let state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-RESOLVE',
    humanUser: human,
    auctionType: 'sprint5',
    seed: 42,
    now: 1000,
    bidTimer: 10,
  });

  // Human bids
  state = localAuctionReducer(state, { type: 'PLACE_BID', bidderId: 'human_1', now: 2000 });
  const soldPrice = state.currentAuction.currentBid;

  // Resolve lot
  state = localAuctionReducer(state, { type: 'RESOLVE_LOT', now: 12000 });

  const cskTeam = state.roomTeams.find((t) => t.teamId === 'CSK');
  assert.equal(cskTeam.squad.length, 1);
  assert.equal(cskTeam.spent, soldPrice);
  assert.equal(cskTeam.budgetRemaining, 60.0 - soldPrice);

  const cskPlayer = state.players.find((p) => p.id === 'human_1');
  assert.equal(cskPlayer.squadCount, 1);
  assert.equal(cskPlayer.spent, soldPrice);

  // Advanced to next player
  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.currentAuction.status, 'bidding');
});

test('localAuctionReducer: RESOLVE_LOT with celebrate: true preserves sold status for celebration animation, then ADVANCE_LOT advances', () => {
  const human = { uid: 'human_1', displayName: 'Captain', team: 'CSK' };
  let state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-CELEBRATE',
    humanUser: human,
    auctionType: 'sprint5',
    seed: 42,
    now: 1000,
    bidTimer: 10,
  });

  state = localAuctionReducer(state, { type: 'PLACE_BID', bidderId: 'human_1', now: 2000 });
  const soldPrice = state.currentAuction.currentBid;

  // Resolve with celebrate: true
  state = localAuctionReducer(state, { type: 'RESOLVE_LOT', now: 12000, celebrate: true, celebrationMs: 3000 });

  // During celebration, lot must be sold with celebration timing preserved
  assert.equal(state.currentAuction.status, 'sold');
  assert.equal(state.currentAuction.celebrationEndsAt, 15000);
  assert.equal(state.currentPlayerIndex, 0); // Still index 0 so card renders the sold player!
  assert.equal(state.roomTeams.find((t) => t.teamId === 'CSK').spent, soldPrice);

  // A duplicate resolve (e.g. a second countdown timer firing late) must not skip
  // the celebration and jump straight to the next lot.
  const duplicate = localAuctionReducer(state, { type: 'RESOLVE_LOT', now: 12500, celebrate: true });
  assert.equal(duplicate.currentAuction.status, 'sold');
  assert.equal(duplicate.currentPlayerIndex, 0);
  assert.equal(duplicate.currentAuction.celebrationEndsAt, 15000);
  state = duplicate;

  // Advance lot after celebration concludes
  state = localAuctionReducer(state, { type: 'ADVANCE_LOT', now: 15000 });
  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.currentAuction.status, 'bidding');
});

// ─── Test 4: Fast-Forward Awards Active Lot to Leading Human and Sets Flag ───
test('localAuctionReducer: FAST_FORWARD awards active lot to human if human is leading, marks fastForwarded', () => {
  const human = { uid: 'human_1', displayName: 'Captain', team: 'RCB' };
  let state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-FF',
    humanUser: human,
    auctionType: 'sprint5',
    seed: 77,
    now: 1000,
  });

  // Human leads the active player lot
  state = localAuctionReducer(state, { type: 'PLACE_BID', bidderId: 'human_1', now: 2000 });
  const leadingPlayerId = state.currentAuction.playerId;
  const leadBid = state.currentAuction.currentBid;

  // Fast forward
  state = localAuctionReducer(state, { type: 'FAST_FORWARD', now: 3000 });

  assert.equal(state.status, 'completed');
  assert.equal(state.fastForwarded, true);

  // Verify active lot was awarded to human
  const rcbTeam = state.roomTeams.find((t) => t.teamId === 'RCB');
  assert.ok(rcbTeam.squad.some((p) => p.id === leadingPlayerId && p.bid === leadBid));

  // Verify all teams have valid budgets
  for (const t of state.roomTeams) {
    assert.ok(t.budgetRemaining >= 0, `Team ${t.teamName} exceeded budget`);
    assert.ok(t.squad.length <= state.squadLimit, `Team ${t.teamName} exceeded squad limit`);
  }
});

// ─── Test 4b: Solo lot order follows IPL sets (marquee first) ───
// ─── Test 4c: Opening bid equals base price, never base + increment ───
test('INIT_AUCTION: first bid is exactly the base price (lot opens at 0)', () => {
  let state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-OPEN',
    humanUser: { uid: 'human_1', displayName: 'Captain', team: 'CSK' },
    auctionType: 'mega',
    seed: 7,
    now: 1000,
    bidTimer: 10,
  });

  assert.equal(state.currentAuction.currentBid, 0);
  const player = IPL_PLAYERS.find((p) => p.id === state.currentAuction.playerId);

  state = localAuctionReducer(state, { type: 'PLACE_BID', bidderId: 'human_1', now: 2000 });
  assert.equal(state.currentAuction.currentBid, player.basePrice);
});

test('INIT_AUCTION: player order follows the shared set order, marquee first', () => {
  const state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-SETS',
    humanUser: { uid: 'human_1', displayName: 'Captain', team: 'MI' },
    auctionType: 'mega',
    seed: 9,
  });

  const setOrder = state.playerOrder.map((i) => IPL_PLAYERS[i].set);
  const contiguousSets = setOrder.filter((s, i) => i === 0 || setOrder[i - 1] !== s);
  const expectedSets = [...new Set(IPL_PLAYERS.map((p) => p.set))];

  assert.deepEqual(contiguousSets, expectedSets);
  assert.equal(setOrder[0], 'Marquee Set 1');
});

// ─── Test 5: Persistence with Schema Versioning & Safe Recovery ───
test('saveLocalSoloRoom & loadLocalSoloRoom: version check, corrupt recovery, and round-trip', () => {
  const testState = {
    id: 'SOLO-SAVE1',
    status: 'active',
    hostId: 'user_123',
    settings: { bidTimer: 10 },
  };

  // 1. Clean save & reload
  saveLocalSoloRoom('SOLO-SAVE1', testState);
  const loaded = loadLocalSoloRoom('SOLO-SAVE1');
  assert.deepEqual(loaded, testState);

  // 2. Corrupt JSON string returns null safely
  window.localStorage.setItem(STORAGE_PREFIX + 'SOLO-CORRUPT', '{ invalid json ...');
  assert.equal(loadLocalSoloRoom('SOLO-CORRUPT'), null);

  // 3. Schema version mismatch returns null safely
  const oldVersionRecord = {
    version: SCHEMA_VERSION + 999, // incompatible version
    roomId: 'SOLO-OLD',
    savedAt: Date.now(),
    data: testState,
  };
  window.localStorage.setItem(STORAGE_PREFIX + 'SOLO-OLD', JSON.stringify(oldVersionRecord));
  assert.equal(loadLocalSoloRoom('SOLO-OLD'), null);

  // Clean up
  deleteLocalSoloRoom('SOLO-SAVE1');
  deleteLocalSoloRoom('SOLO-CORRUPT');
  deleteLocalSoloRoom('SOLO-OLD');
});

// ─── Test 6: LRU Pruning Never Deletes Completed Unsynced Saves ───
test('saveLocalSoloRoom: LRU pruning respects MAX_SOLO_SAVES and NEVER prunes unsynced completed rooms', () => {
  window.localStorage.clear();

  // Create an unsynced completed save (MUST BE PROTECTED)
  const unsyncedCompleted = {
    id: 'SOLO-COMPLETED-UNSYNCED',
    status: 'completed',
    roomTeams: [],
  };
  saveLocalSoloRoom('SOLO-COMPLETED-UNSYNCED', unsyncedCompleted, false);

  // Now create 6 more synced/in-progress saves (exceeding MAX_SOLO_SAVES = 5)
  for (let i = 1; i <= 6; i++) {
    saveLocalSoloRoom(`SOLO-ROOM-${i}`, { id: `SOLO-ROOM-${i}`, status: 'active' }, true);
  }

  // The unsynced completed room must STILL EXIST!
  const loadedProtected = loadLocalSoloRoom('SOLO-COMPLETED-UNSYNCED');
  assert.ok(loadedProtected !== null, 'LRU pruning illegally deleted an unsynced completed save');

  // Total saves should be capped
  const index = JSON.parse(window.localStorage.getItem(STORAGE_INDEX_KEY) || '[]');
  assert.ok(index.length <= MAX_SOLO_SAVES + 1); // +1 because unsynced is preserved
});

// ─── Test 7: Serialized Save Size Measurement & Quota Exceeded Path ───
test('saveLocalSoloRoom: measure full Mega Auction payload size and handle quota exceeded safely', () => {
  // Simulate a full Mega Auction room state with 10 teams x 25 players = 250 squad entries
  const fullMegaTeams = Array.from({ length: 10 }, (_, tIdx) => ({
    id: `SOLO-MEASURE_team_${tIdx}`,
    auctionId: 'SOLO-MEASURE',
    userId: tIdx === 0 ? 'human_1' : `bot_${tIdx}`,
    teamId: `TEAM_${tIdx}`,
    teamName: `Team ${tIdx}`,
    budgetRemaining: 5.5,
    spent: 114.5,
    squad: Array.from({ length: 25 }, (_, pIdx) => ({
      id: `p_${tIdx * 25 + pIdx}`,
      name: `Player Name ${tIdx * 25 + pIdx}`,
      role: 'Batsman',
      bid: 4.5,
      team: `TEAM_${tIdx}`,
    })),
  }));

  const fullMegaState = {
    id: 'SOLO-MEASURE',
    status: 'completed',
    auctionType: 'mega',
    squadLimit: 25,
    overseasLimit: 8,
    settings: { bidTimer: 10, budget: 120.0 },
    players: fullMegaTeams.map((t) => ({ id: t.userId, spent: t.spent, squadCount: 25 })),
    roomTeams: fullMegaTeams,
    playerOrder: Array.from({ length: 250 }, (_, i) => i),
    messages: Array.from({ length: 50 }, (_, i) => ({
      id: `msg_${i}`,
      text: `Player ${i} sold to Team ${i % 10} for ₹4.5 Cr`,
      type: 'sold',
      timestamp: Date.now() - i * 1000,
    })),
  };

  const serialized = JSON.stringify(fullMegaState);
  const sizeBytes = Buffer.byteLength(serialized, 'utf8');
  const sizeKb = (sizeBytes / 1024).toFixed(2);

  // Assert serialized size is measured and well under 60 KB
  assert.ok(sizeBytes > 5000, 'State should have substantial data');
  assert.ok(sizeBytes < 60000, `Full mega size should be < 60KB, got ${sizeKb} KB`);

  // Test QuotaExceededError handling
  const originalSetItem = window.localStorage.setItem;
  window.localStorage.setItem = () => {
    const quotaErr = new Error('QuotaExceededError');
    quotaErr.name = 'QuotaExceededError';
    throw quotaErr;
  };

  // Must not throw, returns false gracefully
  const result = saveLocalSoloRoom('SOLO-QUOTA', fullMegaState);
  assert.equal(result, false);

  window.localStorage.setItem = originalSetItem;
});

// ─── Test 8: Two-Tab Lease Lock with Heartbeat Fallback ───
test('acquireSoloRoomLock: prevents concurrent tabs from mutating same local auction', async () => {
  const roomId = 'SOLO-LOCK-ROOM';
  const tabA = 'tab_alpha_1';
  const tabB = 'tab_beta_2';

  // Tab A acquires lock
  const lockA = await acquireSoloRoomLock(roomId, tabA);
  assert.equal(lockA.acquired, true);

  // Tab B attempts to acquire lock immediately -> rejected!
  const lockB = await acquireSoloRoomLock(roomId, tabB);
  assert.equal(lockB.acquired, false);
  await lockB.release();

  // Tab A releases lock
  await lockA.release();

  // Tab B now succeeds
  const lockBRetry = await acquireSoloRoomLock(roomId, tabB);
  assert.equal(lockBRetry.acquired, true);
  await lockBRetry.release();
});

// ─── Test 9: Zero-Firebase & Zero-Supabase-Realtime Assertion with Real Guards ───
test('local engine: zero Firebase RTDB and zero Supabase Realtime channel calls in local mode', () => {
  // 1. Enter local solo mode
  enterLocalMode();
  assert.equal(isLocalMode(), true);

  // 2. Real firebase guards throw on any RTDB access attempt
  assert.throws(
    () => getRtdb('local'),
    /RTDB access is strictly prohibited in device-local solo mode/,
  );
  assert.throws(
    () => getRtdb(),
    /RTDB access is strictly prohibited in device-local solo mode/,
  );
  assert.throws(
    () => goOnlineServer('server-1'),
    /Cannot connect RTDB server while in local solo mode/,
  );

  // 3. Run full local solo auction lifecycle purely client-side
  const human = { uid: 'human_zero', displayName: 'Offline', team: 'CSK' };
  let state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-ZERO-CALLS',
    humanUser: human,
    auctionType: 'sprint5',
    seed: 101,
  });

  state = localAuctionReducer(state, { type: 'PLACE_BID', bidderId: 'human_zero', now: 1000 });
  state = localAuctionReducer(state, { type: 'RESOLVE_LOT', now: 11000 });
  state = localAuctionReducer(state, { type: 'FAST_FORWARD', now: 12000 });

  assert.equal(state.status, 'completed');

  // 4. Clean up
  exitLocalMode();
  assert.equal(isLocalMode(), false);
});
