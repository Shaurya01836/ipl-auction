import React, { useEffect, useRef, useState } from 'react';
import { Home, RefreshCw, Radio, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useConnectionAlert } from '../contexts/ConnectionAlertContext';

/**
 * Shown when the app cannot reach the Realtime Database: either the project has
 * hit its simultaneous-connection ceiling, or the connection could not be
 * established at all.
 *
 * Promotes the zero-cloud Offline / Hotspot Mode so users can immediately
 * host and play auctions with friends without waiting for cloud seats.
 */

const AUTO_RETRY_SECONDS = 30;

const COPY = {
  capacity: {
    badge: 'Cloud Capacity Reached',
    title: 'Cloud Server Full',
    body: 'Firebase’s free plan (100 simultaneous managers) is currently full. Your internet is fine!',
    hint: 'Seats free up as managers leave. Or play immediately with zero server caps below:',
  },
  unreachable: {
    badge: 'Server Unreachable',
    title: 'Can’t Reach Cloud',
    body: 'We couldn’t reach the cloud auction server right now. Your internet is fine.',
    hint: 'You can wait for auto-reconnect, or switch to zero-cloud Hotspot Mode below:',
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

  const playHotspotMode = () => {
    window.location.href = '/?mode=hotspot';
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

  const copy = COPY[problem] ?? COPY.unreachable;

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
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-orange-400 mb-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                </span>
                <span>{copy.badge}</span>
              </div>

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

              {/* Offline / Hotspot Mode Promotion Card */}
              <div className="my-3.5 rounded-2xl border border-[#ff5500]/30 bg-gradient-to-b from-[#ff5500]/15 via-[#ff5500]/5 to-transparent p-3.5 text-left shadow-[0_8px_25px_rgba(255,85,0,0.15)]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#ff5500]/25 border border-[#ff5500]/40 flex items-center justify-center text-[#ff5500]">
                      <Radio size={13} className="animate-pulse" />
                    </div>
                    <span className="text-[11px] font-black uppercase text-white tracking-wider">
                      Play Hotspot & Wi-Fi Mode
                    </span>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                    ZERO LIMITS
                  </span>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Host an auction on your mobile hotspot or Wi-Fi with friends. Zero cloud limits, sub-5ms bid response, and no data recharge required!
                </p>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-3 text-[9px] font-mono text-gray-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 size={11} className="shrink-0" /> No server cap
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Zap size={11} className="shrink-0" /> Zero lag
                  </span>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-gray-500">{copy.hint}</p>
            </div>

            {/* Pinned actions */}
            <div className="shrink-0 border-t border-white/5 px-5 pb-[calc(1.1rem_+_env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-6 sm:pt-3.5 space-y-2">
              {/* Primary Call to Action: Play Hotspot Mode */}
              <button
                type="button"
                onClick={playHotspotMode}
                className="group/hotspot relative flex h-12 w-full touch-manipulation items-center justify-center overflow-hidden rounded-xl border border-orange-500/40 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_10px_30px_rgba(255,85,0,0.35)] transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/hotspot:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  <Radio size={14} className="animate-pulse" />
                  <span>Play Offline / Hotspot Mode</span>
                  <ArrowRight size={13} className="group-hover/hotspot:translate-x-1 transition-transform" />
                </span>
              </button>

              <div className="flex gap-2">
                <button
                  ref={retryButtonRef}
                  type="button"
                  onClick={retry}
                  className="flex h-10 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.12em] text-gray-300 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reconnect Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={goHome}
                  aria-label="Go to home page"
                  title="Home"
                  className="flex h-10 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-[0.98] cursor-pointer"
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
