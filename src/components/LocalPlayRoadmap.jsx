import React from 'react';
import {
  Radio,
  Wifi,
  Smartphone,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const LocalPlayRoadmap = ({ onSelectOfflineMode }) => {
  return (
    <section
      aria-label="How to play with Hotspot mode"
      className="w-full max-w-6xl rounded-3xl sm:rounded-[2.5rem] p-3 sm:p-5  z-10 relative mt-10 sm:mt-16"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff5500]/[0.03] via-blue-600/[0.02] to-transparent rounded-3xl sm:rounded-[2.5rem] blur-2xl pointer-events-none -z-10" />
      <div className="absolute -inset-1.5 bg-gradient-to-r from-[#ff5500]/5 via-amber-500/5 to-[#0088ff]/5 rounded-3xl sm:rounded-[2.5rem] blur-3xl opacity-40 pointer-events-none -z-10" />

      <div className="bg-[#0c0c0c]/70 rounded-[1.8rem] sm:rounded-[2.2rem] border border-white/5 p-4 sm:p-7 md:p-9 relative overflow-hidden">
        {/* Subtle grid accent background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

        {/* ── Header ── */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="max-w-2xl">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-pixel uppercase leading-snug text-white">
              PLAY WITH FRIENDS OVER{' '}
              <span className="text-[#ff5500] drop-shadow-[0_2px_10px_rgba(255,85,0,0.3)]">
                HOTSPOT & WI-FI
              </span>
            </h2>

            <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 font-medium mt-1.5 leading-relaxed">
              Cloud auctions use Firebase RTDB with simultaneous user limits.
              With <strong className="text-gray-200">Hotspot Mode</strong>, the auction engine runs on the host device with real-time multiplayer relayed via lightweight Supabase Realtime messaging—bypassing cloud database caps!
            </p>
          </div>

          {onSelectOfflineMode && (
            <div className="shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={onSelectOfflineMode}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#ff5500] active:scale-[0.98] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2  cursor-pointer group"
              >
                <span>Try Hotspot Mode</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* ── 3 Simple Steps: How Hotspot Mode Works ── */}
        <div className="relative z-10 pt-5 sm:pt-6">
          <div className="flex items-center gap-2 mb-3.5">

            <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
              How It Works in 3 Easy Steps:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-[#ff5500]/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2.5">

                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Connect to Network
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Turn on your personal hotspot or connect everyone to the same Wi-Fi. <span className="text-gray-300 font-semibold">An active internet connection is required on all devices to sync multiplayer bids.</span>
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">

                <span>Bypasses Firebase Quotas</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2.5">

                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Friends Join with Code
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Friends open CrickAuction in their browser and enter the 4-digit code. Initial room discovery connects through Supabase Realtime.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1.5">

                <span>Lightweight Relay</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-amber-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Host-Powered Bidding
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Auction timers, purse mathematics, and bot AI execute directly on the host device. Solo play against bots works offline once loaded.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">

                <span>Host Engine Simulation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocalPlayRoadmap;
