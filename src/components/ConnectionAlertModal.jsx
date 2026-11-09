import React, { useEffect, useRef, useState } from 'react';
import { Home, RefreshCw } from 'lucide-react';
import { useConnectionAlert } from '../contexts/ConnectionAlertContext';

/**
 * Shown when the app cannot reach the Realtime Database: either the project has
 * hit its simultaneous-connection ceiling, or the connection could not be
 * established at all.
 */

const AUTO_RETRY_SECONDS = 30;

const COPY = {
  capacity: {
    badge: 'Cloud Capacity Reached',
    title: 'Cloud Server Full',
    body: 'Firebase’s free plan (100 simultaneous managers) is currently full. Your internet is fine!',
    hint: 'Seats free up as managers leave. You can wait for auto-reconnect or retry now.',
  },
  unreachable: {
    badge: 'Server Unreachable',
    title: 'Can’t Reach Cloud',
    body: 'We couldn’t reach the cloud auction server right now. Check your internet connection or try again.',
    hint: 'You can wait for auto-reconnect or retry now.',
  },
  offline: {
    badge: 'No Internet Connection',
    title: 'Internet Disconnected',
    body: 'You appear to be offline. Cross-device multiplayer requires an active internet connection to synchronize bids.',
    hint: 'Please check your Wi-Fi or mobile data connection to resume.',
  },
};

function AlertDialog({ problem }) {
  const { retry } = useConnectionAlert();
  const retryButtonRef = useRef(null);
  const retriedRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETRY_SECONDS);

  const goHome = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    retryButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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

  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const activeReason = isOffline ? 'offline' : problem;
  const copy = COPY[activeReason] ?? COPY.unreachable;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/90 font-sans backdrop-blur-2xl sm:items-center sm:p-4"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute bottom-0 left-1/2 h-[320px] w-[320px] -translate-x-1/2 translate-y-1/3 rounded-full bg-[#ff5500]/25 blur-[110px] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" />
        <div className="absolute right-0 top-0 h-[200px] w-[200px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-alert-title"
        aria-describedby="connection-alert-body"
        className="relative flex max-h-[100dvh] w-full flex-col sm:max-h-[calc(100dvh_-_2rem)] sm:max-w-md"
      >
        {/* Glass frame */}
        <div className="relative flex min-h-0 flex-col rounded-t-[2rem] border border-white/10 bg-white/[0.04] p-2.5 shadow-[0_-20px_60px_rgba(0,0,0,0.85)] backdrop-blur-3xl sm:rounded-[2.5rem] sm:p-3">
          {/* Solid card */}
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-t-[1.7rem] border border-white/5 bg-[#0c0c0c] sm:rounded-[2.2rem]">
            <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ff5500]/50 to-transparent" />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3 pt-5 text-left sm:px-7 sm:pt-6">

              <h2
                id="connection-alert-title"
                className="mb-2 break-words text-[1.3rem] font-black uppercase italic leading-[1.05] tracking-tight text-[#ff5500] drop-shadow-[0_4px_12px_rgba(255,85,0,0.25)] sm:text-[1.55rem] sm:tracking-tighter"
              >
                {copy.title}
              </h2>

              <p
                id="connection-alert-body"
                className="text-[12.5px] font-medium leading-relaxed text-gray-300 sm:text-[13px]"
              >
                {copy.body}
              </p>

              <p className="mt-3.5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-gray-500">{copy.hint}</p>
            </div>

            {/* Pinned actions */}
            <div className="shrink-0 border-t border-white/5 px-5 pb-[calc(1.1rem_+_env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-6 sm:pt-3.5 space-y-2">
              <div className="flex gap-2">
                <button
                  ref={retryButtonRef}
                  type="button"
                  onClick={retry}
                  className="flex h-12 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-orange-500/40 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-[10px] font-black uppercase tracking-[0.12em] text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reconnect Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={goHome}
                  aria-label="Go to home page"
                  title="Home"
                  className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="pt-1">
                <p className="text-center text-[10px] font-medium text-gray-500 mb-1">
                  Cloud auto-retry in {secondsLeft}s
                </p>
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5" aria-hidden="true">
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
    </div>
  );
}

export default function ConnectionAlertModal() {
  const { problem } = useConnectionAlert();
  if (!problem) return null;
  return <AlertDialog key={problem} problem={problem} />;
}
