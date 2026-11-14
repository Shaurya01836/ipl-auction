import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FEEDBACK_COLUMNS, FEEDBACK_ITEMS } from '../../data/feedback';

const columnStyles = {
  heard: {
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    cardBorder: 'border-white/10 hover:border-amber-500/30',
  },
  working: {
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    cardBorder: 'border-white/10 hover:border-blue-500/30',
  },
  shipped: {
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
    cardBorder: 'border-white/10 hover:border-emerald-500/30',
  },
};

export default function FeedbackBoard() {
  const [expandedId, setExpandedId] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('heard');

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full">
      {/* Mobile Tabs Switcher (< lg screens): Touch-optimized pill bar with smooth horizontal swipe */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-1.5 p-1 mb-4 rounded-2xl bg-black/50 border border-white/10 scroll-smooth touch-pan-x">
        {FEEDBACK_COLUMNS.map((col) => {
          const count = FEEDBACK_ITEMS.filter((item) => item.status === col.id).length;
          const isActive = activeMobileTab === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveMobileTab(col.id)}
              className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-xl font-pixel text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-white/15 text-white border border-white/25 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{col.label.split(' ')[0]}</span>
              <span className="text-[8px] opacity-70 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 3-Column Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {FEEDBACK_COLUMNS.map((col) => {
          const colItems = FEEDBACK_ITEMS.filter((item) => item.status === col.id);
          const style = columnStyles[col.id];
          const isMobileHidden = activeMobileTab !== col.id;

          return (
            <div
              key={col.id}
              className={`flex flex-col gap-2.5 sm:gap-3 rounded-2xl p-3 sm:p-4 bg-white/[0.02] border border-white/5 lg:flex ${
                isMobileHidden ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                  <h4 className="font-pixel text-[10px] sm:text-[11px] uppercase tracking-wider text-white">
                    {col.label}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border ${style.badgeBg}`}>
                  {colItems.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex flex-col gap-2.5">
                {colItems.map((item, itemIdx) => {
                  const isExpanded = expandedId === item.id;
                  const tiltClass = itemIdx % 2 === 0 ? 'lg:hover:-rotate-1' : 'lg:hover:rotate-1';

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleExpand(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(item.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      className={`group relative rounded-xl p-3.5 bg-[#0e1015]/95 border cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 transform-gpu transition-all duration-200 active:scale-[0.98] lg:hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
                        style.cardBorder
                      } ${tiltClass}`}
                    >
                      {/* Card Tag Pill */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-pixel text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                          {item.tag}
                        </span>

                        <span className="text-slate-500 group-hover:text-slate-300 transition-colors p-0.5">
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </span>
                      </div>

                      {/* Card Title */}
                      <h5 className="font-bold text-xs sm:text-[13px] text-white leading-tight mb-1">
                        {item.title}
                      </h5>

                      {/* One-Line Note */}
                      <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                        {item.note}
                      </p>

                      {/* Expandable Deep-Dive Detail (Silky 60fps collapse/expand) */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="mt-2.5 pt-2 border-t border-white/5 text-[11px] text-slate-300 leading-relaxed overflow-hidden"
                          >
                            <p className="font-medium text-slate-300">
                              {item.detail}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
