import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, rtdb } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { ref, onValue, update as updateRtdb, set as setRtdb, get as getRtdb } from 'firebase/database';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useQuota } from '../../contexts/QuotaContext';

let cachedPlayerPoints = null;
let cachedPlayerStats = null;

import { IPL_PLAYERS } from '../../data/players';
import { TEAMS } from '../../data/teams';
import SquadSelector from './SquadSelector';
import SquadPreview from './SquadPreview';

const FantasyDashboard = ({ auctionId, user, roomTeams = [], currentAuction }) => {
  const [activeSubTab, setActiveSubTab] = useState('squad');
  const [userSquad, setUserSquad] = useState(null);
  const [allSquads, setAllSquads] = useState([]);
  const [playerPoints, setPlayerPoints] = useState({});
  const [playerStats, setPlayerStats] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Current user's team doc from roomTeams
  const userTeamDoc = useMemo(() => {
    if (!user?.uid) return null;
    return roomTeams.find(rt => 
      rt.userId === user.uid || 
      rt.id === `${auctionId}_${user.uid}` ||
      (currentAuction?.players || []).some(p => (p.uid === user.uid || p.id === user.uid) && p.team === rt.teamId)
    );
  }, [roomTeams, user, auctionId, currentAuction]);

  // Owned players for squad selection
  const ownedPlayers = useMemo(() => {
    if (!userTeamDoc || !userTeamDoc.squad) return [];
    return userTeamDoc.squad.map(s => {
      const pid = typeof s === 'string' ? s : (s?.id || s);
      const bidVal = typeof s === 'string' ? 0 : (s?.bid || 0);
      const pInfo = IPL_PLAYERS.find(p => p.id === pid);
      return pInfo ? { ...pInfo, bid: bidVal, teamId: userTeamDoc.teamId } : null;
    }).filter(p => !!p && !!p.id);
  }, [userTeamDoc]);


  const calculatedLeaderboard = useMemo(() => {
    const auctionPlayers = currentAuction?.players || [];

    return allSquads.map(squad => {
      const { userId, userName, teamId, players = [], captain, viceCaptain, impactPlayer } = squad;

      const normalizedPlayers = players.map(p => typeof p === 'string' ? p : (p?.id || p));
      const captainId = typeof captain === 'string' ? captain : (captain?.id || captain);
      const viceCaptainId = typeof viceCaptain === 'string' ? viceCaptain : (viceCaptain?.id || viceCaptain);
      const impactId = typeof impactPlayer === 'string' ? impactPlayer : (impactPlayer?.id || impactPlayer);

      // Calculate total fantasy points and total matches
      let totalPoints = 0;
      let totalMatches = 0;

      normalizedPlayers.forEach(pId => {
        const stats = playerStats[pId] || { totalPoints: 0, matches: 0 };
        const pts = stats.totalPoints || 0;
        const matches = stats.matches || 0;
        
        if (pId === captainId) totalPoints += pts * 2;
        else if (pId === viceCaptainId) totalPoints += pts * 1.5;
        else totalPoints += pts;

        totalMatches += matches;
      });

      // Impact player points
      if (impactId && !normalizedPlayers.includes(impactId)) {
        const stats = playerStats[impactId] || { totalPoints: 0, matches: 0 };
        totalPoints += stats.totalPoints || 0;
        totalMatches += stats.matches || 0;
      }

      // Calculate average
      const avgPoints = totalMatches > 0 ? (totalPoints / (normalizedPlayers.length + (impactId ? 1 : 0))) : 0;

      // Resolve manager name from multiple sources
      const auctionPlayer = auctionPlayers.find(p => p.uid === userId || p.team === teamId);
      const resolvedName = auctionPlayer?.name || userName || (userId === user?.uid ? (user.displayName || 'You') : 'Manager');

      // Resolve franchise info
      const teamInfo = TEAMS.find(t => t.id === teamId);

      return {
        userId,
        userName: resolvedName,
        teamId,
        teamName: teamInfo?.name || teamId,
        teamLogo: teamInfo?.logo || null,
        totalPoints: Math.round(totalPoints),
        avgPoints: Number(avgPoints.toFixed(1)),
        playerCount: normalizedPlayers.length,
      };
    }).sort((a, b) => b.avgPoints - a.avgPoints || b.totalPoints - a.totalPoints);
  }, [allSquads, playerStats, currentAuction, user]);

 
  const { handleFirebaseError } = useQuota();

  useEffect(() => {
    if (!auctionId || !user?.uid) return;

    // Legacy Scanner for squads saved previously in Firestore or alternative RTDB paths
    const scanLegacySquads = async () => {
      try {
        // 1. Check Firestore fantasySquads collection
        const q1 = query(collection(db, 'fantasySquads'), where('auctionId', '==', auctionId));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          const legacySquads = {};
          snap1.docs.forEach(docSnap => {
            const data = docSnap.data();
            const uId = data.userId || docSnap.id.replace(`${auctionId}_`, '');
            if (data.players?.length) {
              legacySquads[uId] = data;
              setRtdb(ref(rtdb, `auctions/${auctionId}/userSquads/${uId}`), data).catch(() => {});
            }
          });
          if (legacySquads[user.uid]) {
            setUserSquad(legacySquads[user.uid]);
            setIsEditing(false);
          }
          setAllSquads(Object.entries(legacySquads).map(([uid, squad]) => ({ id: `${auctionId}_${uid}`, ...squad })));
          return;
        }

        // 2. Check Firestore userSquads collection
        const q2 = query(collection(db, 'userSquads'), where('auctionId', '==', auctionId));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const legacySquads = {};
          snap2.docs.forEach(docSnap => {
            const data = docSnap.data();
            const uId = data.userId || docSnap.id.replace(`${auctionId}_`, '');
            if (data.players?.length) {
              legacySquads[uId] = data;
              setRtdb(ref(rtdb, `auctions/${auctionId}/userSquads/${uId}`), data).catch(() => {});
            }
          });
          if (legacySquads[user.uid]) {
            setUserSquad(legacySquads[user.uid]);
            setIsEditing(false);
          }
          setAllSquads(Object.entries(legacySquads).map(([uid, squad]) => ({ id: `${auctionId}_${uid}`, ...squad })));
          return;
        }

        // 3. Check legacy RTDB paths
        const legacyRtdbRef = ref(rtdb, `userSquads/${auctionId}`);
        const legacyRtdbSnap = await getRtdb(legacyRtdbRef);
        if (legacyRtdbSnap.exists()) {
          const val = legacyRtdbSnap.val();
          const legacySquads = {};
          Object.entries(val).forEach(([uId, squad]) => {
            if (squad?.players?.length) {
              legacySquads[uId] = squad;
              setRtdb(ref(rtdb, `auctions/${auctionId}/userSquads/${uId}`), squad).catch(() => {});
            }
          });
          if (legacySquads[user.uid]) {
            setUserSquad(legacySquads[user.uid]);
            setIsEditing(false);
          }
          setAllSquads(Object.entries(legacySquads).map(([uid, squad]) => ({ id: `${auctionId}_${uid}`, ...squad })));
        }
      } catch (e) {
        // Non-blocking legacy scan
      }
    };

    // 1. Current user's own squad & ALL squads in this room from Supabase
    const fetchSquadsFromSupabase = async () => {
      try {
        if (!supabase) return;
        const { data: sSquads } = await supabase.from('user_squads').select('*').eq('auction_id', auctionId);
        if (sSquads) {
          const squadsArr = sSquads.map(s => ({
            id: s.id || `${s.auction_id}_${s.user_id}`,
            userId: s.user_id,
            userName: s.user_name,
            teamId: s.team_id,
            auctionId: s.auction_id,
            players: s.players || [],
            captain: s.captain,
            viceCaptain: s.vice_captain,
            impactPlayer: s.impact_player
          }));
          setAllSquads(squadsArr);
          const mySq = squadsArr.find(s => s.userId === user.uid);
          if (mySq && mySq.players?.length > 0) {
            setUserSquad(mySq);
            setIsEditing(false);
          }
        }
      } catch (err) {}
    };

    fetchSquadsFromSupabase();

    // Subscribe to real-time changes on user_squads in Supabase
    let squadChannel = null;
    if (supabase) {
      squadChannel = supabase.channel(`public:user_squads:auction_id=eq.${auctionId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_squads', filter: `auction_id=eq.${auctionId}` }, () => {
          fetchSquadsFromSupabase();
        })
        .subscribe();
    }

    // 2. Player points & stats from Supabase fantasy_config table
    const fetchFantasyConfigFromSupabase = async () => {
      try {
        if (!supabase) return;
        const { data: fcData } = await supabase.from('fantasy_config').select('*');
        if (fcData) {
          const pointsRow = fcData.find(r => r.key === 'playerPoints' || r.id === 'playerPoints');
          const matchesRow = fcData.find(r => r.key === 'playerMatches' || r.id === 'playerMatches');
          const statsRow = fcData.find(r => r.key === 'playerStats' || r.id === 'playerStats');

          if (pointsRow?.data) setPlayerPoints(pointsRow.data);
          if (statsRow?.data) setPlayerStats(statsRow.data);
          else if (pointsRow?.data) setPlayerStats(pointsRow.data);
        }
      } catch (e) {}
    };

    fetchFantasyConfigFromSupabase();

    return () => {
      if (squadChannel) squadChannel.unsubscribe();
    };

  }, [auctionId, user, handleFirebaseError]);

  // Save squad handler (Stores directly to Supabase user_squads table)
  const handleSaveSquad = async (squadData) => {
    if (!user?.uid || !auctionId) return;
    setIsSaving(true);
    try {
      if (supabase) {
        await supabase.from('user_squads').upsert({
          id: `${auctionId}_${user.uid}`,
          auction_id: auctionId,
          user_id: user.uid,
          user_name: user.displayName || 'Manager',
          team_id: userTeamDoc?.teamId || 'N/A',
          players: squadData.players || []
        });
      }

      setUserSquad({
        userId: user.uid,
        userName: user.displayName || 'Manager',
        teamId: userTeamDoc?.teamId || 'N/A',
        auctionId,
        ...squadData
      });

      setIsEditing(false);
    } catch (err) {
      alert("Error saving squad to database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-12">
      {/* Sub Tabs */}
      <div className="grid grid-cols-2 sm:flex sm:justify-start gap-2 sm:gap-4 border-b border-white/5 pb-4 sm:pb-6">
        {[
          { id: 'squad', label: 'My Fantasy XI', icon: Users },
          { id: 'leaderboard', label: 'Point Leaderboard', icon: Trophy }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-3 touch-manipulation ${
              activeSubTab === tab.id 
                ? 'bg-orange-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white bg-white/5 sm:bg-transparent'
            }`}
          >
            <tab.icon size={14} className="shrink-0" /> <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'squad' ? (
          <motion.div
            key="squad-tab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
          >
            {!userTeamDoc ? (
              <div className="bg-red-500/10 border border-red-500/20 p-6 sm:p-12 rounded-2xl sm:rounded-[2.5rem] text-center">
                 <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
                 <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2 italic">No Team Assigned</h2>
                 <p className="text-xs sm:text-sm text-gray-400">You must be part of a franchise to participate in fantasy selections.</p>
              </div>
            ) : isEditing ? (
              <SquadSelector 
                ownedPlayers={ownedPlayers} 
                currentSquad={userSquad}
                playerStats={playerStats}
                onSave={handleSaveSquad}
              />
            ) : (
              <SquadPreview 
                ownedPlayers={ownedPlayers}
                currentSquad={userSquad}
                playerStats={playerStats}
                onEdit={() => setIsEditing(true)}
              />
            )}
          </motion.div>
        ) : activeSubTab === 'leaderboard' ? (
          <motion.div
            key="lb-tab"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="max-w-5xl mx-auto space-y-6 sm:space-y-12 pb-24 sm:pb-32"
          >
            {/* Header */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-12">
              <div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter drop-shadow-2xl italic leading-none">Room <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] to-[#ff8c00]">Standings</span></h2>
                <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-2">Live Fantasy Points Table</p>
              </div>
            </div>

            {/* Points Table */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
               {calculatedLeaderboard.length > 0 ? (
                 calculatedLeaderboard.map((entry, idx) => (
                   <motion.div
                     key={entry.userId || entry.id}
                     initial={{ x: -30, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: idx * 0.08 }}
                     className={`group relative bg-[#0c0c0c] border p-1 rounded-2xl sm:rounded-[2.5rem] transition-all overflow-hidden ${
                       entry.userId === user?.uid 
                       ? 'border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
                       : 'border-white/5 hover:border-blue-500/30'
                     }`}
                   >
                      <div className="p-4 sm:p-8 relative z-10">
                        {/* Background Rank Number */}
                        <div className="absolute -left-2 -top-4 text-7xl sm:text-9xl italic font-black text-white/5 pointer-events-none group-hover:text-blue-500/[0.03] transition-colors leading-none select-none">
                           #{idx + 1}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-8 relative z-10">
                          {/* Manager Identity & Team Logo */}
                          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                             {/* Team Logo */}
                             <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-2xl relative transition-transform group-hover:scale-110 duration-500 shrink-0">
                                {entry.teamLogo ? (
                                  <img src={entry.teamLogo} alt={entry.teamId} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-lg sm:text-xl font-black">{entry.userName?.[0]}</span>
                                )}
                             </div>
                             
                             <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                   <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight italic truncate">
                                     {entry.userName}
                                   </h3>
                                   {entry.userId === user?.uid && (
                                     <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full shrink-0">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">YOU</span>
                                     </div>
                                   )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                                   <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight truncate">{entry.teamName}</p>
                                </div>
                             </div>
                          </div>

                          {/* Point Score Dash */}
                         <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                           <div className="text-left sm:text-right sm:border-r border-white/5 sm:pr-8">
                              <div className="flex flex-col items-start sm:items-center">
                                 <span className={`text-2xl sm:text-4xl font-black leading-none ${
                                   entry.avgPoints > 0 && idx < 3 ? 'text-[#ff5500] drop-shadow-[0_0_20px_rgba(255,85,0,0.3)]' : entry.avgPoints > 0 ? 'text-blue-500' : 'text-gray-600'
                                 }`}>
                                   {entry.avgPoints}
                                 </span>
                                 <span className="text-[7px] sm:text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">
                                    {entry.avgPoints > 0 ? 'AVG POINTS' : 'AWAITING'}
                                 </span>
                              </div>
                           </div>

                           {/* Rank Indicator Badge */}
                           {idx < 3 && entry.avgPoints > 0 ? (
                             <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg border shrink-0 ${
                               idx === 0 ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500' :
                               idx === 1 ? 'bg-gray-400/20 border-gray-400/30 text-gray-300' :
                               'bg-orange-900/20 border-orange-800/30 text-orange-600'
                             }`}>
                                <Trophy size={18} className="sm:w-5 sm:h-5" />
                             </div>
                           ) : (
                             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors shrink-0">
                                <Trophy size={16} className="opacity-20 sm:w-4 sm:h-4" />
                             </div>
                           )}
                         </div>
                        </div>
                      </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="py-40 text-center bg-[#0c0c0c] rounded-[3rem] border border-white/5 opacity-50">
                    <BarChart3 size={64} className="mx-auto mb-6 text-gray-800" />
                    <p className="text-xs font-black uppercase tracking-[0.5em] text-gray-500">No squads submitted yet</p>
                 </div>
               )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default FantasyDashboard;
