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
   X
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
      updateRoomSettings
   } = useAuction();
   const { user } = useAuth();
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
   const [allTeams, setAllTeams] = useState({});
   const [newTimerValue, setNewTimerValue] = useState(currentAuction?.settings?.bidTimer || 10);
   const audioRef = useRef(null);
   const celebrationAudioRef = useRef(null);

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
      return IPL_PLAYERS.find(p => p.id === currentAuction?.currentAuction?.playerId) || IPL_PLAYERS[0];
   }, [currentAuction?.currentAuction?.playerId]);

   const isAdmin = currentAuction?.hostId === user?.uid;
   const currentBid = currentAuction?.currentAuction?.currentBid || 0;
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
      const currentPlayerId = currentAuction?.currentAuction?.playerId;
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
   }, [currentAuction?.playerOrder, currentAuction?.currentAuction?.playerId, roomTeams]);

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
      const status = currentAuction?.currentAuction?.status;
      if (status === 'sold') {
         const teamId = currentAuction?.currentAuction?.highBidderTeamId;
         if (teamId && TEAM_SONGS[teamId.toLowerCase()]) {
            if (celebrationAudioRef.current) {
               celebrationAudioRef.current.pause();
               celebrationAudioRef.current.currentTime = 0;
            }
            const audio = new Audio(TEAM_SONGS[teamId.toLowerCase()]);
            audio.volume = 0.4;
            audio.play().catch(e => console.warn("Autoplay blocked"));
            celebrationAudioRef.current = audio;
         }
      } else if (status === 'unsold') {
         const unsoldAudios = [
            '/unsold1.mpeg',
            '/dun-dun-dun-sound-effect-brass_8nFBccR.mp3',
            '/gopgopgop.mp3',
            '/ny-video-online-audio-converter.mp3'
         ];
         const randomAudio = unsoldAudios[Math.floor(Math.random() * unsoldAudios.length)];
         const audio = new Audio(randomAudio);
         audio.volume = 0.5;
         audio.play().catch(e => console.warn("Autoplay blocked"));
         celebrationAudioRef.current = audio;
      } else {
         if (celebrationAudioRef.current) {
            celebrationAudioRef.current.pause();
            celebrationAudioRef.current.currentTime = 0;
            celebrationAudioRef.current = null;
         }
      }
   }, [currentAuction?.currentAuction?.status]);



   useEffect(() => {
      if (!currentAuction?.currentAuction?.timerEndsAt || currentAuction.currentAuction.status !== 'bidding') return;

      const interval = setInterval(() => {
         const diff = Math.max(0, Math.floor((currentAuction.currentAuction.timerEndsAt - Date.now()) / 1000));

         if (diff !== timeLeft && diff <= 5 && diff > 0) {
            playBeep(diff === 1 ? 880 : 440, 0.1);
         }

         setTimeLeft(diff);
         if (diff === 0) {
            clearInterval(interval);
            if (isAdmin && currentAuction.currentAuction.status === 'bidding') {
               endPlayerAuction(id);
            }
         }
      }, 100);

      return () => clearInterval(interval);
   }, [currentAuction?.currentAuction?.timerEndsAt, currentAuction?.currentAuction?.status, timeLeft]);

   const handleBid = async () => {
      if (currentAuction?.currentAuction?.highBidderId === user?.uid) return;

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
      try {
         await placeBid(nextBidAmount);
      } catch (err) {
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

   if (currentAuction?.status === 'completed') {
      const allPlayersBought = roomTeams.flatMap(rt => 
         (rt.squad || []).map(s => {
            const pid = typeof s === 'string' ? s : s.id;
            const bidVal = typeof s === 'string' ? 0 : s.bid;
            const teamInfo = TEAMS.find(t => t.id === rt.teamId);
            const pInfo = IPL_PLAYERS.find(p => p.id === pid);
            return { ...pInfo, bidVal, teamName: teamInfo?.name, teamId: rt.teamId, teamColor: teamInfo?.color };
         })
      ).sort((a, b) => b.bidVal - a.bidVal).slice(0, 5);

      return (
         <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 flex flex-col items-center custom-scrollbar overflow-y-auto">
            <motion.div
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between mb-12 gap-6"
            >
               <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-1 drop-shadow-2xl">Auction Complete!</h1>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Room ID: <span className="text-yellow-500">{id}</span></p>
               </div>
               
               <div className="flex gap-2">
                  <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer"><Share2 size={18} /></button>
                  <button className="p-3 bg-green-500 text-black rounded-xl hover:bg-green-400 transition-all cursor-pointer"><Wifi size={18} /></button>
               </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="w-full max-w-4xl grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
               <button 
                  onClick={() => setSummaryTab('squads')}
                  className={`py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer border ${summaryTab === 'squads' ? 'bg-[#ffca28] text-black border-transparent shadow-[0_10px_30px_rgba(255,202,40,0.3)]' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
               >
                  <Users size={16} /> Squads
               </button>
               <button 
                  onClick={() => setSummaryTab('leaderboard')}
                  className={`py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer border ${summaryTab === 'leaderboard' ? 'bg-[#ffca28] text-black border-transparent shadow-[0_10px_30px_rgba(255,202,40,0.3)]' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
               >
                  <Trophy size={16} /> Leaderboard
               </button>
               <button className="py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <Heart size={16} /> Support
               </button>
               <button className="py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <MessageSquare size={16} /> Chat
               </button>
            </div>

            <AnimatePresence mode="wait">
               {summaryTab === 'leaderboard' ? (
                  <motion.div 
                     key="leaderboard"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="w-full max-w-4xl space-y-6"
                  >
                     <div className="flex items-center gap-4 mb-8">
                        <Trophy size={32} className="text-yellow-500" />
                        <h2 className="text-2xl font-black uppercase italic tracking-tight">Most Expensive Players</h2>
                        <div className="flex-1 h-px bg-white/10" />
                        <div className="flex gap-2">
                           <button className="p-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-all cursor-pointer"><Wifi size={14} /></button>
                           <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer">
                              <Share2 size={12} /> Save Image
                           </button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {allPlayersBought.map((player, idx) => (
                           <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              key={player.id}
                              className="bg-[#151515] border border-yellow-500/20 rounded-2xl p-5 flex items-center justify-between group hover:border-yellow-500/50 transition-all relative overflow-hidden"
                           >
                              <div className="absolute left-0 inset-y-0 w-1 bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
                              <div className="flex items-center gap-6">
                                 <span className="text-4xl font-black italic text-gray-800 group-hover:text-yellow-500/20 transition-colors w-12">{idx + 1}</span>
                                 <div className={`w-12 h-12 rounded-xl ${player.teamColor} flex items-center justify-center font-black text-sm text-white shadow-xl`}>
                                    {player.teamId}
                                 </div>
                                 <div>
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                       {player.name}
                                       {player.country !== 'IND' && <Wifi size={14} className="text-purple-400 rotate-90" />}
                                    </h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                       {player.role} • {player.teamName}
                                    </p>
                                 </div>
                              </div>
                              <span className="text-2xl font-black italic text-yellow-500">₹{player.bidVal.toFixed(2)} Cr</span>
                           </motion.div>
                        ))}
                     </div>
                  </motion.div>
               ) : (
                  <motion.div 
                     key="squads"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                     {TEAMS.map((t, idx) => {
                        const teamDoc = roomTeams.find(doc => doc.teamId === t.id);
                        const isMyTeam = currentAuction?.players?.find(p => p.team === t.id)?.id === user?.uid;
                        const managerName = currentAuction?.players?.find(p => p.team === t.id)?.name || 'N/A';
                        const osCount = teamDoc?.squad?.filter(s => {
                           const pid = typeof s === 'string' ? s : s.id;
                           return IPL_PLAYERS.find(pl => pl.id === pid)?.country !== 'IND';
                        }).length || 0;
                        const totalSpent = 120 - (teamDoc?.budgetRemaining || 120);

                        return (
                           <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-[#151515] border border-yellow-500/10 rounded-[2.5rem] p-6 flex flex-col gap-6 relative group"
                           >
                              <div className="absolute top-6 right-6 flex items-center gap-1 opacity-40">
                                 <ChevronDown size={18} />
                              </div>

                              <div className="flex items-center gap-4">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl ${t.color} text-white`}>
                                    {t.id.substring(0, 2)}
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                       <h3 className="text-xl font-black uppercase italic tracking-tight">{t.name}</h3>
                                       {isMyTeam && <span className="bg-orange-500/20 text-orange-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">YOU</span>}
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{managerName}</p>
                                 </div>
                                 <div className="flex gap-4 border-l border-white/5 pl-6">
                                    <div className="text-center">
                                       <span className={`block text-[8px] font-black uppercase mb-0.5 ${teamDoc?.squad?.length < 18 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>{teamDoc?.squad?.length || 0}</span>
                                       <span className="text-[7px] font-bold text-gray-600 uppercase tracking-tighter">Players</span>
                                    </div>
                                    <div className="text-center">
                                       <span className="block text-[8px] font-black text-purple-500 uppercase mb-0.5">{osCount}</span>
                                       <span className="text-[7px] font-bold text-gray-600 uppercase tracking-tighter">Overseas</span>
                                    </div>
                                    <div className="text-center">
                                       <span className="block text-[8px] font-black text-green-500 uppercase mb-0.5">₹{teamDoc?.budgetRemaining?.toFixed(2) || '110.00'} Cr</span>
                                       <span className="text-[7px] font-bold text-gray-600 uppercase tracking-tighter">Remaining</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Spent</span>
                                 <span className="text-lg font-black italic text-yellow-500">₹{totalSpent.toFixed(2)} Cr</span>
                              </div>

                              <div className="space-y-6">
                                 {['Batsman', 'All-Rounder', 'Wicket-Keeper', 'Bowler'].map(role => {
                                    const rolePlayers = (teamDoc?.squad || []).map(s => {
                                       const pid = typeof s === 'string' ? s : s.id;
                                       const b = typeof s === 'string' ? 0 : s.bid;
                                       return { ...IPL_PLAYERS.find(p => p.id === pid), bid: b };
                                    }).filter(p => p.role === role);

                                    if (rolePlayers.length === 0) return null;

                                    return (
                                       <div key={role} className="space-y-3">
                                          <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                             {role}s ({rolePlayers.length})
                                          </h4>
                                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                             {rolePlayers.map((p, pidx) => (
                                                <div key={pidx} className="flex items-center justify-between group/p">
                                                   <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 truncate max-w-[120px]">
                                                      {p.name}
                                                      {p.country !== 'IND' && <Wifi size={10} className="text-purple-400 rotate-90" />}
                                                   </span>
                                                   <span className="text-[10px] font-black italic text-green-500">₹{p.bid.toFixed(2)} Cr</span>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>

                              <div className="flex gap-2 mt-4">
                                 <button className="flex-1 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-green-500 hover:text-black transition-all cursor-pointer">
                                    <Share2 size={12} /> Share
                                 </button>
                                 <button className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
                                    <Share2 size={12} /> Save Image
                                 </button>
                              </div>
                           </motion.div>
                        );
                     })}
                  </motion.div>
               )}
            </AnimatePresence>

            <motion.button
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1 }}
               onClick={() => navigate('/')}
               className="mt-12 mb-12 px-12 py-4 bg-white text-black font-black rounded-2xl hover:bg-yellow-500 transition-all active:scale-95 uppercase tracking-widest flex items-center gap-3 cursor-pointer shadow-2xl"
            >
               <Home size={20} /> Exit to Menu
            </motion.button>
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
                     {currentAuction?.currentAuction?.status === 'paused' ? (
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
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showSettings ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-gray-400 border-white/5'}`}
                     >
                        <SettingsIcon size={16} />
                     </button>
                  </div>
               )}
               <div className="flex items-center gap-1.5 border-l border-white/10 pl-6 h-6">
                  <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 cursor-pointer"><Volume2 size={16} /></button>
                  <button onClick={() => navigate('/')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 cursor-pointer"><Home size={16} /></button>
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
                     {(currentAuction?.currentAuction?.status === 'sold' || currentAuction?.currentAuction?.status === 'unsold') ? (
                        // --- ENHANCED COMPACT CELEBRATION ---
                        <motion.div
                           key="celebration"
                           initial={{ opacity: 0, scale: 0.9, y: 20 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 1.1 }}
                           className={`w-full max-w-2xl mx-auto min-h-[400px] flex flex-col items-center justify-center rounded-[2.5rem] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/20 ${currentAuction.currentAuction.status === 'sold' ? 'bg-green-500' : 'bg-red-950'}`}
                        >
                           {/* Side Confetti on SOLD */}
                           {currentAuction.currentAuction.status === 'sold' && (
                              <>
                                 <div className="absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none z-50">
                                    {[...Array(20)].map((_, i) => (
                                       <motion.div
                                          key={`l-${i}`}
                                          initial={{ opacity: 1, x: 0, y: 0, scale: Math.random() * 0.5 + 0.5, rotate: 0 }}
                                          animate={{ opacity: 0, x: (Math.random() * 500 + 100), y: Math.random() * 600 - 300, rotate: Math.random() * 1080 }}
                                          transition={{ duration: 2 + Math.random(), ease: "easeOut", delay: Math.random() * 0.3 }}
                                          className={`absolute w-3 h-3 ${['bg-yellow-400', 'bg-blue-400', 'bg-red-500', 'bg-white', 'bg-green-400'][i % 5]} rounded-sm`}
                                       />
                                    ))}
                                 </div>
                                 <div className="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none z-50">
                                    {[...Array(20)].map((_, i) => (
                                       <motion.div
                                          key={`r-${i}`}
                                          initial={{ opacity: 1, x: 0, y: 0, scale: Math.random() * 0.5 + 0.5, rotate: 0 }}
                                          animate={{ opacity: 0, x: -(Math.random() * 500 + 100), y: Math.random() * 600 - 300, rotate: Math.random() * 1080 }}
                                          transition={{ duration: 2 + Math.random(), ease: "easeOut", delay: Math.random() * 0.3 }}
                                          className={`absolute w-3 h-3 ${['bg-yellow-400', 'bg-blue-400', 'bg-red-500', 'bg-white', 'bg-green-400'][i % 5]} rounded-sm`}
                                       />
                                    ))}
                                 </div>
                              </>
                           )}

                           <div className="flex flex-col items-center text-center z-10 px-8 py-10 w-full bg-gradient-to-b from-white/10 to-transparent">
                              <motion.div
                                 initial={{ y: 20, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ delay: 0.2 }}
                                 className="relative mb-6"
                              >
                                 <div className="absolute -inset-4 bg-white/20 blur-2xl rounded-full animate-pulse" />
                                 <img
                                    src={currentPlayer.image}
                                    alt={currentPlayer.name}
                                    className="w-32 h-32 md:w-44 md:h-44 object-cover rounded-3xl border-4 border-white/30 shadow-2xl relative z-10"
                                 />
                              </motion.div>

                              <motion.h2
                                 initial={{ y: 10, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ delay: 0.3 }}
                                 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-md"
                              >
                                 {currentPlayer.name}
                              </motion.h2>

                              <motion.div
                                 initial={{ scale: 0.8, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 transition={{ delay: 0.4, type: 'spring' }}
                                 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6"
                              >
                                 {currentAuction.currentAuction.status === 'sold' ? 'SOLD' : 'UNSOLD'}
                              </motion.div>

                              {currentAuction.currentAuction.status === 'sold' && (
                                 <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-col items-center gap-4 w-full"
                                 >
                                    <div className="bg-black/40 backdrop-blur-xl px-10 py-3 rounded-full border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                                       <span className="text-4xl md:text-5xl font-black text-yellow-500 tracking-tight">
                                          ₹{(currentAuction.currentAuction.currentBid || 0).toFixed(2)} Cr
                                       </span>
                                    </div>

                                    <div className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${TEAMS.find(t => t.id === currentAuction.currentAuction.highBidderTeamId)?.color || 'bg-gray-700'}`}>
                                          {currentAuction.currentAuction.highBidderTeamId}
                                       </div>
                                       <span className="text-lg md:text-xl font-black uppercase text-white tracking-widest">
                                          {TEAMS.find(t => t.id === currentAuction.currentAuction.highBidderTeamId)?.name || 'Franchise'}
                                       </span>
                                    </div>
                                 </motion.div>
                              )}

                              {currentAuction.currentAuction.status === 'unsold' && (
                                 <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] mt-4"
                                 >
                                    Returning to Pool
                                 </motion.div>
                              )}
                           </div>
                        </motion.div>
                     ) : (
                        // --- REGULAR BIDDING UI ---
                        <motion.div
                           key="player-card"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="w-full flex-col gap-4 md:gap-6 flex"
                        >
                           <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 px-2 md:px-4">
                              <div className="flex items-center gap-3 md:gap-4">
                                 <div className="px-2 py-0.5 md:px-3 md:py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                                    <span className="text-[8px] md:text-[9px] font-black text-yellow-500 uppercase tracking-widest italic">{currentPlayer.set}</span>
                                 </div>
                                 <div className="h-3 w-px bg-white/10 hidden md:block" />
                                 <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">Base Price:</span>
                                 <span className="text-lg md:text-xl font-black italic text-white">₹{currentPlayer.basePrice.toFixed(2)} Cr</span>
                              </div>
                              <div className="flex items-center gap-2 md:gap-3">
                                 <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">High Bidder:</span>
                                 <div className="bg-green-500/20 border border-green-500/30 px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                                    <span className="text-[9px] md:text-[10px] font-black text-green-400 uppercase tracking-widest italic">{currentAuction?.currentAuction?.highBidderName}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-[#111] border border-white/5 rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl relative min-h-[400px]">
                              <div className="absolute top-0 inset-x-0 h-1 bg-white/5">
                                 <motion.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${(timeLeft / (currentAuction?.settings?.bidTimer || 10)) * 100}%` }}
                                    className={`h-full transition-colors duration-1000 ${timeLeft < 5 ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}
                                 />
                              </div>

                              <div className="p-4 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                                 <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-b from-yellow-500/20 to-transparent rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-32 h-32 md:w-48 md:h-48 bg-gradient-to-b from-white/10 to-transparent rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 relative z-10">
                                       <img
                                          src={currentPlayer.image}
                                          alt={currentPlayer.name}
                                          className="w-full h-full object-cover filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform"
                                       />
                                    </div>
                                 </div>

                                 <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full text-center md:text-left">
                                    <div>
                                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 md:mb-4">
                                          <span className="bg-blue-600 border border-blue-400/30 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase italic tracking-widest">{currentPlayer.role}</span>
                                          <span className="bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase italic tracking-widest">{currentPlayer.type}</span>
                                          <span className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-0 md:ml-2">
                                             {currentPlayer.country === 'IND' ? '🇮🇳' : '🌍'} {currentPlayer.country || 'IND'}
                                          </span>
                                       </div>
                                       <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight italic leading-none">{currentPlayer.name}</h2>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm">
                                       <div className="text-center group">
                                          <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-gray-300 transition-colors">Matches</span>
                                          <span className="text-2xl font-black italic">{currentPlayer.stats?.matches || 0}</span>
                                       </div>
                                       {currentPlayer.stats?.runs !== undefined && (
                                          <div className="text-center border-l border-white/10">
                                             <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Runs</span>
                                             <span className="text-2xl font-black italic text-yellow-500">{currentPlayer.stats.runs}</span>
                                          </div>
                                       )}
                                       {currentPlayer.stats?.sr !== undefined && (
                                          <div className="text-center border-l border-white/10">
                                             <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">S.Rate</span>
                                             <span className="text-2xl font-black italic">{currentPlayer.stats.sr}</span>
                                          </div>
                                       )}
                                       {currentPlayer.stats?.wickets !== undefined && (
                                          <div className="text-center border-l border-white/10">
                                             <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Wkts</span>
                                             <span className="text-2xl font-black italic text-green-500">{currentPlayer.stats.wickets}</span>
                                          </div>
                                       )}
                                       {!currentPlayer.stats?.runs && !currentPlayer.stats?.wickets && (
                                          <div className="text-center border-l border-white/10 col-span-3">
                                             <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</span>
                                             <span className="text-sm font-black italic uppercase text-blue-400 tracking-widest">Mega Auction Ready</span>
                                          </div>
                                       )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2 md:mt-4">
                                       <div className="text-left">
                                          <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-0.5 md:mb-1">Current Bid</span>
                                          <div className="flex items-center gap-3">
                                             <span className="text-xl md:text-3xl font-black italic text-white leading-none">₹{(currentAuction?.currentAuction?.currentBid || 0).toFixed(2)} Cr</span>
                                             {currentAuction?.currentAuction?.highBidderTeamId && (
                                                <div className={`px-2 py-0.5 rounded-lg border border-white/10 shadow-lg flex items-center gap-1.5 ${TEAMS.find(t => t.id === currentAuction.currentAuction.highBidderTeamId)?.color || 'bg-gray-800'}`}>
                                                   <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                   <span className="text-[10px] font-black uppercase tracking-tighter">
                                                      {currentAuction.currentAuction.highBidderTeamId}
                                                   </span>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                       <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-black border-4 border-black/10 shadow-2xl transition-all ${currentAuction?.currentAuction?.status === 'sold' || currentAuction?.currentAuction?.status === 'unsold' ? (currentAuction.currentAuction.status === 'sold' ? 'bg-green-500 scale-110' : 'bg-red-500 scale-110') : 'bg-yellow-500'}`}>
                                          <span className="text-xl md:text-3xl font-black leading-none uppercase tracking-tighter">
                                             {timeLeft}
                                          </span>
                                          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">SEC</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-black/40 border-t border-white/5 p-3 md:p-5 flex gap-2 md:gap-4">
                                 <button
                                    onClick={handleBid}
                                    disabled={timeLeft === 0 || currentAuction?.currentAuction?.status !== 'bidding' || currentAuction?.currentAuction?.highBidderId === user?.uid}
                                    className={`flex-1 h-14 md:h-20 font-black text-lg md:text-2xl rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-4 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer shadow-[0_0_40px_rgba(34,197,94,0.3)] ${currentAuction?.currentAuction?.highBidderId === user?.uid
                                       ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                                       : 'bg-green-500 hover:bg-green-400 text-[#050505]'
                                       }`}
                                 >
                                    {currentAuction?.currentAuction?.status === 'paused' ? 'PAUSED' :
                                       currentAuction?.currentAuction?.highBidderId === user?.uid ? "LEADING BIDDER" :
                                          `PLACE BID: ₹${nextBidAmount.toFixed(2)} Cr`}
                                 </button>
                                 <button
                                    onClick={() => setShowPlayersOverlay(true)}
                                    className="w-14 h-14 md:w-20 md:h-20 bg-[#181818] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-[#222] transition-colors cursor-pointer text-gray-400 group"
                                 >
                                    <List size={24} className="group-hover:text-yellow-500 transition-colors" />
                                 </button>
                              </div>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </main>

            <aside className={`${mobileTab === 'activity' ? 'flex' : 'hidden'} md:flex w-full md:w-96 bg-black/40 border-l border-white/5 flex-col h-full md:max-h-[calc(100vh-3.5rem)]`}>
               <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Activity</h4>
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                  {messages.filter(m => m.type === 'log').map((msg, index) => {
                        const log = msg.text;
                        const isSold = log.includes('SOLD');
                        const isUnsold = log.includes('UNSOLD');
                        const isStart = log.includes('started');
                        const isPaused = log.includes('PAUSED');
                        const isJoin = log.includes('joined');
                        const isBid = log.includes('New bid');

                        let Icon = MessageSquare;
                        let color = 'text-gray-400';
                        if (isJoin) { Icon = Users; color = 'text-green-500'; }
                        if (isStart) { Icon = Play; color = 'text-yellow-500'; }
                        if (isSold) { Icon = CheckCircle2; color = 'text-green-400 font-bold'; }
                        if (isUnsold) { Icon = XCircle; color = 'text-red-400 font-bold'; }
                        if (isPaused) { Icon = Pause; color = 'text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'; }
                        if (isBid) { Icon = Gavel; color = 'text-blue-400'; }

                        return (
                           <div key={`log-${index}`} className="flex gap-3 items-start group animate-in fade-in slide-in-from-left-2 duration-300">
                              <div className={`mt-1 bg-white/5 p-1.5 rounded flex items-center justify-center ${color}`}>
                                 <Icon size={14} />
                              </div>
                              <div className="flex-1">
                                 <p className={`text-[12px] font-medium leading-relaxed ${color}`}>
                                    {log}
                                 </p>
                              </div>
                           </div>
                        );
                  })}
               </div>

               <div className="p-4 bg-black/20 border-t border-white/5 relative">
                  <div className="flex items-center justify-center py-2 text-gray-500 gap-2">
                     <History size={14} />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Auction Log</span>
                  </div>
               </div>
            </aside>
         </div>

         <div className="fixed bottom-0 inset-x-0 h-16 bg-[#111] border-t border-white/10 flex md:hidden z-50">
            <button
               onClick={() => setMobileTab('squad')}
               className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobileTab === 'squad' ? 'text-blue-500' : 'text-gray-500'}`}
            >
               <Users size={18} />
               <span className="text-[9px] font-black uppercase tracking-widest">Squads</span>
            </button>
            <button
               onClick={() => setMobileTab('arena')}
               className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobileTab === 'arena' ? 'text-yellow-500' : 'text-gray-500'}`}
            >
               <div className={`p-2 rounded-full -mt-8 ${mobileTab === 'arena' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'bg-[#222] text-gray-500'}`}>
                  <Gavel size={24} />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest mt-1">Arena</span>
            </button>
            <button
               onClick={() => setMobileTab('activity')}
               className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${mobileTab === 'activity' ? 'text-green-500' : 'text-gray-500'}`}
            >
               <History size={18} />
               <span className="text-[9px] font-black uppercase tracking-widest">Logs</span>
            </button>
         </div>

         <AnimatePresence>
            {showPlayersOverlay && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-4 md:p-8 flex flex-col items-center"
               >
                  <div className="w-full max-w-7xl flex flex-col gap-6 h-full">
                     {/* Header */}
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black">
                              <LayoutGrid size={24} />
                           </div>
                           <div>
                              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Mega Auction Roster</h2>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Complete Player Inventory</p>
                           </div>
                        </div>
                        <button
                           onClick={() => setShowPlayersOverlay(false)}
                           className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                        >
                           <X size={20} />
                        </button>
                     </div>

                     {/* Tab Stats Row - MATCHING IMAGE */}
                     <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-white/5">
                        {[
                           { id: 'upcoming', label: 'Upcoming', icon: Clock, count: playerCategories.upcoming.length, color: 'text-yellow-500' },
                           { id: 'sold', label: 'Sold', icon: CheckCircle2, count: playerCategories.sold.length, color: 'text-green-500' },
                           { id: 'unsold', label: 'Unsold', icon: XCircle, count: playerCategories.unsold.length, color: 'text-red-500' },
                           { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, count: playerCategories.sold.length, color: 'text-blue-500' }
                        ].map((tab) => (
                           <button
                              key={tab.id}
                              onClick={() => setActiveOverlayTab(tab.id)}
                              className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap group ${
                                 activeOverlayTab === tab.id 
                                    ? 'bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                                    : 'text-gray-500 hover:text-gray-300'
                              }`}
                           >
                              <tab.icon size={18} />
                              <span className="text-sm font-black uppercase tracking-widest">{tab.label}</span>
                              <div className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                 activeOverlayTab === tab.id ? 'bg-yellow-500 text-black' : 'bg-white/5 group-hover:bg-white/10'
                              }`}>
                                 {tab.count}
                              </div>
                           </button>
                        ))}

                        {/* Search in Tabs row */}
                        <div className="ml-auto bg-white/5 border border-white/10 rounded-xl hidden md:flex items-center px-4 py-2 gap-3 w-64 lg:w-80">
                           <Search size={14} className="text-gray-500" />
                           <input
                              type="text"
                              placeholder="Find player..."
                              className="bg-transparent border-none outline-none focus:ring-0 text-xs font-bold placeholder:text-gray-700 w-full"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>
                     </div>

                     {/* Content */}
                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                        {activeOverlayTab === 'leaderboard' ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredPlayers.map((p, idx) => (
                                 <div key={p.id} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl italic text-gray-500">
                                       #{idx + 1}
                                    </div>
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl overflow-hidden p-1">
                                       <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                    </div>
                                    <div className="flex-1">
                                       <h5 className="text-sm font-black uppercase mb-0.5">{p.name}</h5>
                                       <p className="text-[10px] font-bold text-gray-500 uppercase">{p.teamId} • {p.role}</p>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-yellow-500 font-black text-lg">₹{p.bid.toFixed(2)} Cr</div>
                                       <div className="text-[9px] font-bold text-gray-600 uppercase">Top Bid</div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                              {filteredPlayers.map(p => (
                                 <div key={p.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all group relative">
                                    {p.country !== 'India' && (
                                       <div className="absolute top-2 right-2 text-blue-500">
                                          <Wifi size={10} className="rotate-45" />
                                       </div>
                                    )}
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:scale-105 transition-transform mx-auto">
                                       <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                    </div>
                                    <div className="text-center">
                                       <h5 className="text-[10px] md:text-xs font-black truncate mb-0.5">{p.name}</h5>
                                       <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase italic block mb-2">{p.role}</span>
                                       
                                       {activeOverlayTab === 'sold' ? (
                                          <div className="bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
                                             <div className="text-[10px] font-black text-green-500">₹{p.bid.toFixed(2)} Cr</div>
                                             <div className="text-[8px] font-black text-green-800 uppercase leading-none">{p.teamId}</div>
                                          </div>
                                       ) : activeOverlayTab === 'unsold' ? (
                                          <div className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                                             <span className="text-[10px] font-black text-red-500 uppercase">Unsold</span>
                                          </div>
                                       ) : (
                                          <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                             <span className="text-[10px] font-black text-yellow-500">₹{p.basePrice.toFixed(2)} Cr</span>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {error && (
               <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="fixed bottom-20 md:bottom-12 bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)] border border-red-500/50 p-4 md:p-6 rounded-3xl flex items-center gap-4 text-red-500 font-black z-[110]"
               >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                     <AlertCircle size={16} />
                  </div>
                  <span className="text-xs md:text-base">{error}</span>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {showSettings && (
               <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed top-20 right-6 z-[100] bg-[#181818] border border-white/10 p-6 rounded-[2rem] shadow-2xl w-80 backdrop-blur-3xl"
               >
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Auction Settings</h3>
                     <button onClick={() => setShowSettings(false)} className="hover:text-white transition-colors cursor-pointer"><X size={16} /></button>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Player Bid Countdown</label>
                        <div className="flex items-center gap-4">
                           <input
                              type="range"
                              min="5"
                              max="60"
                              value={newTimerValue}
                              onChange={(e) => setNewTimerValue(parseInt(e.target.value))}
                              className="flex-1 accent-blue-500"
                           />
                           <span className="text-2xl font-black italic w-12 text-center">{newTimerValue}s</span>
                        </div>
                     </div>

                     <button
                        onClick={async () => {
                           await updateRoomSettings(id, { ...currentAuction.settings, bidTimer: newTimerValue });
                           setShowSettings(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                     >
                        Update Settings
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default AuctionRoom;
