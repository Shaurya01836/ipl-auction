import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import {
  Trophy,
  Users,
  Home,
  ChevronDown,
  TrendingUp,
  Share2,
  Download,
  Wifi,
  History,
  LayoutGrid,
  Zap,
  BarChart3,
  CheckCircle2 as CheckIcon,
  Verified,
  AlertTriangle,
  Sword,
  Shield,
  Activity,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuctionSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAuction, roomTeams, loading, joinAuction } = useAuction();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('squads');
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [expandedPointsTeam, setExpandedPointsTeam] = useState(null);

  useEffect(() => {
    if (id && user?.uid) {
      const unsub = joinAuction(id, user.uid);
      return () => unsub();
    }
  }, [id, user?.uid, joinAuction]);

  // Derived Data
  const allSoldPlayers = useMemo(() => {
    return roomTeams.flatMap(rt => 
      (rt.squad || []).map(s => {
        const pid = typeof s === 'string' ? s : s.id;
        const bidVal = typeof s === 'string' ? 0 : s.bid;
        const teamInfo = TEAMS.find(t => t.id === rt.teamId);
        const pInfo = IPL_PLAYERS.find(p => p.id === pid);
        return { 
          ...pInfo, 
          bidVal, 
          teamName: teamInfo?.name, 
          teamId: rt.teamId, 
          teamColor: teamInfo?.color,
          teamTextColor: teamInfo?.textColor
        };
      })
    ).sort((a, b) => b.bidVal - a.bidVal);
  }, [roomTeams]);

  const topPlayers = allSoldPlayers.slice(0, 5);

  // AI Evaluation Logic (Gemini Engine Inspired)
  const teamRankings = useMemo(() => {
    return TEAMS.map(t => {
      const teamDoc = roomTeams.find(doc => doc.teamId === t.id);
      const manager = currentAuction?.players?.find(p => p.team === t.id);
      
      const squad = (teamDoc?.squad || []).map(s => {
        const pid = typeof s === 'string' ? s : s.id;
        const bid = typeof s === 'string' ? 0 : s.bid;
        return { ...IPL_PLAYERS.find(p => p.id === pid), bid };
      });

      if (squad.length === 0) {
        return { 
          ...t, 
          managerName: manager?.name || 'Manager',
          totalScore: 0, 
          isDisqualified: true, 
          playerCount: 0,
          insight: "Disqualified: Failed to meet the minimum requirement of 18 players.",
          stats: { batting: 0, bowling: 0, balance: 0, value: 0 } 
        };
      }

      // 1. Batting Score (Average of top 4 batters)
      const batters = squad.filter(p => p.role === 'Batsman' || p.role === 'Wicket-Keeper' || p.role === 'All-Rounder')
        .sort((a, b) => (b.stats?.sr || 0) - (a.stats?.sr || 0));
      const battingScore = (batters.slice(0, 4).reduce((acc, p) => {
        const srVal = p.stats?.sr || 120;
        const avgVal = p.stats?.avg || 25;
        return acc + (srVal / 1.5) + (avgVal * 0.8);
      }, 0) / 4) || 30;

      // 2. Bowling Score (Average of top 4 bowlers)
      const bowlers = squad.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder')
        .sort((a, b) => (b.stats?.wickets || 0) - (a.stats?.wickets || 0));
      const bowlingScore = (bowlers.slice(0, 4).reduce((acc, p) => {
        const econVal = p.stats?.econ || 8.5;
        const wktRate = (p.stats?.wickets / (p.stats?.matches || 50)) || 1;
        return acc + (100 / econVal) * 5 + (wktRate * 20);
      }, 0) / 4) || 30;

      // 3. Squad Balance (Bonus for covering all bases)
      const hasWK = squad.some(p => p.role === 'Wicket-Keeper');
      const hasAR = squad.some(p => p.role === 'All-Rounder');
      const roleCount = new Set(squad.map(p => p.role)).size;
      const overseasCount = squad.filter(p => p.country !== 'IND').length;
      const balanceBonus = (hasWK ? 15 : 0) + (hasAR ? 10 : 0) + (roleCount * 5) + (overseasCount >= 3 ? 10 : 0);

      // 4. Value/Efficiency (Base vs Bid)
      const totalBid = squad.reduce((acc, p) => acc + (p.bid || 0), 0);
      const totalBase = squad.reduce((acc, p) => acc + (p.basePrice || 0), 0);
      const valueScore = Math.max(0, 30 - (totalBid - totalBase));

      const totalScore = (battingScore * 0.45) + (bowlingScore * 0.4) + balanceBonus + valueScore;
      const playerCount = squad.length;
      const isDisqualified = playerCount < 18;

      // AI Insights
      let insight = "Balanced squad with good potential.";
      if (isDisqualified) insight = "Disqualified: Failed to meet the minimum requirement of 18 players.";
      else {
        if (battingScore > bowlingScore + 20) insight = "Explosive batting lineup! Capable of chasing any target.";
        if (bowlingScore > battingScore + 20) insight = "Powerhouse bowling units. Defending low totals is their specialty.";
        if (balanceBonus > 45) insight = "Clinical squad building. Masterclass in role-specific recruitment.";
        if (valueScore > 25) insight = "Masters of the auction. Found incredible value in every signing.";
        if (overseasCount > 4) insight = "Heavy reliance on international stars. High-risk, high-reward.";
      }

      return {
        ...t,
        managerName: manager?.name || 'Manager',
        totalScore: isDisqualified ? 0 : Math.round(totalScore),
        isDisqualified,
        playerCount,
        insight,
        stats: {
          batting: Math.min(100, Math.round(battingScore)),
          bowling: Math.min(100, Math.round(bowlingScore)),
          balance: Math.min(100, Math.round(balanceBonus * 2)),
          value: Math.min(100, Math.round(valueScore * 3.3))
        }
      };
    }).sort((a, b) => {
      // Sort disqualified teams to the bottom
      if (a.isDisqualified && !b.isDisqualified) return 1;
      if (!a.isDisqualified && b.isDisqualified) return -1;
      // Then sort by total score
      return b.totalScore - a.totalScore;
    });
  }, [roomTeams, currentAuction]);

  if (loading || !currentAuction) {
    return (
      <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-8" />
        <h2 className="text-2xl font-black italic tracking-widest uppercase animate-pulse text-gray-400">Loading Summary...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-orange-500 selection:text-black">
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-600/20 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8"
        >
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <div className="bg-orange-600 text-white px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,85,0,0.4)]">
                2026 Season
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none">ID:</span>
                <span className="text-orange-500 font-extrabold tracking-widest text-sm">{id}</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none drop-shadow-2xl">
              Auction <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] to-[#ff8c00]">Complete</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white text-gray-400 hover:text-black font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95"
            >
              <Home size={18} /> Menu
            </button>
            <button className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_40px_rgba(255,85,0,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
              <Download size={18} /> Export Results
            </button>
          </div>
        </motion.header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 backdrop-blur-3xl p-1.5 rounded-[2rem] border border-white/10 flex gap-2">
            {[
              { id: 'squads', label: 'Team Squads', icon: Users },
              { id: 'leaderboard', label: 'Top Expensive', icon: Trophy },
              { id: 'points', label: 'Points Table', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 md:px-10 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-3 ${
                  activeTab === tab.id 
                    ? 'bg-[#ff5500] text-white shadow-2xl' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.section
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center gap-6 mb-10">
                <div className="w-12 h-12 bg-[#ff5500] rounded-2xl flex items-center justify-center text-white shadow-2xl">
                    <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Leaderboard</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">The Most Expensive Signings</p>
                </div>
              </div>

              <div className="space-y-4">
                {topPlayers.map((player, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={player.id}
                    className="group relative bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] transition-all hover:bg-white/5 hover:border-orange-500/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-8">
                      <span className="text-5xl font-black italic text-white/5 group-hover:text-orange-500/10 transition-colors">#{idx + 1}</span>
                      <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 p-2">
                        <img src={player.image} className="w-full h-full object-cover filter drop-shadow-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none">{player.name}</h3>
                          {player.country !== 'IND' && <Wifi size={14} className="text-purple-400 rotate-90" />}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${player.teamColor} ${player.teamTextColor}`}>
                            {player.teamId}
                          </div>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            {player.role} • {player.teamName}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black italic text-[#ff5500] tracking-tighter mb-1">
                        ₹{player.bidVal.toFixed(2)}<span className="text-xs ml-1 font-bold not-italic">Cr</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Winning Bid</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ) : activeTab === 'points' ? (
            <motion.section
              key="points"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              {/* AI Badge */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-blue-600/5 border border-blue-500/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap size={120} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                    <Zap size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Draft Power Rankings</h2>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      
                       Gemini AI Engine • Evaluation Complete
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {teamRankings.map((team, idx) => {
                  if (team.playerCount === 0 && !team.isDisqualified) return null;
                  const isEx = expandedPointsTeam === team.id;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={team.id}
                      className={`group relative bg-[#0c0c0c] border p-1 rounded-[2.5rem] transition-all overflow-hidden ${
                        team.isDisqualified ? 'border-red-500/20 opacity-90' : 'border-white/5 hover:border-blue-500/30'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedPointsTeam(isEx ? null : team.id)}
                        className="w-full text-left p-6 relative z-10"
                      >
                         {/* Rank Number */}
                         <div className="absolute -left-4 -top-6 text-9xl font-black italic text-white/[0.02] pointer-events-none group-hover:text-blue-500/[0.03] transition-colors">
                           #{idx + 1}
                         </div>

                         <div className="flex items-center justify-between gap-8 relative z-10">
                            {/* Team Info */}
                            <div className="flex items-center gap-6">
                              <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-2xl relative`}>
                                 <img src={team.logo} alt="" className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tight">{team.name}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">Managed by {team.managerName}</p>
                                   {team.isDisqualified && (
                                     <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase rounded border border-red-500/20">
                                       Disqualified
                                     </span>
                                   )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-8">
                               {/* Draft Score Indicator */}
                               <div className="text-right border-r border-white/5 pr-8">
                                  {team.isDisqualified ? (
                                    <AlertTriangle className="text-red-500" size={24} />
                                  ) : (
                                    <div className="flex flex-col items-center">
                                       <span className="text-3xl font-black italic text-blue-500 leading-none">{team.totalScore}</span>
                                       <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">SCORE</span>
                                    </div>
                                  )}
                               </div>

                               <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-all duration-500 ${isEx ? 'rotate-180 bg-blue-600 text-white shadow-lg' : 'text-gray-500 group-hover:text-white'}`}>
                                  <ChevronDown size={20} />
                               </div>
                            </div>
                         </div>
                      </button>

                      <AnimatePresence>
                        {isEx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/5 bg-white/[0.01]"
                          >
                            <div className="p-8 space-y-8">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Analysis Metrics */}
                                <div className="grid grid-cols-2 gap-4">
                                   {[
                                     { label: 'Batting', icon: Sword, val: team.stats.batting, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                     { label: 'Bowling', icon: Shield, val: team.stats.bowling, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                     { label: 'Balance', icon: Activity, val: team.stats.balance, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                                     { label: 'Value', icon: Coins, val: team.stats.value, color: 'text-green-500', bg: 'bg-green-500/10' }
                                   ].map(stat => (
                                     <div key={stat.label} className={`${stat.bg} p-4 rounded-3xl border border-white/5`}>
                                       <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-3">
                                             <div className={`p-1.5 rounded-lg bg-black/40`}>
                                                <stat.icon size={14} className={stat.color} />
                                             </div>
                                             <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{stat.label}</span>
                                          </div>
                                          <span className={`text-sm font-black italic ${stat.color}`}>{stat.val}%</span>
                                       </div>
                                       <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.val}%` }}
                                            transition={{ duration: 1 }}
                                            className={`h-full ${stat.color.replace('text-', 'bg-')}`}
                                          />
                                       </div>
                                     </div>
                                   ))}
                                </div>

                                {/* AI Context */}
                                <div className="flex flex-col justify-center gap-6">
                                   <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                         {team.isDisqualified ? (
                                           <AlertTriangle className="text-red-500" size={16} />
                                         ) : (
                                           <Verified className="text-green-500" size={16} />
                                         )}
                                         <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${team.isDisqualified ? 'text-red-500' : 'text-green-500'}`}>
                                            {team.isDisqualified ? 'Security Audit Failed' : 'Elite Appraisal Status'}
                                         </span>
                                      </div>
                                      <p className="text-xl font-black italic leading-tight text-white/90">
                                         &ldquo;{team.insight}&rdquo;
                                      </p>
                                   </div>

                                   <div className="flex gap-4">
                                      <div className="flex-1 bg-white/5 border border-white/5 p-4 rounded-2xl">
                                         <span className="block text-[8px] font-black text-gray-500 uppercase mb-1">Squad Size</span>
                                         <span className={`text-lg font-black italic ${team.playerCount < 16 ? 'text-red-500' : 'text-white'}`}>{team.playerCount}/25</span>
                                      </div>
                                      <div className="flex-1 bg-white/5 border border-white/5 p-4 rounded-2xl">
                                         <span className="block text-[8px] font-black text-gray-500 uppercase mb-1">Status</span>
                                         <span className={`text-lg font-black italic ${team.isDisqualified ? 'text-red-500' : 'text-green-500'}`}>
                                            {team.isDisqualified ? 'Disqualified' : 'Qualified'}
                                         </span>
                                      </div>
                                   </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="squads"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-5xl mx-auto space-y-4"
            >
              {TEAMS.map((t, idx) => {
                const teamDoc = roomTeams.find(doc => doc.teamId === t.id);
                const manager = currentAuction?.players?.find(p => p.team === t.id);
                const isExpanded = expandedTeam === t.id;
                
                const squad = (teamDoc?.squad || []).map(s => {
                  const pid = typeof s === 'string' ? s : s.id;
                  const bid = typeof s === 'string' ? 0 : s.bid;
                  return { ...IPL_PLAYERS.find(p => p.id === pid), bid };
                });

                if (squad.length === 0) return null;

                const osCount = squad.filter(p => p.country !== 'IND').length;
                const totalSpent = 120 - (teamDoc?.budgetRemaining || 120);

                return (
                  <div key={t.id} className="group flex flex-col gap-2">
                    {/* Team Bar */}
                    <button
                      onClick={() => setExpandedTeam(isExpanded ? null : t.id)}
                      className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] bg-[#0c0c0c] border transition-all duration-500 relative overflow-hidden group ${
                        isExpanded ? 'border-orange-500/50 bg-white/5 shadow-2xl' : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Massive Background Logo for Style */}
                      <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none grayscale">
                         <img src={t.logo} alt="" className="w-full h-full object-contain" />
                      </div>

                      <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-2xl relative`}>
                           <img src={t.logo} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter group-hover:text-orange-500 transition-colors uppercase">{t.name}</h3>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] leading-none mt-1">Managed by {manager?.name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        {/* Summary Stats */}
                        <div className="hidden md:flex gap-12 text-right border-r border-white/5 pr-12 h-10 items-center">
                          <div>
                            <span className="block text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Players</span>
                            <span className="text-lg font-black italic">{squad.length}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black text-purple-500 uppercase tracking-widest mb-0.5">Overseas</span>
                            <span className="text-lg font-black italic">{osCount}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Spent</span>
                            <span className="text-lg font-black italic">₹{totalSpent.toFixed(1)}Cr</span>
                          </div>
                        </div>

                        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-orange-600 text-white' : 'text-gray-500'}`}>
                          <ChevronDown size={24} />
                        </div>
                      </div>
                    </button>

                    {/* Squad Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden px-4 md:px-8 mb-4"
                        >
                          <div className="bg-white/[0.02] border-x border-b border-white/5 rounded-b-[3rem] p-8 space-y-12">
                            {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                              const rolePlayers = squad.filter(p => p.role === role);
                              if (rolePlayers.length === 0) return null;

                              return (
                                <div key={role} className="space-y-6">
                                  <div className="flex items-center gap-4">
                                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">{role}s</h4>
                                    <div className="flex-1 h-px bg-orange-500/20" />
                                    <span className="text-[10px] font-black text-gray-700 italic">{rolePlayers.length} Members</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rolePlayers.map((p, pidx) => (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: pidx * 0.05 }}
                                        key={p.id} 
                                        className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center justify-between group/p hover:bg-white/10 transition-all"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-xl p-1 shrink-0 overflow-hidden">
                                            <img src={p.image} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="overflow-hidden">
                                            <h5 className="text-[12px] font-black uppercase tracking-tight truncate max-w-[120px]">{p.name}</h5>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{p.type}</span>
                                              {p.country !== 'IND' && <Wifi size={10} className="text-purple-400 rotate-90" />}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-[14px] font-black italic text-green-500">₹{p.bid.toFixed(2)}Cr</div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Summary Footer for Team */}
                            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
                               <div className="flex items-center gap-4">
                                  <LayoutGrid size={16} className="text-gray-600" />
                                  <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.5em]">Composition Verified by Arena Engine</p>
                               </div>
                               <div className="flex gap-4">
                                  <button className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-700 hover:text-orange-500 transition-colors">
                                     <Share2 size={12} /> Share Squad
                                  </button>
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Global Footer Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 flex flex-col items-center gap-8"
        >
          <div className="flex items-center gap-4 text-gray-800 text-[10px] font-black uppercase tracking-[0.5em]">
            <History size={14} /> End of Session
          </div>
          <button 
            onClick={() => navigate('/')}
            className="group relative px-16 py-6 bg-white text-black font-black uppercase text-sm tracking-[0.3em] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative flex items-center gap-4 group-hover:text-white transition-colors">
              <Home size={20} /> Exit to Main Menu
            </div>
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default AuctionSummary;
