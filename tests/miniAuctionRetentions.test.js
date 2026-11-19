import test from 'node:test';
import assert from 'node:assert/strict';
import { IPL_PLAYERS } from '../src/data/players.js';
import { TEAMS } from '../src/data/teams.js';
import {
  TOTAL_SALARY_CAP_CR,
  IPL_2027_RETENTIONS,
  IPL_2027_RELEASED_PLAYERS,
  getOfficialRetentions,
  calculateCustomTeamState,
  getMiniAuctionPoolIndices
} from '../src/data/retentions.js';
import { generatePlayerOrder } from '../src/lib/auctionRules.js';
import { localAuctionReducer } from '../src/lib/localAuctionEngine.js';

test('TATA IPL 2027 financial integrity: all 10 franchises balance to ₹130.00 Cr', () => {
  const teamIds = ['CSK', 'DC', 'GT', 'KKR', 'LSG', 'MI', 'PBKS', 'RR', 'RCB', 'SRH'];

  teamIds.forEach((teamId) => {
    const data = IPL_2027_RETENTIONS[teamId];
    assert.ok(data, `Team data missing for ${teamId}`);
    const sum = parseFloat((data.totalSpent + (data.retentionDeduction || 0) + data.remainingPurse).toFixed(2));
    assert.equal(sum, TOTAL_SALARY_CAP_CR, `${teamId} purse sum must equal ₹130.00 Cr`);
    assert.ok(data.players.length >= 16 && data.players.length <= 22, `${teamId} must have between 16 and 22 retained players`);
  });
});

test('TATA IPL 2027 released player pool: all 83 released players map to IPL_PLAYERS', () => {
  assert.equal(IPL_2027_RELEASED_PLAYERS.length, 83, 'Released player list must contain exactly 83 players');
  assert.equal(IPL_2027_RELEASED_PLAYERS.some((p) => p.id === 'p_200'), false, 'Shahrukh Khan must be removed');
  assert.equal(IPL_2027_RELEASED_PLAYERS.some((p) => p.id === 'p_117'), false, 'Mitchell Starc must not be in released list');
  assert.equal(IPL_2027_RELEASED_PLAYERS.some((p) => p.id === 'p_139'), false, 'Travis Head must not be in released list');
  assert.equal(IPL_2027_RELEASED_PLAYERS.some((p) => p.id === 'p_174'), false, 'Jacob Bethell must not be in released list');

  IPL_2027_RELEASED_PLAYERS.forEach((rel) => {
    const found = IPL_PLAYERS.find((p) => p.id === rel.id);
    assert.ok(found, `Released player ${rel.name} (${rel.id}) must exist in IPL_PLAYERS`);
    assert.equal(found.role, rel.role, `Role mismatch for ${rel.name}`);
    assert.ok(rel.basePrice > 0, `Base price must be positive for ${rel.name}`);
  });
});

test('unregistered players (Mitchell Starc, Travis Head, Jacob Bethell) are excluded from Mini Auction but available in Mega Auction', () => {
  const starc = IPL_PLAYERS.find((p) => p.id === 'p_117');
  const head = IPL_PLAYERS.find((p) => p.id === 'p_139');
  const bethell = IPL_PLAYERS.find((p) => p.id === 'p_174');

  assert.ok(starc && head && bethell, 'All three players must exist in IPL_PLAYERS');
  assert.equal(starc.excludeFromMini, true);
  assert.equal(head.excludeFromMini, true);
  assert.equal(bethell.excludeFromMini, true);

  // Excluded from Mini Auction
  const miniOrder = generatePlayerOrder('mini');
  const miniIds = new Set(miniOrder.map((idx) => IPL_PLAYERS[idx].id));
  assert.equal(miniIds.has('p_117'), false, 'Mitchell Starc must NOT be in Mini Auction');
  assert.equal(miniIds.has('p_139'), false, 'Travis Head must NOT be in Mini Auction');
  assert.equal(miniIds.has('p_174'), false, 'Jacob Bethell must NOT be in Mini Auction');

  // Included in Mega Auction
  const megaOrder = generatePlayerOrder('mega');
  const megaIds = new Set(megaOrder.map((idx) => IPL_PLAYERS[idx].id));
  assert.equal(megaIds.has('p_117'), true, 'Mitchell Starc must be in Mega Auction');
  assert.equal(megaIds.has('p_139'), true, 'Travis Head must be in Mega Auction');
  assert.equal(megaIds.has('p_174'), true, 'Jacob Bethell must be in Mega Auction');
});

