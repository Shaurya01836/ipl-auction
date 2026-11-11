import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CommunityBanner() {
  const scrollToCommunity = (e) => {
    e.preventDefault();
    const el = document.getElementById('community-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside
      aria-label="Community updates banner"
      className="relative z-50 w-full bg-[#0a0d14]/90 border-b border-white/10 backdrop-blur-md text-white transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-center gap-2 text-center text-[10px] sm:text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15 font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider shrink-0">
          <span>New</span>
        </span>

        <span className="text-slate-300 font-medium truncate sm:overflow-visible">
          <strong className="text-white font-bold">You said, I did:</strong> Check out the live feedback board and ratings audit.
        </span>

        <button
          type="button"
          onClick={scrollToCommunity}
          className="inline-flex items-center gap-1 text-slate-200 hover:text-white font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all cursor-pointer shrink-0 ml-1 group"
        >
          <span>View board</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </aside>
  );
}

