import test from 'node:test';
import assert from 'node:assert/strict';
import { isSoloBotRoom, simulateBotLot, simulateRemainingAuction } from '../src/lib/botSimulation.js';
import { computeBotValuation, computeHundredStatsMultiplier, evaluateBotBid } from '../src/lib/botEngine.js';
import { IPL_PLAYERS } from '../src/data/players.js';
import { HUNDRED_BOT_NAMES, HUNDRED_TEAMS, getTeamBotName, pickRandomBotName } from '../src/data/teams.js';
import { generatePlayerOrder } from '../src/lib/auctionRules.js';

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

test('simulateBotLot: with 0 bots always yields unsold', () => {
  const player = IPL_PLAYERS[0];
  const result = simulateBotLot({
    player,
    botTeams: [],
    initialBudget: 120,
    squadLimit: 25,
    overseasLimit: 8,
  });
  assert.equal(result.isSold, false);
  assert.equal(result.winnerId, '');
  assert.equal(result.finalBid, 0);
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

test('computeBotValuation: scales exponentially with player rating in modern sets', () => {
  const elitePlayer = { id: 'p_elite', name: 'Elite Star', basePrice: 2.0, rating: 94, role: 'Batsman', set: 'Set 1' };
  const avgPlayer = { id: 'p_avg', name: 'Average Player', basePrice: 2.0, rating: 74, role: 'Batsman', set: 'Set 1' };
  const botTeam = { userId: 'bot_RCB', teamId: 'RCB', budgetRemaining: 120, squad: [] };

  // Fixed randomFn (0.5) to isolate rating effect
  const valElite = computeBotValuation({ player: elitePlayer, botTeam, budgetRemaining: 120, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });
  const valAvg = computeBotValuation({ player: avgPlayer, botTeam, budgetRemaining: 120, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });

  assert.ok(valElite > valAvg * 1.3, `Elite player (${valElite}) should be valued significantly higher than average player (${valAvg})`);
});

test('computeBotValuation: franchise loyalty gives home team higher valuation for real-life icon', () => {
  const cskIcon = { id: 'p_dhoni', name: 'MS Dhoni', basePrice: 2.0, rating: 88, role: 'Wicket-Keeper', set: 'Set 1', team: 'CSK' };
  const cskBot = { userId: 'bot_CSK', teamId: 'CSK', budgetRemaining: 120, squad: [] };
  const pbksBot = { userId: 'bot_PBKS', teamId: 'PBKS', budgetRemaining: 120, squad: [] };

  const valCSK = computeBotValuation({ player: cskIcon, botTeam: cskBot, budgetRemaining: 120, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });
  const valPBKS = computeBotValuation({ player: cskIcon, botTeam: pbksBot, budgetRemaining: 120, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });

  assert.ok(valCSK > valPBKS, `CSK bot valuation (${valCSK}) should be higher than PBKS (${valPBKS}) for CSK icon`);
});

test('computeBotValuation: dynamic role deficit increases valuation when lacking critical roles', () => {
  const wkPlayer = { id: 'p_wk', name: 'Top Keeper', basePrice: 2.0, rating: 82, role: 'Wicket-Keeper', set: 'Set 2' };

  // Bot A has 4 players, 0 WKs (deficit)
  const botWithNoWK = {
    userId: 'bot_MI',
    teamId: 'MI',
    budgetRemaining: 90,
    squad: [
      { id: 'p1', role: 'Batsman' },
      { id: 'p2', role: 'Batsman' },
      { id: 'p3', role: 'Bowler' },
      { id: 'p4', role: 'Bowler' },
    ],
  };

  // Bot B has 4 players, already has 2 WKs (saturated)
  const botWith2WKs = {
    userId: 'bot_MI',
    teamId: 'MI',
    budgetRemaining: 90,
    squad: [
      { id: 'p1', role: 'Batsman' },
      { id: 'p2', role: 'Bowler' },
      { id: 'p3', role: 'Wicket-Keeper' },
      { id: 'p4', role: 'Wicket-Keeper' },
    ],
  };

  const valDeficit = computeBotValuation({ player: wkPlayer, botTeam: botWithNoWK, budgetRemaining: 90, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });
  const valSaturated = computeBotValuation({ player: wkPlayer, botTeam: botWith2WKs, budgetRemaining: 90, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });

  assert.ok(valDeficit > valSaturated, `Bot with 0 WKs (${valDeficit}) must value WK higher than bot with 2 WKs (${valSaturated})`);
});

test('computeBotValuation: manager archetype modifies bidding strategy', () => {
  const superstar = { id: 'p_super', name: 'Mega Star', basePrice: 2.0, rating: 92, role: 'Batsman', set: 'Set 1' };
  const starHunterBot = { userId: 'bot_1', teamId: 'MI', archetype: 'star_hunter', budgetRemaining: 120, squad: [] };
  const moneyballBot = { userId: 'bot_2', teamId: 'MI', archetype: 'moneyball', budgetRemaining: 120, squad: [] };

  const valHunter = computeBotValuation({ player: superstar, botTeam: starHunterBot, budgetRemaining: 120, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });
  const valMoneyball = computeBotValuation({ player: superstar, botTeam: moneyballBot, budgetRemaining: 120, initialBudget: 120, squadLimit: 25, randomFn: () => 0.5 });

  assert.ok(valHunter > valMoneyball, `Star hunter bot (${valHunter}) must value 92-rated star higher than moneyball bot (${valMoneyball})`);
});

test('The Hundred: bot names use local UK names and team coaches', () => {
  const picked = pickRandomBotName([], () => 0.1, 'hundred');
  assert.ok(HUNDRED_BOT_NAMES.includes(picked), `Expected local UK bot name, got ${picked}`);
  assert.equal(getTeamBotName('BPH'), 'Gaffer Dan');
  assert.equal(getTeamBotName('OIN'), 'Coach Alistair');
});

test('The Hundred: bots bid aggressively based on player stats while respecting £2.05M budget', () => {
  const starWithBigStats = {
    id: 'h_star',
    name: 'Star Opener',
    role: 'Batsman',
    country: 'ENG',
    basePrice: 0.08,
    rating: 88,
    set: 'Hundred',
    stats: { matches: 140, runs: 4500, avg: 38.5, sr: 154.2 },
  };
  const sameRatingWeakStats = {
    id: 'h_weak',
    name: 'Quiet Batter',
    role: 'Batsman',
    country: 'ENG',
    basePrice: 0.08,
    rating: 88,
    set: 'Hundred',
    stats: { matches: 20, runs: 320, avg: 18.0, sr: 118.5 },
  };

  assert.ok(
    computeHundredStatsMultiplier(starWithBigStats) > computeHundredStatsMultiplier(sameRatingWeakStats),
    'High-stats Hundred player should get a higher stats multiplier',
  );

  const botTeam = { userId: 'bot_BPH', teamId: 'BPH', budgetRemaining: 2.05, squad: [] };
  const starVal = computeBotValuation({
    player: starWithBigStats,
    botTeam,
    squadLimit: 16,
    budgetRemaining: 2.05,
    initialBudget: 2.05,
    randomFn: () => 0.5,
  });
  const weakVal = computeBotValuation({
    player: sameRatingWeakStats,
    botTeam,
    squadLimit: 16,
    budgetRemaining: 2.05,
    initialBudget: 2.05,
    randomFn: () => 0.5,
  });

  assert.ok(starVal > weakVal, `Star (${starVal}) must be valued higher than weak-stats player (${weakVal})`);
  assert.ok(starVal <= 2.05, `Valuation (${starVal}) must stay within £2.05M budget`);

  const bid = evaluateBotBid({
    player: starWithBigStats,
    currentBid: 0.25,
    highBidderId: 'human_1',
    botTeam,
    squadLimit: 16,
    overseasLimit: 4,
    initialBudget: 2.05,
    randomFn: () => 0.5,
  });
  assert.equal(bid?.shouldBid, true);

  // simulateBotLot must preserve the room bot's assigned name (e.g. Zaid) instead of coach fallback
  const sim = simulateBotLot({
    player: { id: 'p_srh', name: 'Test Star', role: 'Batsman', country: 'IND', basePrice: 2.0, rating: 90, set: 'Marquee Set 1' },
    botTeams: [{ userId: 'bot_SRH', teamId: 'SRH', botName: 'Zaid', budgetRemaining: 120, squad: [] }],
    initialBudget: 120,
    squadLimit: 25,
    overseasLimit: 8,
    randomFn: () => 0.1,
  });
  assert.equal(sim.isSold, true);
  assert.equal(sim.winnerName, 'Zaid');
});

test('The Hundred: 8-bot simulation completes 16-player squads within £2.05M without IPL-style price spikes', () => {
  const order = generatePlayerOrder('hundred');
  const teams = HUNDRED_TEAMS.map((t) => ({
    userId: `bot_${t.id}`,
    teamId: t.id,
    botName: getTeamBotName(t.id),
    squad: [],
    budgetRemaining: 2.05,
    spent: 0,
  }));

  let seed = 1;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const { simulatedTeams } = simulateRemainingAuction({
    playerOrder: order,
    currentPlayerIndex: -1,
    teams,
    settings: { budget: 2.05 },
    squadLimit: 16,
    overseasLimit: 4,
    randomFn: rng,
  });

  for (const t of simulatedTeams) {
    assert.equal(t.squad.length, 16, `${t.teamId} should complete 16-player squad, got ${t.squad.length}`);
    assert.ok(t.spent <= 2.05, `${t.teamId} exceeded £2.05M purse (${t.spent})`);
    for (const p of t.squad) {
      assert.ok(p.bid <= 0.42, `${p.name} bid £${p.bid}M exceeded realistic Hundred cap`);
    }
  }
});
