import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLocalRoom,
  readLocalRoom,
  joinLocalRoomDb,
  updateLocalPlayerTeam,
  fillLocalEmptyTeamsWithBots,
  removeLocalBotTeam,
  startLocalAuction,
  placeLocalBid,
  endLocalPlayerAuction,
  pauseLocalAuction,
  resumeLocalAuction,
  endLocalAuction,
  mergeLocalRooms,
  subscribeLocalRoom,
} from '../src/lib/localAuctionEngine.js';

test('createLocalRoom creates a room with valid initial data', () => {
  const roomId = 'HOTSPOT-TEST1';
  const result = createLocalRoom(
    roomId,
    'user_123',
    { name: 'Host Manager', team: 'MI' },
    'sprint5',
    false,
  );

  assert.equal(result.server, 'local');
  const room = readLocalRoom(roomId);
  assert.ok(room);
  assert.equal(room.id, roomId);
  assert.equal(room.hostId, 'user_123');
  assert.equal(room.squadLimit, 5);
  assert.equal(room.overseasLimit, 2);
  assert.equal(room.settings.budget, 60.0);
  assert.equal(room.players.length, 1);
  assert.equal(room.players[0].team, 'MI');
  assert.ok(room.teams[`${roomId}_user_123`]);
  assert.equal(room.teams[`${roomId}_user_123`].budgetRemaining, 60.0);
});

test('joinLocalRoomDb adds new manager to local room', () => {
  const roomId = 'HOTSPOT-TEST2';
  createLocalRoom(roomId, 'user_host', { name: 'Host', team: 'CSK' }, 'mega');

  joinLocalRoomDb(roomId, 'user_guest', { name: 'Guest', team: 'RCB' });

  const room = readLocalRoom(roomId);
  assert.equal(room.players.length, 2);
  const guest = room.players.find((p) => p.id === 'user_guest');
  assert.ok(guest);
  assert.equal(guest.team, 'RCB');
  assert.ok(room.teams[`${roomId}_user_guest`]);
  assert.equal(room.teams[`${roomId}_user_guest`].budgetRemaining, 120.0);
});

test('fillLocalEmptyTeamsWithBots fills remaining teams up to 10 teams', () => {
  const roomId = 'HOTSPOT-TEST3';
  createLocalRoom(roomId, 'user_host', { name: 'Host', team: 'MI' }, 'mega');

  fillLocalEmptyTeamsWithBots(roomId);

  const room = readLocalRoom(roomId);
  assert.equal(room.players.length, 10);
  assert.equal(Object.keys(room.teams).length, 10);
  assert.ok(room.players.some((p) => p.isBot && p.team === 'CSK'));
});

test('removeLocalBotTeam removes a bot player and team', () => {
  const roomId = 'HOTSPOT-TEST4';
  createLocalRoom(roomId, 'user_host', { name: 'Host', team: 'MI' }, 'mega');
  fillLocalEmptyTeamsWithBots(roomId);

  removeLocalBotTeam(roomId, 'bot_CSK');

  const room = readLocalRoom(roomId);
  assert.equal(room.players.length, 9);
  assert.equal(room.players.some((p) => p.id === 'bot_CSK'), false);
  assert.equal(room.teams[`${roomId}_bot_CSK`], undefined);
});

test('startLocalAuction transitions room to active and sets live bidding', () => {
  const roomId = 'HOTSPOT-TEST5';
  createLocalRoom(roomId, 'user_host', { name: 'Host', team: 'MI' }, 'mega');

  startLocalAuction(roomId);

  const room = readLocalRoom(roomId);
  assert.equal(room.status, 'active');
  assert.equal(room.live.status, 'bidding');
  assert.ok(room.live.playerId);
  assert.equal(room.live.currentBid, 0);
  assert.ok(room.live.timerEndsAt > Date.now());
});

test('placeLocalBid updates currentBid, highBidder, and extends timer', () => {
  const roomId = 'HOTSPOT-TEST6';
  createLocalRoom(roomId, 'user_host', { name: 'Host', team: 'MI' }, 'mega');
  startLocalAuction(roomId);

  const room = placeLocalBid(
    roomId,
    'user_host',
    'MI',
    'Host',
    'Mumbai Indians',
  );

  assert.equal(room.live.highBidderId, 'user_host');
  assert.ok(room.live.currentBid > 0);
  assert.equal(room.live.highBidderName, 'Host');
  assert.equal(room.live.highBidderTeamId, 'MI');
});

test('pauseLocalAuction, resumeLocalAuction, and endLocalAuction manage room lifecycle', () => {
  const roomId = 'HOTSPOT-TEST7';
  createLocalRoom(roomId, 'user_host', { name: 'Host', team: 'MI' }, 'mega');
  startLocalAuction(roomId);

  pauseLocalAuction(roomId);
  let room = readLocalRoom(roomId);
  assert.equal(room.live.status, 'paused');

  resumeLocalAuction(roomId);
  room = readLocalRoom(roomId);
  assert.equal(room.live.status, 'bidding');

  endLocalAuction(roomId);
  room = readLocalRoom(roomId);
  assert.equal(room.status, 'completed');
  assert.equal(room.live.status, 'completed');
});

