import test from 'node:test';
import assert from 'node:assert/strict';
import {
  finalizedLotRecoveryDelay,
  getNextBidAmount,
  getSquadConstraintError,
  getStartDisposition,
  mapRoomPlayers,
  mergeRoomPlayer,
} from '../src/lib/auctionRules.js';
import {
  transactBid,
  transactRoomPlayersSale,
  transactSale,
  transactTeamSale,
} from '../src/lib/auctionTransactions.js';
import { createServerSessionTracker } from '../src/lib/serverSessions.js';
import { shouldAcceptState } from '../src/lib/localAuctionEngine.js';

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

test('a peer never accepts an older or foreign-host local snapshot', () => {
  const current = { id: 'HOTSPOT-1', hostId: 'host-1', hostRev: 5 };

  assert.equal(shouldAcceptState(null, current), true);
  assert.equal(shouldAcceptState(current, { ...current, hostRev: 6 }), true);
  assert.equal(shouldAcceptState(current, { ...current, hostRev: 5 }), false);
  assert.equal(shouldAcceptState(current, { ...current, hostRev: 4 }), false);
  assert.equal(shouldAcceptState(current, { ...current, hostId: 'host-2', hostRev: 6 }), false);
  assert.equal(shouldAcceptState(current, null), false);
});
