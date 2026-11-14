import React from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import PaginationControls from './PaginationControls';
import { getPlayerAvatar } from '../../lib/auctionDisplay';

const PLAYERS_PER_PAGE = 12;

const PlayersTab = ({
  allPlayers,
  playerSearch,
  setPlayerSearch,
  playerRoleFilter,
  setPlayerRoleFilter,
  playerSortBy,
  setPlayerSortBy,
  playerPage,
  setPlayerPage,
  setSelectedPlayer,
  getRatingBadgeStyle,
  getPlayerKeyStats,
}) => {
  // Apply Filters & Sorting
  let filtered = [...allPlayers];

  if (playerSearch.trim()) {
    const term = playerSearch.toLowerCase().trim();
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.country.toLowerCase().includes(term) ||
      (p.set && p.set.toLowerCase().includes(term))
    );
  }

  if (playerRoleFilter !== 'all') {
    if (playerRoleFilter === 'Batter') {
      filtered = filtered.filter((p) => p.role === 'Batter' || p.role === 'Batsman');
    } else {
      filtered = filtered.filter((p) => p.role === playerRoleFilter);
    }
  }

  // Sorting
  if (playerSortBy === 'rating_desc') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (playerSortBy === 'rating_asc') {
    filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  } else if (playerSortBy === 'price_desc') {
    filtered.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
  } else if (playerSortBy === 'price_asc') {
    filtered.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
  } else if (playerSortBy === 'matches_desc') {
    filtered.sort((a, b) => (b.stats?.matches || 0) - (a.stats?.matches || 0));
  } else if (playerSortBy === 'name_asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PLAYERS_PER_PAGE));
  const currentPlayers = filtered.slice(
    (playerPage - 1) * PLAYERS_PER_PAGE,
    playerPage * PLAYERS_PER_PAGE
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search & Filters */}
      <div className="bg-[#0c0d10] border border-white/10 rounded-[1.5rem] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Search by Player Name, Country, or Set..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 sm:py-2.5 flex items-center gap-2 w-full md:w-auto">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden xs:inline">Sort:</span>
              <select
                value={playerSortBy}
                onChange={(e) => setPlayerSortBy(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer pr-2 w-full"
              >
                <option value="default" className="bg-[#0c0d10] text-white">Default (Set Order)</option>
                <option value="rating_desc" className="bg-[#0c0d10] text-white">Rating: High to Low ★</option>
                <option value="rating_asc" className="bg-[#0c0d10] text-white">Rating: Low to High</option>
                <option value="price_desc" className="bg-[#0c0d10] text-white">Base Price: High to Low</option>
                <option value="price_asc" className="bg-[#0c0d10] text-white">Base Price: Low to High</option>
                <option value="matches_desc" className="bg-[#0c0d10] text-white">Matches: Most Played</option>
                <option value="name_asc" className="bg-[#0c0d10] text-white">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar py-1">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'Batter', label: 'Batters' },
            { id: 'Bowler', label: 'Bowlers' },
            { id: 'All-Rounder', label: 'All-Rounders' },
            { id: 'Wicket-Keeper', label: 'Wicket-Keepers' },
          ].map((roleItem) => (
            <button
              key={roleItem.id}
              onClick={() => setPlayerRoleFilter(roleItem.id)}
              className={`px-4 py-2 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${playerRoleFilter === roleItem.id
                ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.08)]'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
            >
              {roleItem.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#0c0d10] border border-white/10 rounded-[1.75rem] p-8 sm:p-12 text-center shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] space-y-2">
          <h3 className="font-pixel text-sm sm:text-base uppercase tracking-tight text-white">
            No Players Found
          </h3>
          <p className="text-xs text-slate-400 font-normal max-w-md mx-auto">
            We couldn't find any players matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentPlayers.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedPlayer(player)}
              className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-200 cursor-pointer group transform-gpu"
            >
              {/* Header row: Photo + Name + Role + Rating */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/8">
                  <img
                    src={player.image || getPlayerAvatar(player?.name)}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getPlayerAvatar(player?.name);
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-snug truncate" title={player.name}>
                    {player.name}
                  </p>
                  <p className="text-gray-500 text-[11px] font-medium mt-0.5 truncate">
                    {player.role} · {player.type}
                  </p>
                  <p className="text-gray-500 text-[10px] font-medium mt-0.5">
                    {player.country}
                  </p>
                </div>

                <div className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg border shrink-0 min-w-[42px] ${getRatingBadgeStyle(player.rating)}`}>
                  <span className="text-base font-black leading-none">{player.rating ?? '—'}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider opacity-60 mt-0.5">/ 100</span>
                </div>
              </div>

              {/* Stats row */}
              {player.stats && (
                <div className="grid grid-cols-4 gap-1">
                  {getPlayerKeyStats(player).map((st, i) => (
                    <div key={i} className="flex flex-col items-center py-1.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg border border-white/5">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{st.label}</span>
                      <span className={`text-[11px] font-black ${st.accent || 'text-gray-200'}`}>{st.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500 font-medium">
                <span>{player.stats?.matches ?? 0} matches</span>
                <span className="text-gray-600 truncate max-w-[120px]">{player.set}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <PaginationControls
        currentPage={playerPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={PLAYERS_PER_PAGE}
        onPageChange={setPlayerPage}
        label="players"
      />
    </motion.div>
  );
};

export default PlayersTab;
