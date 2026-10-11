import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Activity } from 'lucide-react';

const PlayerDetailModal = ({
  player,
  onClose,
  getRoleBadgeStyle,
  getRatingBadgeStyle,
}) => {
  return (
    <AnimatePresence>
      {player && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {player.id}
                </span>
                <span className="text-gray-400 text-xs font-bold truncate">
                  {player.set}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Player Main Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl bg-gradient-to-br from-gray-800 to-black overflow-hidden border border-white/15 shadow-xl">
                <img
                  src={player.image || 'https://documents.iplt20.com/ipl/IPLHeadshot2026/default.png'}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://documents.iplt20.com/ipl/IPLHeadshot2026/default.png';
                  }}
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {player.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle ? getRoleBadgeStyle(player.role) : ''}`}>
                    {player.role}
                  </span>
                  <span className="text-gray-400 text-xs font-medium">
                    {player.type} · {player.country}
                  </span>
                </div>

                {/* Rating + Base Price */}
                <div className="mt-3 flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${getRatingBadgeStyle ? getRatingBadgeStyle(player.rating) : ''}`}>
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm font-black">{player.rating}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-60">/ 100</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs font-bold text-gray-300">
                    Base: ₹{player.basePrice} Cr
                  </div>
                </div>
              </div>
            </div>

            {player.stats && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Career Statistics
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Matches</span>
                    <span className="text-sm font-black text-white">{player.stats.matches ?? '—'}</span>
                  </div>

                  {player.stats.runs !== undefined && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Runs</span>
                      <span className="text-sm font-black text-gray-100">{player.stats.runs}</span>
                    </div>
                  )}

                  {player.stats.avg !== undefined && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Bat Avg</span>
                      <span className="text-sm font-black text-gray-100">{player.stats.avg}</span>
                    </div>
                  )}

                  {player.stats.sr !== undefined && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Strike Rate</span>
                      <span className="text-sm font-black text-gray-100">{player.stats.sr}</span>
                    </div>
                  )}

                  {player.stats.hs !== undefined && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">High Score</span>
                      <span className="text-sm font-black text-gray-100">{player.stats.hs}</span>
                    </div>
                  )}

                  {player.stats.wickets !== undefined && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Wickets</span>
                      <span className="text-sm font-black text-gray-100">{player.stats.wickets}</span>
                    </div>
                  )}

                  {player.stats.econ !== undefined && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Economy</span>
                      <span className="text-sm font-black text-gray-100">{player.stats.econ}</span>
                    </div>
                  )}

                  {player.stats.bb !== undefined && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 block mb-1">Best Bowling</span>
                      <span className="text-sm font-black text-gray-100">{player.stats.bb}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PlayerDetailModal;
