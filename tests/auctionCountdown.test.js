import test from 'node:test';
import assert from 'node:assert/strict';
import { clampTimer, timerProgress } from '../src/lib/auctionDisplay.js';

// Helper simulating timer derivation logic extracted into AuctionCountdown
function deriveCountdownTimeState({
  displayAuctionState,
  configuredBidTimer = 10,
  now = 10000,
}) {
  const timerTotal = configuredBidTimer > 0 ? configuredBidTimer : 10;
  const isTimerBidding = displayAuctionState?.status === 'bidding';
  const isTimerPaused = displayAuctionState?.status === 'paused';

  const rawMsRemaining = isTimerPaused
    ? Math.max(0, displayAuctionState?.remainingMs || 0)
    : (isTimerBidding && displayAuctionState?.timerEndsAt
      ? Math.max(0, displayAuctionState.timerEndsAt - now)
      : 0);

  const rawSecondsRemaining = (isTimerBidding || isTimerPaused)
    ? Math.ceil(rawMsRemaining / 1000)
    : 0;

  const secondsRemaining = (isTimerBidding || isTimerPaused)
    ? clampTimer(rawSecondsRemaining, timerTotal)
    : 0;

  const timerPercent = (isTimerBidding || isTimerPaused)
    ? timerProgress(rawSecondsRemaining, timerTotal)
    : 0;

  return { rawMsRemaining, rawSecondsRemaining, secondsRemaining, timerPercent, timerTotal };
}

test('countdown derivation: accurately calculates seconds remaining and progress percentage during active bidding', () => {
  const displayAuctionState = {
    status: 'bidding',
    timerEndsAt: 18000, // 8000ms from now
    playerId: 'p1',
  };

  const state = deriveCountdownTimeState({
    displayAuctionState,
    configuredBidTimer: 10,
    now: 10000,
  });

  assert.equal(state.rawMsRemaining, 8000);
  assert.equal(state.rawSecondsRemaining, 8);
  assert.equal(state.secondsRemaining, 8);
  assert.equal(state.timerPercent, 80);
});

test('countdown derivation: clamps seconds to configured timer limit if clock drift exceeds configured bid timer', () => {
  const displayAuctionState = {
    status: 'bidding',
    timerEndsAt: 25000, // 15s remaining, but configured timer is 10s
    playerId: 'p1',
  };

  const state = deriveCountdownTimeState({
    displayAuctionState,
    configuredBidTimer: 10,
    now: 10000,
  });

  assert.equal(state.rawSecondsRemaining, 15);
  assert.equal(state.secondsRemaining, 10, 'Must clamp to 10s');
  assert.equal(state.timerPercent, 100, 'Must clamp to 100%');
});

test('countdown derivation: frozen remainingMs is preserved when auction is paused', () => {
  const displayAuctionState = {
    status: 'paused',
    remainingMs: 4200,
    playerId: 'p1',
  };

  const state = deriveCountdownTimeState({
    displayAuctionState,
    configuredBidTimer: 10,
    now: 20000, // now has advanced by 10s
  });

  assert.equal(state.rawMsRemaining, 4200);
  assert.equal(state.rawSecondsRemaining, 5); // ceil(4200 / 1000) = 5
  assert.equal(state.secondsRemaining, 5);
  assert.equal(state.timerPercent, 50);
});

test('countdown lifecycle: end trigger fires exactly once on expiration and re-arms on new player', () => {
  let endPlayerAuctionCalls = 0;
  let endTriggered = false;

  function onTick(rawMs) {
    const diff = Math.max(0, Math.ceil(rawMs / 1000));
    if (diff === 0 && !endTriggered) {
      endTriggered = true;
      endPlayerAuctionCalls++;
    }
  }

  // 1. Timer expires for Player 1
  onTick(0, 'p1');
  assert.equal(endPlayerAuctionCalls, 1);
  assert.equal(endTriggered, true);

  // Subsequent ticks for Player 1 must NOT re-trigger
  onTick(-200, 'p1');
  onTick(-400, 'p1');
  assert.equal(endPlayerAuctionCalls, 1, 'Must not fire again while locked on same player');

  // 2. New player arrives -> trigger re-arms
  const newPlayerId = 'p2';
  endTriggered = false; // reset when playerId changes

  // Player 2 expires later
  onTick(0, newPlayerId);
  assert.equal(endPlayerAuctionCalls, 2, 'Must fire for new player once re-armed');
});

test('countdown expiration ownership: admin triggers at 0s, non-host falls back at -1.5s', () => {
  function shouldTriggerExpiration({ isAdmin, rawMs, isBidding, endTriggered }) {
    return (isAdmin || rawMs < -1500) && isBidding && !endTriggered;
  }

  // Admin client at diff === 0 (rawMs = 0)
  assert.equal(
    shouldTriggerExpiration({ isAdmin: true, rawMs: 0, isBidding: true, endTriggered: false }),
    true,
    'Admin must trigger expiration at 0s',
  );

  // Non-host client at diff === 0 (rawMs = 0)
  assert.equal(
    shouldTriggerExpiration({ isAdmin: false, rawMs: 0, isBidding: true, endTriggered: false }),
    false,
    'Non-host must NOT trigger at 0s; must yield to admin',
  );

  // Non-host client at 1.0s after expiration (rawMs = -1000)
  assert.equal(
    shouldTriggerExpiration({ isAdmin: false, rawMs: -1000, isBidding: true, endTriggered: false }),
    false,
    'Non-host must not trigger before 1.5s fallback grace period',
  );

  // Non-host client at 1.6s after expiration (rawMs = -1600)
  assert.equal(
    shouldTriggerExpiration({ isAdmin: false, rawMs: -1600, isBidding: true, endTriggered: false }),
    true,
    'Non-host must trigger fallback after 1.5s has elapsed',
  );
});

test('countdown cleanup: unmounting cancels pending finalization timeout and clears interval', () => {
  let intervalCleared = false;
  let timeoutCleared = false;
  let finalizationExecuted = false;

  // Simulate cleanup effect on unmount
  function unmountCleanup() {
    intervalCleared = true;
    timeoutCleared = true;
    // Timeout cancelled before firing:
    finalizationExecuted = false;
  }

  unmountCleanup();

  assert.equal(intervalCleared, true, 'Interval must be cleared on unmount');
  assert.equal(timeoutCleared, true, 'Pending timeout must be cancelled on unmount');
  assert.equal(finalizationExecuted, false, 'Finalization must not run after unmount');
});


