import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countAuctionTeams,
  finalizedLotRecoveryDelay,
  generatePlayerOrder,
  getNextBidAmount,
  getNextUnsoldPlayerIndex,
  getSquadConstraintError,
  getStartDisposition,
  mapRoomPlayers,
  mergeRoomPlayer,
  resolveDisconnectAction,
  shouldArmDisconnectPause,
} from '../src/lib/auctionRules.js';
import { pausedRemainingMs } from '../src/lib/auctionDisplay.js';
import { IPL_PLAYERS } from '../src/data/players.js';
import {
  transactBid,
  transactRoomPlayersSale,
  transactSale,
  transactTeamSale,
} from '../src/lib/auctionTransactions.js';
import { createServerSessionTracker } from '../src/lib/serverSessions.js';

const biddingLot = (overrides = {}) => ({
  status: 'bidding',
  playerId: 'p-current',
  currentBid: 0,
  highBidderId: '',
  timerEndsAt: 10_000,
  ...overrides,
});

test('a delayed bid click cannot land on the next lot', () => {
  const lotAfterAdvance = biddingLot({ playerId: 'p-next' });

  const result = transactBid(lotAfterAdvance, {
    userId: 'manager-1',
    userName: 'Manager',
    teamId: 'MI',
    playerId: 'p-old',
    now: 5_000,
    timerMs: 10_000,
    budget: 120,
    basePrice: 2,
  });

  assert.equal(result, undefined, 'transaction must abort when the playerId changed');
});

test('mega player order contains every modern player exactly once', () => {
  const modernPlayers = IPL_PLAYERS.filter((p) => p.set !== 'Legends');
  const order = generatePlayerOrder('mega');
  assert.equal(order.length, modernPlayers.length);
  assert.equal(new Set(order).size, modernPlayers.length);
});

test('legends player order contains every legend player exactly once', () => {
  const legendPlayers = IPL_PLAYERS.filter((p) => p.set === 'Legends');
  const indianLegends = legendPlayers.filter((p) => p.type === 'Indian');
  const order = generatePlayerOrder('legends');
  assert.equal(order.length, legendPlayers.length);
  assert.equal(new Set(order).size, legendPlayers.length);
  assert.ok(indianLegends.length >= 70, `must have at least 70 Indian players for 10-team 11-man squads, got ${indianLegends.length}`);
});

test('team count includes human and bot franchises, not teamless spectators', () => {
  assert.equal(countAuctionTeams([]), 0);
  assert.equal(countAuctionTeams([{ id: 'host', team: 'MI' }]), 1);
  assert.equal(
    countAuctionTeams([
      { id: 'host', team: 'MI' },
      { id: 'bot_CSK', team: 'CSK', isBot: true },
    ]),
    2,
  );
  assert.equal(
    countAuctionTeams([
      { id: 'host', team: 'MI' },
      { id: 'spectator', team: '' },
    ]),
    1,
  );
});

test('opening bid uses base price and later increments stay rounded', () => {
  assert.equal(getNextBidAmount({ basePrice: 2 }, 0), 2);

  const atEdge = transactBid(biddingLot({ currentBid: 4.8 }), {
    userId: 'manager-1',
    userName: 'Manager',
    teamId: 'MI',
    playerId: 'p-current',
    now: 5_000,
    timerMs: 10_000,
    budget: 120,
    basePrice: 2,
  });
  assert.equal(atEdge.currentBid, 5);
  assert.equal(transactBid({ ...atEdge, highBidderId: 'other' }, {
    userId: 'manager-1',
    userName: 'Manager',
    teamId: 'MI',
    playerId: 'p-current',
    now: 5_000,
    timerMs: 10_000,
    budget: 120,
    basePrice: 2,
  }).currentBid, 5.25);
});

test('auction start is idempotent for running and completed rooms', () => {
  assert.equal(getStartDisposition(null, null), 'missing');
  assert.equal(getStartDisposition({ status: 'waiting' }, null), 'start');
  assert.equal(getStartDisposition({ status: 'active' }, null), 'resume');
  assert.equal(
    getStartDisposition({ status: 'active' }, biddingLot()),
    'running',
    'an already live lot must never be restarted',
  );
  assert.equal(getStartDisposition({ status: 'completed' }, null), 'completed');
  assert.equal(
    getStartDisposition({ status: 'active' }, { status: 'completed' }),
    'completed',
    'a completed live lot must not be restarted from the first player',
  );
});

