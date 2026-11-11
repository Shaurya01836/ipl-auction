import React from 'react';
import { ArrowRight, Sliders, Sparkles, MessageSquarePlus } from 'lucide-react';
import { RATINGS_V2_CONFIG } from '../../data/feedback';

export default function PlayerRatingsCard() {
  const openFeedback = () => {
    window.dispatchEvent(new CustomEvent('open-feedback-modal'));
    document.getElementById('feedback-fab-button')?.click();
  };

  const progressPercent = Math.min(100, Math.max(0, RATINGS_V2_CONFIG.progress || 40));

  return (
    <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 p-5 sm:p-7 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden">
      <div>
        {/* Top Eyebrow Tag */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-300 font-pixel text-[9px] uppercase tracking-wider">
            <Sparkles size={11} />
            <span>LAB</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {progressPercent}% Complete
          </span>
        </div>

        {/* Title */}
        <h3 className="font-pixel text-sm sm:text-base uppercase tracking-wider text-white mb-2">
          {RATINGS_V2_CONFIG.title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          Auditing all 250+ player stats with updated role weights, recent T20 form, and franchise demand.
        </p>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
            <span>Audit Progress</span>
            <span className="font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-400 to-white transition-all duration-500 shadow-sm shadow-white/10"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mini Before / After Row (Placeholder Data) */}
        <div className="space-y-2 mb-6">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">
            Preview Adjustments (Audit Sample)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RATINGS_V2_CONFIG.beforeAfter.map((player) => (
              <div
                key={player.id}
                className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block text-[11px] truncate">{player.name}</span>
                  <span className="text-[9px] text-slate-500 uppercase">{player.role}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-slate-500 line-through">{player.oldRating}</span>
                  <ArrowRight size={10} className="text-slate-400" />
                  <span className="text-emerald-400 font-bold">{player.newRating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-300 font-medium">
          {RATINGS_V2_CONFIG.prompt}
        </span>
        <button
          type="button"
          onClick={openFeedback}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-pixel text-[9px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
        >
          <MessageSquarePlus size={13} />
          <span>{RATINGS_V2_CONFIG.buttonText}</span>
        </button>
      </div>
    </div>
  );
}

