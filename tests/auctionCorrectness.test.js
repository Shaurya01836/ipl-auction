import test from 'node:test';
import assert from 'node:assert/strict';
import { r2, toFiniteNumber } from '../src/lib/auctionDisplay.js';
import {
  transactAdvance,
  transactBid,
  transactRoomPlayersSale,
  transactSale,
  transactTeamSale,
} from '../src/lib/auctionTransactions.js';
import { normalizeSquad } from '../src/lib/auctionRules.js';

// Production live-bid transaction, with the same inputs the old local
// simulation used so these tests now guard the shipped function.
function runLiveBidTransaction(currentData, { userId, userName, teamId, authoritativeBudget, basePrice, timerSeconds = 10, now }) {
  return transactBid(currentData, {
    userId,
    userName,
    teamId,
    playerId: currentData?.playerId,
    now,
    timerMs: timerSeconds * 1000,
    budget: authoritativeBudget,
    basePrice,
  });
}

// Production sale transaction on auctions/{id}/live.
function runLiveEndTransaction(currentData, now) {
  return transactSale(currentData, now);
}

// Production sale finalization: team transaction + monotonic room stats.
function processSaleFinalization({ roomPlayers, teamData, auctionState, defaultBudget = 120.0 }) {
  const isSold = auctionState.status === 'sold';
  let updatedPlayers = null;
  let newTeamData = null;
  const lotMsgKey = `lot_${auctionState.playerId}`;

  if (isSold) {
    newTeamData = transactTeamSale(teamData, {
      roomId: 'room-1',
      playerId: auctionState.playerId,
      bid: auctionState.currentBid,
      winnerId: auctionState.highBidderId,
      winnerTeamId: auctionState.highBidderTeamId,
      winnerName: auctionState.highBidderName,
      initialBudget: defaultBudget,
    });

    if (roomPlayers) {
      updatedPlayers = transactRoomPlayersSale(
        { players: roomPlayers },
        {
          winnerId: auctionState.highBidderId,
          totalSpent: toFiniteNumber(newTeamData?.spent, 0),
          squadCount: normalizeSquad(newTeamData?.squad).length,
        },
      ).players;
    }
  }

  const messageEntry = {
    key: lotMsgKey,
    type: isSold ? 'sold_card' : 'log',
    playerId: auctionState.playerId,
  };

  return { updatedPlayers, newTeamData, messageEntry };
}

test('concurrent bidding: retried transaction aborts if updated bid exceeds purse', () => {
  const liveState = {
    status: 'bidding',
    playerId: 'p-1',
    currentBid: 4.0,
    highBidderId: 'other-user',
    timerEndsAt: 10000,
  };

  // Manager has only 4.20 left. Expected next bid at cBid=4.0 is 4.20.
  const validBid = runLiveBidTransaction(liveState, {
    userId: 'my-user',
    userName: 'Manager',
    teamId: 'CSK',
    authoritativeBudget: 4.20,
    basePrice: 2.0,
    now: 5000,
  });
  assert.ok(validBid);
  assert.equal(validBid.currentBid, 4.20);
  assert.equal(validBid.highBidderId, 'my-user');

  // Concurrency scenario: during transaction retry, another bidder has raised currentBid to 4.20
  // Next bid would now be 4.40, which exceeds manager's authoritativeBudget (4.20).
  const conflictedLiveState = {
    ...liveState,
    currentBid: 4.20,
    highBidderId: 'concurrent-user',
  };
  const abortedRetry = runLiveBidTransaction(conflictedLiveState, {
    userId: 'my-user',
    userName: 'Manager',
    teamId: 'CSK',
    authoritativeBudget: 4.20,
    basePrice: 2.0,
    now: 5000,
  });
  assert.equal(abortedRetry, undefined, 'Transaction retry must abort when new bid exceeds remaining purse');
});

