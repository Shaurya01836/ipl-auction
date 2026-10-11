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
  5: 'from-emerald-500 to-teal-400',
  4: 'from-teal-500 to-sky-400',
  3: 'from-amber-500 to-yellow-400',
  2: 'from-orange-500 to-amber-500',
  1: 'from-rose-500 to-orange-500',
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
        <div className="bg-[#0b0b0b] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Rating Distribution
                </h3>
                <p className="text-[10px] text-gray-500">
                  {totalRated} verified reviews
                </p>
              </div>

              {/* Big avg score badge */}
              <div className="flex items-baseline gap-1 bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-xl">
                <span className="text-base font-black text-amber-400">{stats.avgRating}</span>
                <span className="text-[10px] font-bold text-gray-500">★</span>
              </div>
            </div>

            {/* Clean Progress Bars */}
            <div className="space-y-2.5 pt-4">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.starCounts[rating] || 0;
                const pct = totalRated > 0 ? (count / totalRated) * 100 : 0;
                const gradient = STAR_BAR_GRADIENTS[rating] || 'from-amber-500 to-[#ff5500]';

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

                    <div className="w-12 text-right text-[11px] font-medium text-gray-400 tabular-nums">
                      {count} <span className="text-gray-600 text-[10px]">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Feedback Categories Breakdown */}
        <div className="bg-[#0b0b0b] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Feedback Categories
                </h3>
                <p className="text-[10px] text-gray-500">
                  Submissions by topic
                </p>
              </div>

              <span className="text-[10px] font-semibold text-gray-400 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5">
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
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.035] border border-white/[0.06] transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                        <span className="text-[11px] font-medium text-gray-400">
                          {conf.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-semibold tabular-nums">
                        {pct}%
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="text-xl font-bold text-white">
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
      <div className="bg-[#0b0b0b] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Recent Feedbacks
            </h3>
            <p className="text-[10px] text-gray-500">
              Latest submissions
            </p>
          </div>

          <button
            onClick={onViewAllFeedbacks}
            className="text-[11px] font-semibold text-[#ff5500] hover:text-[#ff7733] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({feedbacks.length})</span>
            <ChevronRight className="w-3 h-3" />
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
