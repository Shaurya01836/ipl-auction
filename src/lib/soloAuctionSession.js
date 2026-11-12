import { localAuctionReducer, saveLocalSoloRoom, isLocalRoom } from './localAuctionEngine.js';
import { SERVER_LOCAL, withServerParam } from './auctionServers.js';

/**
 * Calculates adaptive reaction delays for bot bidding, matching cloud room dynamics.
 */
export function calculateBotDelay({
  currentBid = 0,
  timerMs = 10000,
  remainingMs = 10000,
  randomFn = Math.random,
}) {
  let delayMs = 400;
  const randMode = randomFn();

  if (currentBid < 3.0) {
    // Early Price Stage: 70% rapid impulse, 30% mid-timer hesitation
    if (randMode < 0.70) {
      delayMs = Math.min(900, timerMs * (0.05 + randomFn() * 0.10));
    } else {
      delayMs = timerMs * (0.25 + randomFn() * 0.25);
    }
  } else {
    // High Price / Intense Stage: Mixed blend (Impulse vs Mid-Timer vs Clutch Sniping)
    if (randMode < 0.35) {
      // Instant Impulse Reaction
      delayMs = Math.min(1000, timerMs * (0.08 + randomFn() * 0.12));
    } else if (randMode < 0.70) {
      // Mid-Timer Re-evaluation
      delayMs = timerMs * (0.30 + randomFn() * 0.25);
    } else {
      // Late Clutch Sniping (final 15–30% of countdown)
      const targetRemainMs = timerMs * (0.15 + randomFn() * 0.15);
      delayMs = remainingMs > targetRemainMs
        ? remainingMs - targetRemainMs
        : 300 + randomFn() * 400;
    }
  }

  // Bound delay safely: minimum 300ms, maximum (remainingMs - 300ms)
  return Math.max(300, Math.min(delayMs, Math.max(300, remainingMs - 300)));
}

/**
 * Drives client-side solo auction bot bidding strictly by timestamps.
 * Provides React StrictMode safety by ensuring starting twice cancels
 * any previous interval and maintains at most one active interval.
 */