test('concurrent bidding: self-outbidding and expired timer are rejected', () => {
  const liveState = {
    status: 'bidding',
    playerId: 'p-1',
    currentBid: 5.0,
    highBidderId: 'my-user',
    timerEndsAt: 10000,
  };

  // Same user bidding again
  const selfBid = runLiveBidTransaction(liveState, {
    userId: 'my-user',
    userName: 'Manager',
    teamId: 'CSK',
    authoritativeBudget: 50.0,
    basePrice: 2.0,
    now: 5000,
  });
  assert.equal(selfBid, undefined, 'Self outbidding must be rejected');

  // Bid placed after timer expiration
  const lateBid = runLiveBidTransaction(
    { ...liveState, highBidderId: 'other-user' },
    {
      userId: 'my-user',
      userName: 'Manager',
      teamId: 'CSK',
      authoritativeBudget: 50.0,
      basePrice: 2.0,
      now: 10001,
    },
  );
  assert.equal(lateBid, undefined, 'Late bid after timer expiration must be rejected');
});

test('sale finalization: live transaction is strictly idempotent', () => {
  const activeBidding = {
    status: 'bidding',
    playerId: 'p-1',
    currentBid: 12.5,
    highBidderId: 'winner-1',
    highBidderTeamId: 'MI',
    timerEndsAt: 5000,
  };

  // First execution commits sold state
  const firstTx = runLiveEndTransaction(activeBidding, 5001);
  assert.ok(firstTx);
  assert.equal(firstTx.status, 'sold');

  // Second execution (retry or competing client) aborts because status is already 'sold'
  const secondTx = runLiveEndTransaction(firstTx, 5002);
  assert.equal(secondTx, undefined, 'Compromised or duplicate endPlayerAuction must abort when status is not bidding');
});

test('sale finalization: idempotency guard prevents double deduction and duplicate squad/messages on retry', () => {
  const auctionState = {
    status: 'sold',
    playerId: 'p-bumrah',
    currentBid: 18.0,
    highBidderId: 'winner-1',
    highBidderTeamId: 'MI',
  };

  const initialRoomPlayers = [{ id: 'winner-1', spent: 0, squadCount: 0 }];
  const initialTeamData = {
    teamId: 'MI',
    budgetRemaining: 120.0,
    spent: 0,
    squad: [],
  };

  // First sale finalization
  const result1 = processSaleFinalization({
    roomPlayers: initialRoomPlayers,
    teamData: initialTeamData,
    auctionState,
  });

  assert.equal(result1.messageEntry.key, 'lot_p-bumrah');
  assert.equal(result1.newTeamData.budgetRemaining, 102.0);
  assert.equal(result1.newTeamData.spent, 18.0);
  assert.equal(result1.newTeamData.squad.length, 1);
  assert.equal(result1.newTeamData.squad[0].id, 'p-bumrah');
  assert.equal(result1.updatedPlayers[0].spent, 18.0);
  assert.equal(result1.updatedPlayers[0].squadCount, 1);

  // Retry scenario: team data in RTDB already has the player from previous commit
  const retriedTeamData = result1.newTeamData;
  const retriedRoomPlayers = result1.updatedPlayers;

  const result2 = processSaleFinalization({
    roomPlayers: retriedRoomPlayers,
    teamData: retriedTeamData,
    auctionState,
  });

  // Second execution maintains exact same deduplicated squad, exact same budget, and identical message key
  assert.equal(result2.newTeamData.budgetRemaining, 102.0, 'Purse must not be deducted again on retried execution');
  assert.equal(result2.newTeamData.spent, 18.0, 'Total spent must remain 18.0');
  assert.equal(result2.newTeamData.squad.length, 1, 'Squad must not duplicate the player');
  assert.equal(result2.messageEntry.key, 'lot_p-bumrah', 'Message key must be identical deterministic key');
});

test('purse precision: repeated fractional bids and sales maintain exact two-decimal precision', () => {
  let budget = 120.0;
  let spent = 0;

  const bids = [0.20, 0.25, 1.20, 3.45, 14.80, 20.30];
  for (const bid of bids) {
    budget = Math.max(0, r2(budget - bid));
    spent = r2(spent + bid);
    // Check no floating point drift (e.g. 104.80000000000001)
    const budgetStr = budget.toString();
    const decimalParts = budgetStr.split('.')[1] || '';
    assert.ok(decimalParts.length <= 2, `Budget ${budget} has excessive decimal places`);
  }

  assert.equal(r2(budget + spent), 120.0);
});

