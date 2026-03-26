import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { IPL_PLAYERS } from '../data/players';
import {
   Wallet,
   History,
   Star,
   AlertCircle,
   Timer,
   ChevronRight,
   TrendingUp,
   Share2,
   Copy,
   MessageSquare,
   Settings as SettingsIcon,
   Home,
   Volume2,
   Pause,
   XCircle,
   Rocket,
   Users,
   LayoutGrid,
   Heart,
   Wifi,
   List,
   CheckCircle2,
   PlayCircle,
   Filter,
   Search,
   ChevronDown,
   Play,
   Gavel,
   ShieldAlert,
   Trophy,
   Clock,
   X,
   LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TEAMS = [
   { id: 'MI', name: 'Mumbai Indians', color: 'bg-blue-600' },
   { id: 'CSK', name: 'Chennai Super Kings', color: 'bg-yellow-400 text-black' },
   { id: 'RCB', name: 'Royal Challengers Bengaluru', color: 'bg-red-600' },
   { id: 'KKR', name: 'Kolkata Knight Riders', color: 'bg-purple-800' },
   { id: 'DC', name: 'Delhi Capitals', color: 'bg-blue-500' },
   { id: 'PBKS', name: 'Punjab Kings', color: 'bg-red-500' },
   { id: 'RR', name: 'Rajasthan Royals', color: 'bg-pink-600' },
   { id: 'SRH', name: 'Sunrisers Hyderabad', color: 'bg-orange-500' },
   { id: 'GT', name: 'Gujarat Titans', color: 'bg-slate-700' },
   { id: 'LSG', name: 'Lucknow Super Giants', color: 'bg-pink-800' },
];

const AuctionRoom = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const {
      currentAuction,
      team,
      roomTeams,
      loading,
      placeBid,
      joinAuction,
      endPlayerAuction,
      pauseAuction,
      resumeAuction,
      endAuction,
      sendMessage,
      messages,
      updateRoomSettings,
      kickPlayer,
      getSyncedTime
   } = useAuction();
   const { user, logout } = useAuth();
   const [timeLeft, setTimeLeft] = useState(15);
   const [error, setError] = useState('');
   const [copied, setCopied] = useState(false);
   const [showPlayersOverlay, setShowPlayersOverlay] = useState(false);
   const [activeOverlayTab, setActiveOverlayTab] = useState('upcoming');
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedTeamId, setSelectedTeamId] = useState(null);
   const [mobileTab, setMobileTab] = useState('arena'); // arena, squad, activity
   const [showSettings, setShowSettings] = useState(false);
   const [summaryTab, setSummaryTab] = useState('squads'); // squads, leaderboard
   const [newTimerValue, setNewTimerValue] = useState(currentAuction?.settings?.bidTimer || 10);
   const [showParticipantsOverlay, setShowParticipantsOverlay] = useState(false);
   const audioRef = useRef(null);
   const celebrationAudioRef = useRef(null);

   const [optimisticState, setOptimisticState] = useState(null);

   // Clear optimistic state when DB catches up
   useEffect(() => {
      if (optimisticState && currentAuction?.currentAuction?.currentBid >= optimisticState.currentBid) {
         setOptimisticState(null);
      }
   }, [currentAuction?.currentAuction?.currentBid, optimisticState]);

   const displayAuctionState = optimisticState || currentAuction?.currentAuction;

   // Audio unlocker for mobile devices
   useEffect(() => {
      if (!celebrationAudioRef.current) {
         celebrationAudioRef.current = new Audio();
      }
      const unlockAudio = () => {
         if (celebrationAudioRef.current) {
            celebrationAudioRef.current.src = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
            celebrationAudioRef.current.play().then(() => {
               celebrationAudioRef.current.pause();
               celebrationAudioRef.current.currentTime = 0;
            }).catch(() => {});
         }
      };
      
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
      
      return () => {
         window.removeEventListener('click', unlockAudio);
         window.removeEventListener('touchstart', unlockAudio);
      };
   }, []);

   // Sync completion status
   useEffect(() => {
      if (currentAuction?.status === 'completed') {
         navigate(`/summary/${id}`);
      }
   }, [currentAuction?.status, id, navigate]);

   const TEAM_SONGS = {
      'csk': '/CSK.mpeg',
      'mi': '/MI.mpeg',
      'rcb': '/RCB.mpeg',
      'kkr': '/KKR.mpeg',
      'dc': '/DC.mpeg',
      'pbks': '/PBKS.mpeg',
      'rr': '/RR.mpeg',
      'srh': '/SRH.mpeg',
      'lsg': '/LSG.mpeg',
      'gt': '/GT.mpeg',
   };

   useEffect(() => {
      if (user) setSelectedTeamId(user.uid);
   }, [user]);


   const currentPlayer = useMemo(() => {
      return IPL_PLAYERS.find(p => p.id === displayAuctionState?.playerId) || IPL_PLAYERS[0];
   }, [displayAuctionState?.playerId]);

   const isAdmin = currentAuction?.hostId === user?.uid;
   const currentBid = displayAuctionState?.currentBid || 0;
   const increment = currentBid < 2 ? 0.1 : currentBid < 5 ? 0.25 : 0.5;
   const nextBidAmount = currentBid === 0 ? (currentPlayer?.basePrice || 0) : currentBid + increment;
   const playerCategories = useMemo(() => {
      const soldIds = new Set();
      const soldWithBids = {};
      roomTeams.forEach(t => {
         (t.squad || []).forEach(p => {
            soldIds.add(p.id);
            soldWithBids[p.id] = { bid: p.bid, teamId: t.teamId };
         });
      });

      const playerOrder = currentAuction?.playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
      const currentPlayerId = displayAuctionState?.playerId;
      const currentPlayerIndexInOrder = playerOrder.indexOf(IPL_PLAYERS.findIndex(p => p.id === currentPlayerId));

      const upcoming = [];
      const sold = [];
      const unsold = [];

      playerOrder.forEach((idx, i) => {
         const p = IPL_PLAYERS[idx];
         if (soldIds.has(p.id)) {
            sold.push({ ...p, ...soldWithBids[p.id] });
         } else if (i < currentPlayerIndexInOrder) {
            unsold.push(p);
         } else {
            upcoming.push(p);
         }
      });

      return { upcoming, sold, unsold };
   }, [currentAuction?.playerOrder, displayAuctionState?.playerId, roomTeams]);

   const filteredPlayers = useMemo(() => {
      let players = [];
      if (activeOverlayTab === 'upcoming') players = playerCategories.upcoming;
      else if (activeOverlayTab === 'sold') players = playerCategories.sold;
      else if (activeOverlayTab === 'unsold') players = playerCategories.unsold;
      else if (activeOverlayTab === 'leaderboard') {
         players = [...playerCategories.sold].sort((a, b) => b.bid - a.bid);
      }

      return players.filter(p =>
         p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (p.set || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
   }, [activeOverlayTab, playerCategories, searchQuery]);

   useEffect(() => {
      if (!id || !user?.uid) return;
      const unsub = joinAuction(id, user.uid);
      return () => unsub();
   }, [id, user?.uid]);

   const playBeep = (freq = 440, duration = 0.1) => {
      try {
         const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
         const oscillator = audioCtx.createOscillator();
         const gainNode = audioCtx.createGain();

         oscillator.type = 'sine';
         oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
         gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
         gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

         oscillator.connect(gainNode);
         gainNode.connect(audioCtx.destination);

         oscillator.start();
         oscillator.stop(audioCtx.currentTime + duration);
      } catch (e) {
         console.warn('Audio context blocked or not supported');
      }
   };


   useEffect(() => {
      const status = displayAuctionState?.status;
      if (status === 'sold') {
         const teamId = displayAuctionState?.highBidderTeamId;
         if (teamId && TEAM_SONGS[teamId.toLowerCase()]) {
            const audio = celebrationAudioRef.current;
            if (audio) {
               audio.pause();
               audio.src = TEAM_SONGS[teamId.toLowerCase()];
               audio.volume = 0.4;
               audio.play().catch(e => console.warn("Autoplay blocked", e));
            }
         }
      } else if (status === 'unsold') {
         const unsoldAudios = [
            '/unsold1.mpeg',
            '/dun-dun-dun-sound-effect-brass_8nFBccR.mp3',
            '/gopgopgop.mp3',
            '/ny-video-online-audio-converter.mp3'
         ];
         const randomAudio = unsoldAudios[Math.floor(Math.random() * unsoldAudios.length)];
         const audio = celebrationAudioRef.current;
         if (audio) {
            audio.pause();
            audio.src = randomAudio;
            audio.volume = 0.5;
            audio.play().catch(e => console.warn("Autoplay blocked", e));
         }
      } else {
         const audio = celebrationAudioRef.current;
         if (audio) {
            audio.pause();
            audio.currentTime = 0;
         }
      }
   }, [displayAuctionState?.status, displayAuctionState?.highBidderTeamId]);



   const lastBeepedSecRef = useRef(-1);

   useEffect(() => {
      if (currentAuction?.status !== 'active' || !displayAuctionState?.timerEndsAt || displayAuctionState?.status !== 'bidding') {
         return;
      }

      // Reset beep tracking when timer resets (new bid / new player)
      lastBeepedSecRef.current = -1;

      const interval = setInterval(() => {
         const rawMs = displayAuctionState.timerEndsAt - getSyncedTime();
         // Use Math.ceil so the display shows "7" until it truly crosses below 7.000s.
         // This prevents the 7→6→7 flicker that Math.floor causes near boundaries.
         const diff = Math.max(0, Math.ceil(rawMs / 1000));

         // Beep only once per second crossing (prevents double-beep on re-renders)
         if (diff <= 5 && diff > 0 && diff !== lastBeepedSecRef.current) {
            lastBeepedSecRef.current = diff;
            playBeep(diff === 1 ? 880 : 440, 0.1);
         }

         setTimeLeft(diff);
         if (diff === 0) {
            clearInterval(interval);
            if (isAdmin && displayAuctionState.status === 'bidding') {
               endPlayerAuction(id);
            }
         }
      }, 200);

      return () => clearInterval(interval);
   }, [displayAuctionState?.timerEndsAt, displayAuctionState?.status, currentAuction?.status, isAdmin, id, endPlayerAuction, getSyncedTime]);

   const handleBid = async () => {
      if (displayAuctionState?.highBidderId === user?.uid) return;

      // Budget Guard
      if ((team?.budgetRemaining || 0) < nextBidAmount) {
         setError('Insufficient Budget');
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
         return;
      }

      // Squad Size Guard (Max 25)
      if ((team?.squad?.length || 0) >= 25) {
         setError('Squad Full (Max 25 Players)');
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
         return;
      }

      // Overseas Limit Check (Max 8)
      const isOverseas = currentPlayer?.country !== 'IND';
      if (isOverseas) {
         const overseasCount = team?.squad?.filter(s => {
            const pid = typeof s === 'string' ? s : s.id;
            const p = IPL_PLAYERS.find(pl => pl.id === pid);
            return p?.country !== 'IND';
         }).length || 0;

         if (overseasCount >= 8) {
            setError('Overseas Player Limit Reached (Max 8)');
            playBeep(220, 0.3); // Low error beep
            setTimeout(() => setError(''), 3000);
            return;
         }
      }

      playBeep(660, 0.1);
      setError('');
      
      setOptimisticState({
         ...displayAuctionState,
         currentBid: nextBidAmount,
         highBidderId: user?.uid,
         highBidderName: user?.displayName || 'Manager',
         highBidderTeamId: team?.teamId,
         timerEndsAt: getSyncedTime() + (currentAuction?.settings?.bidTimer || 10) * 1000
      });

      try {
         await placeBid(nextBidAmount);
      } catch (err) {
         setOptimisticState(null);
         setError(err.message);
         setTimeout(() => setError(''), 3000);
      }
   };

   const copyRoomId = () => {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   if (loading) {
      return (
         <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
            <div className="relative">
               <div className="w-24 h-24 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Gavel size={32} className="text-yellow-500 animate-pulse" />
               </div>
            </div>
            <h2 className="mt-8 text-2xl font-black italic tracking-widest uppercase animate-pulse text-gray-400">Syncing Auction Data...</h2>
            <p className="mt-2 text-gray-600 text-sm font-bold uppercase tracking-[0.3em]">Connecting to Mega Auction</p>
         </div>
      );
   }

   // Team Selection Guard
   if (!team && !loading && user) {
      return (
         <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full" />

            <div className="relative z-10 flex flex-col items-center max-w-lg">
               <div className="w-24 h-24 bg-red-500/20 border border-red-500/30 rounded-3xl flex items-center justify-center text-red-500 mb-8 shadow-2xl">
                  <ShieldAlert size={48} strokeWidth={2.5} />
               </div>
               <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-4">No Franchise Selected</h2>
               <p className="text-gray-400 text-lg font-medium mb-10 leading-relaxed">
                  You must be assigned to an IPL franchise to participate in the bidding. Please return to the lobby to select your team.
               </p>
               <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                     onClick={() => navigate(`/lobby/${id}`)}
                     className="flex-1 px-8 py-4 bg-[#ff8c00] text-white font-black rounded-2xl hover:bg-[#ff5500] transition-all active:scale-95 uppercase tracking-widest cursor-pointer shadow-[0_0_30px_rgba(255,140,0,0.3)] flex items-center justify-center gap-2"
                  >
                     <Users size={20} /> Go to Lobby
                  </button>
                  <button
                     onClick={() => navigate('/')}
                     className="flex-1 px-8 py-4 bg-white/5 border border-white/10 text-gray-400 font-black rounded-2xl hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest cursor-pointer"
                  >
                     Home
                  </button>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="h-screen bg-[#050505] text-white font-sans flex flex-col items-center overflow-hidden">
         <header className="w-full h-14 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Room:</span>
                  <span className="text-yellow-500 font-black tracking-widest">{id}</span>
               </div>
               <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-500">{currentAuction?.players?.length || 1}/10</span>
               </div>
               <div className="flex items-center gap-2 border-l border-white/10 pl-6 h-6">
                  <button onClick={copyRoomId} className="p-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                     {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-3">
               {isAdmin && (
                  <div className="flex items-center gap-2">
                     {displayAuctionState?.status === 'paused' ? (
                        <button
                           onClick={() => resumeAuction(id)}
                           className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all cursor-pointer"
                        >
                           <PlayCircle size={12} fill="currentColor" /> Resume
                        </button>
                     ) : (
                        <button
                           onClick={() => pauseAuction(id)}
                           className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all cursor-pointer"
                        >
                           <Pause size={12} fill="currentColor" /> Pause
                        </button>
                     )}
                     <button
                        onClick={() => endAuction(id)}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all cursor-pointer"
                     >
                        <XCircle size={12} fill="currentColor" /> End
                     </button>
                     <button
                        onClick={() => setShowParticipantsOverlay(true)}
                        className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all cursor-pointer"
                     >
                        <Users size={12} fill="currentColor" /> Participants
                     </button>
                     <button
                        onClick={() => setShowSettings(true)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showSettings ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-gray-400 border-white/5'}`}
                     >
                        <SettingsIcon size={16} />
                     </button>
                  </div>
               )}
               <div className="flex items-center gap-1.5 border-l border-white/10 pl-6 h-6">
                  <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 cursor-pointer"><Volume2 size={16} /></button>
                  <button onClick={() => navigate('/')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 cursor-pointer"><Home size={16} /></button>
                  <button onClick={logout} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 cursor-pointer transition-colors" title="Logout"><LogOut size={16} /></button>
               </div>
            </div>
         </header>

         <div className="w-full flex flex-col md:flex-row flex-1 overflow-hidden relative">
            <aside className={`${mobileTab === 'squad' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-black/40 border-r border-white/5 flex-col h-full md:max-h-[calc(100vh-3.5rem)]`}>
               <div className="p-6 border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-black border-4 border-black/10">
                        <Users size={20} />
                     </div>
                     <div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Auction Teams</span>
                        <h3 className="text-xl font-black text-blue-500 tracking-tight italic">{currentAuction?.players?.length || 0} Managers</h3>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {TEAMS.map((t, idx) => {
                     const manager = currentAuction?.players?.find(p => p.team === t.id);
                     const isMyTeam = manager?.id === user?.uid;
                     const isSelected = selectedTeamId === manager?.id || (selectedTeamId === t.id && !manager);
                     const teamDoc = roomTeams.find(doc => doc.teamId === t.id);

                     return (
                        <div key={idx} className="space-y-1">
                           <button
                              onClick={() => setSelectedTeamId(isSelected ? null : (manager?.id || t.id))}
                              className={`w-full text-left p-4 rounded-3xl border transition-all flex items-center justify-between group cursor-pointer ${isSelected ? 'bg-white/10 border-white/20 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${t.color} text-white`}>
                                    {t.id.substring(0, 2).toUpperCase()}
                                 </div>
                                 <div className="overflow-hidden">
                                    <h5 className="text-[11px] font-black truncate max-w-[120px]">{t.name}</h5>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${manager ? 'text-gray-400' : 'text-gray-600 italic'}`}>
                                       {manager ? `${manager.name} ${isMyTeam ? '(YOU)' : ''}` : 'Available'}
                                    </span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <span className={`text-[10px] font-black italic block leading-none ${manager ? 'text-green-500' : 'text-gray-700'}`}>
                                       ₹{(teamDoc?.budgetRemaining || 120.0).toFixed(1)} Cr
                                    </span>
                                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{teamDoc?.squad?.length || 0}/25</span>
                                 </div>
                                 <ChevronDown size={14} className={`text-gray-600 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} />
                              </div>
                           </button>

                           <AnimatePresence>
                              {isSelected && (
                                 <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden px-2 mb-4"
                                 >
                                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden mt-1 p-2 space-y-2">
                                       <div className="p-2 bg-white/5 rounded-lg flex items-center justify-between text-[9px] font-black uppercase tracking-tight">
                                          <div className="flex gap-3">
                                             <span className="text-gray-500">OS: <span className="text-white">{(teamDoc?.squad?.filter(s => {
                                                const pid = typeof s === 'string' ? s : s.id;
                                                return IPL_PLAYERS.find(pl => pl.id === pid)?.country !== 'IND';
                                             }).length || 0)}</span></span>
                                             <span className="text-gray-500">Spent: <span className="text-yellow-500">{(120 - (teamDoc?.budgetRemaining || 120)).toFixed(2)} Cr</span></span>
                                          </div>
                                       </div>

                                       {teamDoc?.squad?.length > 0 ? (
                                          <div className="space-y-3">
                                             {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                                                const squadWithDisplayData = teamDoc.squad.map(s => {
                                                   const pid = typeof s === 'string' ? s : s.id;
                                                   const bidVal = typeof s === 'string' ? null : s.bid;
                                                   const pInfo = IPL_PLAYERS.find(pl => pl.id === pid);
                                                   return { ...pInfo, bidVal };
                                                });

                                                const playersInRole = squadWithDisplayData.filter(p => p?.role === role);

                                                if (playersInRole.length === 0) return null;

                                                return (
                                                   <div key={role} className="space-y-1">
                                                      <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-lg mb-1">
                                                         <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{role}</span>
                                                         <span className="text-[8px] font-black text-blue-500">{playersInRole.length}</span>
                                                      </div>
                                                      {playersInRole.map((p, sidx) => (
                                                         <div key={sidx} className="bg-white/5 p-2 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                                            <div className="flex items-center gap-2">
                                                               <img src={p?.image} className="w-6 h-6 object-contain rounded-md" />
                                                               <div className="overflow-hidden">
                                                                  <h5 className="text-[10px] font-black whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{p?.name}</h5>
                                                                  <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{p?.role}</span>
                                                               </div>
                                                            </div>
                                                            <span className="text-[8px] font-black italic text-yellow-500">
                                                               ₹{p?.bidVal ? p.bidVal.toFixed(2) : (p?.basePrice || 0).toFixed(2)} Cr
                                                            </span>
                                                         </div>
                                                      ))}
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       ) : (
                                          <div className="py-4 text-center opacity-30 italic">
                                             <p className="text-[9px] font-black text-white/50 uppercase">No players joined yet</p>
                                          </div>
                                       )}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     );
                  })}
               </div>
            </aside>

            <main className={`${mobileTab === 'arena' ? 'flex' : 'hidden'} md:flex flex-1 overflow-y-auto p-4 md:p-8 flex-col items-center custom-scrollbar`}>
               <div className="w-full max-w-4xl flex flex-col gap-4 md:gap-6">
                  <AnimatePresence mode="wait">
                     {(displayAuctionState?.status === 'sold' || displayAuctionState?.status === 'unsold') ? (
                        <motion.div
                           key="celebration"
                           initial={{ opacity: 0, scale: 0.9, y: 20 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 1.1 }}
                           className={`w-full max-w-2xl mx-auto min-h-[400px] flex flex-col items-center justify-center rounded-[2.5rem] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/20 ${displayAuctionState.status === 'sold' ? (TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId)?.color || 'bg-green-500') : 'bg-red-950'}`}
                        >
                           {/* Confetti deleted for brevity during recovery */}
                           <div className="flex flex-col items-center text-center z-10 px-8 py-10 w-full bg-gradient-to-b from-white/10 to-transparent">
                              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative mb-6">
                                 <img src={currentPlayer.image} alt={currentPlayer.name} className="w-32 h-32 md:w-44 md:h-44 object-cover rounded-3xl border-4 border-white/30 shadow-2xl relative z-10" />
                              </motion.div>
                              <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-md">
                                 {currentPlayer.name}
                              </motion.h2>
                              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="text-6xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6">
                                 {displayAuctionState.status === 'sold' ? 'SOLD' : 'UNSOLD'}
                              </motion.div>
                              {displayAuctionState.status === 'sold' && (
                                 <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center gap-4 w-full">
                                    <div className="bg-black/40 backdrop-blur-xl px-10 py-3 rounded-full border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                                       <span className="text-4xl md:text-5xl font-black text-yellow-500 tracking-tight">₹{(displayAuctionState.currentBid || 0).toFixed(2)} Cr</span>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId)?.color || 'bg-gray-700'}`}>{displayAuctionState.highBidderTeamId}</div>
                                       <span className="text-lg md:text-xl font-black uppercase text-white tracking-widest">{TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId)?.name || 'Franchise'}</span>
                                    </div>
                                 </motion.div>
                              )}
                           </div>
                        </motion.div>
                     ) : (
                        <motion.div key="player-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex-col gap-4 md:gap-6 flex">
                           <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 px-2 md:px-4">
                              <div className="flex items-center gap-3 md:gap-4">
                                 <div className="px-2 py-0.5 md:px-3 md:py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                                    <span className="text-[8px] md:text-[9px] font-black text-yellow-500 uppercase tracking-widest italic">{currentPlayer.set}</span>
                                 </div>
                                 <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">Base Price:</span>
                                 <span className="text-lg md:text-xl font-black italic text-white">₹{currentPlayer.basePrice.toFixed(2)} Cr</span>
                              </div>
                              <div className="flex items-center gap-2 md:gap-3">
                                 <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">High Bidder:</span>
                                 <div className="bg-green-500/20 border border-green-500/30 px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                                    <span className="text-[9px] md:text-[10px] font-black text-green-400 uppercase tracking-widest italic">{displayAuctionState?.highBidderName}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="bg-[#111] border border-white/5 rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl relative min-h-[400px]">
                              <div className="absolute top-0 inset-x-0 h-1 bg-white/5">
                                 <motion.div initial={{ width: "100%" }} animate={{ width: `${(timeLeft / (currentAuction?.settings?.bidTimer || 10)) * 100}%` }} className={`h-full transition-colors duration-1000 ${timeLeft < 5 ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`} />
                              </div>
                              <div className="p-4 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                                 <div className="w-32 h-32 md:w-48 md:h-48 bg-gradient-to-b from-white/10 to-transparent rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 relative z-10">
                                    <img src={currentPlayer.image} alt={currentPlayer.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform" />
                                 </div>
                                 <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full text-center md:text-left">
                                    <div>
                                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 md:mb-4">
                                          <span className="bg-blue-600 border border-blue-400/30 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase italic tracking-widest">{currentPlayer.role}</span>
                                          <span className="bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase italic tracking-widest">{currentPlayer.type}</span>
                                       </div>
                                       <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight italic leading-none">{currentPlayer.name}</h2>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm">
                                       <div className="text-center group"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Matches</span><span className="text-2xl font-black italic">{currentPlayer.stats?.matches || 0}</span></div>
                                       {currentPlayer.stats?.runs !== undefined && (<div className="text-center border-l border-white/10"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Runs</span><span className="text-2xl font-black italic text-yellow-500">{currentPlayer.stats.runs}</span></div>)}
                                       {currentPlayer.stats?.sr !== undefined && (<div className="text-center border-l border-white/10"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">S.Rate</span><span className="text-2xl font-black italic">{currentPlayer.stats.sr}</span></div>)}
                                       {currentPlayer.stats?.wickets !== undefined && (<div className="text-center border-l border-white/10"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Wkts</span><span className="text-2xl font-black italic text-green-500">{currentPlayer.stats.wickets}</span></div>)}
                                    </div>
                                    <div className="flex items-center justify-between mt-2 md:mt-4">
                                       <div className="text-left">
                                          <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-0.5 md:mb-1">Current Bid</span>
                                          <div className="flex items-center gap-3">
                                             <span className="text-xl md:text-3xl font-black italic text-white leading-none">₹{(displayAuctionState?.currentBid || 0).toFixed(2)} Cr</span>
                                          </div>
                                       </div>
                                       <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-black border-4 border-black/10 shadow-2xl transition-all ${displayAuctionState?.status === 'sold' || displayAuctionState?.status === 'unsold' ? (displayAuctionState.status === 'sold' ? 'bg-green-500 scale-110' : 'bg-red-500 scale-110') : 'bg-yellow-500'}`}>
                                          <span className="text-xl md:text-3xl font-black leading-none uppercase tracking-tighter">{timeLeft}</span>
                                          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">SEC</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="bg-black/40 border-t border-white/5 p-3 md:p-5 flex gap-2 md:gap-4">
                                 <button onClick={handleBid} disabled={timeLeft === 0 || displayAuctionState?.status !== 'bidding' || displayAuctionState?.highBidderId === user?.uid} className={`flex-1 h-14 md:h-20 font-black text-lg md:text-2xl rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-4 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer shadow-[0_0_40px_rgba(34,197,94,0.3)] ${displayAuctionState?.highBidderId === user?.uid ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20' : 'bg-green-500 hover:bg-green-400 text-[#050505]'}`}>
                                    {displayAuctionState?.status === 'paused' ? 'PAUSED' : displayAuctionState?.highBidderId === user?.uid ? "LEADING BIDDER" : `PLACE BID: ₹${nextBidAmount.toFixed(2)} Cr`}
                                 </button>
                                 <button onClick={() => setShowPlayersOverlay(true)} className="w-14 h-14 md:w-20 md:h-20 bg-[#181818] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-gray-400"><List size={24} /></button>
                              </div>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </main>

            <aside className={`${mobileTab === 'activity' ? 'flex' : 'hidden'} md:flex w-full md:w-96 bg-black/40 border-l border-white/5 flex-col h-full md:max-h-[calc(100vh-3.5rem)]`}>
               <div className="p-6 border-b border-white/5 flex items-center justify-between"><h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Activity</h4><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /></div>
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                  {messages.filter(m => m.type === 'log').filter(m => !m.text.includes('New bid:')).map((msg, index) => (
                     <div key={`log-${msg.id || index}`} className="flex gap-3 items-start group">
                        <div className="mt-1 bg-white/5 p-1.5 rounded flex items-center justify-center text-gray-400"><MessageSquare size={14} /></div>
                        <div className="flex-1"><p className="text-[12px] font-medium leading-relaxed text-gray-400">{msg.text}</p></div>
                     </div>
                  ))}
               </div>
            </aside>
         </div>

         <div className="fixed bottom-0 inset-x-0 h-16 bg-[#111] border-t border-white/10 flex md:hidden z-50">
            <button onClick={() => setMobileTab('squad')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === 'squad' ? 'text-blue-500' : 'text-gray-500'}`}><Users size={18} /><span className="text-[9px] font-black uppercase tracking-widest">Squads</span></button>
            <button onClick={() => setMobileTab('arena')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === 'arena' ? 'text-yellow-500' : 'text-gray-500'}`}><div className={`p-2 rounded-full -mt-8 ${mobileTab === 'arena' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'bg-[#222] text-gray-500'}`}><Gavel size={24} /></div><span className="text-[9px] font-black uppercase tracking-widest mt-1">Arena</span></button>
            <button onClick={() => setMobileTab('activity')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${mobileTab === 'activity' ? 'text-green-500' : 'text-gray-500'}`}><History size={18} /><span className="text-[9px] font-black uppercase tracking-widest">Logs</span></button>
         </div>

         <AnimatePresence>
            {showPlayersOverlay && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-4 md:p-8 flex flex-col items-center">
                  <div className="w-full max-w-7xl flex flex-col gap-6 h-full">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black"><LayoutGrid size={24} /></div>
                           <div><h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Mega Auction Roster</h2><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Complete Player Inventory</p></div>
                        </div>
                        <button onClick={() => setShowPlayersOverlay(false)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
                     </div>
                     <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
                        {['upcoming', 'sold', 'unsold', 'leaderboard'].map(tab => (
                           <button key={tab} onClick={() => setActiveOverlayTab(tab)} className={`px-6 py-4 rounded-2xl transition-all uppercase text-sm font-black ${activeOverlayTab === tab ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{tab}</button>
                        ))}
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                           {filteredPlayers.map(p => (
                              <div key={p.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all group">
                                 <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:scale-105 transition-transform mx-auto">
                                    <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                 </div>
                                 <div className="text-center">
                                    <h5 className="text-[10px] md:text-xs font-black truncate mb-0.5">{p.name}</h5>
                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase italic block mb-2">{p.role}</span>
                                    <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5"><span className="text-[10px] font-black text-yellow-500">₹{p.basePrice.toFixed(2)} Cr</span></div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {error && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-20 md:bottom-12 bg-red-500/20 border border-red-500/50 p-4 md:p-6 rounded-3xl flex items-center gap-4 text-red-500 font-black z-[110]">
                  <AlertCircle size={16} /><span className="text-xs md:text-base">{error}</span>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {showSettings && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-20 right-6 z-[100] bg-[#181818] border border-white/10 p-6 rounded-[2rem] shadow-2xl w-80 backdrop-blur-3xl">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Auction Settings</h3><button onClick={() => setShowSettings(false)} className="hover:text-white transition-colors"><X size={16} /></button></div>
                  <div className="space-y-6">
                     <div><label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Player Bid Countdown</label><div className="flex items-center gap-4"><input type="range" min="5" max="60" value={newTimerValue} onChange={(e) => setNewTimerValue(parseInt(e.target.value))} className="flex-1 accent-blue-500" /><span className="text-2xl font-black italic w-12 text-center">{newTimerValue}s</span></div></div>
                     <button onClick={async () => { await updateRoomSettings(id, { ...currentAuction.settings, bidTimer: newTimerValue }); setShowSettings(false); }} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">Update Settings</button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {showParticipantsOverlay && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-4 md:p-8 flex flex-col items-center">
                  <div className="w-full max-w-2xl flex flex-col gap-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Users size={24} /></div>
                           <div><h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Active Participants</h2><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Manage Room Connectivity</p></div>
                        </div>
                        <button onClick={() => setShowParticipantsOverlay(false)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-500 transition-all"><X size={20} /></button>
                     </div>
                     <div className="space-y-3">
                        {(currentAuction.players || []).map((player) => (
                           <div key={player.id} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${TEAMS.find(t => t.id === player.team)?.color || 'bg-gray-700'}`}>{player.team}</div>
                                 <div><h5 className="text-sm font-black uppercase flex items-center gap-2">{player.name}{player.isHost && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[8px] rounded-md">HOST</span>}</h5><p className="text-[10px] font-bold text-gray-500 uppercase">{player.teamName}</p></div>
                              </div>
                              {!player.isHost && (
                                 <button onClick={async () => { if (window.confirm(`Are you sure you want to kick ${player.name}?`)) { await kickPlayer(id, player); } }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100">Kick Player</button>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default AuctionRoom;