test('MS Dhoni (p_120) and Ajinkya Rahane (p_188) are retired from IPL and are designated as Legends', () => {
  const dhoni = IPL_PLAYERS.find((p) => p.id === 'p_120');
  assert.ok(dhoni, 'MS Dhoni must exist in IPL_PLAYERS');
  assert.equal(dhoni.set, 'Legends', 'MS Dhoni set must be Legends');
  assert.equal(dhoni.rating, 96, 'MS Dhoni must have elite legend rating');
  assert.ok(!dhoni.team, 'MS Dhoni must not have an assigned IPL 2027 team');

  const rahane = IPL_PLAYERS.find((p) => p.id === 'p_188');
  assert.ok(rahane, 'Ajinkya Rahane must exist in IPL_PLAYERS');
  assert.equal(rahane.set, 'Legends', 'Ajinkya Rahane set must be Legends');
  assert.equal(rahane.rating, 82, 'Ajinkya Rahane must have legend rating');
  assert.ok(!rahane.team, 'Ajinkya Rahane must not have an assigned IPL 2027 team');

  // Verify both are included in legends auction order
  const legendsOrder = generatePlayerOrder('legends');
  assert.ok(legendsOrder.some((idx) => IPL_PLAYERS[idx].id === 'p_120'), 'MS Dhoni must be in Legends auction pool');
  assert.ok(legendsOrder.some((idx) => IPL_PLAYERS[idx].id === 'p_188'), 'Ajinkya Rahane must be in Legends auction pool');

  // Verify both are NOT in mini auction order
  const miniOrder = generatePlayerOrder('mini');
  assert.equal(miniOrder.some((idx) => IPL_PLAYERS[idx].id === 'p_120'), false, 'MS Dhoni must NOT be in Mini auction pool');
  assert.equal(miniOrder.some((idx) => IPL_PLAYERS[idx].id === 'p_188'), false, 'Ajinkya Rahane must NOT be in Mini auction pool');
});

test('retained players in IPL_PLAYERS are tagged with correct team and retention details', () => {
  let retainedCount = 0;
  for (const [teamId, data] of Object.entries(IPL_2027_RETENTIONS)) {
    data.players.forEach((rp) => {
      const p = IPL_PLAYERS.find((pl) => pl.id === rp.id);
      assert.ok(p, `Retained player ${rp.name} (${rp.id}) must exist in IPL_PLAYERS`);
      assert.equal(p.team, teamId, `Player ${rp.name} must have team === ${teamId}`);
      assert.equal(p.retentionPrice, rp.price, `Player ${rp.name} retentionPrice must match`);
      assert.equal(p.isRetained, true, `Player ${rp.name} must be marked isRetained`);
      retainedCount++;
    });
  }
  assert.equal(retainedCount, 184, 'Exactly 184 players must be retained across 10 franchises');
});

test('generatePlayerOrder(mini): lot sequence contains all 106 unassigned modern players, zero retained, zero legends', () => {
  const miniOrder = generatePlayerOrder('mini');
  assert.equal(miniOrder.length, 106, 'Mini auction order must contain all 106 unassigned modern players');

  // Collect all retained player IDs across all 10 franchises
  const retainedIds = new Set();
  Object.values(IPL_2027_RETENTIONS).forEach((team) => {
    team.players.forEach((p) => retainedIds.add(p.id));
  });

  miniOrder.forEach((playerIdx) => {
    const player = IPL_PLAYERS[playerIdx];
    assert.ok(!retainedIds.has(player.id), `Retained player ${player.name} (${player.id}) must NOT appear in mini auction pool`);
    assert.notEqual(player.set, 'Legends', `Legend ${player.name} must NOT appear in mini auction pool`);
    assert.ok(!player.team, `Player in mini auction pool must not have an assigned team`);
    assert.equal(player.excludeFromMini, undefined, `Player ${player.name} marked excludeFromMini must not be in mini pool`);
  });

  // Verify all 83 official released players are included in the mini order
  const miniOrderIds = new Set(miniOrder.map((idx) => IPL_PLAYERS[idx].id));
  IPL_2027_RELEASED_PLAYERS.forEach((rel) => {
    assert.ok(miniOrderIds.has(rel.id), `Official released player ${rel.name} must be in the mini auction order`);
  });
});