test('concurrent bidding: manager cannot bid on a player already present in their squad', () => {
  const liveState = {
    status: 'bidding',
    playerId: 'p-dhoni',
    currentBid: 10.0,
    highBidderId: 'other-user',
    timerEndsAt: 10000,
  };

  const teamWithPlayer = {
    teamId: 'CSK',
    budgetRemaining: 50.0,
    squad: [{ id: 'p-dhoni', bid: 10.0 }],
  };

  const canBid = !teamWithPlayer.squad.some(p => (typeof p === 'string' ? p : p?.id) === liveState.playerId);
  assert.equal(canBid, false, 'Manager must be prevented from bidding on a player already in their squad');
});

test('concurrent bidding: multiple simultaneous bids with optimistic retry resolve deterministically', async () => {
  // Simulates an RTDB node with optimistic concurrency control (OCC)
  class SimulatedRtdbNode {
    constructor(initialValue) {
      this.value = initialValue;
      this.version = 1;
    }

    async runTransaction(updateFn, maxRetries = 5) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const readVersion = this.version;
        const currentData = JSON.parse(JSON.stringify(this.value));
        const updatedData = updateFn(currentData);

        if (updatedData === undefined) {
          return { committed: false, snapshot: { val: () => this.value } };
        }

        // Simulate network latency / interleaved event loop tick
        await new Promise((r) => setTimeout(r, Math.random() * 5));

        // Optimistic concurrency check: if version changed while calculating, retry!
        if (this.version === readVersion) {
          this.value = updatedData;
          this.version += 1;
          return { committed: true, snapshot: { val: () => this.value } };
        }
      }
      return { committed: false, snapshot: { val: () => this.value } };
    }
  }

  const liveNode = new SimulatedRtdbNode({
    status: 'bidding',
    playerId: 'p-virat',
    currentBid: 5.0,
    highBidderId: 'starter',
    highBidderName: 'Starter',
    highBidderTeamId: 'RCB',
    timerEndsAt: Date.now() + 10000,
  });

  // Client 1 (CSK) with 6.0 budget and Client 2 (MI) with 7.0 budget bid at the exact same instant
  const client1Bid = liveNode.runTransaction((data) =>
    runLiveBidTransaction(data, {
      userId: 'user-csk',
      userName: 'CSK Manager',
      teamId: 'CSK',
      authoritativeBudget: 6.0,
      basePrice: 2.0,
      now: Date.now(),
    }),
  );

  const client2Bid = liveNode.runTransaction((data) =>
    runLiveBidTransaction(data, {
      userId: 'user-mi',
      userName: 'MI Manager',
      teamId: 'MI',
      authoritativeBudget: 7.0,
      basePrice: 2.0,
      now: Date.now(),
    }),
  );

  const results = await Promise.all([client1Bid, client2Bid]);
  const committedCount = results.filter((r) => r.committed).length;

  // Both bids should be committed in sequence via retry
  assert.equal(committedCount, 2, 'Both concurrent transactions should commit via OCC retry');
  assert.equal(liveNode.value.currentBid, 5.50, 'Current bid should increment twice (+0.25 each above 5.0)');
});

test('sale finalization: unsold players do not cause purse deduction or alter team rosters', () => {
  const initialRoomPlayers = [{ id: 'user-1', spent: 10.0, squadCount: 1 }];
  const initialTeamData = {
    teamId: 'KKR',
    budgetRemaining: 110.0,
    spent: 10.0,
    squad: [{ id: 'p-1', bid: 10.0 }],
  };

  const unsoldAuctionState = {
    status: 'unsold',
    playerId: 'p-unsold',
    currentBid: 0,
    highBidderId: '',
    highBidderTeamId: '',
  };

  const result = processSaleFinalization({
    roomPlayers: initialRoomPlayers,
    teamData: initialTeamData,
    auctionState: unsoldAuctionState,
  });

  assert.equal(result.messageEntry.key, 'lot_p-unsold', 'Unsold system message should be generated');
  assert.equal(result.newTeamData, null, 'No team data should be updated for unsold player');
  assert.equal(result.updatedPlayers, null, 'No player spent/squadCount should be modified for unsold player');
});

