import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Dropdown selector for choosing which RTDB new rooms/history use.
 * Compact and fully responsive across all screen sizes.
 */
export default function ServerSwitcher({ servers, value, onChange, className = '' }) {
  const visibleServers = (servers || []).filter((server) => !server?.isLocal);
  if (visibleServers.length < 2) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Auction server"
        className="appearance-none bg-white/[0.03] hover:bg-white/[0.06] text-slate-100 border border-white/10 hover:border-white/20 rounded-lg pl-3 pr-8 py-1.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus:border-slate-400/50 shadow-sm"
      >
        {visibleServers.map((server) => (
          <option
            key={server.id}
            value={server.id}
            className="bg-[#0c0d10] text-gray-200 py-1"
          >
            {server.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}
