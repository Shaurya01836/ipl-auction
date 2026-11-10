import React from 'react';

/**
 * Segmented control for choosing which RTDB new rooms/history use.
 * - Mobile/Tablet (< lg): full-width 4-column grid on the next line for easy tapping.
 * - Desktop/Laptop (>= lg): compact inline segmented control on the same line as the header.
 */
export default function ServerSwitcher({ servers, value, onChange, className = '' }) {
  if (!servers || servers.length < 2) return null;

  return (
    <div
      role="group"
      aria-label="Auction server"
      className={`grid grid-cols-4 lg:inline-flex items-center gap-1 lg:gap-0.5 rounded-lg border border-white/10 bg-white/[0.02] p-1 lg:p-0.5 w-full lg:w-auto shrink-0 ${className}`}
    >
      {servers.map((server) => {
        const active = server.id === value;
        return (
          <button
            key={server.id}
            type="button"
            onClick={() => onChange?.(server.id)}
            aria-pressed={active}
            title={server.description}
            className={`flex items-center justify-center rounded-md px-1.5 lg:px-2.5 py-2 lg:py-1 text-[8.5px] lg:text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-center ${
              active
                ? 'bg-slate-500/20 text-slate-100 border border-slate-400/30 shadow-sm'
                : 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
            }`}
          >
            <span>{server.label}</span>
          </button>
        );
      })}
    </div>
  );
}
