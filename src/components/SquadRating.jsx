import React, { useMemo } from 'react';
import { Users, Star } from 'lucide-react';
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
      const squadArr = Array.isArray(squad) ? squad : (squad ? Object.values(squad) : []);

      let totalRating = 0;
      const normalizedPlayers = squadArr.map(p => typeof p === 'string' ? p : (p?.id || p));

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
            className={`w-full flex flex-row items-center justify-between p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] bg-[#0c0d10] border transition-all duration-300 relative overflow-hidden group gap-2 sm:gap-4 ${
              team.isDisqualified 
                ? 'border-red-900/30 opacity-70 grayscale-[0.5]' 
                : idx === 0 
                  ? 'border-white/20 bg-white/[0.04] shadow-2xl' 
                  : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
            }`}
          >
            {/* Massive Background Logo */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 sm:w-64 sm:h-64 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none ${team.isDisqualified ? 'grayscale' : 'grayscale'}`}>
              {team.teamLogo && <img src={team.teamLogo} alt={`${team.teamName} Watermark Logo`} className="w-full h-full object-contain" />}
            </div>
            
            <div className="flex items-center gap-2.5 sm:gap-5 relative z-10 min-w-0">
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-xl shrink-0 relative ${team.isDisqualified ? 'bg-red-950/20 border-red-900/30' : ''}`}>
                {!team.isDisqualified && idx === 0 && <Star className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.4)]" />}
                {team.teamLogo ? (
                  <img src={team.teamLogo} alt={team.teamName} className={`w-full h-full object-contain ${team.isDisqualified ? 'opacity-50' : ''}`} />
                ) : (
                  <Users className="w-full h-full text-gray-500 p-1" />
                )}
              </div>
              
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-slate-400 font-bold text-xs sm:text-sm shrink-0">#{idx + 1}</span>
                  <h3 className={`text-sm sm:text-xl font-black uppercase tracking-tight transition-colors truncate ${team.isDisqualified ? 'text-gray-500' : 'text-white group-hover:text-slate-200'}`}>{team.teamName}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-[7px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.3em] leading-none truncate ${team.isDisqualified ? 'text-red-500' : 'text-slate-400'}`}>{team.playerCount} / {minPlayers} Players</p>
                  {team.isDisqualified && (
                    <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded text-[6px] sm:text-[8px] font-black uppercase tracking-widest shrink-0">Disqualified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end justify-center relative z-10 shrink-0 pl-2 sm:pl-4">
              <span className={`block text-[7px] sm:text-[8px] font-black uppercase tracking-widest mb-0.5 ${team.isDisqualified ? 'text-red-500' : 'text-slate-400'}`}>Avg Rating</span>
              <span className={`text-lg sm:text-2xl font-black leading-none ${team.isDisqualified ? 'text-red-600/50' : 'text-white'}`}>
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