test('finalized lots get a recovery window longer than the normal display wait', () => {
  assert.equal(finalizedLotRecoveryDelay('sold'), 6000);
  assert.equal(finalizedLotRecoveryDelay('unsold'), 3000);
  assert.equal(finalizedLotRecoveryDelay('bidding'), null);
});

test('re-joining a room preserves spent and squad count and keeps other managers', () => {
  const players = [
    { id: 'manager-1', name: 'Old', spent: 18, squadCount: 2, isHost: true },
    { id: 'manager-2', name: 'Other', spent: 3, squadCount: 1 },
  ];

  const merged = mergeRoomPlayer(players, {
    id: 'manager-1',
    name: 'New',
    team: 'CSK',
  });

  assert.equal(merged.length, 2);
  const rejoin = merged.find((player) => player.id === 'manager-1');
  assert.equal(rejoin.spent, 18);
  assert.equal(rejoin.squadCount, 2);
  assert.equal(rejoin.isHost, true, 'existing host flag must survive a re-join');
  assert.ok(merged.some((player) => player.id === 'manager-2'));
});

test('roster helper accepts both RTDB arrays and keyed objects', () => {
  assert.deepEqual(mapRoomPlayers(['a', 'b'], (value) => value.toUpperCase()), ['A', 'B']);
  assert.deepEqual(mapRoomPlayers({ 0: 'a', 1: 'b' }, (value) => value.toUpperCase()), ['A', 'B']);
  assert.deepEqual(mapRoomPlayers(null, (value) => value), []);
});

test('team sale is idempotent for a duplicate delayed recovery', () => {
  const once = transactTeamSale(null, {
    roomId: 'room-1',
    playerId: 'p-1',
    bid: 10,
    winnerId: 'manager-1',
    winnerTeamId: 'MI',
    winnerName: 'MI',
    initialBudget: 120,
  });
  assert.equal(once.spent, 10);
  assert.equal(once.budgetRemaining, 110);

  const twice = transactTeamSale(once, {
    roomId: 'room-1',
    playerId: 'p-1',
    bid: 10,
    winnerId: 'manager-1',
    winnerTeamId: 'MI',
    winnerName: 'MI',
    initialBudget: 120,
  });
  assert.equal(twice, once, 'a repeated sale of the same player is a no-op');
  assert.equal(twice.squad.length, 1);
});

test('room stats never regress when a stale sale is recovered late', () => {
  const room = {
    players: [{ id: 'manager-1', spent: 25, squadCount: 2 }],
  };

  const updated = transactRoomPlayersSale(room, {
    winnerId: 'manager-1',
    totalSpent: 10,
    squadCount: 1,
  });

  assert.equal(updated.players[0].spent, 25);
  assert.equal(updated.players[0].squadCount, 2);
});

test('sale transaction only commits after the timer expires', () => {
  const lot = biddingLot({ currentBid: 10, highBidderId: 'manager-1', timerEndsAt: 10_000 });

  assert.equal(transactSale(lot, 9_999), undefined);
  assert.equal(transactSale(lot, 10_000).status, 'sold');
  assert.equal(transactSale(biddingLot({ timerEndsAt: 0 }), 1).status, 'unsold');
});

test('squad and overseas limits block an invalid winning bid', () => {
  const indian = { id: 'p-ind', country: 'IND' };
  const overseas = { id: 'p-aus', country: 'AUS' };
  const playerIndex = [indian, overseas];

  assert.equal(
    getSquadConstraintError({ team: null, player: indian, playerIndex }),
    'Pick a team before bidding',
  );
  assert.equal(
    getSquadConstraintError({
      team: { squad: [{ id: 'p-ind' }] },
      player: indian,
      playerIndex,
    }),
    'This player is already in your squad',
  );
  assert.equal(
    getSquadConstraintError({
      team: { squad: [{ id: 'a' }] },
      player: overseas,
      squadLimit: 1,
      playerIndex,
    }),
    'Squad is full',
  );
  assert.equal(
    getSquadConstraintError({
      team: { squad: [{ id: 'p-other' }] },
      player: overseas,
      overseasLimit: 1,
      playerIndex,
    }),
    'Overseas player limit reached',
  );
  assert.equal(
    getSquadConstraintError({
      team: { squad: [] },
      player: overseas,
      overseasLimit: 8,
      playerIndex,
    }),
    null,
  );
});

