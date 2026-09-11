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
      {/* Background Ambient Glow matching Landing Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#ff5500]/20 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 left-1/3 w-[200px] h-[200px] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Outer Card Glass Frame matching Landing Page style */}
      <div className="relative max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10">
        {/* Subtle Orange Glow behind panel */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff5500]/[0.05] via-[#ff5500]/[0.02] to-transparent rounded-[2.5rem] blur-xl pointer-events-none -z-10" />

        {/* Inner Dark Container */}
        <div className="bg-[#0c0c0c] rounded-[2.2rem] border border-white/5 p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Top Divider Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#ff5500]/50 to-transparent" />

          {/* Badge matching Landing Page */}
          <div className="inline-flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-5 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            🏏 IPL AUCTION NOTICE
          </div>

          {/* Main Title matching Landing Page typography */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#ff5500] uppercase italic drop-shadow-[0_4px_12px_rgba(255,85,0,0.25)] mb-3">
            DAILY SERVER QUOTA REACHED
          </h2>

          {/* Description matching Landing Page text style */}
          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto leading-relaxed mb-6">
            Our daily free database capacity has been reached. Live auction bidding, user squad sync, and updates are temporarily paused to prevent server downtime.
          </p>

          {/* Info Status Panel */}
          <div className="bg-black/60 rounded-2xl border border-white/10 p-4 mb-6 text-left space-y-1.5">
            <div className="text-[10px] font-black text-[#ff5500] uppercase tracking-widest flex items-center gap-1.5">
              <span>🕒 RESET SCHEDULE</span>
            </div>
            <p className="text-xs text-gray-400 font-medium leading-normal">
              Firebase free quotas reset automatically every 24 hours (Midnight PST). Please check back tomorrow!
            </p>
          </div>

          {/* Action Buttons matching Landing Page primary button style */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-12 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.25)] cursor-pointer transition-all active:scale-[0.98] border border-orange-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
              <div className="relative flex items-center justify-center text-white font-black uppercase tracking-[0.15em] text-xs">
                Refresh Page
              </div>
            </button>

            <button
              onClick={resetQuotaError}
              className="h-12 px-5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-widest text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
