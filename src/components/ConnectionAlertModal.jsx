import React, { useEffect, useRef } from 'react';
import { Home, RefreshCw, ServerOff, WifiOff } from 'lucide-react';
import { useConnectionAlert } from '../contexts/ConnectionAlertContext';
import { CAPACITY } from '../lib/connectionAlerts';

/**
 * Shown when the app cannot reach the Realtime Database: either the project has
 * hit its simultaneous-connection ceiling, or the connection could not be
 * established at all. The copy follows the reason so the notice never claims a
 * cause it does not actually know.
 *
 * Layout notes:
 * - Mobile: bottom sheet, full width, safe-area aware.
 * - >= sm: centered dialog capped at a comfortable reading width.
 * - The body scrolls on short screens (landscape phones / small handsets) while
 *   the action row stays pinned, so Try Again / Home are always reachable.
 * - Tap targets are 48px. There is deliberately no close button: the notice is
 *   dismissed by tapping the backdrop or pressing Esc, and the secondary action
 *   reloads the app home rather than pushing a route.
 */

// Wording per reason: 'capacity' (server full) and 'unreachable' (unknown).
const COPY = {
  capacity: {
    badge: 'Live server notice',
    title: 'Server at full capacity',
    body: (
      <>
        Sorry — the live auction server has hit its connection limit right now.
        This isn&apos;t your internet: too many managers are connected at once.
      </>
    ),
    nextTitle: '🔄 What happens next',
    nextBody: (
      <>
        Nothing is lost. As managers finish their auctions and leave, seats free
        up automatically — usually within a minute or two. Wait a moment, then
        tap <span className="font-semibold text-gray-200">Try Again</span>.
      </>
    ),
    footnote: 'Free-plan limit: 100 simultaneous live connections.',
  },
  unreachable: {
    badge: 'Connection problem',
    title: "Can't reach the server",
    body: (
      <>
        Sorry — we couldn&apos;t open a live connection to the auction server.
        It may be temporarily at capacity, or your connection may have dropped.
      </>
    ),
    nextTitle: '🔄 What happens next',
    nextBody: (
      <>
        Nothing is lost. Check your internet connection, then tap{' '}
        <span className="font-semibold text-gray-200">Try Again</span> to
        reconnect.
      </>
    ),
    footnote: 'Still stuck? The server may be at its 100-connection limit.',
  },
};

export default function ConnectionAlertModal() {
  const { problem, dismiss, retry } = useConnectionAlert();
  const retryButtonRef = useRef(null);

  // Home is a hard navigation, not a router push: the whole point is to leave
  // the stuck screen and come back on a freshly loaded page that opens a new
  // connection attempt. Assigning location.href also reloads when the user is
  // already on `/`, which a client-side navigate silently would not.
  const goHome = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    if (!problem) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Constructive action first; preventScroll keeps the sheet from jumping.
    retryButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [problem, dismiss]);

  if (!problem) return null;

  const copy = COPY[problem] ?? COPY.unreachable;
  const isCapacity = problem === CAPACITY;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/90 font-sans backdrop-blur-2xl sm:items-center sm:p-4"
      onClick={dismiss}
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
        className="relative flex max-h-[100dvh] w-full flex-col sm:max-h-[calc(100dvh_-_2rem)] sm:max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Glass frame */}
        <div className="relative flex min-h-0 flex-col rounded-t-[2rem] border border-white/10 bg-white/[0.04] p-2.5 shadow-[0_-20px_60px_rgba(0,0,0,0.85)] backdrop-blur-3xl sm:rounded-[2.5rem] sm:p-3">
          {/* Solid card: scrolling body + pinned actions */}
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-t-[1.7rem] border border-white/5 bg-[#0c0c0c] sm:rounded-[2.2rem]">
            <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ff5500]/50 to-transparent" />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-6 text-center sm:px-8 sm:pt-8">
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff5500]/25 bg-[#ff5500]/10 shadow-[0_0_28px_rgba(255,85,0,0.18)] sm:mb-4 sm:h-14 sm:w-14">
                {isCapacity ? (
                  <ServerOff className="h-6 w-6 text-[#ff5500] sm:h-7 sm:w-7" aria-hidden="true" />
                ) : (
                  <WifiOff className="h-6 w-6 text-[#ff5500] sm:h-7 sm:w-7" aria-hidden="true" />
                )}
              </div>

              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-orange-300 sm:mb-4 sm:px-4 sm:py-1.5 sm:text-[10px]">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-70 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
                </span>
                {copy.badge}
              </div>

              <h2
                id="connection-alert-title"
                className="mb-2.5 break-words text-[1.65rem] font-black uppercase italic leading-[1.05] tracking-tight text-[#ff5500] drop-shadow-[0_4px_12px_rgba(255,85,0,0.25)] sm:mb-3 sm:text-3xl sm:tracking-tighter"
              >
                {copy.title}
              </h2>

              <p
                id="connection-alert-body"
                className="mx-auto mb-5 max-w-xl text-[13px] font-medium leading-relaxed text-gray-400 sm:mb-6 sm:text-sm"
              >
                {copy.body}
              </p>

              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/60 p-3.5 text-left sm:p-4">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#ff5500] sm:text-[10px]">
                  <span>{copy.nextTitle}</span>
                </div>
                <p className="text-[12.5px] font-medium leading-relaxed text-gray-400 sm:text-xs">
                  {copy.nextBody}
                </p>
                <p className="border-t border-white/5 pt-2 text-[10px] font-medium text-gray-500">
                  {copy.footnote}
                </p>
              </div>
            </div>

            {/* Pinned actions — never scroll out of reach */}
            <div className="shrink-0 border-t border-white/5 px-5 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] pt-3.5 sm:px-8 sm:pb-8 sm:pt-4">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <button
                  ref={retryButtonRef}
                  type="button"
                  onClick={retry}
                  className="group/retry relative flex h-12 w-full touch-manipulation items-center justify-center overflow-hidden rounded-xl border border-orange-500/30 shadow-[0_10px_30px_rgba(255,85,0,0.25)] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c0c] sm:flex-1"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/retry:scale-105" />
                  <span className="relative flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-white">
                    <RefreshCw
                      className="h-4 w-4 transition-transform duration-500 group-hover/retry:rotate-180"
                      aria-hidden="true"
                    />
                    Try Again
                  </span>
                </button>

                <button
                  type="button"
                  onClick={goHome}
                  className="flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:bg-white/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
