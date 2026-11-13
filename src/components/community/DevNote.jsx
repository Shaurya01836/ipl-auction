import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { DEV_NOTE_CONFIG } from '../../data/feedback';

export default function DevNote() {
  const [avatarError, setAvatarError] = useState(false);

  const openFeedback = () => {
    window.dispatchEvent(new CustomEvent('open-feedback-modal'));
    document.getElementById('feedback-fab-button')?.click();
  };

  return (
    <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 p-5 sm:p-7 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden">
      <div>
        {/* Header with Photo & Heading */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0 shadow-md">
            {!avatarError ? (
              <img
                src={DEV_NOTE_CONFIG.avatarUrl}
                alt={DEV_NOTE_CONFIG.name}
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-pixel text-xs text-slate-300">
                SU
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-pixel text-sm sm:text-base uppercase tracking-wider text-white">
                {DEV_NOTE_CONFIG.heading}
              </h3>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              {DEV_NOTE_CONFIG.name} • {DEV_NOTE_CONFIG.role}
            </p>
          </div>
        </div>

        {/* Note Body */}
        <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300 font-normal mb-6">
          {DEV_NOTE_CONFIG.copy}
        </p>

        {/* What Keeps This Alive Strip */}
        <div className="mb-6">
          <span className="text-[9px] font-pixel uppercase tracking-widest text-slate-400 block mb-2">
            WHAT KEEPS THIS ALIVE
          </span>
          <div className="flex flex-wrap gap-2">
            {DEV_NOTE_CONFIG.chips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 border border-white/5 font-pixel text-[9px] uppercase tracking-wider text-slate-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-3">
        {/* Send feedback primary button */}
        <button
          type="button"
          onClick={openFeedback}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-pixel text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
        >
          <MessageSquare size={13} />
          <span>{DEV_NOTE_CONFIG.feedbackBtnText}</span>
        </button>
      </div>
    </div>
  );
}

