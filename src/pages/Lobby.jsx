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
  MessageSquare,
  Settings as SettingsIcon,
  CheckCircle2,
  Rocket,
  TrendingUp,
  Zap,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TEAMS } from '../data/teams';
import VoiceChat from '../components/VoiceChat';

const Lobby = () => {
  const { id } = useParams();
  const { user, loginWithGoogle, loginAsGuest, logout, loading: authLoading } = useAuth();
  const { joinAuction, currentAuction, kickPlayer, updatePlayerTeam, updateRoomSettings, startAuction, joinRoomDb } = useAuction();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('players');
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSelectingTeam, setIsSelectingTeam] = useState(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [banError, setBanError] = useState(null);

  const isAdmin = currentAuction?.hostId === user?.uid;
  const players = currentAuction?.players || [];
  
  const teamAssignments = players.reduce((acc, p) => {
    if (p.team) acc[p.team] = p.name;
    return acc;
  }, {});

  const currentUserPlayer = players.find(p => p.id === user?.uid);

  const isJoined = players.some(p => p.id === user?.uid);

  useEffect(() => {
    if (id && user?.uid) {
      const unsub = joinAuction(id, user.uid);
      
      // Auto-join record if not present
      const autoJoin = async () => {
        try {
          await joinRoomDb(id, user.uid, { name: user.displayName || 'Manager' });
        } catch (e) {
          console.error("Auto-join failed:", e);
          if (e.message.includes("kicked")) {
            setBanError(e.message);
          }
        }
      };
      autoJoin();

      return () => unsub();
    }
  }, [id, user?.uid, user?.displayName, joinAuction, joinRoomDb]);

  useEffect(() => {
    if (currentAuction?.status === 'active') {
      navigate(`/auction/${id}`, { replace: true });
    } else if (currentAuction?.status === 'completed') {
      navigate(`/summary/${id}`, { replace: true });
    }
  }, [currentAuction?.status, id, navigate]);

  useEffect(() => {
    if (currentAuction && user) {
      const isUserBanned = currentAuction.bannedPlayers?.includes(user.uid);
      if (isUserBanned) {
        setBanError("You have been kicked from this room and cannot rejoin.");
      }
    }
  }, [currentAuction, user]);

  if (currentAuction?.status === 'completed' || currentAuction?.status === 'active') return null;

  // ─── Handlers ───
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

  const handleGoogleSignIn = async () => {
    setIsUpdatingSettings(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleGuestSignIn = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setIsUpdatingSettings(true);
    try {
      await loginAsGuest(guestName);
    } catch (error) {
       console.error("Guest login failed:", error);
    } finally {
      setIsUpdatingSettings(false);
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

  // ─── Unauthenticated State: Show Login Gateway ───
  if (banError) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-primary text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[3.5rem] text-center backdrop-blur-3xl relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
           <div className="absolute bottom-0 left-0 p-8 w-32 h-32 bg-red-500/10 rounded-full -ml-16 -mb-16 blur-3xl" />
           
           <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-red-500/20 relative group">
              <ShieldAlert size={48} className="text-red-500 group-hover:scale-110 transition-transform duration-500" />
           </div>

           <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">BANNED FROM ROOM</h1>
           <p className="text-gray-400 font-bold text-sm leading-relaxed uppercase tracking-widest mb-10 opacity-70">
             {banError}
           </p>

           <button 
             onClick={() => navigate('/')}
             className="w-full py-6 bg-white text-black font-black uppercase tracking-widest rounded-[2rem] hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3"
           >
             <Home size={20} />
             BACK TO HOME
           </button>
        </motion.div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <BrandLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-12 px-4 font-sans text-white overflow-x-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-md bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 backdrop-blur-3xl shadow-2xl"
        >
          <div className="bg-[#0c0c0c] rounded-[2.2rem] p-8 border border-white/5 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 mb-6 shadow-2xl">
               <Gavel size={32} strokeWidth={2.5} />
            </div>

            <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Joining Arena</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Room ID: <span className="text-orange-500">{id}</span></p>

            {!isGuestMode ? (
              <div className="w-full space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isUpdatingSettings}
                  className="w-full h-14 bg-white text-black rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all font-black uppercase tracking-widest text-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingSettings ? <Loader2 size={18} className="animate-spin text-black" /> : (
                    <>
                      <svg viewBox="0 0 24 24" width="18" height="18" className="mr-1">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                  <span className="relative bg-[#0c0c0c] px-4 text-[9px] font-black text-gray-700 uppercase tracking-widest italic">Or enter as temporary guest</span>
                </div>

                <button
                  onClick={() => setIsGuestMode(true)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-black uppercase tracking-widest text-xs cursor-pointer active:scale-95"
                >
                  <Users size={18} /> Join as Guest
                </button>
              </div>
            ) : (
              <form onSubmit={handleGuestSignIn} className="w-full space-y-5">
                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Manager Identity</label>
                  <input 
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. THALA"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white font-black uppercase text-sm tracking-[0.2em] placeholder:text-gray-800 focus:outline-none focus:border-orange-500/50 transition-all"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingSettings || !guestName.trim()}
                  className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(255,85,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isUpdatingSettings ? <Loader2 size={18} className="animate-spin" /> : <span>Step into Hub</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setIsGuestMode(false)}
                  className="w-full text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-[0.4em] transition-colors"
                >
                  ← Use Google Account
                </button>
              </form>
            )}
          </div>
        </motion.div>
        
        <button onClick={() => navigate('/')} className="mt-8 text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-[0.4em] transition-all flex items-center gap-2">
           <Home size={14} /> Back to Base
        </button>
      </div>
    );
  }

  if (!isJoined || !currentUserPlayer?.team) {
    // ═══ TEAM SELECTION OVERLAY ═══
    return (
      <div className="relative min-h-screen bg-[#050505] flex flex-col items-center py-12 px-4 font-sans text-white overflow-x-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-4xl z-10"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Select Your Squad</h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.3em]">Choose a vacant franchise to enter the auction hub</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {TEAMS.map((team) => {
              const isTaken = teamAssignments[team.id];
              return (
                <button
                  key={team.id}
                  onClick={() => !isTaken && handleTeamSelect(team.id)}
                  disabled={!!isTaken}
                  className={`relative group/sel p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-4 ${
                    isTaken 
                      ? 'bg-white/[0.01] border-white/5 opacity-20 grayscale cursor-not-allowed' 
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 shadow-2xl'
                  }`}
                >
                  <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-2xl p-2 flex items-center justify-center">
                    {isSelectingTeam === team.id ? <Loader2 className="animate-spin text-orange-500" /> : <img src={team.logo} alt="" className="w-full h-full object-contain" />}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">{team.id}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1">{isTaken ? (isTaken.split(' ')[0]) : 'Available'}</p>
                  </div>
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="mx-auto mt-16 flex items-center gap-2 text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-[0.4em] transition-all"
          >
            ← Cancel & Exit
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Authenticated State ───
  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center py-8 px-4 font-sans text-white overflow-x-hidden">
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Top Navigation */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 mb-10 z-20 px-4">
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 sm:gap-4">
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

        <div className="flex items-center justify-center md:justify-end gap-4 w-full md:w-auto">
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

          {/* Session Rules Card */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-6">
               <ShieldAlert size={14} className="text-blue-500" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Battle Rules</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">Auction Mode</span>
                <span className="text-[11px] font-black text-white uppercase tracking-tight">
                  {currentAuction?.auctionType === 'sprint5' ? '5-Player Sprint' : 
                   currentAuction?.auctionType === 'sprint11' ? '11-Player Classic' : 
                   'Mega Auction'}
                </span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">Initial Budget</span>
                <span className="text-[11px] font-black text-yellow-500 uppercase tracking-tight">
                  ₹{currentAuction?.settings?.budget || 120}.0 Cr
                </span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">Squad Capacity</span>
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-tight">
                  {currentAuction?.squadLimit || 25} Players
                </span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-1">Overseas Quota</span>
                <span className="text-[11px] font-black text-purple-400 uppercase tracking-tight">
                  Max {currentAuction?.overseasLimit || 8}
                </span>
              </div>
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

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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

            <div className="p-8 flex-1 overflow-y-auto max-h-[600px]">
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
                               <div className={`w-1.5 h-1.5 rounded-full shadow-lg ${player.isOnline ? 'bg-green-500 shadow-green-500/50' : 'bg-gray-700'}`} />
                               <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${player.isOnline ? 'text-green-500' : 'text-gray-700'}`}>
                                 {player.isOnline ? 'Online' : 'Offline'}
                               </span>
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
                    className="flex flex-col h-full bg-[#111] rounded-3xl overflow-hidden"
                  >
                    <VoiceChat channel={id} />
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
           <span className="hover:text-yellow-500 transition-colors">Designed &</span>
           <span className="hover:text-orange-500 transition-colors">Developed By</span>
           <a href="https://shaurya-upadhyay.me" target="_blank" rel="noopener noreferrer"> 
              <span className="hover:text-blue-500 transition-colors">Shaurya Upadhyay</span>
           </a>
        </div>
      </footer>
    </div>
  );
};

export default Lobby;