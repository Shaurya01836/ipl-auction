import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampTimer,
  computeSquadDepartmentBalance,
  computeTeamSpent,
  countOverseas,
  formatCrores,
  getPlayerAvatar,
  isOverseasPlayer,
  r2,
  resolveSquadPlayer,
  shouldStickToBottom,
  timerProgress,
  toFiniteNumber,
} from '../src/lib/auctionDisplay.js';

const PLAYERS = [
  { id: 'ind-1', name: 'Indian One', country: 'IND' },
  { id: 'os-1', name: 'Overseas One', country: 'AUS' },
  { id: 'os-2', name: 'Overseas Two', country: 'OS' },
];

test('toFiniteNumber preserves genuine zero and handles missing values', () => {
  assert.equal(toFiniteNumber(0), 0);
  assert.equal(toFiniteNumber('0'), 0);
  assert.equal(toFiniteNumber(-0), 0);
  assert.equal(toFiniteNumber(12.5), 12.5);
  assert.equal(toFiniteNumber('12.5'), 12.5);
  assert.equal(toFiniteNumber(null, 120), 120);
  assert.equal(toFiniteNumber(undefined, 120), 120);
  assert.equal(toFiniteNumber('', 120), 120);
  assert.equal(toFiniteNumber('   ', 120), 120);
  assert.equal(toFiniteNumber(Number.NaN, 120), 120);
  assert.equal(toFiniteNumber(Number.POSITIVE_INFINITY, 120), 120);
  assert.equal(toFiniteNumber(null, null), null);
});

test('formatCrores shows missing bids as an em dash and keeps zero', () => {
  assert.equal(formatCrores(0), '0.00');
  assert.equal(formatCrores(0, 1), '0.0');
  assert.equal(formatCrores(12.5), '12.50');
  assert.equal(formatCrores('12.5', 1), '12.5');
  assert.equal(formatCrores(null), '—');
  assert.equal(formatCrores(undefined), '—');
  assert.equal(formatCrores(''), '—');
  assert.equal(formatCrores(Number.NaN), '—');
});

test('isOverseasPlayer follows the canonical IND rule', () => {
  assert.equal(isOverseasPlayer({ country: 'IND' }), false);
  assert.equal(isOverseasPlayer({ country: 'AUS' }), true);
  assert.equal(isOverseasPlayer({ country: 'OS' }), true);
  assert.equal(isOverseasPlayer({ country: '' }), true);
  assert.equal(isOverseasPlayer({}), true);
  assert.equal(isOverseasPlayer(undefined), true);
});

test('missing-country players count toward the overseas quota', () => {
  const squad = [
    { id: 'ind-1', bid: 2 },
    { id: 'os-1', bid: 3 },
    { id: 'unknown-player', bid: 1 },
  ];

  assert.equal(countOverseas(squad, PLAYERS), 2);
});

test('countOverseas handles mixed, empty, and legacy string squads', () => {
  assert.equal(countOverseas([], PLAYERS), 0);
  assert.equal(countOverseas(null, PLAYERS), 0);
  assert.equal(countOverseas(['ind-1'], PLAYERS), 0);
  assert.equal(countOverseas(['ind-1', 'os-1', 'os-2'], PLAYERS), 2);
  assert.equal(
    countOverseas(
      [{ id: 'ind-1' }, { id: 'os-1' }, { id: 'missing-id' }, null],
      PLAYERS,
    ),
    2,
  );
  assert.equal(
    countOverseas([{ country: 'IND' }, { country: 'AUS' }, { country: '' }]),
    2,
  );
});

test('resolveSquadPlayer resolves ids and keeps player objects', () => {
  assert.deepEqual(resolveSquadPlayer('ind-1', PLAYERS), PLAYERS[0]);
  assert.deepEqual(resolveSquadPlayer({ id: 'os-1', bid: 4 }, PLAYERS), PLAYERS[1]);
  assert.deepEqual(resolveSquadPlayer({ id: 'missing-id' }, PLAYERS), {
    id: 'missing-id',
  });
  assert.deepEqual(resolveSquadPlayer({ country: 'AUS' }, PLAYERS), {
    country: 'AUS',
  });
  assert.equal(resolveSquadPlayer(null, PLAYERS), null);
});

