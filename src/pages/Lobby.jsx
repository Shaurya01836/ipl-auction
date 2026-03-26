import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import {
  Loader2,
  Users,
  Crown,
  UserMinus,
  LogOut,
  Home,
  Gavel,
  ShieldAlert,
  Copy,
  Share2,
  MessageSquare,
  Settings as SettingsIcon,
  CheckCircle2,
  Rocket,
  AlertCircle,
  TrendingUp,
  Zap,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TEAMS } from '../data/teams';

const Lobby = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const { joinAuction, currentAuction, kickPlayer, updatePlayerTeam, updateRoomSettings, startAuction } = useAuction();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('players');
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSelectingTeam, setIsSelectingTeam] = useState(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const isAdmin = currentAuction?.hostId === user?.uid;
  const players = currentAuction?.players || [];
  const currentUserPlayer = players.find(p => p.id === user?.uid);

  const teamAssignments = players.reduce((acc, p) => {
    acc[p.team] = p.name;
    return acc;
  }, {});

  useEffect(() => {
    if (id && user?.uid) {
      const unsub = joinAuction(id, user.uid);
      return () => unsub();
    }
  }, [id, user?.uid]);

  useEffect(() => {
    if (currentAuction?.status === 'active') {
      navigate(`/auction/${id}`);
    }
  }, [currentAuction?.status, id, navigate]);

  const handleStartAuction = async () => {
    if (isAdmin) {
      setIsStarting(true);
      try {
        await startAuction(id);
        navigate(`/auction/${id}`);
      } catch (error) {
        setIsStarting(false);
        console.error("Failed to start auction:", error);
      }
    }
  };

  const handleKickPlayer = async (playerObj) => {
    if (isAdmin) await kickPlayer(id, playerObj);
  };

  const handleTeamSelect = async (teamId) => {
    if (teamAssignments[teamId] && teamId !== currentUserPlayer?.team) return;
    setIsSelectingTeam(teamId);
    try {
      await updatePlayerTeam(id, user.uid, teamId);
    } finally {
      setIsSelectingTeam(null);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Join my IPL Auction room! Code: ${id}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleUpdateBidTimer = async (seconds) => {
    if (!isAdmin) return;
    setIsUpdatingSettings(true);
    try {
      await updateRoomSettings(id, { 
        ...currentAuction.settings,
        bidTimer: seconds 
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center py-8 px-4 font-sans text-white overflow-x-hidden">
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Top Navigation */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-10 z-20 px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group flex items-center gap-2"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Exit Hub</span>
          </button>
          <button 
            onClick={logout}
            className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-2xl transition-all group flex items-center gap-2 text-gray-400 hover:text-red-400"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Logout</span>
          </button>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Room ID</span>
            <span className="text-xl font-black text-white  tracking-tighter">{id}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded leading-none uppercase">Live Engine</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
            </div>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Ready for Auction</p>
          </div>

          {isAdmin && (
            <button
              onClick={handleStartAuction}
              disabled={isStarting}
              className="relative overflow-hidden group px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(255,85,0,0.3)] disabled:opacity-50 transition-all active:scale-95"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center gap-2">
                {isStarting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />}
                <span>{isStarting ? 'Igniting...' : 'Start Auction'}</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Left Column: Management Hub */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Share Section */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 backdrop-blur-3xl shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
               <Zap size={14} className="text-orange-500" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Invite Crew Members</h3>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-500 font-medium truncate">
                {window.location.href}
              </div>
              <button onClick={copyLink} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 relative group/copy">
                {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} className="group-hover/copy:scale-110 transition-transform" />}
              </button>
              <button 
                onClick={shareWhatsApp} 
                className="p-3 bg-[#25D366]/5 hover:bg-[#25D366]/10 rounded-xl transition-all border border-[#25D366]/10 text-[#25D366] group/wa"
              >
                <MessageSquare size={18} className="group-hover/wa:scale-110 transition-transform" />
              </button>
            </div>
          </motion.section>

          {/* Franchise Selector */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 backdrop-blur-3xl shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <Star size={14} className="text-yellow-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Claim Franchise</h3>
              </div>
              {currentUserPlayer?.team && (
                <div className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded uppercase">Locked In</div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {TEAMS.map((team) => {
                const isTaken = teamAssignments[team.id];
                const isMine = currentUserPlayer?.team === team.id;

                return (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    disabled={!!isTaken && !isMine}
                    className={`relative group/team flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 border ${
                      isMine 
                        ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]' 
                        : isTaken 
                          ? 'border-white/5 opacity-30 grayscale cursor-not-allowed' 
                          : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {isMine && (
                      <motion.div layoutId="lobby-badge" className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center z-20 shadow-lg">
                        <CheckCircle2 size={10} className="text-black" />
                      </motion.div>
                    )}

                    <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 p-1.5 flex items-center justify-center mb-2 transition-all duration-300 ${isMine ? 'scale-110 border-yellow-400 shadow-lg' : 'group-hover/team:scale-110'}`}>
                      {isSelectingTeam === team.id ? <Loader2 size={14} className="animate-spin text-yellow-500" /> : <img src={team.logo} alt="" className="w-full h-full object-contain" />}
                    </div>
                    
                    <span className={`text-[8px] font-black uppercase text-center tracking-tighter truncate w-full ${isMine ? 'text-yellow-400' : isTaken ? 'text-gray-600' : 'text-gray-500'}`}>
                      {isTaken ? isTaken.split(' ')[0] : team.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        </div>

        {/* Right Column: Engagement Hub */}
        <div className="lg:col-span-7">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-full flex flex-col"
          >
            {/* Tabs Header */}
            <div className="flex bg-white/[0.02] p-2 gap-2">
              {[
                { id: 'players', icon: Users, label: `Crew` },
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'settings', icon: SettingsIcon, label: 'Configs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 flex flex-col items-center justify-center gap-1.5 transition-all rounded-2xl ${activeTab === tab.id
                      ? 'bg-white/5 text-yellow-500 border border-white/10 shadow-inner'
                      : 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.01]'
                    }`}
                >
                  <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{tab.id === 'players' ? `${tab.label} (${players.length})` : tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-8 flex-1 overflow-y-auto max-h-[300px]">
              <AnimatePresence mode="wait">
                {activeTab === 'players' && (
                  <motion.div 
                    key="p-list"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {players.map((player, idx) => {
                      const playerTeam = TEAMS.find(t => t.id === player.team);
                      return (
                        <motion.div
                          key={`${player.id}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.05 } }}
                          className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-4 rounded-2xl group transition-all hover:bg-white/[0.03] hover:border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden bg-white/5 p-1.5`}>
                              <div className="absolute inset-x-0 bottom-0 top-1/2 bg-black/5 pointer-events-none" />
                              {playerTeam ? (
                                <img src={playerTeam.logo} alt="" className="w-full h-full object-contain relative z-10" />
                              ) : (
                                <span className="text-gray-500 relative z-10 text-xs">?</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-sm text-white uppercase tracking-tight">{player.name}</p>
                                {player.isHost && <Crown size={14} className="text-yellow-500 fill-yellow-500 " />}
                                {player.id === user?.uid && <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 rounded text-gray-400">YOU</span>}
                              </div>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">
                                {playerTeam?.name || (player.team === '' ? 'CALIBRATING...' : player.team)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                               <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
                               <span className="text-[8px] font-black text-gray-800 uppercase tracking-tighter mt-1">Synced</span>
                            </div>
                            {isAdmin && !player.isHost && (
                              <button
                                onClick={() => handleKickPlayer(player)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <UserMinus size={18} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center mb-6">
                       <MessageSquare size={32} className="text-gray-700" />
                    </div>
                    <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Comms Offline</h4>
                    <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Chat engine deployment in next patch</p>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div 
                    key="config"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl">
                      <div className="flex items-center justify-between mb-8">
                         <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-2">Auction Bid Cycle</h4>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Duration of bidding window per player</p>
                         </div>
                         <div className="text-2xl font-black text-yellow-500 ">
                            {currentAuction?.settings?.bidTimer || 10}<span className="text-xs ml-1 font-bold not-italic text-gray-600">S</span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-3">
                         {[5, 10, 15, 20, 25].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleUpdateBidTimer(s)}
                              disabled={!isAdmin || isUpdatingSettings}
                              className={`py-3 rounded-xl border text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center gap-1 shadow-lg ${
                                currentAuction?.settings?.bidTimer === s
                                  ? 'bg-yellow-500 text-black border-yellow-500'
                                  : 'bg-white/5 border-white/5 text-gray-600 hover:border-white/20'
                              } disabled:opacity-50`}
                            >
                              {s}s
                              <TrendingUp size={10} className={currentAuction?.settings?.bidTimer === s ? 'text-black' : 'text-gray-800'} />
                            </button>
                         ))}
                      </div>
                    </div>

                    {!isAdmin && (
                      <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4 items-center">
                         <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                            <ShieldAlert size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">Restricted Control</p>
                            <p className="text-[10px] text-blue-200/50 font-medium">Only the Hub Host can calibrate auction engine parameters.</p>
                         </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>
      </div>

      <footer className="mt-auto py-12 flex flex-col items-center gap-6 z-10 ">
        <div className="h-px w-20 bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-2" />
        <div className="flex gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">
           <span className="hover:text-yellow-500 transition-colors">Fair Play</span>
           <span className="hover:text-orange-500 transition-colors">Stadium Engine</span>
           <span className="hover:text-blue-500 transition-colors">v2026.4</span>
        </div>
      </footer>
    </div>
  );
};

export default Lobby;