import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { IPL_PLAYERS } from '../../data/players';
import { TEAMS } from '../../data/teams';
import SquadSelector from './SquadSelector';
import SquadPreview from './SquadPreview';

const FantasyDashboard = ({ auctionId, user, roomTeams = [], currentAuction }) => {
  const [activeSubTab, setActiveSubTab] = useState('squad');
  const [userSquad, setUserSquad] = useState(null);
  const [allSquads, setAllSquads] = useState([]);
  const [playerPoints, setPlayerPoints] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Current user's team doc from roomTeams
  const userTeamDoc = useMemo(() => {
    return roomTeams.find(rt => rt.userId === user?.uid);
  }, [roomTeams, user]);

  // Owned players for squad selection
  const ownedPlayers = useMemo(() => {
    if (!userTeamDoc || !userTeamDoc.squad) return [];
    return userTeamDoc.squad.map(s => {
      const pid = typeof s === 'string' ? s : s.id;
      const bidVal = typeof s === 'string' ? 0 : s.bid;
      const pInfo = IPL_PLAYERS.find(p => p.id === pid);
      return { ...pInfo, bid: bidVal, teamId: userTeamDoc.teamId };
    }).filter(p => !!p);
  }, [userTeamDoc]);


  const calculatedLeaderboard = useMemo(() => {
    const auctionPlayers = currentAuction?.players || [];

    return allSquads.map(squad => {
      const { userId, userName, teamId, players = [], captain, viceCaptain, impactPlayer } = squad;

      // Calculate total fantasy points
      let totalPoints = 0;
      players.forEach(pId => {
        const pts = Number(playerPoints[pId]) || 0;
        if (pId === captain) totalPoints += pts * 2;
        else if (pId === viceCaptain) totalPoints += pts * 1.5;
        else totalPoints += pts;
      });
      // Impact player points (only if not already in the playing XI)
      if (impactPlayer && !players.includes(impactPlayer)) {
        totalPoints += Number(playerPoints[impactPlayer]) || 0;
      }

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
        playerCount: players.length,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [allSquads, playerPoints, currentAuction, user]);

 
  useEffect(() => {
    if (!auctionId || !user?.uid) return;

    // 1. Current user's own squad (for the editor)
    const squadRef = doc(db, 'userSquads', `${auctionId}_${user.uid}`);
    const unsubMySquad = onSnapshot(squadRef, (snap) => {
      if (snap.exists()) {
        setUserSquad(snap.data());
        if (!isEditing) setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    });

    // 2. ALL squads in this auction room (for leaderboard calculation)
    const squadsRef = collection(db, 'userSquads');
    const qSquads = query(squadsRef, where('auctionId', '==', auctionId));
    const unsubAllSquads = onSnapshot(qSquads, (snap) => {
      setAllSquads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Player points from Firestore (single doc: fantasyConfig/playerPoints)
    //    Structure: { playerId1: 120, playerId2: 85, ... }
    const ppRef = doc(db, 'fantasyConfig', 'playerPoints');
    const unsubPP = onSnapshot(ppRef, (snap) => {
      if (snap.exists()) {
        setPlayerPoints(snap.data());
      }
    });

    return () => {
      unsubMySquad();
      unsubAllSquads();
      unsubPP();
    };
  }, [auctionId, user]);

  // Save squad handler
  const handleSaveSquad = async (squadData) => {
    if (!user?.uid || !auctionId) return;
    setIsSaving(true);
    try {
      const squadRef = doc(db, 'userSquads', `${auctionId}_${user.uid}`);
      await setDoc(squadRef, {
        userId: user.uid,
        userName: user.displayName || 'Manager',
        teamId: userTeamDoc?.teamId || 'N/A',
        auctionId,
        ...squadData
      }, { merge: true });
      setIsEditing(false);
    } catch (err) {
      alert("Error saving squad.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Sub Tabs */}
      <div className="flex justify-start gap-4 border-b border-white/5 pb-6">
        {[
          { id: 'squad', label: 'My Fantasy XI', icon: Users },
          { id: 'leaderboard', label: 'Point Leaderboard', icon: Trophy }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 ${
              activeSubTab === tab.id 
                ? 'bg-orange-600 text-white shadow-lg' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
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
              <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[2.5rem] text-center">
                 <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                 <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2 italic">No Team Assigned</h2>
                 <p className="text-sm text-gray-500">You must be part of a franchise to participate in fantasy selections.</p>
              </div>
            ) : isEditing ? (
              <SquadSelector 
                ownedPlayers={ownedPlayers} 
                currentSquad={userSquad}
                onSave={handleSaveSquad}
              />
            ) : (
              <SquadPreview 
                ownedPlayers={ownedPlayers}
                currentSquad={userSquad}
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
            className="max-w-5xl mx-auto space-y-12 pb-32"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#ff5500] rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(255,85,0,0.4)]">
                   <Trophy size={32} />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter drop-shadow-2xl italic leading-none">Room <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] to-[#ff8c00]">Standings</span></h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2 ml-1">Live Fantasy Points Table</p>
                </div>
              </div>
            </div>

            {/* Points Table */}
            <div className="grid grid-cols-1 gap-4">
               {calculatedLeaderboard.length > 0 ? (
                 calculatedLeaderboard.map((entry, idx) => (
                   <motion.div
                     key={entry.userId || entry.id}
                     initial={{ x: -30, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: idx * 0.08 }}
                     className={`group relative bg-[#0c0c0c] border p-1 rounded-[2.5rem] transition-all overflow-hidden ${
                       entry.userId === user?.uid 
                       ? 'border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
                       : 'border-white/5 hover:border-blue-500/30'
                     }`}
                   >
                      <div className="p-6 sm:p-8 relative z-10">
                        {/* Huge Background Rank Number */}
                        <div className="absolute -left-4 -top-6 text-9xl italic font-black text-white/10 pointer-events-none group-hover:text-blue-500/[0.03] transition-colors leading-none select-none">
                           #{idx + 1}
                        </div>

                        <div className="flex items-center justify-between gap-8 relative z-10">
                          {/* Manager Identity & Team Logo */}
                          <div className="flex items-center gap-6 min-w-0 flex-1">
                             {/* Team Logo */}
                             <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-2xl relative transition-transform group-hover:scale-110 duration-500 shrink-0`}>
                                {entry.teamLogo ? (
                                  <img src={entry.teamLogo} alt={entry.teamId} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-xl font-black">{entry.userName?.[0]}</span>
                                )}
                             </div>
                             
                             <div className="min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                   <h3 className="text-2xl font-black uppercase tracking-tight italic truncate">
                                     {entry.userName}
                                   </h3>
                                   {entry.userId === user?.uid && (
                                     <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full shrink-0">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">YOU</span>
                                     </div>
                                   )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">{entry.teamName}</p>
                                </div>
                             </div>
                          </div>

                          {/* Point Score Dash */}
                          <div className="flex items-center gap-8">
                             <div className="text-right border-r border-white/5 pr-8">
                                <div className="flex flex-col items-center">
                                   <span className={`text-4xl font-black leading-none ${
                                     entry.totalPoints > 0 && idx < 3 ? 'text-[#ff5500] drop-shadow-[0_0_20px_rgba(255,85,0,0.3)]' : entry.totalPoints > 0 ? 'text-blue-500' : 'text-gray-700'
                                   }`}>
                                     {entry.totalPoints}
                                   </span>
                                   <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">
                                      {entry.totalPoints > 0 ? 'POINTS' : 'AWAITING'}
                                   </span>
                                </div>
                             </div>

                             {/* Rank Indicator Badge */}
                             {idx < 3 && entry.totalPoints > 0 ? (
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border ${
                                 idx === 0 ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500' :
                                 idx === 1 ? 'bg-gray-400/20 border-gray-400/30 text-gray-300' :
                                 'bg-orange-900/20 border-orange-800/30 text-orange-600'
                               }`}>
                                  <Trophy size={20} />
                               </div>
                             ) : (
                               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                                  <Trophy size={18} className="opacity-20" />
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
