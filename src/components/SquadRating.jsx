import React, { useMemo } from 'react';
import { Trophy, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';

const SquadRating = ({ roomTeams = [], currentAuction }) => {
  const minPlayers = useMemo(() => {
    const type = currentAuction?.auctionType || 'mega';
    if (type === 'mega') return 18;
    if (type === 'sprint11') return 11;
    if (type === 'sprint5') return 5;
    return currentAuction?.settings?.minPlayers || 18;
  }, [currentAuction]);

  const calculatedLeaderboard = useMemo(() => {
    return roomTeams.map(team => {
      const { userId, userName, teamId, squad = [] } = team;

      let totalRating = 0;
      const normalizedPlayers = squad.map(p => typeof p === 'string' ? p : (p?.id || p));

      normalizedPlayers.forEach(pId => {
        const playerInfo = IPL_PLAYERS.find(p => p.id === pId);
        if (playerInfo && playerInfo.rating) {
          totalRating += playerInfo.rating;
        }
      });

      const teamInfo = TEAMS.find(t => t.id === teamId);
      const isDisqualified = normalizedPlayers.length < minPlayers;

      return {
        userId,
        userName: userName || (teamInfo ? teamInfo.name : teamId),
        teamId,
        teamName: teamInfo?.name || teamId,
        teamLogo: teamInfo?.logo || null,
        avgRating: normalizedPlayers.length > 0 ? Number((totalRating / normalizedPlayers.length).toFixed(1)) : 0,
        playerCount: normalizedPlayers.length,
        isDisqualified
      };
    }).sort((a, b) => {
      if (a.isDisqualified !== b.isDisqualified) return a.isDisqualified ? 1 : -1;
      return b.avgRating - a.avgRating;
    });
  }, [roomTeams, minPlayers]);

  if (roomTeams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <Users className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-300">No Squads Yet</h3>
        <p className="text-gray-500 mt-2">Squad ratings will appear once franchises start buying players.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-3 mb-6 sm:mb-8 px-2 sm:px-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">Franchise Strength</h2>
          <p className="text-xs sm:text-sm text-gray-400">Full squad evaluation based on career impact ratings</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {calculatedLeaderboard.map((team, idx) => (
          <motion.div 
            key={team.teamId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`w-full flex flex-row items-center justify-between p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-[#0c0c0c] border transition-all duration-300 relative overflow-hidden group gap-2 sm:gap-4 ${
              team.isDisqualified 
                ? 'border-red-900/30 opacity-70 grayscale-[0.5]' 
                : idx === 0 
                  ? 'border-orange-500/50 shadow-2xl' 
                  : 'border-white/5 hover:border-white/10'
            }`}
          >
            {/* Massive Background Logo */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 sm:w-64 sm:h-64 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none ${team.isDisqualified ? 'grayscale' : 'grayscale'}`}>
              {team.teamLogo && <img src={team.teamLogo} alt={`${team.teamName} Watermark Logo`} className="w-full h-full object-contain" />}
            </div>
            
            <div className="flex items-center gap-2.5 sm:gap-6 relative z-10 min-w-0">
              <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-2xl shrink-0 relative ${team.isDisqualified ? 'bg-red-950/20 border-red-900/30' : ''}`}>
                {!team.isDisqualified && idx === 0 && <Star className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}
                {team.teamLogo ? (
                  <img src={team.teamLogo} alt={team.teamName} className={`w-full h-full object-contain ${team.isDisqualified ? 'opacity-50' : ''}`} />
                ) : (
                  <Users className="w-full h-full text-gray-500 p-1" />
                )}
              </div>
              
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-gray-400 font-bold text-xs sm:text-base shrink-0">#{idx + 1}</span>
                  <h3 className={`text-sm sm:text-2xl font-black uppercase tracking-tight sm:tracking-tighter transition-colors truncate ${team.isDisqualified ? 'text-gray-500' : 'text-white group-hover:text-orange-500'}`}>{team.teamName}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                  <p className={`text-[7px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.4em] leading-none truncate ${team.isDisqualified ? 'text-red-500' : 'text-gray-500'}`}>{team.playerCount} / {minPlayers} Players</p>
                  {team.isDisqualified && (
                    <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded text-[6px] sm:text-[8px] font-black uppercase tracking-widest shrink-0">Disqualified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end justify-center relative z-10 shrink-0 pl-2 sm:pl-4">
              <span className={`block text-[7px] sm:text-[8px] font-black uppercase tracking-widest mb-0.5 sm:mb-1 ${team.isDisqualified ? 'text-red-500' : 'text-orange-500'}`}>Avg Rating</span>
              <span className={`text-lg sm:text-3xl font-black leading-none ${team.isDisqualified ? 'text-red-600/50' : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-[#ff5500]'}`}>
                {team.avgRating}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SquadRating;
