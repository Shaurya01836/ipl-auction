import React from 'react';

const PageLoader = ({ text = 'Loading...', fullscreen = true, className = '' }) => {
  const containerClasses = fullscreen
    ? 'fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-4'
    : 'min-h-[50vh] w-full bg-transparent flex flex-col items-center justify-center p-4';

  return (
    <div className={`${containerClasses} ${className}`} role="status" aria-live="polite">
      {/* Subtle atmospheric backdrop glows per THEME.md */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-white/[0.02] blur-[140px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-slate-500/[0.02] blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-3.5 text-center">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white/15 border-t-white animate-spin" />
        {text && (
          <p className="font-pixel text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest animate-pulse select-none">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageLoader;
