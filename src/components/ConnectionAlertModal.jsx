import React, { useEffect, useRef } from 'react';
import { Home } from 'lucide-react';
import { useConnectionAlert } from '../contexts/ConnectionAlertContext';

/**
 * Connection Alert Modal designed in strict adherence to THEME.md guidelines:
 * - High-contrast dark glassmorphism with #0c0c0c solid modal core
 * - Double-layered glass frame (rounded-[1.75rem] mobile, rounded-[2.5rem] desktop)
 * - Atmospheric neutral glow (w-96 blur-[120px])
 * - Pixel typography for titles, micro-badges, and step tags
 * - Monochrome solid Primary CTA (bg-white text-black) for "Go to Home"
 * - Minimum 44px thumb-friendly touch target with active:scale-[0.98]
 */

const COPY = {
  capacity: {
    badge: 'Cloud Capacity Reached',
    title: 'Cloud Server Full',
    body: 'This server has hit its free-tier limit of 100 simultaneous managers. Your internet connection is working properly!',
    switchTip: 'You don’t have to wait: switch to Server 2, 3, or 4 from the Home page or Lobby to play immediately.',
    hint: 'Seats free up as managers leave, or you can switch to another server on the Home page.',
  },
  unreachable: {
    badge: 'Server Unreachable',
    title: 'Can’t Reach Cloud Server',
    body: 'We couldn’t connect to this auction server right now. The server might be temporarily busy or restarting.',
    switchTip: 'You can switch to another server (Server 2, 3, or 4) to start or join a game without delay.',
    hint: 'Check your internet connection, or try switching to another server on the Home page.',
  },
  offline: {
    badge: 'No Internet Connection',
    title: 'Internet Disconnected',
    body: 'You appear to be offline. Cross-device multiplayer requires an active internet connection to synchronize bids.',
    switchTip: null,
    hint: 'Please check your Wi-Fi or mobile data connection to resume.',
  },
};

function AlertDialog({ problem }) {
  const homeButtonRef = useRef(null);

  const goHome = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    homeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const activeReason = isOffline ? 'offline' : problem;
  const copy = COPY[activeReason] ?? COPY.unreachable;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-6 bg-black/90 font-sans backdrop-blur-2xl animate-fade-in"
    >
      {/* Background Ambient Glow matching THEME.md Section 3 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.02] blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-slate-500/[0.02] blur-[120px] rounded-full" />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-alert-title"
        aria-describedby="connection-alert-body"
        className="relative z-10 flex w-full max-w-md flex-col max-h-[92dvh]"
      >
        {/* Outer Card Glass Frame (THEME.md Section 2 / Quota Modal pattern) */}
        <div className="relative flex flex-col min-h-0 bg-white/[0.02] border border-white/10 rounded-[1.75rem] sm:rounded-[2.5rem] p-2.5 sm:p-3 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          {/* Inner Dark Container */}
          <div className="relative flex flex-col min-h-0 overflow-hidden rounded-[1.4rem] sm:rounded-[2rem] border border-white/5 bg-[#0c0c0c] p-5 sm:p-7 text-left">
            {/* Top Divider Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 custom-scrollbar">
              {/* Status Badge per THEME.md Section 4 */}
              <div className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 text-slate-300 px-3 py-1 rounded-full font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider backdrop-blur-md mb-3.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                {copy.badge}
              </div>

              {/* Main Heading matching THEME.md Section 4 */}
              <h2
                id="connection-alert-title"
                className="mb-2.5 break-words text-lg sm:text-2xl font-pixel uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]"
              >
                {copy.title}
              </h2>

              {/* Description Body */}
              <p
                id="connection-alert-body"
                className="text-xs sm:text-[13px] font-medium leading-relaxed text-slate-300"
              >
                {copy.body}
              </p>

              {/* Switch Server Info Well matching THEME.md Section 1 */}
              {copy.switchTip && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-1">
                  <div className="font-pixel text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>IMMEDIATE PLAY</span>
                  </div>
                  <p className="text-xs sm:text-[12.5px] text-slate-400 font-medium leading-relaxed">
                    {copy.switchTip}
                  </p>
                </div>
              )}

              {/* Muted Metadata / Hint */}
              <p className="mt-4 border-t border-white/10 pt-3.5 text-[11px] leading-relaxed text-slate-500">
                {copy.hint}
              </p>

              {/* Action Button: Single Solid Primary CTA matching THEME.md */}
              <div className="mt-6">
                <button
                  ref={homeButtonRef}
                  type="button"
                  onClick={goHome}
                  className="w-full h-11 sm:h-12 rounded-xl bg-white hover:bg-slate-200 text-black font-black uppercase tracking-[0.14em] text-[10px] sm:text-xs transition-all active:scale-[0.98] cursor-pointer shadow-[0_10px_30px_rgba(255,255,255,0.08)] flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  <span>Go to Home</span>
                </button>
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
