import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampTimer,
  computeTeamSpent,
  countOverseas,
  formatCrores,
  isOverseasPlayer,
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
