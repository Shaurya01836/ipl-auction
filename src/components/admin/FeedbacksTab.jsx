import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Star,
  Bookmark,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import PaginationControls from './PaginationControls';

const FeedbacksTab = ({
  feedbacks,
  filteredFeedbacks,
  paginatedFeedbacks,
  feedbackSearch,
  setFeedbackSearch,
  feedbackStatusFilter,
  setFeedbackStatusFilter,
  feedbackCategory,
  setFeedbackCategory,
  feedbackStarFilter,
  setFeedbackStarFilter,
  feedbackPage,
  setFeedbackPage,
  totalFeedbackPages,
  feedbacksPerPage,
  savingNoteId,
  expandedFeedbackIds,
  setExpandedFeedbackIds,
  handleUpdateFeedback,
  setDeleteTarget,
  formatDate,
  categories,
  workflowStatuses,
  getFeedbackCategoryStyle,
  getFeedbackStatusStyle,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Clean Header & Filter Bar */}
      <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={feedbackSearch}
            onChange={(e) => setFeedbackSearch(e.target.value)}
            placeholder="Search feedback message, user, email, or notes..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5500]/50 font-medium transition-colors"
          />
          {feedbackSearch && (
            <button
              onClick={() => setFeedbackSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Status:</span>
            <select
              value={feedbackStatusFilter}
              onChange={(e) => setFeedbackStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {workflowStatuses.map((st) => (
                <option key={st.id} value={st.id} className="bg-[#151515] text-white">
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Category:</span>
            <select
              value={feedbackCategory}
              onChange={(e) => setFeedbackCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#151515] text-white">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Rating:</span>
            <select
              value={feedbackStarFilter}
              onChange={(e) => setFeedbackStarFilter(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-[#151515] text-white">All Ratings ({feedbacks.length})</option>
              <option value={5} className="bg-[#151515] text-white">5 Stars ★</option>
              <option value={4} className="bg-[#151515] text-white">4 Stars ★</option>
              <option value={3} className="bg-[#151515] text-white">3 Stars ★</option>
              <option value={2} className="bg-[#151515] text-white">2 Stars ★</option>
              <option value={1} className="bg-[#151515] text-white">1 Star ★</option>
            </select>
          </div>
        </div>
      </div>

      {/* List View Container */}
      {filteredFeedbacks.length === 0 ? (
        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-10 text-center space-y-3 shadow-xl">
          <MessageSquare className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-white">No Feedbacks Found</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try clearing or adjusting search query, category, or status filters.
          </p>
        </div>
      ) : (
        <>
          {/* Clean List View with Expandable Rows */}
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-xl divide-y divide-white/5">
            {paginatedFeedbacks.map((fb) => {
              const isExpanded = expandedFeedbackIds.has(fb.id);
              const catStyle = getFeedbackCategoryStyle(fb.category);
              const statusStyle = getFeedbackStatusStyle(fb.status);

              const toggleExpand = () => {
                setExpandedFeedbackIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(fb.id)) next.delete(fb.id);
                  else next.add(fb.id);
                  return next;
                });
              };

              const currentRating = Math.max(1, Math.min(5, Number(fb.rating) || 1));

              return (
                <div key={fb.id} className="transition-colors hover:bg-white/[0.015]">
                  {/* List Row (Clean & Minimal) */}
                  <div
                    onClick={toggleExpand}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none group"
                  >
                    {/* Left: Avatar + User Info + Preview */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {fb.userPhoto ? (
                        <img
                          src={fb.userPhoto}
                          alt={fb.userName || 'User'}
                          className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gray-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {(fb.userName || fb.email || 'A')[0].toUpperCase()}
                        </div>
                      )}

                      {/* Info & Message Snippet */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">
                            {fb.userName || 'Anonymous'}
                          </span>

                          <span className={`text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${catStyle.badge}`}>
                            <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                            {catStyle.label}
                          </span>

                          <span className={`text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-md border ${statusStyle}`}>
                            {fb.status === 'resolved' ? 'Resolved' : fb.status === 'in_progress' ? 'In Progress' : 'New'}
                          </span>

                          {fb.isStarred && (
                            <span className="text-amber-400 text-xs" title="Starred">★</span>
                          )}
                        </div>

                        {/* Collapsed message preview only when not expanded */}
                        {!isExpanded && (
                          <p className="text-xs text-gray-400 truncate mt-1 font-normal">
                            {fb.feedback}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Rating + Date + Expand Icon */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{currentRating}</span>
                      </div>

                      <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">
                        {formatDate(fb.createdAt)}
                      </span>

                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown / Expanded View (Decluttered, minimal & elegant) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 bg-white/[0.02] border-t border-white/5 space-y-3">
                          {/* Minimal User Metadata Row */}
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap pt-1.5">
                            {fb.email && fb.email !== 'Not provided' && (
                              <span className="flex items-center gap-1.5">
                                <span className="text-gray-500">Email:</span>
                                <span className="text-gray-200 font-mono text-[10.5px]">{fb.email}</span>
                              </span>
                            )}
                            {fb.authType && (
                              <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400">
                                Auth: {fb.authType}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 sm:hidden">
                              {formatDate(fb.createdAt)}
                            </span>
                          </div>

                          {/* Full Feedback Message Card */}
                          <div className="bg-[#0e0e0e] border border-white/5 rounded-xl p-3.5 text-xs text-gray-200 leading-relaxed whitespace-pre-wrap selection:bg-[#ff5500]/20">
                            {fb.feedback}
                          </div>

                          {/* Actions & Internal Note Row */}
                          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-0.5">
                            {/* Controls: Rating, Status, Star, Delete */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Rating Edit */}
                              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Rating:</span>
                                <select
                                  value={currentRating}
                                  onChange={(e) => handleUpdateFeedback(fb.id, { rating: Number(e.target.value) })}
                                  className="bg-transparent text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
                                >
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <option key={star} value={star} className="bg-[#151515] text-amber-400">
                                      {star} ★
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Status Edit */}
                              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
                                <select
                                  value={fb.status || 'new'}
                                  onChange={(e) => handleUpdateFeedback(fb.id, { status: e.target.value })}
                                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                                >
                                  <option value="new" className="bg-[#151515] text-blue-400">New</option>
                                  <option value="in_progress" className="bg-[#151515] text-amber-400">In Progress</option>
                                  <option value="resolved" className="bg-[#151515] text-emerald-400">Resolved</option>
                                </select>
                              </div>

                              {/* Star / Bookmark Toggle */}
                              <button
                                onClick={() => handleUpdateFeedback(fb.id, { isStarred: !fb.isStarred })}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${fb.isStarred
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                  }`}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${fb.isStarred ? 'fill-amber-400' : ''}`} />
                                <span>{fb.isStarred ? 'Starred' : 'Star'}</span>
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => setDeleteTarget({ type: 'feedback', id: fb.id, title: fb.email || 'Feedback' })}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-xs font-bold text-gray-400 hover:text-rose-400 flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>

                            {/* Internal Note Field */}
                            <div className="relative flex-1 md:max-w-xs">
                              <input
                                type="text"
                                defaultValue={fb.adminNote || ''}
                                placeholder="Internal note..."
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val !== (fb.adminNote || '')) {
                                    handleUpdateFeedback(fb.id, { adminNote: val });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="w-full bg-[#0e0e0e] border border-white/10 focus:border-[#ff5500]/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                              />
                              {savingNoteId === fb.id && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-[9px] animate-pulse">
                                  Saving...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Feedback Pagination Bar */}
          <PaginationControls
            currentPage={feedbackPage}
            totalPages={totalFeedbackPages}
            totalItems={filteredFeedbacks.length}
            itemsPerPage={feedbacksPerPage}
            onPageChange={setFeedbackPage}
            label="feedbacks"
          />
        </>
      )}
    </motion.div>
  );
};

export default FeedbacksTab;