test('computeTeamSpent preserves zero and derives from remaining budget', () => {
  assert.equal(computeTeamSpent({ spent: 0 }), 0);
  assert.equal(computeTeamSpent({ spent: 0, budgetRemaining: 0 }), 0);
  assert.equal(computeTeamSpent({ budget: 120, budgetRemaining: 0 }), 120);
  assert.equal(computeTeamSpent({ budget: 120, budgetRemaining: 45 }), 75);
  assert.equal(computeTeamSpent({ budget: 120, budgetRemaining: '45' }), 75);
  assert.equal(computeTeamSpent({ budget: 0, budgetRemaining: 0 }), 0);
  assert.equal(computeTeamSpent({ budget: 120, budgetRemaining: null }), null);
  assert.equal(computeTeamSpent({}), null);
  assert.equal(computeTeamSpent({ spent: '' , budgetRemaining: 0, budget: 120 }), 120);
});

test('clampTimer and timerProgress stay inside the configured range', () => {
  assert.equal(clampTimer(15, 10), 10);
  assert.equal(clampTimer(-3, 10), 0);
  assert.equal(clampTimer(5, 10), 5);
  assert.equal(clampTimer(0, 10), 0);
  assert.equal(clampTimer(10, 0), 0);
  assert.equal(clampTimer(null, 10), 0);

  assert.equal(timerProgress(15, 10), 100);
  assert.equal(timerProgress(-3, 10), 0);
  assert.equal(timerProgress(5, 10), 50);
  assert.equal(timerProgress(0, 10), 0);
  assert.equal(timerProgress(10, 0), 0);
});

test('shouldStickToBottom respects the near-bottom threshold', () => {
  assert.equal(shouldStickToBottom(1000, 600, 400), true);
  assert.equal(shouldStickToBottom(1000, 500, 400), false);
  assert.equal(shouldStickToBottom(1000, 570, 400, 48), true);
  assert.equal(shouldStickToBottom(0, 0, 0), true);
  assert.equal(shouldStickToBottom(undefined, undefined, undefined), true);
});

test('r2 rounds to two decimal places and handles floating point drift', () => {
  assert.equal(r2(0), 0);
  assert.equal(r2(12.345), 12.35);
  assert.equal(r2(12.344), 12.34);
  assert.equal(r2(0.1 + 0.2), 0.3);
  assert.equal(r2(104.80000000000001), 104.8);
  assert.equal(r2(15.200000000000003), 15.2);
  assert.equal(r2(null), 0);
  assert.equal(r2(undefined), 0);
  assert.equal(r2('45.678'), 45.68);
});