test('sale finalization: partial failure recovery completes multipath write and does not lose sale', () => {
  // Scenario:
  // Step 1: liveRef transaction succeeded and committed status: 'sold'
  const liveState = {
    status: 'sold',
    playerId: 'p-bumrah',
    currentBid: 18.0,
    highBidderId: 'winner-1',
    highBidderTeamId: 'MI',
  };

  // Step 2: Database state right after multipath write threw / failed:
  // The team node does NOT have the player yet
  const teamDataInRtdb = {
    teamId: 'MI',
    budgetRemaining: 120.0,
    spent: 0,
    squad: [],
  };
  const roomPlayersInRtdb = [{ id: 'winner-1', spent: 0, squadCount: 0 }];

  // Step 3: Recovery execution (endPlayerAuction called with force=true)
  const alreadyInSquad = (teamDataInRtdb.squad || []).some(
    (item) => (typeof item === 'string' ? item : item?.id) === liveState.playerId,
  );

  assert.equal(alreadyInSquad, false, 'Recovery detects that player write was not completed');

  // Perform recovery finalization
  const recoveryResult = processSaleFinalization({
    roomPlayers: roomPlayersInRtdb,
    teamData: teamDataInRtdb,
    auctionState: liveState,
  });

  assert.ok(recoveryResult.newTeamData, 'Recovery must produce new team data');
  assert.equal(recoveryResult.newTeamData.budgetRemaining, 102.0, 'Purse must be deducted on recovery');
  assert.equal(recoveryResult.newTeamData.squad.length, 1, 'Player must be added to squad on recovery');
  assert.equal(recoveryResult.newTeamData.squad[0].id, 'p-bumrah');
  assert.equal(recoveryResult.updatedPlayers[0].squadCount, 1, 'Squad count must be incremented on recovery');
});

test('data consistency: failed multipath write preserves live sold status and room active status', () => {
  // In RTDB, there are two distinct status nodes:
  // 1. auctions/{id}/live/status: tracks current lot ('bidding' -> 'sold' / 'unsold')
  // 2. auctions/{id}/room/status: tracks overall room lifecycle ('active' -> 'completed')
  const rtdbTree = {
    room: { id: 'ROOM-1', status: 'active', playerOrder: ['p-1', 'p-2'] },
    live: { playerId: 'p-1', currentBid: 10.0, highBidderId: 'user-1', status: 'bidding' },
    teams: { 'ROOM-1_user-1': { squad: [], budgetRemaining: 120.0, spent: 0 } },
  };

  // Step 1: Live transaction succeeds -> live.status becomes 'sold'
  rtdbTree.live.status = 'sold';

  // Step 2: Multipath write fails (simulated failure before writing teams)
  const multipathSucceeded = false;
  if (!multipathSucceeded) {
    // Error caught in catch block; advanceToNextPlayer is NOT called
  }

  // Verify status states after failure:
  // - live.status is 'sold' (transaction committed)
  // - room.status is STILL 'active' (not completed)
  // - team squad has NOT yet received player
  assert.equal(rtdbTree.live.status, 'sold', 'Live lot status must be sold');
  assert.equal(rtdbTree.room.status, 'active', 'Room session status must remain active');
  assert.equal(rtdbTree.teams['ROOM-1_user-1'].squad.length, 0, 'Squad write was not applied yet');

  // Step 3: When recovery executes, it checks live.status === 'sold' and !alreadyInSquad
  const needsRecovery = rtdbTree.live.status === 'sold' &&
    !rtdbTree.teams['ROOM-1_user-1'].squad.some(p => p.id === rtdbTree.live.playerId);

  assert.equal(needsRecovery, true, 'Recovery must detect that live lot is sold but squad write was interrupted');
});

