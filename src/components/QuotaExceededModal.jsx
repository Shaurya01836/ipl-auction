import React, { useEffect } from 'react';
import { useQuota } from '../contexts/QuotaContext';

export default function QuotaExceededModal() {
  const { isQuotaExceeded, resetQuotaError } = useQuota();

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isQuotaExceeded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isQuotaExceeded]);

  if (!isQuotaExceeded) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in font-sans">
      {/* Background Ambient Glow matching THEME.md */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-white/[0.02] blur-[140px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[200px] h-[200px] bg-slate-500/[0.02] blur-[120px] rounded-full" />
      </div>

      {/* Outer Card Glass Frame */}
      <div className="relative max-w-md w-full bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-2.5 sm:p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10">
        {/* Inner Dark Container */}
        <div className="bg-[#0c0c0c] rounded-[2rem] border border-white/5 p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Top Divider Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 text-slate-300 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md mb-4">
            🏏 IPL AUCTION NOTICE
          </div>

          {/* Main Title matching THEME.md typography */}
          <h2 className="text-xl sm:text-2xl font-pixel uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)] mb-3">
            DAILY SERVER QUOTA REACHED
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-[13px] text-slate-400 font-medium max-w-xl mx-auto leading-relaxed mb-5">
            Our daily free database capacity has been reached. Live auction bidding, user squad sync, and updates are temporarily paused to prevent server downtime.
          </p>

          {/* Info Status Panel */}
          <div className="bg-white/[0.02] rounded-xl border border-white/10 p-3.5 sm:p-4 mb-6 text-left space-y-1">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <span>🕒 RESET SCHEDULE</span>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-normal">
              Firebase free quotas reset automatically every 24 hours (Midnight PST). Please check back tomorrow!
            </p>
          </div>

          {/* Action Buttons matching THEME.md solid CTA */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-12 rounded-xl bg-white hover:bg-slate-200 text-black font-black uppercase tracking-[0.14em] text-xs transition-all active:scale-[0.98] cursor-pointer shadow-[0_10px_30px_rgba(255,255,255,0.08)] flex items-center justify-center"
            >
              Refresh Page
            </button>

            <button
              onClick={resetQuotaError}
              className="h-12 px-5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