test('closing a room on a server with another live session keeps the socket online', () => {
  const sessions = createServerSessionTracker();

  sessions.acquire('primary');
  sessions.acquire('primary');
  sessions.release('primary');
  assert.equal(sessions.has('primary'), true, 'the next room still needs this socket');

  sessions.release('primary');
  assert.equal(sessions.has('primary'), false);
  assert.equal(sessions.size(), 0);
});

test('server-side disconnect auto-pause: arms only for connected host primary tab during bidding', () => {
  const base = {
    socketConnected: true,
    isHost: true,
    isPrimaryTab: true,
    roomStatus: 'active',
    liveStatus: 'bidding',
    playerId: 'p-1',
  };

  assert.equal(shouldArmDisconnectPause(base), true, 'must arm when all conditions met');

  assert.equal(shouldArmDisconnectPause({ ...base, socketConnected: false }), false, 'must not arm when disconnected');
  assert.equal(shouldArmDisconnectPause({ ...base, isHost: false }), false, 'must not arm for non-host');
  assert.equal(shouldArmDisconnectPause({ ...base, isPrimaryTab: false }), false, 'must not arm for secondary host tab');
  assert.equal(shouldArmDisconnectPause({ ...base, roomStatus: 'waiting' }), false, 'must not arm in lobby');
  assert.equal(shouldArmDisconnectPause({ ...base, roomStatus: 'completed' }), false, 'must not arm when auction completed');
  assert.equal(shouldArmDisconnectPause({ ...base, liveStatus: 'paused' }), false, 'must not arm when already paused');
  assert.equal(shouldArmDisconnectPause({ ...base, liveStatus: 'sold' }), false, 'must not arm when lot sold');
  assert.equal(shouldArmDisconnectPause({ ...base, liveStatus: 'unsold' }), false, 'must not arm when lot unsold');
  assert.equal(shouldArmDisconnectPause({ ...base, liveStatus: 'completed' }), false, 'must not arm when lot completed');
  assert.equal(shouldArmDisconnectPause({ ...base, playerId: null }), false, 'must not arm without valid player');
});

test('server-side disconnect auto-pause: lifecycle actions prevent stale operations and re-arm on lot change', () => {
  // Fresh arm
  assert.equal(
    resolveDisconnectAction({
      shouldArm: true,
      currentlyArmed: false,
      armedLotId: null,
      currentLotId: 'p-1',
    }),
    'arm',
  );

  // Already armed for same player -> no-op
  assert.equal(
    resolveDisconnectAction({
      shouldArm: true,
      currentlyArmed: true,
      armedLotId: 'p-1',
      currentLotId: 'p-1',
    }),
    'none',
  );

  // Advanced to next player -> must re-arm (cancel old, arm new)
  assert.equal(
    resolveDisconnectAction({
      shouldArm: true,
      currentlyArmed: true,
      armedLotId: 'p-1',
      currentLotId: 'p-2',
    }),
    'rearm',
  );

  // Status became paused/sold/completed -> cancel armed operation
  assert.equal(
    resolveDisconnectAction({
      shouldArm: false,
      currentlyArmed: true,
      armedLotId: 'p-1',
      currentLotId: 'p-1',
    }),
    'cancel',
  );

  // Already not armed -> no-op
  assert.equal(
    resolveDisconnectAction({
      shouldArm: false,
      currentlyArmed: false,
      armedLotId: null,
      currentLotId: 'p-1',
    }),
    'none',
  );
});

