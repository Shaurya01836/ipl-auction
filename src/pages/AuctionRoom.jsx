import React, { useEffect, useState, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { TEAM_SLOGANS } from '../data/slogans';
import confetti from 'canvas-confetti';
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
   VolumeX,
   Pause,
   XCircle,
   Rocket,
   Users,
   LayoutGrid,
   Heart,
   Wifi,
   List,
   Download,
   Gavel,
   X,
   CheckCircle2,
   PlayCircle,
   Filter,
   Search,
   ChevronDown,
   Play,
   ShieldAlert,
   Trophy,
   Clock,
   LogOut,
   Mic,
   MicOff,
   PhoneOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TEAMS } from '../data/teams';
import VoiceChat from '../components/VoiceChat';

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
      joinRoomDb,
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
   const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
   const [isMicMuted, setIsMicMuted] = useState(false);
   const audioRef = useRef(null);
   const celebrationAudioRef = useRef(null);

   const [optimisticState, setOptimisticState] = useState(null);
   const [joiningTeam, setJoiningTeam] = useState(null);

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
            }).catch(() => { });
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
         navigate(`/summary/${id}`, { replace: true });
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
   const increment = currentBid < 5 ? 0.20 : 0.25;
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

   const groupedUpcomingPlayers = useMemo(() => {
      if (activeOverlayTab !== 'upcoming') return null;
      const groups = {};
      filteredPlayers.forEach(p => {
         const setName = p.set || 'General Pool';
         if (!groups[setName]) groups[setName] = [];
         groups[setName].push(p);
      });
      return groups;
   }, [activeOverlayTab, filteredPlayers]);

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

         // Trigger Celebration Ribbons
         const team = TEAMS.find(t => t.id === teamId);
         const colorMap = {
            'MI': ['#004BA0', '#FFFFFF', '#0080FF'],
            'CSK': ['#FFFF00', '#0000FF', '#FDB913'],
            'RCB': ['#EC1C24', '#2c30a7ff', '#FFD700'],
            'KKR': ['#3A225D', '#B38B2D', '#D1AB3E'],
            'DC': ['#000080', '#FF0000', '#0000CD'],
            'PBKS': ['#ED1B24', '#FFFFFF', '#D71921'],
            'RR': ['#EA1A85', '#004B8D', '#254AA5'],
            'SRH': ['#FF8228', '#000000', '#F26522'],
            'GT': ['#1B2133', '#C1AA77', '#0B132B'],
            'LSG': ['#0057E7', '#D11D55', '#01153E']
         };
         const colors = teamId && colorMap[teamId] ? colorMap[teamId] : ['#FFD700', '#FFA500', '#FF4500'];

         const end = Date.now() + 3 * 1000;
         const frame = () => {
            confetti({
               particleCount: 2,
               angle: 60,
               spread: 55,
               origin: { x: 0, y: 0.6 },
               colors: colors,
               scalar: 1.2,
               ticks: 200
            });
            confetti({
               particleCount: 2,
               angle: 120,
               spread: 55,
               origin: { x: 1, y: 0.6 },
               colors: colors,
               scalar: 1.2,
               ticks: 200
            });

            if (Date.now() < end) {
               requestAnimationFrame(frame);
            }
         };
         frame();

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

   if (currentAuction?.status === 'completed') return null;

   if (loading) {
      return (
         <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
            <div className="relative">
               <div className="w-24 h-24 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Gavel size={32} className="text-yellow-500 animate-pulse" />
               </div>
            </div>
            <h2 className="mt-8 text-2xl font-black tracking-widest uppercase animate-pulse text-gray-400">Syncing Auction Data...</h2>
            <p className="mt-2 text-gray-600 text-sm font-bold uppercase tracking-[0.3em]">Connecting to Mega Auction</p>
         </div>
      );
   }

   // Manual team selection for late joiners

   const handleQuickJoin = async (selectedTeam) => {
      if (joiningTeam) return;
      setJoiningTeam(selectedTeam.id);
      try {
         await joinRoomDb(id, user.uid, {
            name: user.displayName || 'Manager',
            team: selectedTeam.id
         });
      } catch (err) {
         console.error('Join failed:', err);
         setJoiningTeam(null);
      }
   };

   // Team Selection Guard — show team picker or "room full" error
   if (!team && !loading && user) {
      const takenTeamIds = new Set(roomTeams.map(t => t.teamId));
      (currentAuction?.players || []).forEach(p => { if (p.team) takenTeamIds.add(p.team); });
      const availableTeams = TEAMS.filter(t => !takenTeamIds.has(t.id));

      return (
         <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full" />
            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl">
               {availableTeams.length > 0 ? (
                  <>
                     <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center justify-center text-yellow-500 mb-6 shadow-2xl">
                        <Gavel size={40} strokeWidth={2.5} />
                     </div>
                     <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-2">Claim Your Franchise</h2>
                     <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">The auction is live! Pick a team to jump straight in.</p>

                     <div className="grid grid-cols-5 gap-3 md:gap-4 w-full max-w-xl">
                        {TEAMS.map((t) => {
                           const isTaken = takenTeamIds.has(t.id);
                           const isJoining = joiningTeam === t.id;

                           return (
                              <button
                                 key={t.id}
                                 onClick={() => !isTaken && handleQuickJoin(t)}
                                 disabled={isTaken || !!joiningTeam}
                                 className={`relative group flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl transition-all duration-300 border cursor-pointer ${isJoining
                                       ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.2)] scale-105'
                                       : isTaken
                                          ? 'border-white/5 opacity-25 grayscale cursor-not-allowed'
                                          : 'border-white/10 hover:border-yellow-500/30 hover:bg-white/5 hover:scale-105 active:scale-95'
                                    }`}
                              >
                                 <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center ${isJoining ? 'animate-pulse' : ''}`}>
                                    <img src={t.logo} alt="" className="w-full h-full object-contain" />
                                 </div>
                                 <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-tight ${isJoining ? 'text-yellow-400' : isTaken ? 'text-gray-600' : 'text-gray-400 group-hover:text-white'}`}>
                                    {isJoining ? 'Joining...' : isTaken ? 'Taken' : t.id}
                                 </span>
                              </button>
                           );
                        })}
                     </div>

                     <p className="mt-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest">{availableTeams.length} franchise{availableTeams.length !== 1 ? 's' : ''} available</p>
                  </>
               ) : (
                  <>
                     <div className="w-24 h-24 bg-red-500/20 border border-red-500/30 rounded-3xl flex items-center justify-center text-red-500 mb-8 shadow-2xl">
                        <ShieldAlert size={48} strokeWidth={2.5} />
                     </div>
                     <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">Room Full</h2>
                     <p className="text-gray-400 text-lg font-medium mb-10 leading-relaxed">
                        All 10 IPL franchises have been claimed. No teams are available to join.
                     </p>
                     <button
                        onClick={() => navigate('/')}
                        className="px-8 py-4 bg-white/5 border border-white/10 text-gray-400 font-black rounded-2xl hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest cursor-pointer"
                     >
                        Home
                     </button>
                  </>
               )}
            </div>
         </div>
      );
   }

   return (
      <div className="h-screen bg-[#050505] text-white font-sans flex flex-col items-center overflow-hidden">
         {/* Voice Chat Component (Background Logic) */}
         {isVoiceEnabled && (
            <VoiceChat
               channel={id}
               isModal={false}
               externalIsMicMuted={isMicMuted}
            />
         )}

         <header className="w-full min-h-14 h-auto md:h-14 bg-black/40 backdrop-blur-md border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 md:py-0 z-50 gap-4 md:gap-0">
            <div className="flex items-center gap-3 md:gap-6">
               <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">ID:</span>
                  <span className="text-yellow-500 font-black tracking-widest text-[11px] sm:text-sm">{id}</span>
               </div>
               <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-500">{currentAuction?.players?.length || 1}/10</span>
               </div>
               <div className="flex items-center gap-2 border-l border-white/10 pl-4 sm:pl-6 h-6">
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
                           className="flex items-center gap-1.5 sm:gap-2 bg-green-500/10 border border-green-500/20 px-2 sm:px-3 py-1.5 rounded-lg text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all cursor-pointer"
                        >
                           <PlayCircle size={12} fill="currentColor" /> <span className="hidden sm:inline">Resume</span>
                        </button>
                     ) : (
                        <button
                           onClick={() => pauseAuction(id)}
                           className="flex items-center gap-1.5 sm:gap-2 bg-yellow-500/10 border border-yellow-500/20 px-2 sm:px-3 py-1.5 rounded-lg text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all cursor-pointer"
                        >
                           <Pause size={12} fill="currentColor" /> <span className="hidden sm:inline">Pause</span>
                        </button>
                     )}
                     <button
                        onClick={() => endAuction(id)}
                        className="flex items-center gap-1.5 sm:gap-2 bg-red-500/10 border border-red-500/20 px-2 sm:px-3 py-1.5 rounded-lg text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all cursor-pointer"
                     >
                        <XCircle size={12} fill="currentColor" /> <span className="hidden sm:inline">End</span>
                     </button>
                     <button
                        onClick={() => setShowParticipantsOverlay(true)}
                        className="flex items-center gap-1.5 sm:gap-2 bg-blue-500/10 border border-blue-500/20 px-2 sm:px-3 py-1.5 rounded-lg text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all cursor-pointer"
                     >
                        <Users size={12} fill="currentColor" /> <span className="hidden sm:inline">Participants</span>
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
                  <button
                     onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                     className={`relative p-1.5 rounded-lg border transition-all cursor-pointer ${isVoiceEnabled ? 'bg-green-500/20 border-green-500/30 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                     title={isVoiceEnabled ? "Leave Voice Channel" : "Join Voice Channel"}
                  >
                     {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                     {isVoiceEnabled && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#050505] animate-pulse shadow-[0_0_8px_#22c55e]" />
                     )}
                  </button>
                  <button
                     onClick={() => setIsMicMuted(!isMicMuted)}
                     disabled={!isVoiceEnabled}
                     className={`p-1.5 rounded-lg border transition-all ${!isVoiceEnabled ? 'opacity-30 grayscale cursor-not-allowed hidden md:block' : isMicMuted ? 'bg-red-500/20 border-red-500/30 text-red-500 cursor-pointer' : 'bg-orange-500/20 border-orange-500/30 text-orange-500 hover:bg-orange-500/30 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.2)]'}`}
                     title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                  >
                     {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button onClick={() => navigate('/')} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 cursor-pointer"><Home size={16} /></button>
                  <button onClick={logout} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 cursor-pointer transition-colors" title="Logout"><LogOut size={16} /></button>
               </div>
            </div>
         </header>

         <div className="w-full flex flex-col md:flex-row flex-1 overflow-hidden relative">
            <aside className={`${mobileTab === 'squad' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-black/40 border-r border-white/5 flex-col h-full md:max-h-[calc(100vh-3.5rem)]`}>
               <div className="p-6 border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
                  <div className="flex items-center gap-3 mb-2">

                     <div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Auction Teams</span>

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
                              className={`w-full text-left p-4 rounded-md border transition-all flex items-center justify-between group cursor-pointer ${isSelected ? 'bg-white/10 border-white/20 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center`}>
                                    <img src={t.logo} alt="" className="w-full h-full object-contain" />
                                 </div>
                                 <div className="overflow-hidden">
                                    <h5 className="text-[11px] font-black truncate max-w-[120px]">{t.name}</h5>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${manager ? 'text-gray-400' : 'text-gray-600'}`}>
                                       {manager ? `${manager.name} ${isMyTeam ? '(YOU)' : ''}` : 'Available'}
                                    </span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <span className={`text-[10px] font-black block leading-none ${manager ? 'text-green-500' : 'text-gray-700'}`}>
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
                                    <div className="bg-[#111] border border-white/10 rounded-md overflow-hidden mt-1 p-2 space-y-2">
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
                                                            <span className="text-[8px] font-black  text-yellow-500">
                                                               ₹{p?.bidVal ? p.bidVal.toFixed(2) : (p?.basePrice || 0).toFixed(2)} Cr
                                                            </span>
                                                         </div>
                                                      ))}
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       ) : (
                                          <div className="py-4 text-center opacity-30 ">
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
                                 <img src={currentPlayer.image} alt={currentPlayer.name} className="w-32 h-32 md:w-36 md:h-40 object-cover rounded-3xl border-4 border-white/30 shadow-2xl relative z-10" />
                              </motion.div>
                              <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-md">
                                 {currentPlayer.name}
                              </motion.h2>
                              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="text-4xl sm:text-6xl md:text-8xl font-black  tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6">
                                 {displayAuctionState.status === 'sold' ? 'SOLD' : 'UNSOLD'}
                              </motion.div>
                              {displayAuctionState.status === 'sold' && (
                                 <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center gap-4 w-full">
                                    <div className="bg-black/40 backdrop-blur-xl px-6 sm:px-10 py-3 rounded-full border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                                       <span className="text-2xl sm:text-4xl md:text-5xl font-black text-yellow-500 tracking-tight">₹{(displayAuctionState.currentBid || 0).toFixed(2)} Cr</span>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
                                       <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center`}>
                                          <img src={TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId)?.logo} alt="" className="w-full h-full object-contain" />
                                       </div>
                                       <span className="text-base sm:text-lg md:text-xl font-black uppercase text-white tracking-widest">{TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId)?.name || 'Franchise'}</span>
                                    </div>
                                 </motion.div>
                              )}
                           </div>
                        </motion.div>
                     ) : (
                        <motion.div key="player-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex-col gap-4 md:gap-6 flex">
                           <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 px-2 md:px-4">
                              <div className="flex items-center gap-3 md:gap-4">
                                 <div className="px-2 pb-0.5 md:px-3 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
                                    <span className="text-[8px] md:text-[9px] font-black text-yellow-500 uppercase tracking-widest ">{currentPlayer.set}</span>
                                 </div>
                                 <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">Base Price:</span>
                                 <span className="text-lg md:text-xl font-black  text-white">₹{currentPlayer.basePrice.toFixed(2)} Cr</span>
                              </div>
                              <div className="flex items-center gap-2 md:gap-3">
                                 <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">High Bidder:</span>
                                 <div className="bg-green-500/20 border border-green-500/30 px-2 pb-0.5 md:px-3 rounded-md">
                                    <span className="text-[9px] md:text-[10px] font-black text-green-400 uppercase tracking-widest ">{displayAuctionState?.highBidderName}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="bg-[#111] border border-white/5 rounded-3xl md:rounded-md overflow-hidden shadow-2xl relative min-h-[400px]">
                              <div className="absolute top-0 inset-x-0 h-1 bg-white/5">
                                 <motion.div initial={{ width: "100%" }} animate={{ width: `${(timeLeft / (currentAuction?.settings?.bidTimer || 10)) * 100}%` }} className={`h-full transition-colors duration-1000 ${timeLeft < 5 ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`} />
                              </div>
                              <div className="p-4 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                                 <div className="w-32 h-32 md:w-60 md:h-80 bg-gradient-to-b from-white/10 to-transparent rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 relative z-10">
                                    <img src={currentPlayer.image} alt={currentPlayer.name} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full text-center md:text-left">
                                    <div>
                                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 md:mb-4">
                                          <span className="bg-blue-600 border border-blue-400/30 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase  tracking-widest">{currentPlayer.role}</span>
                                          <span className="bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full uppercase  tracking-widest">{currentPlayer.type}</span>
                                       </div>
                                       <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight  leading-none">{currentPlayer.name}</h2>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-sm">
                                       <div className="text-center group"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Matches</span><span className="text-2xl font-black ">{currentPlayer.stats?.matches || 0}</span></div>
                                       {currentPlayer.stats?.runs !== undefined && (<div className="text-center border-l border-white/10"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Runs</span><span className="text-2xl font-black  text-yellow-500">{currentPlayer.stats.runs}</span></div>)}
                                       {currentPlayer.stats?.sr !== undefined && (<div className="text-center border-l border-white/10"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">S.Rate</span><span className="text-2xl font-black ">{currentPlayer.stats.sr}</span></div>)}
                                       {currentPlayer.stats?.wickets !== undefined && (<div className="text-center border-l border-white/10"><span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Wkts</span><span className="text-2xl font-black  text-green-500">{currentPlayer.stats.wickets}</span></div>)}
                                    </div>
                                    <div className="flex items-center justify-between mt-2 md:mt-4">
                                       <div className="text-left">
                                          <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-0.5 md:mb-1">Current Bid</span>
                                          <div className="flex items-center gap-3">
                                             <span className="text-xl md:text-3xl font-black text-white leading-none">₹{(displayAuctionState?.currentBid || 0).toFixed(2)} Cr</span>
                                             {displayAuctionState?.highBidderTeamId && (
                                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 rounded-xl">
                                                   <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/5 border border-white/10 p-0.5 flex items-center justify-center">
                                                      <img src={TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId)?.logo} alt="" className="w-full h-full object-contain" />
                                                   </div>
                                                   <span className="text-[9px] md:text-[11px] font-black text-gray-300 uppercase tracking-widest">{displayAuctionState.highBidderTeamId}</span>
                                                </div>
                                             )}
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
               <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Activity</h4>
                     <span className="text-[8px] font-black text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{messages.filter(m => m.type === 'log' || m.type === 'sold_card').filter(m => !m.text.includes('New bid:')).length}</span>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
               </div>
               <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-3">
                  {[...messages.filter(m => m.type === 'log' || m.type === 'sold_card').filter(m => !m.text.includes('New bid:'))].reverse().map((msg, index) => {
                     if (msg.type === 'sold_card') return <SoldCard key={msg.id || index} msg={msg} />;

                     // Determine icon and color based on message content
                     const text = msg.text || '';
                     let icon = <MessageSquare size={14} />;
                     let borderColor = 'border-white/5';
                     let iconBg = 'bg-white/5 text-gray-500';

                     if (text.includes('SOLD')) {
                        icon = <Gavel size={14} />;
                        borderColor = 'border-green-500/20';
                        iconBg = 'bg-green-500/10 text-green-500';
                     } else if (text.includes('UNSOLD')) {
                        icon = <XCircle size={14} />;
                        borderColor = 'border-red-500/20';
                        iconBg = 'bg-red-500/10 text-red-500';
                     } else if (text.includes('PAUSED')) {
                        icon = <Pause size={14} />;
                        borderColor = 'border-yellow-500/20';
                        iconBg = 'bg-yellow-500/10 text-yellow-500';
                     } else if (text.includes('RESUMED')) {
                        icon = <Play size={14} />;
                        borderColor = 'border-blue-500/20';
                        iconBg = 'bg-blue-500/10 text-blue-500';
                     } else if (text.includes('started') || text.includes('COMPLETED')) {
                        icon = <Rocket size={14} />;
                        borderColor = 'border-orange-500/20';
                        iconBg = 'bg-orange-500/10 text-orange-500';
                     } else if (text.includes('removed')) {
                        icon = <LogOut size={14} />;
                        borderColor = 'border-red-500/20';
                        iconBg = 'bg-red-500/10 text-red-400';
                     }

                     // Relative timestamp
                     let timeAgo = '';
                     if (msg.timestamp) {
                        const tsValue = typeof msg.timestamp === 'number' ? msg.timestamp : (msg.timestamp?.toDate ? msg.timestamp.toDate().getTime() : Date.now());
                        
                        // Prevent negative time due to clock drift
                        let diffMs = Date.now() - tsValue;
                        if (diffMs < 0) diffMs = 0;
                        
                        const diffSec = Math.floor(diffMs / 1000);
                        if (diffSec < 60) timeAgo = `${diffSec}s ago`;
                        else if (diffSec < 3600) timeAgo = `${Math.floor(diffSec / 60)}m ago`;
                        else timeAgo = `${Math.floor(diffSec / 3600)}h ago`;
                     }

                     return (
                        <motion.div
                           key={`log-${msg.id || index}`}
                           initial={index === 0 ? { opacity: 0, y: -10 } : false}
                           animate={{ opacity: 1, y: 0 }}
                           className={`flex gap-3 items-start p-3 rounded-xl border ${borderColor} bg-white/[0.02] hover:bg-white/[0.04] transition-all`}
                        >
                           <div className={`mt-0.5 p-1.5 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[11px] md:text-[12px] font-semibold leading-relaxed text-gray-300">{msg.text}</p>
                              {timeAgo && <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-1 block">{timeAgo}</span>}
                           </div>
                        </motion.div>
                     );
                  })}
                  {messages.filter(m => m.type === 'log' || m.type === 'sold_card').filter(m => !m.text.includes('New bid:')).length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                        <History size={32} className="text-gray-700 mb-4" />
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No activity yet</p>
                     </div>
                  )}
               </div>
            </aside>
         </div>

         <div className="w-full shrink-0 bg-black/90 backdrop-blur-2xl border-t border-white/5 flex md:hidden z-50 pb-[env(safe-area-inset-bottom)] relative before:absolute before:inset-x-0 before:top-0 before:-mt-5 before:h-5 before:bg-gradient-to-t before:from-[#050505]/80 before:to-transparent before:pointer-events-none">
            <div className="flex w-full h-12 items-center justify-around px-4">
               <button onClick={() => setMobileTab('squad')} className={`flex flex-col items-center justify-center w-16 gap-0.5 transition-all duration-300 ${mobileTab === 'squad' ? 'text-blue-500 translate-y-0' : 'text-gray-500 hover:text-gray-400 translate-y-0.5'}`}>
                  <div className={`p-1 rounded-lg transition-colors duration-300 ${mobileTab === 'squad' ? 'bg-blue-500/10' : 'bg-transparent'}`}>
                     <Users size={16} strokeWidth={mobileTab === 'squad' ? 2.5 : 2} />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${mobileTab === 'squad' ? 'opacity-100' : 'opacity-70'}`}>Squads</span>
               </button>

               <button onClick={() => setMobileTab('arena')} className="flex flex-col items-center justify-center w-20 relative -mt-3 group z-10 transition-transform active:scale-95">
                  <div className={`p-2.5 rounded-xl transition-all duration-500 border relative overflow-hidden ${mobileTab === 'arena' ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_6px_15px_rgba(234,179,8,0.4)] scale-105' : 'bg-[#151515] border-white/10 text-gray-400 shadow-lg'}`}>
                     {mobileTab === 'arena' && <div className="absolute inset-0 bg-white/20 blur-md pointer-events-none" />}
                     <Gavel size={18} strokeWidth={2.5} className="relative z-10" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all mt-1 ${mobileTab === 'arena' ? 'text-yellow-500' : 'text-gray-500'}`}>Arena</span>
               </button>

               <button onClick={() => setMobileTab('activity')} className={`flex flex-col items-center justify-center w-16 gap-0.5 transition-all duration-300 ${mobileTab === 'activity' ? 'text-green-500 translate-y-0' : 'text-gray-500 hover:text-gray-400 translate-y-0.5'}`}>
                  <div className={`p-1 rounded-lg transition-colors duration-300 ${mobileTab === 'activity' ? 'bg-green-500/10' : 'bg-transparent'}`}>
                     <History size={16} strokeWidth={mobileTab === 'activity' ? 2.5 : 2} />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${mobileTab === 'activity' ? 'opacity-100' : 'opacity-70'}`}>Logs</span>
               </button>
            </div>
         </div>

         <AnimatePresence>
            {showPlayersOverlay && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-4 md:p-8 flex flex-col items-center">
                  <div className="w-full max-w-7xl flex flex-col gap-6 h-full">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
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
                        {activeOverlayTab === 'upcoming' ? (
                           <div className="space-y-12">
                              {Object.entries(groupedUpcomingPlayers || {}).map(([setName, players]) => (
                                 <div key={setName} className="space-y-6">
                                    <div className="flex items-center gap-6">
                                       <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                                       <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] bg-yellow-500/5 px-6 py-2 rounded-full border border-yellow-500/10 ">
                                          {setName}
                                       </h3>
                                       <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                                       {players.map(p => (
                                          <div key={p.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all group">
                                             <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:scale-105 transition-transform mx-auto">
                                                <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                             </div>
                                             <div className="text-center">
                                                <h5 className="text-[10px] md:text-xs font-black truncate mb-0.5">{p.name}</h5>
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                   <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase ">{p.role}</span>
                                                </div>
                                                <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                                   <span className="text-[10px] font-black text-yellow-500">
                                                      ₹{p.basePrice.toFixed(2)} Cr
                                                   </span>
                                                </div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                              {filteredPlayers.map(p => (
                                 <div key={p.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all group">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:scale-105 transition-transform mx-auto">
                                       <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                    </div>
                                    <div className="text-center">
                                       <h5 className="text-[10px] md:text-xs font-black truncate mb-0.5">{p.name}</h5>
                                       <div className="flex items-center justify-center gap-2 mb-2">
                                          <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase ">{p.role}</span>
                                       </div>
                                       <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                          <span className="text-[10px] font-black text-yellow-500">
                                             ₹{(activeOverlayTab === 'sold' || activeOverlayTab === 'leaderboard' ? p.bid : p.basePrice).toFixed(2)} Cr
                                          </span>
                                       </div>
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
                     <div><label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Player Bid Countdown</label><div className="flex items-center gap-4"><input type="range" min="5" max="60" value={newTimerValue} onChange={(e) => setNewTimerValue(parseInt(e.target.value))} className="flex-1 accent-blue-500" /><span className="text-2xl font-black  w-12 text-center">{newTimerValue}s</span></div></div>
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
                                 <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center`}>
                                    <img src={TEAMS.find(t => t.id === player.team)?.logo} alt="" className="w-full h-full object-contain" />
                                 </div>
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

const SoldCard = ({ msg }) => {
   const cardRef = useRef(null);
   const player = IPL_PLAYERS.find(p => p.id === msg.metadata.playerId);
   const team = TEAMS.find(t => t.id === msg.metadata.teamId);
   const slogan = TEAM_SLOGANS[msg.metadata.teamId] || { slogan: 'IPL 2025!', hashtag: '#IPL' };

   const handleSave = async () => {
      if (cardRef.current === null) return;
      try {
         const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
         const link = document.createElement('a');
         link.download = `${player.name}_Sold.png`;
         link.href = dataUrl;
         link.click();
      } catch (err) {
         console.error('Error saving image:', err);
      }
   };

   return (
      <div className="space-y-2 mb-6">
         <div ref={cardRef} className="relative w-full h-[480px] aspect-[4/5] rounded-[2rem] overflow-hidden bg-[#0A0A0B] border border-white/10 shadow-2xl">
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${team?.color.replace('bg-', 'from-')} to-black`} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

            <div className="relative h-full flex flex-col p-6 z-10">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10">
                     <img src={team?.logo} alt="" className="w-full h-full object-contain " />
                  </div>
                  <div className="text-right uppercase tracking-[0.2em]">
                     <p className="text-[8px] font-black text-blue-500 mb-0.5">IPL Auction</p>
                     <p className="text-[10px] font-bold text-white/50 leading-none">Sold to</p>
                     <p className="text-[12px] font-black text-white">{msg.metadata.buyerName}</p>
                  </div>
               </div>

               <div className="flex-1 flex flex-col justify-center items-center py-4">
                  <div className="relative w-40 h-40 group">
                     <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 ${team?.color}`} />
                     <img src={player?.image} className="relative w-full h-full object-contain z-10 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]" alt="" />
                  </div>
                  <div className="text-center mt-4">
                     <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">{player?.name}</h2>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">{player?.role} • {player?.country}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="text-center">
                     <p className="text-[16px] font-black italic uppercase tracking-wider text-yellow-500 drop-shadow-lg">#{slogan.slogan}</p>

                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-center">

                     <p className="text-2xl font-black text-white">₹{msg.metadata.bid.toFixed(2)} Cr</p>
                  </div>
               </div>
            </div>
         </div>
         <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 text-gray-400 hover:text-white">
            <Download size={14} /> Save Player Card
         </button>
      </div>
   );
};

export default AuctionRoom;
