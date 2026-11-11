import React from 'react';
import FeedbackBoard from './FeedbackBoard';
import DevNote from './DevNote';
import PlayerRatingsCard from './PlayerRatingsCard';

export default function CommunitySection() {
  return (
    <section
      id="community-section"
      aria-label="Community Feedback and Development Updates"
      className="relative w-full max-w-6xl mx-auto px-2.5 sm:px-4 mt-6 sm:mt-12 mb-8 sm:mb-12 z-10"
    >
      {/* Outer Card Wrapper matching PanelSurface styling */}
      <div className="relative rounded-[1.75rem] sm:rounded-[2.5rem] p-3.5 sm:p-8 md:p-10 bg-[#0c0d10] border border-white/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col gap-6 sm:gap-10 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-white/[0.02] blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-slate-500/[0.02] blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 font-pixel text-[9px] sm:text-[10px] tracking-widest text-slate-300 uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>COMMUNITY</span>
          </div>

          {/* Section Title */}
          <h2 className="font-pixel text-[clamp(1.3rem,4vw,2.4rem)] leading-none uppercase text-white tracking-tight">
            YOU SAID, <span className="text-slate-300">I DID</span>
          </h2>

          {/* Subtitle */}
          <p className="text-[11px] sm:text-[13px] text-slate-400 font-normal mt-2 leading-relaxed px-2">
            Your feedback, my to-do list. Here's what happened to it.
          </p>
        </div>

        {/* Part 1: Four-Column Feedback Board */}
        <div className="relative z-10 w-full">
          <FeedbackBoard />
        </div>

        {/* Part 2 & 3: Two-Column Row (Dev Note & Player Ratings) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Left: Dev Note (7 cols on desktop) */}
          <div className="lg:col-span-7 w-full flex">
            <DevNote />
          </div>

          {/* Right: Player Ratings Lab Card (5 cols on desktop) */}
          <div className="lg:col-span-5 w-full flex">
            <PlayerRatingsCard />
          </div>
        </div>
      </div>
    </section>
  );
}