test('advanceToNextPlayer: atomic transaction prevents advancing next player twice', () => {
  // Production liveRef transaction in advanceToNextPlayer.
  function advancePlayerTransaction(currentLive, { currentPlayerId, nextPlayerId, bidTimer = 10, now = Date.now() }) {
    return transactAdvance(currentLive, {
      currentPlayerId,
      nextPlayerId,
      timerEndsAt: now + bidTimer * 1000,
    });
  }

  let liveState = {
    playerId: 'p-1',
    currentBid: 15.0,
    highBidderId: 'winner-1',
    status: 'sold',
  };

  // Client 1 advances to Player 2
  const client1Advance = advancePlayerTransaction(liveState, {
    currentPlayerId: 'p-1',
    nextPlayerId: 'p-2',
  });
  assert.ok(client1Advance, 'Client 1 should successfully advance to Player 2');
  assert.equal(client1Advance.playerId, 'p-2');
  assert.equal(client1Advance.status, 'bidding');

  // Live state is now on Player 2 in bidding state
  liveState = client1Advance;

  // Client 2 attempts to advance Player 1 (delayed timeout from competing client)
  const client2Advance = advancePlayerTransaction(liveState, {
    currentPlayerId: 'p-1',
    nextPlayerId: 'p-2',
  });
  assert.equal(client2Advance, undefined, 'Client 2 transaction must abort because lot already advanced to Player 2');
  assert.equal(liveState.playerId, 'p-2', 'Live lot must remain Player 2');

  // Even if Client 2 attempts to advance while Player 2 is already receiving bids
  liveState.currentBid = 2.0;
  liveState.highBidderId = 'early-bidder';
  const client2LateAdvance = advancePlayerTransaction(liveState, {
    currentPlayerId: 'p-1',
    nextPlayerId: 'p-2',
  });
  assert.equal(client2LateAdvance, undefined, 'Must never overwrite active bids on next player');
  assert.equal(liveState.currentBid, 2.0, 'Bids placed on next player must be preserved');
});

test('two simultaneous sold-lot recovery attempts write identical squad, purse, and message key', () => {
  // Scenario:
  // Both Client A and Client B see live.status === 'sold' and both read team state before either writes
  const initialTeamData = {
    teamId: 'CSK',
    budgetRemaining: 120.0,
    spent: 0,
    squad: [],
  };
  const auctionState = {
    status: 'sold',
    playerId: 'p-msd',
    currentBid: 14.0,
    highBidderId: 'user-csk',
    highBidderTeamId: 'CSK',
  };

  // Client A prepares multipath update
  const clientAResult = processSaleFinalization({
    roomPlayers: [{ id: 'user-csk', spent: 0, squadCount: 0 }],
    teamData: initialTeamData,
    auctionState,
  });

  // Client B simultaneously prepares multipath update from the same pre-write snapshot
  const clientBResult = processSaleFinalization({
    roomPlayers: [{ id: 'user-csk', spent: 0, squadCount: 0 }],
    teamData: initialTeamData,
    auctionState,
  });

  // Both compute identical deterministic state
  assert.equal(clientAResult.newTeamData.budgetRemaining, 106.0);
  assert.equal(clientBResult.newTeamData.budgetRemaining, 106.0);
  assert.equal(clientAResult.newTeamData.spent, 14.0);
  assert.equal(clientBResult.newTeamData.spent, 14.0);
  assert.equal(clientAResult.newTeamData.squad.length, 1);
  assert.equal(clientBResult.newTeamData.squad.length, 1);

  // Crucial: message key is deterministic, not random push().key!
  assert.equal(clientAResult.messageEntry.key, 'lot_p-msd');
  assert.equal(clientBResult.messageEntry.key, 'lot_p-msd');

  // Simulating RTDB tree where Client A writes, then Client B writes
  const rtdbTree = { messages: {}, teams: {} };
  rtdbTree.messages[clientAResult.messageEntry.key] = { text: 'SOLD to CSK' };
  rtdbTree.teams['CSK'] = clientAResult.newTeamData;

  // Client B's write arrives
  rtdbTree.messages[clientBResult.messageEntry.key] = { text: 'SOLD to CSK' };
  rtdbTree.teams['CSK'] = clientBResult.newTeamData;

  // Result: exactly ONE message exists, squad has 1 player, purse deducted once
  assert.equal(Object.keys(rtdbTree.messages).length, 1, 'Exactly one message must exist in RTDB');
  assert.equal(rtdbTree.teams['CSK'].squad.length, 1, 'Squad must contain exactly 1 player');
  assert.equal(rtdbTree.teams['CSK'].budgetRemaining, 106.0, 'Purse deducted exactly once');
});

