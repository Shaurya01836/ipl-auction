import React from 'react';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuctionServer, withServerParam } from '../../lib/auctionServers';
import PaginationControls from './PaginationControls';

const AuctionsTab = ({
  filteredAuctions,
  paginatedAuctions,
  auctionSearch,
  setAuctionSearch,
  auctionStatusFilter,
  setAuctionStatusFilter,
  auctionPage,
  setAuctionPage,
  totalAuctionPages,
  auctionsPerPage,
  setDeleteTarget,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Filter Bar */}
      <div className="bg-[#0c0d10] border border-white/10 rounded-[1.5rem] sm:rounded-[1.75rem] p-4 sm:p-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={auctionSearch}
            onChange={(e) => setAuctionSearch(e.target.value)}
            placeholder="Search room title or room code..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 font-semibold transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'active', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setAuctionStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-[0.98] ${auctionStatusFilter === st
                ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.08)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10'
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Auctions Content */}
      {filteredAuctions.length === 0 ? (
        <div className="bg-[#0c0d10] border border-white/10 rounded-[1.5rem] sm:rounded-[1.75rem] p-8 sm:p-12 text-center space-y-2 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
          <p className="font-pixel text-xs sm:text-sm uppercase tracking-tight text-white">
            No Auctions Found in Supabase
          </p>
          <p className="text-xs text-slate-400">
            Check status filter or search input.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards Layout */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedAuctions.map((auc) => (
              <div
                key={auc.id}
                className="bg-[#0c0d10] border border-white/10 rounded-2xl p-4 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 truncate max-w-[180px]">
                      ID: {auc.id}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0 ${auc.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                    {auc.status || 'active'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500 text-[9px] font-bold">
                    {auc.created_at ? new Date(auc.created_at).toLocaleDateString() : 'N/A'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      to={withServerParam(
                        auc.status === 'completed'
                          ? `/summary/${auc.id}`
                          : `/auction/${auc.id}`,
                        getAuctionServer(auc),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl transition-all ${
                        auc.status === 'completed'
                          ? 'text-emerald-400 hover:text-white bg-emerald-500/10 border border-emerald-500/20'
                          : 'text-blue-400 hover:text-white bg-blue-500/10 border border-blue-500/20'
                      }`}
                    >
                      {auc.status === 'completed' ? 'Summary' : 'View'} <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => setDeleteTarget({ type: 'auction', id: auc.id, title: auc.title || auc.room_code })}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                      title="Delete Room Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table Layout */}
          <div className="hidden md:block bg-[#0c0d10] border border-white/10 rounded-[1.75rem] overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-gray-300 min-w-[650px]">
                <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/10">
                  <tr>
                    <th className="py-4 px-6">Room Title</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {paginatedAuctions.map((auc) => (
                    <tr key={auc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                          ID: {auc.id}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${auc.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                          {auc.status || 'active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-[10px] font-bold">
                        {auc.created_at ? new Date(auc.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          to={withServerParam(
                            auc.status === 'completed'
                              ? `/summary/${auc.id}`
                              : `/auction/${auc.id}`,
                            getAuctionServer(auc),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl transition-all ${
                            auc.status === 'completed'
                              ? 'text-emerald-400 hover:text-white bg-emerald-500/10 border border-emerald-500/20'
                              : 'text-blue-400 hover:text-white bg-blue-500/10 border border-blue-500/20'
                          }`}
                        >
                          {auc.status === 'completed' ? 'Summary' : 'View'} <ExternalLink className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => setDeleteTarget({ type: 'auction', id: auc.id, title: auc.title || auc.room_code })}
                          className="inline-flex items-center p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete Room Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auction Pagination Bar */}
          <PaginationControls
            currentPage={auctionPage}
            totalPages={totalAuctionPages}
            totalItems={filteredAuctions.length}
            itemsPerPage={auctionsPerPage}
            onPageChange={setAuctionPage}
            label="auctions"
          />
        </>
      )}
    </motion.div>
  );
};

export default AuctionsTab;
