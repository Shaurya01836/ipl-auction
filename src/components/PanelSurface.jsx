import React from 'react';

/**
 * PanelSurface
 * Wraps the auction controller panel without touching its internal layout or logic.
 *
 * Provides:
 * - A clean outer card wrapper with subtle 1px border highlight.
 * - Soft ambient elevation shadow to embed the panel into the page surface.
 * - Zero interference with scrolling or internal controller state.
 */
const PanelSurface = ({ children, className = '' }) => {
  return (
    <div className={`relative w-full max-w-6xl z-10 ${className}`}>
      <div className="relative rounded-[2.5rem] p-2 sm:p-3 bg-white/[0.015] border border-white/10 border-t-white/20 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_-10px_rgba(255,255,255,0.02)]">
        {children}
      </div>
    </div>
  );
};

export default PanelSurface;