test('server-side disconnect auto-pause: preserved remaining time derived accurately from pausedAt', () => {
  // Server disconnect pause sets pausedAt
  const disconnectPausedLive = {
    status: 'paused',
    timerEndsAt: 25000,
    pausedAt: 17000,
    playerId: 'p-1',
  };
  assert.equal(pausedRemainingMs(disconnectPausedLive), 8000, 'must accurately derive remainingMs from timerEndsAt - pausedAt');

  // Disconnect after expiration clamps cleanly to 0
  const expiredDisconnectLive = {
    status: 'paused',
    timerEndsAt: 10000,
    pausedAt: 12000,
    playerId: 'p-1',
  };
  assert.equal(pausedRemainingMs(expiredDisconnectLive), 0, 'expired timer must clamp to 0');

  // Manual pause priority: explicit remainingMs takes precedence
  const manualPausedLive = {
    status: 'paused',
    remainingMs: 5500,
    timerEndsAt: 25000,
    pausedAt: 17000,
  };
  assert.equal(pausedRemainingMs(manualPausedLive), 5500, 'explicit remainingMs takes precedence over pausedAt');
});

test('getNextUnsoldPlayerIndex: strictly skips sold players and never repeats already-owned lots', () => {
  // Let indices 0, 1, 2, 3 represent real players in IPL_PLAYERS
  const p0 = IPL_PLAYERS[0];
  const p1 = IPL_PLAYERS[1];
  const p2 = IPL_PLAYERS[2];
  const p3 = IPL_PLAYERS[3];

  const playerOrder = [0, 1, 2, 3];

  // Teams have p0 and p1 already in their squads
  const teams = [
    { teamId: 'MI', squad: [{ id: p0.id, name: p0.name }] },
    { teamId: 'CSK', squad: [{ id: p1.id, name: p1.name }] },
  ];

  // Advancing from p0 must skip p1 (since p1 is sold to CSK) and return index 2 (p2)
  const nextIdx = getNextUnsoldPlayerIndex(playerOrder, p0.id, teams);
  assert.equal(nextIdx, 2, 'must skip p1 and advance directly to p2');

  // If p2 is also sold, advancing from p0 must advance directly to p3
  teams.push({ teamId: 'RCB', squad: [{ id: p2.id }] });
  const nextIdx2 = getNextUnsoldPlayerIndex(playerOrder, p0.id, teams);
  assert.equal(nextIdx2, 3, 'must skip p1 and p2 and advance directly to p3');

  // If all players are sold, it must return undefined (never loop back to p0!)
  teams.push({ teamId: 'KKR', squad: [{ id: p3.id }] });
  const nextIdx3 = getNextUnsoldPlayerIndex(playerOrder, p0.id, teams);
  assert.equal(nextIdx3, undefined, 'must return undefined when all players in lot are sold');

  // Handles RTDB object serialization { "0": 0, "1": 1, ... } without falling back or erroring
  const rtdbOrderObject = { '0': 0, '1': 1, '2': 2, '3': 3 };
  const partialTeams = [{ teamId: 'MI', squad: [{ id: p0.id }] }];
  const rtdbNext = getNextUnsoldPlayerIndex(rtdbOrderObject, p0.id, partialTeams);
  assert.equal(rtdbNext, 1, 'must handle RTDB object keyed playerOrder smoothly');
});

test('mini auction: player pool is randomized across sets and sequential queue matches next lot', () => {
  const miniOrder = generatePlayerOrder('mini');
  assert.ok(miniOrder.length > 50, 'mini order should have available released/unassigned players');

  // Verify that sets are mixed rather than clustered in chunks
  const sets = miniOrder.map(idx => IPL_PLAYERS[idx]?.set).filter(Boolean);
  let transitions = 0;
  for (let i = 1; i < Math.min(50, sets.length); i++) {
    if (sets[i] !== sets[i - 1]) transitions++;
  }
  // In a shuffled list of different sets, transitions should be high (> 50% of pairs)
  assert.ok(transitions > 20, 'sets must be randomized across lots rather than clustered by set');

  // Verify upcoming queue resolution:
  const currentLotPlayer = IPL_PLAYERS[miniOrder[0]];
  const expectedNextPlayer = IPL_PLAYERS[miniOrder[1]];

  const nextResolvedIdx = getNextUnsoldPlayerIndex(miniOrder, currentLotPlayer.id, []);
  assert.equal(nextResolvedIdx, miniOrder[1]);
  assert.equal(IPL_PLAYERS[nextResolvedIdx].id, expectedNextPlayer.id, 'next unsold lot in engine must match next player in queue');
});