test('mergeLocalRooms prevents stale waiting state from overwriting active status', () => {
  const current = {
    id: 'HOTSPOT-MERGE1',
    hostRev: 5,
    status: 'active',
    live: { status: 'bidding', playerId: 10 },
    playerOrder: [10, 20],
    players: [{ id: 'host', name: 'Host' }],
    messages: [{ id: 'm1', text: 'Started', timestamp: 100 }],
  };

  const incomingStale = {
    id: 'HOTSPOT-MERGE1',
    hostRev: 2,
    status: 'waiting',
    live: { status: 'waiting' },
    players: [{ id: 'guest', name: 'Guest' }],
    messages: [{ id: 'm0', text: 'Joined', timestamp: 50 }],
  };

  const merged = mergeLocalRooms(current, incomingStale);

  assert.equal(merged.status, 'active');
  assert.equal(merged.live.status, 'bidding');
  assert.equal(merged.live.playerId, 10);
  assert.deepEqual(merged.playerOrder, [10, 20]);
  assert.equal(merged.hostRev, 5);
});

test('mergeLocalRooms promotes waiting to active when incoming state is active', () => {
  const current = {
    id: 'HOTSPOT-MERGE2',
    hostRev: 1,
    status: 'waiting',
    live: { status: 'waiting' },
    players: [{ id: 'guest', name: 'Guest' }],
  };

  const incomingActive = {
    id: 'HOTSPOT-MERGE2',
    hostRev: 3,
    status: 'active',
    live: { status: 'bidding', playerId: 5 },
    playerOrder: [5, 6],
    players: [{ id: 'host', name: 'Host' }],
  };

  const merged = mergeLocalRooms(current, incomingActive);

  assert.equal(merged.status, 'active');
  assert.equal(merged.live.status, 'bidding');
  assert.equal(merged.live.playerId, 5);
  assert.equal(merged.hostRev, 3);
});

test('subscribeLocalRoom syncs auction start state to subscriber', () => {
  const roomId = 'HOTSPOT-SYNC1';
  createLocalRoom(roomId, 'user_host', { name: 'Host', team: 'MI' }, 'mega');

  let latestAuctionState = null;
  const unsubscribe = subscribeLocalRoom(roomId, 'user_guest', {
    setCurrentAuction: (val) => { latestAuctionState = val; },
    setRoomTeams: () => {},
    setTeam: () => {},
    setMessages: () => {},
    setLoading: () => {},
  });

  assert.ok(latestAuctionState);
  assert.equal(latestAuctionState.status, 'waiting');

  startLocalAuction(roomId);

  assert.ok(latestAuctionState);
  assert.equal(latestAuctionState.status, 'active');
  assert.equal(latestAuctionState.currentAuction.status, 'bidding');

  unsubscribe();
});

test('mergeLocalRooms preserves higher bids and prevents stale regression', () => {
  const current = {
    id: 'HOTSPOT-BID-TEST',
    status: 'active',
    live: { playerId: 10, currentBid: 4.5, highBidderId: 'host_1', status: 'bidding', timerEndsAt: 5000 },
    playerOrder: [10, 11, 12],
  };

  const staleIncoming = {
    id: 'HOTSPOT-BID-TEST',
    status: 'active',
    live: { playerId: 10, currentBid: 4.25, highBidderId: 'guest_1', status: 'bidding', timerEndsAt: 4000 },
    playerOrder: [10, 11, 12],
  };

  const merged = mergeLocalRooms(current, staleIncoming);
  assert.equal(merged.live.currentBid, 4.5);
  assert.equal(merged.live.highBidderId, 'host_1');
});

test('mergeLocalRooms prevents sold status from regressing back to bidding', () => {
  const current = {
    id: 'HOTSPOT-SOLD-TEST',
    status: 'active',
    live: { playerId: 10, currentBid: 5.0, highBidderId: 'host_1', status: 'sold', timerEndsAt: 5000 },
    playerOrder: [10, 11, 12],
  };

  const staleIncoming = {
    id: 'HOTSPOT-SOLD-TEST',
    status: 'active',
    live: { playerId: 10, currentBid: 5.0, highBidderId: 'host_1', status: 'bidding', timerEndsAt: 4000 },
    playerOrder: [10, 11, 12],
  };

  const merged = mergeLocalRooms(current, staleIncoming);
  assert.equal(merged.live.status, 'sold');
});

test('endLocalPlayerAuction ignores calls from non-host users', () => {
  const roomId = 'HOTSPOT-AUTH-TEST';
  createLocalRoom(roomId, 'host_user', { name: 'Host', team: 'MI' }, 'mega');
  startLocalAuction(roomId);

  // Non-host attempts to end player auction
  endLocalPlayerAuction(roomId, 'guest_user');

  const room = readLocalRoom(roomId);
  assert.equal(room.live.status, 'bidding'); // Still bidding, not ended by guest!
});