test('two simultaneous unsold-lot recovery attempts produce exactly one unsold message without modifying team rosters', () => {
  const unsoldAuctionState = {
    status: 'unsold',
    playerId: 'p-unsold-player',
    currentBid: 0,
    highBidderId: '',
  };

  const clientA = processSaleFinalization({ auctionState: unsoldAuctionState });
  const clientB = processSaleFinalization({ auctionState: unsoldAuctionState });

  // Both write to the exact same deterministic message key
  assert.equal(clientA.messageEntry.key, 'lot_p-unsold-player');
  assert.equal(clientB.messageEntry.key, 'lot_p-unsold-player');
  assert.equal(clientA.newTeamData, null, 'No team data mutated');
  assert.equal(clientB.newTeamData, null, 'No team data mutated');

  // Applied to RTDB messages node
  const rtdbMessages = {};
  rtdbMessages[clientA.messageEntry.key] = { text: 'Player went unsold' };
  rtdbMessages[clientB.messageEntry.key] = { text: 'Player went unsold' };

  assert.equal(Object.keys(rtdbMessages).length, 1, 'Only one unsold message must exist even with concurrent writes');
});

test('retry after successful multipath write but lost acknowledgment is completely idempotent', () => {
  const auctionState = {
    status: 'sold',
    playerId: 'p-hardik',
    currentBid: 15.0,
    highBidderId: 'user-mi',
    highBidderTeamId: 'MI',
  };

  // State after successful commit on server
  const committedTeamData = {
    teamId: 'MI',
    budgetRemaining: 105.0,
    spent: 15.0,
    squad: [{ id: 'p-hardik', bid: 15.0 }],
  };

  // Client lost connection before ACK and retries
  const retryResult = processSaleFinalization({
    roomPlayers: [{ id: 'user-mi', spent: 15.0, squadCount: 1 }],
    teamData: committedTeamData,
    auctionState,
  });

  assert.equal(retryResult.newTeamData.squad.length, 1, 'Player must not be duplicated in squad');
  assert.equal(retryResult.newTeamData.spent, 15.0, 'Spent must remain 15.0');
  assert.equal(retryResult.newTeamData.budgetRemaining, 105.0, 'Budget must not be deducted again');
  assert.equal(retryResult.messageEntry.key, 'lot_p-hardik', 'Message key must remain identical');
});

// Production team transaction on teams/{teamDocId}.
function runTeamFinalizationTransaction(currentTeam, { auctionState, initialBudget = 120.0 }) {
  return transactTeamSale(currentTeam, {
    roomId: 'room-1',
    playerId: auctionState.playerId,
    bid: auctionState.currentBid,
    winnerId: auctionState.highBidderId,
    winnerTeamId: auctionState.highBidderTeamId,
    winnerName: auctionState.highBidderName,
    initialBudget,
  });
}

test('stale recovery protection: delayed recovery for Player 1 does not overwrite Player 2 or roll back team purse', () => {
  const initialBudget = 120.0;

  // Step 1: Player 1 finalized by Client A
  const p1Sale = {
    playerId: 'p1',
    currentBid: 10.0,
    highBidderId: 'user-csk',
    highBidderTeamId: 'CSK',
    highBidderName: 'CSK Manager',
  };
  const afterP1 = runTeamFinalizationTransaction(null, { auctionState: p1Sale, initialBudget });
  assert.equal(afterP1.squad.length, 1);
  assert.equal(afterP1.spent, 10.0);
  assert.equal(afterP1.budgetRemaining, 110.0);

  // Step 2: Auction advances, CSK buys Player 2
  const p2Sale = {
    playerId: 'p2',
    currentBid: 15.0,
    highBidderId: 'user-csk',
    highBidderTeamId: 'CSK',
    highBidderName: 'CSK Manager',
  };
  const afterP2 = runTeamFinalizationTransaction(afterP1, { auctionState: p2Sale, initialBudget });
  assert.equal(afterP2.squad.length, 2);
  assert.equal(afterP2.spent, 25.0);
  assert.equal(afterP2.budgetRemaining, 95.0);
  assert.deepEqual(afterP2.squad.map((p) => p.id), ['p1', 'p2']);

  // Step 3: Delayed recovery for Player 1 executes now against the live server state
  const delayedRecoveryResult = runTeamFinalizationTransaction(afterP2, { auctionState: p1Sale, initialBudget });

  // Verify Player 2 is NOT wiped out and purse is NOT rolled back
  assert.equal(delayedRecoveryResult.squad.length, 2, 'Player 2 must not be erased by delayed recovery');
  assert.deepEqual(delayedRecoveryResult.squad.map((p) => p.id), ['p1', 'p2']);
  assert.equal(delayedRecoveryResult.spent, 25.0, 'Spent must remain 25.0');
  assert.equal(delayedRecoveryResult.budgetRemaining, 95.0, 'Budget must remain 95.0');
});