export function createSoloBotLoop({
  getState,
  updateState,
  intervalMs = 1000,
  celebrate = false,
  pacing = false,
}) {
  let interval = null;
  let lastCycleKey = null;
  let scheduledBidAt = 0;
  let allBotsPassed = false;

  function tick(now = Date.now()) {
    const state = typeof getState === 'function' ? getState() : null;
    const currentLot = state?.currentAuction || state?.currentLot;
    if (!state || state.status === 'completed' || currentLot?.status === 'paused') {
      return null;
    }

    // Celebration phase: wait until celebrationEndsAt expires before advancing
    if (currentLot && (currentLot.status === 'sold' || currentLot.status === 'unsold')) {
      const celebrationLimit = currentLot.celebrationEndsAt || currentLot.timerEndsAt || 0;
      if (now >= celebrationLimit) {
        updateState({ type: 'ADVANCE_LOT', now });
        return 'ADVANCE_LOT';
      }
      return 'CELEBRATING';
    }

    if (currentLot && currentLot.status === 'bidding') {
      if (now >= (currentLot.timerEndsAt || 0)) {
        updateState(celebrate ? { type: 'RESOLVE_LOT', now, celebrate: true } : { type: 'RESOLVE_LOT', now });
        return 'RESOLVE_LOT';
      }

      const remaining = (currentLot.timerEndsAt || 0) - now;

      // Pacing mode (organic reaction delays & sniping identical to normal auction)
      if (pacing) {
        const cycleKey = `${currentLot.playerId}_${currentLot.currentBid}_${currentLot.highBidderId}`;
        if (cycleKey !== lastCycleKey) {
          lastCycleKey = cycleKey;
          allBotsPassed = false;
          const timerMs = (state.settings?.bidTimer || 10) * 1000;
          if (remaining > 500) {
            const delay = calculateBotDelay({
              currentBid: currentLot.currentBid || 0,
              timerMs,
              remainingMs: remaining,
            });
            scheduledBidAt = now + delay;
          } else {
            scheduledBidAt = 0;
          }
        }

        if (!allBotsPassed && scheduledBidAt > 0 && now >= scheduledBidAt && remaining > 500) {
          const nextState = updateState({ type: 'BOT_BID', now });
          const updatedLot = nextState?.currentAuction || nextState?.currentLot;
          if (updatedLot && updatedLot.highBidderId !== currentLot.highBidderId) {
            return 'BOT_BID';
          }
          // No bot wanted to bid: let timer run down naturally
          allBotsPassed = true;
          scheduledBidAt = 0;
        }

        return 'WAIT';
      }

      // Default deterministic tick (used by existing unit tests)
      if (remaining > 500) {
        updateState({ type: 'BOT_BID', now });
        return 'BOT_BID';
      }
    }
    return 'WAIT';
  }

  function start() {
    stop();
    interval = setInterval(() => {
      tick(Date.now());
    }, intervalMs);
    if (interval && interval.unref) {
      interval.unref();
    }
    return stop;
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function isRunning() {
    return interval !== null;
  }

  return {
    start,
    stop,
    tick,
    isRunning,
  };
}

/**
 * Manages local solo state with lease-lock verification.
 * Refuses to write or dispatch updates when this tab does not hold the lease.
 */
export function createSoloStateManager({
  initialState,
  isLockHeldRef,
  onSave = saveLocalSoloRoom,
  onStateChange,
}) {
  let currentState = initialState;

  function updateState(action) {
    if (!isLockHeldRef || !isLockHeldRef.current) {
      console.warn('[solo] Refusing to update local solo state: lock is not held by this window.');
      return null;
    }
    if (!currentState) return null;
    const next = localAuctionReducer(currentState, action);
    currentState = next;
    if (onSave) {
      onSave(next);
    }
    if (onStateChange) {
      onStateChange(next);
    }
    return next;
  }

  function getState() {
    return currentState;
  }

  return {
    updateState,
    getState,
  };
}

/**
 * Handles endAuction in device-local solo mode:
 * dispatches END_AUCTION, saves to local storage, and navigates to summary with ?server=local.
 * Makes zero Firebase RTDB, Firestore or Supabase calls itself; an optional
 * `onPersist` callback lets the caller copy the final stats to Supabase.
 */
export async function handleSoloEndAuction({
  roomId,
  server,
  isHost,
  updateLocalSoloState,
  saveLocalSoloRoom: saveFn = saveLocalSoloRoom,
  navigate,
  onCloudFallback,
  onPersist,
}) {
  const isLocal = isLocalRoom(roomId, server);
  if (!isHost && !isLocal) return { handled: false, reason: 'not_host' };

  if (isLocal) {
    const next = updateLocalSoloState ? updateLocalSoloState({ type: 'END_AUCTION', now: Date.now() }) : null;
    let synced = false;
    if (next && onPersist) {
      try {
        synced = Boolean(await onPersist(next));
      } catch (err) {
        console.warn('[solo] Failed to persist completed auction', err);
      }
    }
    if (next && saveFn) {
      saveFn(next, synced);
    }
    if (navigate) {
      navigate(withServerParam(`/summary/${roomId}`, SERVER_LOCAL));
    }
    return { handled: true, next, synced };
  }

  if (onCloudFallback) {
    return onCloudFallback();
  }
  return { handled: false };
}

/**
 * Handles sendMessage in device-local solo mode:
 * completely safe no-op with zero RTDB or Supabase calls.
 */
export async function handleSoloSendMessage({
  roomId,
  server,
  user,
  text,
  type = 'text',
  onCloudSend,
}) {
  if (!user) return { handled: false, reason: 'no_user' };

  if (isLocalRoom(roomId, server)) {
    return { handled: true, localNoOp: true };
  }

  if (onCloudSend) {
    return onCloudSend({ roomId, text, type, user });
  }
  return { handled: false };
}
