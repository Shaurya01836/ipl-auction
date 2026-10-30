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
      aria-label="How to play offline with mobile hotspot"
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
              Currently, cloud auctions use Firebase RTDB, which has strict connection and bandwidth limits.
              With <strong className="text-gray-200">Offline Mode</strong>, you can host auctions right on your personal
              mobile hotspot with zero cloud limits, zero lag, and zero internet data used!
            </p>
          </div>

          {onSelectOfflineMode && (
            <div className="shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={onSelectOfflineMode}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#ff8c00] active:scale-[0.98] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,85,0,0.35)] cursor-pointer group"
              >
                <Radio size={14} className="shrink-0 animate-pulse" />
                <span>Try Hotspot Mode</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* ── 3 Simple Steps: How to Play Offline ── */}
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
                  <span className="w-6 h-6 rounded-lg bg-[#ff5500]/15 border border-[#ff5500]/30 text-[#ff5500] text-[10px] font-mono font-bold flex items-center justify-center">
                    01
                  </span>
                  <Radio size={16} className="text-[#ff5500]" />
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Turn On Mobile Hotspot
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Turn on your phone's personal hotspot (or connect to any Wi-Fi). <span className="text-gray-300 font-semibold">No active mobile data or recharge is needed!</span>
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={11} className="shrink-0" />
                <span>Zero mobile data consumed</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold flex items-center justify-center">
                    02
                  </span>
                  <Smartphone size={16} className="text-blue-400" />
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Friends Connect Wi-Fi
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Friends open their Wi-Fi settings and connect to your phone's hotspot. Works across Android, iPhone, Windows & Mac.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={11} className="shrink-0" />
                <span>Instant local connection</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:border-amber-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold flex items-center justify-center">
                    03
                  </span>
                  <Zap size={16} className="text-amber-400" />
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-white mb-1">
                  Start & Bid with Zero Lag
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Toggle <strong className="text-white">Offline / Hotspot</strong> in the Create tab. Your friends enter the room code to bid instantly at LAN speed.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={11} className="shrink-0" />
                <span>Sub-5ms paddle latency</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocalPlayRoadmap;