test('calculateCustomTeamState: dynamic purse refunds when user releases a player', () => {
  // CSK default: 19 players, 28.05 Cr purse, 99.95 spent
  const defaultState = calculateCustomTeamState('CSK');
  assert.equal(defaultState.remainingPurse, 28.05);
  assert.equal(defaultState.totalSpent, 99.95);
  assert.equal(defaultState.retainedSquad.length, 19);

  // User releases Rahul Chahar (price: 5.2 Cr)
  const cskPlayers = IPL_2027_RETENTIONS.CSK.players;
  const rahul = cskPlayers.find((p) => p.name === 'Rahul Chahar');
  const customIds = cskPlayers.filter((p) => p.id !== rahul.id).map((p) => p.id);
  const updatedState = calculateCustomTeamState('CSK', customIds);

  assert.equal(updatedState.retainedSquad.length, 18);
  assert.equal(updatedState.releasedPlayers.length, 1);
  assert.equal(updatedState.releasedPlayers[0].name, 'Rahul Chahar');
  assert.equal(updatedState.totalSpent, 94.75); // 99.95 - 5.20 = 94.75
  assert.equal(updatedState.remainingPurse, 33.25); // 130.00 - 94.75 - 2.00 = 33.25

  // When generating mini lot order with user release, Rahul Chahar is included!
  const customOrder = generatePlayerOrder('mini', { userReleasedPlayerIds: [rahul.id] });
  assert.equal(customOrder.length, 107, 'Order length should increase to 107 with the released player');
  const hasRahul = customOrder.some((idx) => IPL_PLAYERS[idx].id === rahul.id);
  assert.ok(hasRahul, 'Rahul Chahar must now be present in the auction pool');
});

test('localAuctionEngine: INIT_AUCTION in mini mode initializes authentic squads and remaining purses', () => {
  const state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: 'SOLO-MINI01',
    humanUser: { uid: 'u_human', displayName: 'Captain', team: 'CSK' },
    auctionType: 'mini',
    settings: { bidTimer: 10 }
  });

  assert.equal(state.auctionType, 'mini');
  assert.equal(state.settings.budget, 130.0);

  // Human team (CSK) checks
  const humanTeam = state.roomTeams.find((t) => t.teamId === 'CSK');
  assert.ok(humanTeam, 'CSK roomTeam must exist');
  assert.equal(humanTeam.budgetRemaining, 28.05, 'CSK starting purse must be 28.05 Cr');
  assert.equal(humanTeam.spent, 99.95, 'CSK starting spent must be 99.95 Cr');
  assert.equal(humanTeam.squad.length, 19, 'CSK starting squad must have 19 retained players');
  assert.ok(humanTeam.squad.every((p) => p.isRetained === true), 'All starting squad members must be marked isRetained');

  // AI teams check (e.g. MI, PBKS, GT)
  const miTeam = state.roomTeams.find((t) => t.teamId === 'MI');
  assert.equal(miTeam.budgetRemaining, 32.60, 'MI starting purse must be 32.60 Cr');
  assert.equal(miTeam.squad.length, 16, 'MI starting squad must have 16 retained players');

  const pbksTeam = state.roomTeams.find((t) => t.teamId === 'PBKS');
  assert.equal(pbksTeam.budgetRemaining, 18.60, 'PBKS starting purse must be 18.60 Cr');
  assert.equal(pbksTeam.squad.length, 19, 'PBKS starting squad must have 19 retained players');

  const gtTeam = state.roomTeams.find((t) => t.teamId === 'GT');
  assert.equal(gtTeam.budgetRemaining, 8.75, 'GT starting purse must be 8.75 Cr');
  assert.equal(gtTeam.squad.length, 22, 'GT starting squad must have 22 retained players');

  // Verify first live lot is from the unassigned open pool
  assert.equal(state.playerOrder.length, 106, 'Auction order should have the 106 open pool players');
  const firstPlayer = IPL_PLAYERS[state.playerOrder[0]];
  assert.ok(firstPlayer, 'First live lot must exist');
  assert.ok(!firstPlayer.team, 'First lot player must not have an assigned team');
  assert.notEqual(firstPlayer.set, 'Legends', 'First lot player must not be a legend');
});

test('player images: every player has a valid image (Wikipedia URL if available, initial SVG fallback otherwise)', () => {
  assert.equal(IPL_PLAYERS.length, 451);
  assert.equal(IPL_PLAYERS.some((p) => p.id === 'p_200'), false, 'Shahrukh Khan must not exist in IPL_PLAYERS');
  const withoutImage = IPL_PLAYERS.filter(p => !p.image || typeof p.image !== 'string' || p.image.trim() === '');
  assert.equal(withoutImage.length, 0, 'Zero players should have missing or empty image');

  // Specific players with verified Wikipedia images
  const lukeWood = IPL_PLAYERS.find(p => p.id === 'p_1163');
  assert.ok(lukeWood.image.includes('wikimedia.org'), 'Luke Wood should have Wikipedia image');

  const auqibDar = IPL_PLAYERS.find(p => p.id === 'p_1173');
  assert.ok(auqibDar.image.includes('wikimedia.org'), 'Auqib Dar should have Wikipedia image');

  // Players without external photos have offline-safe SVG data URI avatar
  const venu = IPL_PLAYERS.find(p => p.id === 'p_1144');
  assert.ok(venu.image.startsWith('data:image/svg+xml;utf8,'), 'Venugopal Rao should have SVG initials avatar');
  assert.ok(decodeURIComponent(venu.image).includes('>VR<'), 'Venugopal Rao avatar must contain initials VR');
});

