import React from 'react';

/**
 * Small segmented control for choosing which RTDB new rooms/history use.
 * It never opens a database connection; it only filters Supabase-backed views.
 */
export default function ServerSwitcher({ servers, value, onChange, className = '' }) {
  if (!servers || servers.length < 2) return null;

  return (
    <div
      role="group"
      aria-label="Auction server"
      className={`inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.02] p-0.5 ${className}`}
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
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer sm:px-2.5 ${
              active
                ? 'bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/25'
                : 'border border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{server.label}</span>
            <span
              className={`text-[7px] font-bold tracking-wide ${
                active ? 'text-orange-300/80' : 'text-gray-600'
              }`}
            >
            </span>
          </button>
        );
      })}
    </div>
  );
}