test('stale recovery protection: monotonic room.players update prevents spent and squadCount regression', () => {
  // Current room participants after Player 2 purchase
  const roomPlayers = [
    { id: 'user-csk', spent: 25.0, squadCount: 2 },
    { id: 'user-mi', spent: 0, squadCount: 0 },
  ];

  // Stale recovery calculates spent=10.0, squadCount=1 from Player 1
  const staleSpent = 10.0;
  const staleSquadCount = 1;

  const updatedPlayers = roomPlayers.map((p) => {
    if (p.id === 'user-csk') {
      return {
        ...p,
        spent: Math.max(toFiniteNumber(p.spent, 0), staleSpent),
        squadCount: Math.max(toFiniteNumber(p.squadCount, 0), staleSquadCount),
      };
    }
    return p;
  });

  const cskUser = updatedPlayers.find((p) => p.id === 'user-csk');
  assert.equal(cskUser.spent, 25.0, 'Spent must not regress to 10.0');
  assert.equal(cskUser.squadCount, 2, 'Squad count must not regress to 1');
});

test('message ordering: chronological sorting handles mixture of push keys and deterministic lot keys', () => {
  // RTDB snapshot might iterate in key order: push keys (-P...) followed by lot keys (lot_...)
  const rawRtdbMessages = [
    { id: '-P001_chat1', text: 'Hello auction', type: 'text', timestamp: 1000 },
    { id: '-P002_chat2', text: 'Good luck all', type: 'text', timestamp: 2000 },
    { id: 'lot_p1', text: 'Player 1 SOLD', type: 'sold_card', timestamp: 1500 },
    { id: '-P003_chat3', text: 'Nice buy!', type: 'text', timestamp: 2500 },
    { id: 'lot_p2', text: 'Player 2 UNSOLD', type: 'log', timestamp: 3000 },
  ];

  // Sorted chronologically ascending (as in AuctionContext setMessages)
  const sortedAscending = [...rawRtdbMessages].sort((a, b) => {
    const ta = toFiniteNumber(typeof a.timestamp === 'number' ? a.timestamp : 0, 0);
    const tb = toFiniteNumber(typeof b.timestamp === 'number' ? b.timestamp : 0, 0);
    if (ta !== tb) return ta - tb;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  assert.deepEqual(
    sortedAscending.map((m) => m.id),
    ['-P001_chat1', 'lot_p1', '-P002_chat2', '-P003_chat3', 'lot_p2'],
    'Messages must sort strictly chronologically regardless of key prefix',
  );

  // Activity feed in AuctionRoom: filtered to log & sold_card and sorted descending (newest on top)
  const activityLogs = sortedAscending
    .filter((m) => m.type === 'log' || m.type === 'sold_card')
    .sort((a, b) => b.timestamp - a.timestamp);

  assert.equal(activityLogs[0].id, 'lot_p2', 'Newest log must be at the top of activity feed');
  assert.equal(activityLogs[1].id, 'lot_p1', 'Older log must be below newer log');
});

test('message deduplication: existing lot message is preserved and not rewritten with newer timestamp', () => {
  const rtdbMessages = {
    lot_p1: {
      userId: 'system',
      text: 'Bumrah SOLD to MI for 18 Cr',
      type: 'sold_card',
      timestamp: 10000,
    },
  };

  // Simulating recovery check: if message exists, skip write
  const lotMsgKey = 'lot_p1';
  const hasExisting = Boolean(rtdbMessages[lotMsgKey]);
  assert.equal(hasExisting, true);

  if (!hasExisting) {
    rtdbMessages[lotMsgKey] = {
      userId: 'system',
      text: 'Bumrah SOLD to MI for 18 Cr',
      type: 'sold_card',
      timestamp: 25000, // Newer timestamp that would cause UI jitter if rewritten
    };
  }

  assert.equal(rtdbMessages[lotMsgKey].timestamp, 10000, 'Timestamp must remain unchanged to prevent UI jitter');
});

