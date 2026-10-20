import React, { useEffect, useRef, useState } from 'react';
import { Home, RefreshCw } from 'lucide-react';
import { useConnectionAlert } from '../contexts/ConnectionAlertContext';
import { CAPACITY } from '../lib/connectionAlerts';
import { getActiveServer, isServerAvailable } from '../lib/firebase';
import { getServerMeta, setPreferredServer } from '../lib/auctionServers';

/**
 * Shown when the app cannot reach the Realtime Database: either the project has
 * hit its simultaneous-connection ceiling, or the connection could not be
 * established at all.
 *
 * Minimal by design: a headline, two short sentences, and one action. The copy
 * explains the actual constraint (Firebase's free plan allows 100 simultaneous
 * connections) and that the traffic was higher than expected, so the user knows
 * the failure is not their internet, their device, or their data.
 *
 * The notice retries itself every 30 seconds while the tab is visible, so a
 * seat is claimed as soon as one frees up without the user having to sit and
 * tap. The countdown pauses in background tabs to avoid a reload storm.
 *
 * Layout notes:
 * - Mobile: bottom sheet, full width, safe-area aware.
 * - >= sm: centered dialog capped at a comfortable reading width.
 * - Body can scroll on very short screens while the action row stays pinned.
 * - Tap targets are 48px. The notice cannot be dismissed by accident: tapping
 *   the backdrop or pressing Esc does nothing, and the only exits are Reconnect
 *   or Home.
 * - The dialog is keyed by reason, so every appearance starts a fresh countdown.
 */

const AUTO_RETRY_SECONDS = 30;

// Wording per reason: 'capacity' (server full) and 'unreachable' (unknown).
const COPY = {
  capacity: {
    title: 'Sorry - we’re full',
    body:
      'We’re on Firebase’s free plan (100 live connections) and didn’t expect this much traffic. Your internet is fine.',
    hint: 'Try again in a minute - seats free up as managers leave.',
  },
  unreachable: {
    title: 'Sorry - can’t connect',
    body:
      'We couldn’t reach the auction server. This one is on us, not your internet.',
    hint: 'Try again in a moment.',
  },
};

function AlertDialog({ problem }) {
  const { retry } = useConnectionAlert();
  const retryButtonRef = useRef(null);
  const retriedRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETRY_SECONDS);

  // Home is a hard navigation, not a router push: the whole point is to leave
  // the stuck screen and come back on a freshly loaded page that opens a new
  // connection attempt. Assigning location.href also reloads when the user is
  // already on `/`, which a client-side navigate silently would not.
  const goHome = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Constructive action first; preventScroll keeps the sheet from jumping.
    retryButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Count only while the tab is visible. A background tab must not reload all
  // night, and it must not add reconnect load while everyone else is waiting.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft > 0 || retriedRef.current) return;
    retriedRef.current = true;
    retry();
  }, [secondsLeft, retry]);

  const copy = COPY[problem] ?? COPY.unreachable;
  const activeServer = getActiveServer();
  const otherServer = activeServer === 'primary' ? 'secondary' : 'primary';
  const canSwitchServer =
    problem === CAPACITY && isServerAvailable(otherServer);
  const activeMeta = getServerMeta(activeServer);
  const otherMeta = getServerMeta(otherServer);
  const body = canSwitchServer
    ? `${activeMeta.label} has reached its free-plan connection limit. Your internet is fine. ${otherMeta.label} is ready for a new room.`
    : copy.body;
  const hint = canSwitchServer
    ? `Use ${otherMeta.label} to create or join a room there. Existing rooms cannot move between servers.`
    : copy.hint;

  const switchServer = () => {
    setPreferredServer(otherServer);
    window.location.href = `/?server=${otherServer}`;
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/90 font-sans backdrop-blur-2xl sm:items-center sm:p-4"
    >
      {/* Ambient glow, matching the landing page / quota modal */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute bottom-0 left-1/2 h-[320px] w-[320px] -translate-x-1/2 translate-y-1/3 rounded-full bg-[#ff5500]/20 blur-[110px] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" />
        <div className="absolute right-0 top-0 h-[200px] w-[200px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-alert-title"
        aria-describedby="connection-alert-body"
        className="relative flex max-h-[100dvh] w-full flex-col sm:max-h-[calc(100dvh_-_2rem)] sm:max-w-sm"
      >
        {/* Glass frame */}
        <div className="relative flex min-h-0 flex-col rounded-t-[2rem] border border-white/10 bg-white/[0.04] p-2.5 shadow-[0_-20px_60px_rgba(0,0,0,0.85)] backdrop-blur-3xl sm:rounded-[2.5rem] sm:p-3">
          {/* Solid card: scrolling body + pinned actions */}
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-t-[1.7rem] border border-white/5 bg-[#0c0c0c] sm:rounded-[2.2rem]">
            <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ff5500]/50 to-transparent" />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-5 text-left sm:px-7 sm:pt-6">
              <h2
                id="connection-alert-title"
                className="mb-2.5 break-words text-[1.35rem] font-black uppercase italic leading-[1.05] tracking-tight text-[#ff5500] drop-shadow-[0_4px_12px_rgba(255,85,0,0.25)] sm:text-[1.65rem] sm:tracking-tighter"
              >
                {copy.title}
              </h2>

              <p
                id="connection-alert-body"
                className="mb-2.5 text-[13px] font-medium leading-relaxed text-gray-300 sm:text-sm"
              >
                {body}
              </p>

              <p className="text-[11.5px] leading-relaxed text-gray-500">{hint}</p>
            </div>

            {/* Pinned actions — never scroll out of reach */}
            <div className="shrink-0 border-t border-white/5 px-5 pb-[calc(1.1rem_+_env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-6 sm:pt-3.5">
              <div className="flex gap-2.5">
                <button
                  ref={retryButtonRef}
                  type="button"
                  onClick={retry}
                  className="group/retry relative flex h-12 flex-1 touch-manipulation items-center justify-center overflow-hidden rounded-xl border border-orange-500/30 shadow-[0_10px_30px_rgba(255,85,0,0.25)] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c0c]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/retry:scale-105" />
                  <span className="relative flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-white">
                    <RefreshCw
                      className="h-4 w-4 transition-transform duration-500 group-hover/retry:rotate-180"
                      aria-hidden="true"
                    />
                    Reconnect
                  </span>
                </button>

                <button
                  type="button"
                  onClick={goHome}
                  aria-label="Go to home page"
                  title="Home"
                  className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition-all hover:bg-white/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {canSwitchServer && (
                <button
                  type="button"
                  onClick={switchServer}
                  className="mt-2.5 flex h-10 w-full items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-[10px] font-black uppercase tracking-[0.15em] text-orange-300 transition-all hover:bg-orange-500/20 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  Use {otherMeta.label}
                </button>
              )}

              <p className="mt-2 text-center text-[10px] font-medium text-gray-500">
                Auto-retry in {secondsLeft}s
              </p>

              <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/5" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-orange-500/60 transition-[width] duration-1000 ease-linear"
                  style={{
                    width: `${Math.max(0, secondsLeft / AUTO_RETRY_SECONDS) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectionAlertModal() {
  const { problem } = useConnectionAlert();
  if (!problem) return null;
  return <AlertDialog key={problem} problem={problem} />;
}