test('getPlayerAvatar generates offline-safe inline SVG data URI with player initials', () => {
  const vk = getPlayerAvatar('Virat Kohli');
  assert.ok(vk.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(decodeURIComponent(vk).includes('VK'));

  const single = getPlayerAvatar('Dhoni');
  assert.ok(decodeURIComponent(single).includes('DH'));

  const empty = getPlayerAvatar('');
  assert.ok(decodeURIComponent(empty).includes('PL'));

  const nullVal = getPlayerAvatar(null);
  assert.ok(decodeURIComponent(nullVal).includes('PL'));
});

test('in-memory live team ratings calculates avgRating and sorts teams correctly', () => {
  const samplePlayers = [
    { id: 'p1', rating: 90 },
    { id: 'p2', rating: 80 },
    { id: 'p3', rating: 70 },
  ];
  const playerMap = new Map(samplePlayers.map(p => [p.id, p]));
  const teams = [
    { id: 'csk', name: 'CSK' },
    { id: 'mi', name: 'MI' },
    { id: 'rcb', name: 'RCB' },
  ];
  const roomTeams = [
    { teamId: 'csk', squad: ['p1', 'p2'] }, // avg 85.0
    { teamId: 'mi', squad: [{ id: 'p1' }, { id: 'p3' }] }, // avg 80.0
    { teamId: 'rcb', squad: [] }, // avg null
  ];

  const ratingMap = {};
  teams.forEach(team => {
    const teamDoc = roomTeams.find(doc => doc.teamId === team.id);
    const squad = teamDoc?.squad || [];
    let totalRating = 0;
    let ratedPlayersCount = 0;
    squad.forEach(member => {
      const pid = typeof member === 'string' ? member : member.id;
      const pInfo = playerMap.get(pid);
      if (pInfo?.rating) {
        totalRating += pInfo.rating;
        ratedPlayersCount += 1;
      }
    });
    const avgRating = ratedPlayersCount > 0 ? (totalRating / ratedPlayersCount).toFixed(1) : null;
    ratingMap[team.id] = { totalRating, avgRating, playerCount: squad.length };
  });

  const rankedTeams = [...teams].sort((a, b) => {
    const rA = ratingMap[a.id]?.avgRating ? parseFloat(ratingMap[a.id].avgRating) : 0;
    const rB = ratingMap[b.id]?.avgRating ? parseFloat(ratingMap[b.id].avgRating) : 0;
    if (rB !== rA) return rB - rA;
    const tA = ratingMap[a.id]?.totalRating || 0;
    const tB = ratingMap[b.id]?.totalRating || 0;
    if (tB !== tA) return tB - tA;
    return a.name.localeCompare(b.name);
  });

  assert.equal(ratingMap['csk'].avgRating, '85.0');
  assert.equal(ratingMap['mi'].avgRating, '80.0');
  assert.equal(ratingMap['rcb'].avgRating, null);
  assert.equal(rankedTeams[0].id, 'csk');
  assert.equal(rankedTeams[1].id, 'mi');
  assert.equal(rankedTeams[2].id, 'rcb');
});

test('computeSquadDepartmentBalance correctly evaluates role averages and team balance', () => {
  const balancedSquad = [
    { role: 'Batsman', rating: 90 },
    { role: 'Batsman', rating: 86 },
    { role: 'Batsman', rating: 84 },
    { role: 'Wicket-Keeper', rating: 92 },
    { role: 'All-Rounder', rating: 88 },
    { role: 'All-Rounder', rating: 85 },
    { role: 'Bowler', rating: 89 },
    { role: 'Bowler', rating: 86 },
    { role: 'Bowler', rating: 85 },
    { role: 'Bowler', rating: 82 },
    { role: 'Bowler', rating: 80 },
  ];

  const lopsidedSquad = [
    { role: 'Batsman', rating: 95 },
    { role: 'Batsman', rating: 92 },
    { role: 'Batsman', rating: 90 },
    { role: 'Batsman', rating: 88 },
    { role: 'Batsman', rating: 85 },
    { role: 'Batsman', rating: 84 },
    { role: 'Batsman', rating: 82 },
    { role: 'Batsman', rating: 80 },
    { role: 'Batsman', rating: 78 },
    { role: 'Batsman', rating: 76 },
    { role: 'Bowler', rating: 70 }, // zero keepers, zero all-rounders, only 1 bowler
  ];

  const resBalanced = computeSquadDepartmentBalance(balancedSquad, false);
  const resLopsided = computeSquadDepartmentBalance(lopsidedSquad, false);
  const resDisqualified = computeSquadDepartmentBalance(balancedSquad, true);

  // Department averages
  assert.equal(resBalanced.batAvg, 86.7);
  assert.equal(resBalanced.bowlAvg, 84.4);
  assert.equal(resBalanced.arAvg, 86.5);
  assert.equal(resBalanced.wkAvg, 92);
  assert.equal(resBalanced.batCount, 3);
  assert.equal(resBalanced.bowlCount, 5);
  assert.equal(resBalanced.arCount, 2);
  assert.equal(resBalanced.wkCount, 1);

  // Balanced squad has higher balanced rating than lopsided squad
  assert.ok(resBalanced.balancedRating > resLopsided.balancedRating);
  assert.ok(resBalanced.balancedRating >= 88);
  assert.ok(resLopsided.balancedRating < 75);

  // Disqualified handling
  assert.equal(resDisqualified.balancedRating, 0);
  assert.equal(resDisqualified.balanceVerdict, 'Disqualified');
});


