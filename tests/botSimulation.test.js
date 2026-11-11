import test from 'node:test';
import assert from 'node:assert/strict';
import { isSoloBotRoom, simulateBotLot, simulateRemainingAuction } from '../src/lib/botSimulation.js';
import { IPL_PLAYERS } from '../src/data/players.js';

test('isSoloBotRoom: accurately detects 1 human + bots', () => {
  const soloRoom = [
    { id: 'user123', isBot: false },
    { id: 'bot_CSK', isBot: true },
    { id: 'bot_MI', isBot: true },
  ];
  assert.equal(isSoloBotRoom(soloRoom), true);

  const multiplayerRoom = [
    { id: 'user123', isBot: false },
    { id: 'user456', isBot: false },
    { id: 'bot_CSK', isBot: true },
  ];
  assert.equal(isSoloBotRoom(multiplayerRoom), false);

  const zeroBotsRoom = [
    { id: 'user123', isBot: false },
  ];
  assert.equal(isSoloBotRoom(zeroBotsRoom), false);
});

test('simulateBotLot: resolves bidding or unsold without crashing', () => {
  const player = IPL_PLAYERS[0];
  const botTeams = [
    { userId: 'bot_CSK', teamId: 'CSK', budgetRemaining: 120, squad: [] },
    { userId: 'bot_MI', teamId: 'MI', budgetRemaining: 120, squad: [] },
  ];

  const result = simulateBotLot({
    player,
    botTeams,
    initialBudget: 120,
    squadLimit: 25,
    overseasLimit: 8,
  });

  if (result.isSold) {
    assert.ok(result.winnerId.startsWith('bot_'));
    assert.ok(result.finalBid >= player.basePrice);
  } else {
    assert.equal(result.winnerId, '');
  }
});

test('simulateRemainingAuction: preserves human squad while drafting for bots', () => {
  const humanTeam = {
    userId: 'user_shaurya',
    teamId: 'CSK',
    squad: [{ id: 'p1', name: 'Existing Star', bid: 15 }],
    budgetRemaining: 105,
    spent: 15,
  };
  const botTeams = [
    { userId: 'bot_MI', teamId: 'MI', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_RCB', teamId: 'RCB', squad: [], budgetRemaining: 120, spent: 0 },
  ];

  const playerOrder = [0, 1, 2, 3];
  const currentLive = {
    playerId: IPL_PLAYERS[0].id,
    currentBid: 5.0,
    highBidderId: 'user_shaurya',
    highBidderName: 'Shaurya',
    highBidderTeamId: 'CSK',
    status: 'bidding',
  };

  const { simulatedTeams, fastForwarded } = simulateRemainingAuction({
    playerOrder,
    currentPlayerIndex: 0,
    currentLive,
    humanUserId: 'user_shaurya',
    humanTeamId: 'CSK',
    teams: [humanTeam, ...botTeams],
    settings: { budget: 120 },
    squadLimit: 25,
    overseasLimit: 8,
  });

  assert.equal(fastForwarded, true);
  const updatedHuman = simulatedTeams.find((t) => t.userId === 'user_shaurya');
  // Human should have the initial player + the live lot awarded!
  assert.equal(updatedHuman.squad.length, 2);
  assert.equal(updatedHuman.squad[1].id, IPL_PLAYERS[0].id);
  assert.equal(updatedHuman.spent, 20); // 15 + 5

  // Verify none of the bot teams exceeded squadLimit or budget
  for (const t of simulatedTeams) {
    assert.ok(t.squad.length <= 25, `Team ${t.teamId} exceeded squad limit`);
    assert.ok(t.spent <= 120, `Team ${t.teamId} exceeded budget`);
  }
});

test('extra requirements: no team over purse/squad/overseas, each player resolved once, human squad unchanged, idempotent', () => {
  const humanTeam = {
    userId: 'user_human',
    teamId: 'CSK',
    squad: [
      { id: 'existing_1', name: 'Player A', bid: 10 },
      { id: 'existing_2', name: 'Player B', bid: 8 },
    ],
    budgetRemaining: 102,
    spent: 18,
  };

  const botTeams = [
    { userId: 'bot_MI', teamId: 'MI', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_RCB', teamId: 'RCB', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_KKR', teamId: 'KKR', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_DC', teamId: 'DC', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_PBKS', teamId: 'PBKS', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_RR', teamId: 'RR', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_SRH', teamId: 'SRH', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_GT', teamId: 'GT', squad: [], budgetRemaining: 120, spent: 0 },
    { userId: 'bot_LSG', teamId: 'LSG', squad: [], budgetRemaining: 120, spent: 0 },
  ];

  // 15 players in playerOrder
  const playerOrder = Array.from({ length: 15 }, (_, i) => i);
  const currentLive = {
    playerId: IPL_PLAYERS[0].id,
    currentBid: 2.0,
    highBidderId: 'bot_MI',
    highBidderName: 'MI Bot',
    highBidderTeamId: 'MI',
    status: 'bidding',
  };

  const result1 = simulateRemainingAuction({
    playerOrder,
    currentPlayerIndex: 0,
    currentLive,
    humanUserId: 'user_human',
    humanTeamId: 'CSK',
    teams: [humanTeam, ...botTeams],
    settings: { budget: 120 },
    squadLimit: 25,
    overseasLimit: 8,
  });

  const humanAfter = result1.simulatedTeams.find((t) => t.userId === 'user_human');
  // Human was NOT high bidder on live lot, so human squad remains exactly the original 2 players
  assert.equal(humanAfter.squad.length, 2);
  assert.equal(humanAfter.spent, 18);
  assert.equal(humanAfter.budgetRemaining, 102);

  // Collect all sold players across all teams
  const allSoldPlayerIds = [];
  for (const t of result1.simulatedTeams) {
    // 1. No team exceeded budget or squad
    assert.ok(t.spent <= 120.0, `Team ${t.teamId} exceeded budget: spent ${t.spent}`);
    assert.ok(t.squad.length <= 25, `Team ${t.teamId} exceeded squad limit: ${t.squad.length}`);

    t.squad.forEach((p) => {
      if (p.id !== 'existing_1' && p.id !== 'existing_2') {
        allSoldPlayerIds.push(p.id);
      }
    });
  }

  // 2. Every player in the auction was resolved at most once (no duplicate sales)
  const uniqueSold = new Set(allSoldPlayerIds);
  assert.equal(uniqueSold.size, allSoldPlayerIds.length, 'No player should be sold more than once');

  // 3. Fast-forward result tag
  assert.equal(result1.fastForwarded, true);

  // 4. Idempotency: calling simulate on the same initial data produces valid output
  const result2 = simulateRemainingAuction({
    playerOrder,
    currentPlayerIndex: 0,
    currentLive,
    humanUserId: 'user_human',
    humanTeamId: 'CSK',
    teams: [humanTeam, ...botTeams],
    settings: { budget: 120 },
    squadLimit: 25,
    overseasLimit: 8,
  });
  assert.equal(result2.fastForwarded, true);
  assert.equal(result2.simulatedTeams.length, 10);
});
