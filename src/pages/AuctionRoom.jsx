import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { IPL_PLAYERS } from '../data/players';
import { 
  Trophy, 
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
  Send,
  ChevronDown,
  Play,
  Gavel,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [mobileTab, setMobileTab] = useState('arena'); // arena, squad, activity
  const [chatInput, setChatInput] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [allTeams, setAllTeams] = useState({});
  const [celebratedPlayer, setCelebratedPlayer] = useState(null);
  const [celebration, setCelebration] = useState(null); // { type, team, playerName, bid }
  const [newTimerValue, setNewTimerValue] = useState(currentAuction?.settings?.bidTimer || 10);
  const audioRef = useRef(null);
  const lastLogRef = useRef(0);

  const TEAM_SONGS = {
    'csk': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholders
    'mi': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'rcb': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'kkr': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'dc': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    'pbks': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    'rr': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    'srh': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    'lsg': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    'gt': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  };

  useEffect(() => {
    if (user) setSelectedTeamId(user.uid);
  }, [user]);

  // Use current player from auction state, but freeze during celebration
  const currentPlayer = useMemo(() => {
    if (celebration && celebratedPlayer) return celebratedPlayer;
    return IPL_PLAYERS.find(p => p.id === currentAuction?.currentAuction?.playerId) || IPL_PLAYERS[0];
  }, [currentAuction?.currentAuction?.playerId, celebration, celebratedPlayer]);

  const isAdmin = currentAuction?.hostId === user?.uid;
  const nextBidAmount = (currentAuction?.currentAuction?.currentBid || currentPlayer.basePrice) + (currentAuction?.currentAuction?.currentBid >= 10 ? 0.5 : 0.25);

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

  // 1. Instant UI Freeze based on status
  useEffect(() => {
    const status = currentAuction?.currentAuction?.status;
    if (status === 'sold' || status === 'unsold') {
      const p = IPL_PLAYERS.find(pl => pl.id === currentAuction?.currentAuction?.playerId);
      if (p && !celebratedPlayer) {
        setCelebratedPlayer(p);
      }
      
      const timer = setTimeout(() => {
        setCelebration(null);
        setCelebratedPlayer(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (status === 'bidding' || status === 'completed') {
      // Clear frozen state when new bidding starts or auction ends
      setCelebratedPlayer(null);
      setCelebration(null);
    }
  }, [currentAuction?.currentAuction?.status, currentAuction?.currentAuction?.playerId]);

  // 2. Reliable Overlay based on Logs
  useEffect(() => {
    if (!currentAuction?.logs || currentAuction.logs.length <= lastLogRef.current) return;
    
    const newLogs = currentAuction.logs.slice(lastLogRef.current);
    lastLogRef.current = currentAuction.logs.length;

    newLogs.forEach(log => {
      if (log.includes('SOLD to')) {
        const parts = log.split('SOLD to');
        const playerName = parts[0].trim();
        const teamInfo = parts[1].trim(); 
        const teamNameInLog = teamInfo.split('for')[0].trim();
        const bidAmountStr = teamInfo.split('for')[1]?.trim();
        const teamId = TEAMS.find(t => t.name.toLowerCase() === teamNameInLog.toLowerCase())?.id;

        setCelebration({ type: 'sold', team: teamId, playerName, bid: bidAmountStr });

        if (teamId && TEAM_SONGS[teamId.toLowerCase()]) {
          const audio = new Audio(TEAM_SONGS[teamId.toLowerCase()]);
          audio.volume = 0.4;
          audio.play().catch(e => console.warn("Autoplay blocked"));
          setTimeout(() => {
             audio.pause();
             audio.currentTime = 0;
          }, 4000);
        }
      } else if (log.includes('UNSOLD')) {
        const playerName = log.split('UNSOLD')[0].trim();
        setCelebration({ type: 'unsold', playerName });
      }
    });
  }, [currentAuction?.logs?.length]);

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

  if (currentAuction?.status === 'completed') {
    return (
      <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-32 h-32 bg-yellow-500 rounded-[2rem] flex items-center justify-center text-black mb-8 shadow-[0_0_50px_rgba(234,179,8,0.4)]">
          <Trophy size={64} strokeWidth={2.5} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase">Auction Completed</h1>
        <p className="text-gray-400 max-w-md text-lg font-medium mb-12">The hammer has fallen for the final time. Check the squads in the lobby to see the final teams.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-widest cursor-pointer"
        >
          Back to Home
        </button>
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
                               {t.id.substring(0,2).toUpperCase()}
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
                                        <span className="text-gray-500">OS: <span className="text-white">{(teamDoc?.squad?.filter(pid => IPL_PLAYERS.find(pl => pl.id === pid)?.country !== 'IND').length || 0)}</span></span>
                                        <span className="text-gray-500">Spent: <span className="text-yellow-500">{(120 - (teamDoc?.budgetRemaining || 120)).toFixed(2)} Cr</span></span>
                                     </div>
                                  </div>
                                  
                                  {teamDoc?.squad?.length > 0 ? (
                                     <div className="space-y-1">
                                        {teamDoc.squad.map((pid, sidx) => {
                                           const p = IPL_PLAYERS.find(pl => pl.id === pid);
                                           return (
                                              <div key={sidx} className="bg-white/5 p-2 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                                 <div className="flex items-center gap-2">
                                                    <img src={p?.image} className="w-6 h-6 object-contain" />
                                                    <div>
                                                       <h5 className="text-[10px] font-black whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{p?.name}</h5>
                                                       <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">{p?.role}</span>
                                                    </div>
                                                 </div>
                                                 <span className="text-[8px] font-black italic text-yellow-500">₹{p?.basePrice}C</span>
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
              {!celebration ? (
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
                         <div className="w-32 h-32 md:w-48 md:h-48 bg-gradient-to-b from-white/10 to-transparent rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 p-2 md:p-3 relative z-10">
                            <img 
                              src={currentPlayer.image} 
                              alt={currentPlayer.name} 
                              className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform" 
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
                           <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-black border-4 border-black/10 shadow-2xl transition-all ${celebration ? (celebration.type === 'sold' ? 'bg-green-500 scale-110' : 'bg-red-500 scale-110') : 'bg-yellow-500'}`}>
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
                        className={`flex-1 h-14 md:h-20 font-black text-lg md:text-2xl rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-4 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer shadow-[0_0_40px_rgba(34,197,94,0.3)] ${
                          currentAuction?.currentAuction?.highBidderId === user?.uid 
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
              ) : (
                <motion.div 
                   key="celebration"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0 }}
                   className={`w-full h-full min-h-[500px] flex-1 flex flex-col items-center justify-center rounded-3xl md:rounded-[3rem] overflow-hidden relative shadow-2xl ${celebration.type === 'sold' ? 'bg-green-600' : 'bg-red-900'}`}
                >
                  {/* Confetti Particles */}
                  {celebration.type === 'sold' && [...Array(30)].map((_, i) => (
                     <motion.div
                       key={i}
                       initial={{ y: -20, x: Math.random() * 600 - 300, rotate: 0 }}
                       animate={{ 
                         y: 800, 
                         x: Math.random() * 600 - 300,
                         rotate: 720 
                       }}
                       transition={{ 
                         duration: 2 + Math.random() * 3, 
                         repeat: Infinity,
                         ease: "linear",
                         delay: Math.random() * 2
                       }}
                       className={`absolute w-1.5 h-1.5 rounded-sm ${['bg-yellow-400', 'bg-white', 'bg-blue-400', 'bg-pink-400', 'bg-green-300'][i % 5]}`}
                       style={{ left: `${Math.random() * 100}%` }}
                     />
                  ))}

                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="flex flex-col items-center relative z-10 px-4 text-center"
                  >
                    <h2 className="text-3xl md:text-5xl font-black text-white/90 uppercase tracking-widest mb-2 drop-shadow-xl text-center">
                       {celebration.playerName || celebratedPlayer?.name}
                    </h2>
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_15px_40px_rgba(0,0,0,0.6)] mb-2">
                      {celebration.type === 'sold' ? 'SOLD!' : 'UNSOLD'}
                    </h1>

                    {celebration.type === 'sold' && (
                      <>
                        <motion.div 
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           transition={{ delay: 0.2, type: 'spring' }}
                           className="text-3xl md:text-5xl font-black text-white mb-8 drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)] bg-black/20 px-6 py-2 rounded-full"
                        >
                          ₹{celebration.bid}
                        </motion.div>
                        
                        <motion.div 
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center gap-5 bg-white backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ${TEAMS.find(t=>t.id===(celebration.team?.toUpperCase()))?.color || 'bg-gray-500'}`}>
                             {celebration.team?.substring(0,2).toUpperCase()}
                          </div>
                          <div className="text-left">
                             <span className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Purchased By</span>
                             <span className="text-2xl font-black text-black italic leading-none">
                                {TEAMS.find(t=>t.id===(celebration.team?.toUpperCase()))?.name || 'Franchise'}
                             </span>
                          </div>
                        </motion.div>
                      </>
                    )}

                    {celebration.type === 'unsold' && (
                       <div className="mt-4 bg-black/40 px-6 py-2 rounded-full border border-white/10 italic font-black text-white/60 tracking-widest uppercase text-sm">
                          Returning to Pool
                       </div>
                    )}
                  </motion.div>
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
             {([...(currentAuction?.logs || []).map(l => ({ type: 'log', text: l })), ...messages]).map((msg, index) => {
                if (msg.type === 'log') {
                   const log = msg.text;
                   const isSold = log.includes('SOLD');
                   const isUnsold = log.includes('UNSOLD');
                   const isStart = log.includes('started');
                   const isPaused = log.includes('PAUSED');
                   const isJoin = log.includes('joined');
                   
                   let Icon = MessageSquare;
                   let color = 'text-gray-400';
                   if (isJoin) { Icon = Users; color = 'text-green-500'; }
                   if (isStart) { Icon = Play; color = 'text-yellow-500'; }
                   if (isSold) { Icon = CheckCircle2; color = 'text-green-500'; }
                   if (isUnsold) { Icon = XCircle; color = 'text-red-500'; }
                   if (isPaused) { Icon = Pause; color = 'text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'; }

                   return (
                      <div key={`log-${index}`} className="flex gap-3 items-start group">
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
                } else {
                   const isMe = msg.userId === user?.uid;
                   return (
                      <div key={`msg-${index}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
                         <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-1">{msg.userName} {isMe && '(YOU)'}</span>
                         <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'}`}>
                            {msg.type === 'gif' ? (
                               <img src={msg.text} className="w-full rounded-lg" alt="IPL GIF" />
                            ) : (
                               <p className="text-[13px] font-medium leading-tight">{msg.text}</p>
                            )}
                         </div>
                      </div>
                   );
                }
             })}
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5 relative">
             <AnimatePresence>
                {showGifPicker && (
                   <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-4 right-4 mb-4 bg-[#181818] border border-white/10 rounded-2xl p-3 shadow-2xl z-50 overflow-hidden"
                   >
                      <div className="flex items-center justify-between mb-3 px-1">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trending IPL GIFs</span>
                         <button onClick={() => setShowGifPicker(false)} className="text-gray-600 hover:text-white"><X size={12} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                         {[
                            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcTVxNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Lp889j3p4b89u5K9xP/giphy.gif",
                            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1xOyIKmU7Q59F3F6mU/giphy.gif",
                            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lO67xO2X7X8_9K/giphy.gif",
                            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif",
                            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHG5KBAZWLXSNEQ/giphy.gif",
                            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqNXp2Z3RqZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGW8X1yVpMn6w/giphy.gif"
                         ].map((url, i) => (
                            <button 
                               key={i} 
                               onClick={() => {
                                  sendMessage(id, url, 'gif');
                                  setShowGifPicker(false);
                               }}
                               className="rounded-lg overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all active:scale-95"
                            >
                               <img src={url} className="w-full h-24 object-cover" />
                            </button>
                         ))}
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>

             <form 
               onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  sendMessage(id, chatInput);
                  setChatInput('');
               }}
               className="flex gap-2 items-center"
             >
                <button 
                  type="button"
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  className={`w-10 h-10 ${showGifPicker ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'} border border-white/10 rounded-lg flex items-center justify-center text-xs font-black hover:text-white transition-all cursor-pointer`}
                >
                  GIF
                </button>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 flex items-center">
                   <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send a message..." 
                      className="bg-transparent border-none outline-none focus:ring-0 text-sm font-medium flex-1 placeholder:text-gray-700"
                   />
                </div>
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-30 transition-all cursor-pointer"
                >
                   <Send size={18} />
                </button>
             </form>
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
               className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-6 md:p-12 flex flex-col items-center"
            >
               <div className="w-full max-w-6xl flex items-center justify-between mb-8">
                  <div className="flex items-center gap-6">
                     <h2 className="text-2xl md:text-4xl font-black italic tracking-tight uppercase">Mega Auction Roster</h2>
                     <div className="bg-white/5 border border-white/10 rounded-2xl hidden md:flex items-center px-4 py-2 gap-3 w-80">
                        <Search size={16} className="text-gray-500" />
                        <input 
                           type="text" 
                           placeholder="Search by name, role, set..."
                           className="bg-transparent border-none outline-none focus:ring-0 text-sm font-black placeholder:text-gray-700 w-full"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                  </div>
                  <button 
                     onClick={() => setShowPlayersOverlay(false)}
                     className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                     <XCircle size={24} />
                  </button>
               </div>

               <div className="w-full max-w-6xl flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12">
                  {Object.entries(
                     IPL_PLAYERS.reduce((acc, p) => {
                        const s = p.set || 'Other';
                        if (!acc[s]) acc[s] = [];
                        acc[s].push(p);
                        return acc;
                     }, {})
                  ).map(([setName, players]) => {
                     const filtered = players.filter(p => 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        setName.toLowerCase().includes(searchQuery.toLowerCase())
                     );
                     
                     if (filtered.length === 0) return null;

                     return (
                        <div key={setName} className="mb-12">
                           <div className="flex items-center gap-4 mb-6">
                              <div className="h-px flex-1 bg-white/10" />
                              <h3 className="text-sm md:text-xl font-black italic uppercase text-gray-500 tracking-[0.3em]">{setName}</h3>
                              <span className="bg-white/5 text-[10px] px-2 py-0.5 rounded font-black">{filtered.length} Players</span>
                              <div className="h-px flex-1 bg-white/10" />
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                              {filtered.map(p => (
                                 <div key={p.id} className="bg-white/5 border border-white/5 p-3 md:p-4 rounded-3xl hover:bg-white/10 transition-all group flex flex-col items-center text-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:scale-110 transition-transform">
                                       <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                    </div>
                                    <h5 className="text-[10px] md:text-xs font-black truncate w-full">{p.name}</h5>
                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase italic mb-2">{p.role}</span>
                                    <div className="bg-black/40 px-3 py-1 rounded-full border border-white/5 mt-auto">
                                       <span className="text-[9px] md:text-[10px] font-black text-yellow-500">₹{p.basePrice.toFixed(2)} Cr</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })}
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
