import React from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';

const CATEGORY_CONFIG = {
  general: {
    label: 'General',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    border: 'border-amber-500/20',
  },
  bug: {
    label: 'Bug Reports',
    color: 'text-rose-400',
    dot: 'bg-rose-400',
    border: 'border-rose-500/20',
  },
  feature: {
    label: 'Features',
    color: 'text-sky-400',
    dot: 'bg-sky-400',
    border: 'border-sky-500/20',
  },
  ui: {
    label: 'UI / UX',
    color: 'text-purple-400',
    dot: 'bg-purple-400',
    border: 'border-purple-500/20',
  },
};

const STAR_BAR_GRADIENTS = {
  5: 'from-emerald-400 to-teal-400',
  4: 'from-teal-400 to-sky-400',
  3: 'from-amber-400 to-yellow-400',
  2: 'from-amber-500 to-rose-400',
  1: 'from-rose-400 to-rose-600',
};

const OverviewTab = ({
  stats,
  feedbacks,
  formatDate,
  onViewAllFeedbacks,
}) => {
  const totalRated = stats.ratedCount || stats.totalFeedbacks || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* 2-Column Grid: Rating Insights & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Rating Distribution */}
        <div className="bg-[#0c0d10] border border-white/10 rounded-[1.75rem] p-5 sm:p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="font-pixel text-xs sm:text-sm uppercase tracking-tight text-white">
                  Rating Distribution
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {totalRated} verified reviews
                </p>
              </div>

              {/* Big avg score badge */}
              <div className="flex items-baseline gap-1 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-xl">
                <span className="font-pixel text-base text-amber-400">{stats.avgRating}</span>
                <span className="text-[10px] font-bold text-slate-400">★</span>
              </div>
            </div>

            {/* Clean Progress Bars */}
            <div className="space-y-2.5 pt-4">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.starCounts[rating] || 0;
                const pct = totalRated > 0 ? (count / totalRated) * 100 : 0;
                const gradient = STAR_BAR_GRADIENTS[rating] || 'from-amber-400 to-yellow-400';

                return (
                  <div key={rating} className="flex items-center gap-3 group">
                    <div className="flex items-center gap-1 w-6 text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                      <span>{rating}</span>
                      <span className="text-amber-400 text-[10px]">★</span>
                    </div>

                    <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                      />
                    </div>

                    <div className="w-12 text-right text-[11px] font-medium text-slate-400 tabular-nums">
                      {count} <span className="text-gray-600 text-[10px]">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Feedback Categories Breakdown */}
        <div className="bg-[#0c0d10] border border-white/10 rounded-[1.75rem] p-5 sm:p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="font-pixel text-xs sm:text-sm uppercase tracking-tight text-white">
                  Feedback Categories
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Submissions by topic
                </p>
              </div>

              <span className="text-[10px] font-semibold text-slate-300 px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/10">
                {stats.totalFeedbacks} total
              </span>
            </div>

            {/* 4 Minimal category cards with colored dots instead of icons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {['general', 'bug', 'feature', 'ui'].map((catKey) => {
                const conf = CATEGORY_CONFIG[catKey];
                const count = stats.categoryCounts[catKey] || 0;
                const pct = stats.totalFeedbacks > 0 ? ((count / stats.totalFeedbacks) * 100).toFixed(0) : 0;

                return (
                  <div
                    key={catKey}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                        <span className="text-[11px] font-medium text-slate-300">
                          {conf.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold tabular-nums">
                        {pct}%
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="font-pixel text-xl text-white">
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feedback Feed Preview (Minimal & Clean) */}
      <div className="bg-[#0c0d10] border border-white/10 rounded-[1.75rem] p-5 sm:p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="font-pixel text-xs sm:text-sm uppercase tracking-tight text-white">
              Recent Feedbacks
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Latest submissions
            </p>
          </div>

          <button
            onClick={onViewAllFeedbacks}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer active:scale-[0.98]"
          >
            <span>View All ({feedbacks.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {feedbacks.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No feedbacks received yet.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {feedbacks.slice(0, 4).map((fb) => {
              const currentRating = Math.max(1, Math.min(5, Number(fb.rating) || 1));
              const catKey = (fb.category || 'general').toLowerCase();
              const conf = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.general;

              return (
                <div
                  key={fb.id}
                  className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors group"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* User Avatar */}
                    {fb.userPhoto ? (
                      <img
                        src={fb.userPhoto}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 mt-0.5 sm:mt-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-gray-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        {(fb.userName || fb.email || 'A')[0].toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                          {fb.userName || 'Anonymous'}
                        </span>

                        <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded border border-white/5 bg-white/[0.02] text-gray-300 inline-flex items-center gap-1">
                          <span className={`w-1 h-1 rounded-full ${conf.dot}`} />
                          {conf.label}
                        </span>

                        {fb.status && (
                          <span className={`text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded border ${
                            fb.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : fb.status === 'in_progress'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {fb.status === 'resolved' ? 'Resolved' : fb.status === 'in_progress' ? 'In Progress' : 'New'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 truncate mt-0.5 font-normal">
                        {fb.feedback}
                      </p>
                    </div>
                  </div>

                  {/* Right: Rating + Date */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-10 sm:pl-0">
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      <span>{currentRating}</span>
                    </div>

                    <span className="text-[10px] text-gray-500 font-medium">
                      {formatDate(fb.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OverviewTab;
