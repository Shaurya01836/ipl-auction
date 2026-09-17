import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { db, rtdb } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { ref, onValue, get } from 'firebase/database';
import { collection, query, where, getDocs, doc, getDoc, documentId, limit, orderBy } from 'firebase/firestore';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import {
  Zap,
  Gavel,
  KeyRound,
  Loader2,
  Users,
  Trophy,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Check,
  Star,
  Wallet,
  Wifi,
  Globe,
  GitBranchPlusIcon,
  BookOpen,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GithubStarButton from '../components/GithubStarButton';
import BuyMeACoffee from '../components/BuyMeACoffee';
import AuctionActivityFeed from '../components/AuctionActivityFeed';
import Footer from '../components/Footer';

const LogoMarquee = () => {
  const marqueeTeams = [...TEAMS, ...TEAMS]; // Double for seamless loop
  return (
    <div className="relative overflow-hidden w-full py-12 select-none">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />

      <motion.div
        className="flex gap-12 items-center"
        animate={{ x: [0, -1920] }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {marqueeTeams.map((t, idx) => (
          <div key={`${t.id}-${idx}`} className="flex-shrink-0 group">
            <img
              src={t.logo}
              alt={`${t.name} IPL Logo`}
              className="h-12 md:h-16 w-auto object-contain transition-all duration-500 opacity-40 group-hover:opacity-100 group-hover:scale-110 grayscale group-hover:grayscale-0 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 15
    }
  }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 60,
      damping: 15
    }
  }
};

const LandingPage = () => {
  const [selectedTeam, setSelectedTeam] = useState('MI');
  const [activeTab, setActiveTab] = useState('new');
  const [auctionType, setAuctionType] = useState('mega'); // 'mega' or 'sprint5'
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Public Lobbies state
  const [publicRooms, setPublicRooms] = useState([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // History state
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);

  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');

  const { user, loginWithGoogle, loginAsGuest, logout } = useAuth();
  const { createRoom, joinRoomDb } = useAuction();
  const navigate = useNavigate();

  // Check for URL errors (e.g., from being kicked)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'kicked') {
      setError('ACCESS DENIED: You have been removed from that hub by the host.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch Public Lobbies directly from Supabase (0 RTDB bandwidth download cost)
  useEffect(() => {
    if (!user) return;

    setLobbiesLoading(true);

    const fetchPublicLobbies = async () => {
      try {
        if (supabase) {
          const { data: supabaseRooms, error } = await supabase
            .from('auctions')
            .select('*')
            .eq('status', 'waiting')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(30);

          if (!error && supabaseRooms && supabaseRooms.length > 0) {
            const list = supabaseRooms.map(r => {
              const players = r.players || [];
              const host = players.find(p => p.isHost) || players[0];
              return {
                roomId: r.id,
                hostName: r.host_name || host?.name || 'Manager',
                status: r.status,
                auctionType: r.auction_type || 'mega',
                playerCount: players.length,
                players,
                squadLimit: r.squad_limit || 25,
                settings: r.settings || {}
              };
            });
            setPublicRooms(list);
            setLobbiesLoading(false);
            return;
          }
        }
        setPublicRooms([]);
      } catch (sErr) {
        setPublicRooms([]);
      } finally {
        setLobbiesLoading(false);
      }
    };

    fetchPublicLobbies();
    // Poll every 10 seconds for open rooms without holding heavy listeners
    const interval = setInterval(fetchPublicLobbies, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch auction history directly from Supabase
  // Fetch auction history directly from Supabase
  useEffect(() => {
    if (activeTab !== 'history' || !user?.uid || historyData.length > 0) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        if (supabase) {
          const { data: supabaseTeams, error: tErr } = await supabase
            .from('teams')
            .select('*')
            .eq('user_id', user.uid)
            .order('created_at', { ascending: false });

          if (!tErr && supabaseTeams && supabaseTeams.length > 0) {
            const auctionIds = [...new Set(supabaseTeams.map(t => t.auction_id))].filter(Boolean);

            const { data: supabaseAuctions } = await supabase
              .from('auctions')
              .select('*')
              .in('id', auctionIds);

            const auctionMap = {};
            (supabaseAuctions || []).forEach(a => {
              auctionMap[a.id] = a;
            });

            const sessions = supabaseTeams.map(teamData => {
              const auctionData = auctionMap[teamData.auction_id];
              const totalBudget = auctionData?.settings?.budget || 120;
              const spent = teamData.spent || (totalBudget - (teamData.budget_remaining || totalBudget));

              return {
                id: teamData.id,
                roomId: teamData.auction_id,
                teamId: teamData.team_id,
                teamName: teamData.team_name,
                budgetRemaining: teamData.budget_remaining,
                spent,
                squad: (teamData.squad || []).map(s => {
                  const pid = typeof s === 'string' ? s : s.id;
                  const bid = typeof s === 'string' ? 0 : s.bid;
                  const playerInfo = IPL_PLAYERS.find(p => p.id === pid);
                  return {
                    id: pid,
                    name: playerInfo?.name || pid,
                    role: playerInfo?.role || 'Player',
                    image: playerInfo?.image || '',
                    bid: bid || playerInfo?.basePrice || 0
                  };
                }),
                date: teamData.created_at ? new Date(teamData.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                }) : 'Recent Session'
              };
            });

            setHistoryData(sessions);
            setHistoryLoading(false);
            return;
          }
        }
        setHistoryData([]);
      } catch (err) {
        setHistoryData([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [activeTab, user?.uid]);

  // Filtered public rooms
  const filteredPublicRooms = useMemo(() => {
    return publicRooms.filter(room => {
      const matchesSearch = room.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = filterMode === 'all' || room.auctionType === filterMode;
      return matchesSearch && matchesMode;
    });
  }, [publicRooms, searchQuery, filterMode]);

  // Computed stats
  const historyStats = useMemo(() => {
    if (historyData.length === 0) return null;
    const totalAuctions = historyData.length;
    const totalPlayers = historyData.reduce((s, h) => s + h.squad.length, 0);
    const totalSpent = historyData.reduce((s, h) => s + h.spent, 0);

    const bestBuy = historyData
      .flatMap(h => h.squad)
      .sort((a, b) => (b.bid || 0) - (a.bid || 0))[0];
    return { totalAuctions, totalPlayers, totalSpent, bestBuy };
  }, [historyData]);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleGuestSignIn = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter a name');
      return;
    }
    setIsSubmitting(true);
    try {
      await loginAsGuest(guestName.trim());
      setIsSubmitting(false);
    } catch (err) {
      setError('Guest login failed. Ensure Anonymous Auth is enabled.');
      setTimeout(() => setError(''), 3000);
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const displayName = user.displayName || 'Manager';

      if (activeTab === 'new') {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        await createRoom(newRoomId, user.uid, { name: displayName, team: selectedTeam }, auctionType, isPublicRoom);
        navigate(`/lobby/${newRoomId}`);
      } else if (activeTab === 'join') {
        if (!roomCode) {
          setIsSubmitting(false);
          return;
        }
        const code = roomCode.toUpperCase();
        await joinRoomDb(code, user.uid, { name: displayName, team: '' });
        navigate(`/lobby/${code}`);
      }
    } catch (error) {
      setError(error.message || 'Failed to create/join room. Please try again.');
      setTimeout(() => setError(''), 3000);
      setIsSubmitting(false);
    }
  };

  // ─── Not Signed In: Show Google / Guest Login ───
  if (!user) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-10 px-4 font-sans text-white overflow-x-hidden"
      >
        <GithubStarButton />
        <BuyMeACoffee />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <motion.div
          variants={itemVariants}
          className="relative z-10 flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
        >
          🏏 LIVE IPL AUCTION
        </motion.div>

        <motion.div
          variants={scaleVariants}
          className="text-center mb-4 z-10 relative max-w-3xl px-4"
        >
          <h1 className="sr-only">IPL Auction Simulator & Game - Live IPL Mega Auction 2026</h1>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-extrabold tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            CREATE YOUR
          </div>
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black tracking-tighter text-[#ff5500] leading-none uppercase mt-1 italic drop-shadow-[0_4px_12px_rgba(255,85,0,0.2)]">
            AUCTION ROOM
          </div>

          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto mt-3.5 leading-relaxed">
            The ultimate multiplayer IPL auction simulator and game. Host live IPL mega auctions with friends in real-time, choose your favorite franchise, bid strategically, and build a championship T20 squad.
          </p>

          {/* Three-step visual story */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-5 text-[9px] font-black tracking-widest text-gray-600 uppercase select-none">
            <span className="hover:text-orange-500/80 transition-colors">① Create Room</span>
            <span className="text-gray-800">➔</span>
            <span className="hover:text-orange-500/80 transition-colors">② Invite Friends</span>
            <span className="text-gray-800">➔</span>
            <span className="hover:text-orange-500/80 transition-colors">③ Start Bidding</span>
          </div>
        </motion.div>

        {/* Subtle gradient line / Faded Divider */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 z-10 relative"
        />

        <motion.div
          variants={itemVariants}
          className="w-full max-w-6xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative mt-2"
        >
          {/* Subtle Orange Glow behind panel */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff5500]/[0.02] via-[#ff5500]/[0.01] to-transparent rounded-[2.5rem] blur-xl pointer-events-none -z-10" />
          <div className="absolute -inset-2 bg-gradient-to-r from-[#ff5500]/5 to-[#0088ff]/2 rounded-[2.5rem] blur-3xl opacity-40 pointer-events-none -z-10" />
          <div className="bg-[#0c0c0c] rounded-[2.2rem] border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/5 overflow-hidden">
            {/* Left Side: Live Activity Feed */}
            <div className="lg:col-span-7 w-full flex flex-col p-6 md:p-8 relative">
              <AuctionActivityFeed />
            </div>

            {/* Right Side: Welcome Login Form */}
            <div className="lg:col-span-5 w-full p-8 md:p-10 flex flex-col items-center justify-center">
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">
                {isGuestMode ? 'Guest Access' : 'Welcome, Manager'}
              </h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">
                {isGuestMode ? 'Enter a name to join' : 'Sign in to enter the auction hub'}
              </p>

              {!isGuestMode ? (
                <div className="w-full space-y-4">
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                    <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                      <svg viewBox="0 0 24 24" width="18" height="18" className="fill-white">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </div>
                  </button>

                  <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                    <span className="relative bg-[#0c0c0c] px-4 text-[9px] font-black text-gray-700 uppercase tracking-widest italic">Wait, I'm a guest</span>
                  </div>

                  <button
                    onClick={() => setIsGuestMode(true)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-black uppercase tracking-[0.2rem] text-xs cursor-pointer active:scale-[0.98]"
                  >
                    <Users size={18} /> Join as Guest
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGuestSignIn} className="w-full space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Your Manager Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. MS Dhoni"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black uppercase text-sm tracking-widest placeholder:text-gray-800 focus:outline-none focus:border-orange-500/50 transition-all"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                    <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Start Auction Hub</span>}
                      {!isSubmitting && <ChevronRight size={18} className="group-hover/submit:translate-x-1 transition-transform" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGuestMode(false)}
                    className="w-full text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-[0.3em] transition-colors mt-2"
                  >
                    ← Back to Google Login
                  </button>
                </form>
              )}

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-red-500 font-bold">{error}</motion.p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="w-full max-w-6xl mt-12 mb-4"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-white/10" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Official Franchises</span>
            <div className="h-px w-12 bg-white/10" />
          </div>
          <LogoMarquee />
        </motion.div>

        <Footer />
      </motion.div>
    );
  }

  // ─── Signed In: Show Create / Join / History ───
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-10 px-4 font-sans text-white overflow-x-hidden"
    >
      <GithubStarButton />
      <BuyMeACoffee />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Top Badge */}
      <motion.div
        variants={itemVariants}
        className="relative z-10 flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
      >
        🏏 LIVE IPL AUCTION
      </motion.div>

      {/* Hero */}
      <motion.div
        variants={scaleVariants}
        className="text-center mb-4 z-10 relative max-w-3xl px-4"
      >
        <h1 className="sr-only">IPL Auction Simulator & Game - Live IPL Mega Auction 2026</h1>
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-extrabold tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          CREATE YOUR
        </div>
        <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black tracking-tighter text-[#ff5500] leading-none uppercase mt-1 italic drop-shadow-[0_4px_12px_rgba(255,85,0,0.2)]">
          AUCTION ROOM
        </div>

        <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto mt-3.5 leading-relaxed">
          The ultimate multiplayer IPL auction simulator and game. Host live IPL mega auctions with friends in real-time, choose your favorite franchise, bid strategically, and build a championship T20 squad.
        </p>


        {/* Three-step visual story */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mt-5 text-[9px] font-black tracking-widest text-gray-600 uppercase select-none">
          <span className="hover:text-orange-500/80 transition-colors">① Create Room</span>
          <span className="text-gray-800">➔</span>
          <span className="hover:text-orange-500/80 transition-colors">② Invite Friends</span>
          <span className="text-gray-800">➔</span>
          <span className="hover:text-orange-500/80 transition-colors">③ Start Bidding</span>
        </div>
      </motion.div>

      {/* Subtle gradient line / Faded Divider */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 z-10 relative"
      />

      <motion.div
        variants={itemVariants}
        className="w-full max-w-6xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative mt-2"
      >
        {/* Subtle Orange Glow behind panel */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff5500]/[0.02] via-[#ff5500]/[0.01] to-transparent rounded-[2.5rem] blur-xl pointer-events-none -z-10" />
        <div className="absolute -inset-2 bg-gradient-to-r from-[#ff5500]/5 to-[#0088ff]/2 rounded-[2.5rem] blur-3xl opacity-40 pointer-events-none -z-10" />
        <div className="bg-[#0c0c0c] rounded-[2.2rem] border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/5 overflow-hidden">
          {/* Left Side: Live signings */}
          <div className="lg:col-span-5 w-full flex flex-col p-6 md:p-8 relative">
            <AuctionActivityFeed />
          </div>

          {/* Right Side: Create/Join/History form */}
          <div className="lg:col-span-7 w-full p-6 md:p-8 flex flex-col">

            {/* Flat Tab Bar Navigation: Create / Join / History */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 mb-8 gap-4">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className={`pb-3.5 px-6 font-black text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 relative ${activeTab === 'new'
                    ? 'border-[#ff5500] text-[#ff5500]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('join')}
                  className={`pb-3.5 px-6 font-black text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 relative flex items-center gap-1.5 ${activeTab === 'join'
                    ? 'border-[#ff5500] text-[#ff5500]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  <span>Join</span>
                  {publicRooms.length > 0 && (
                    <span className="bg-[#ff5500]/20 text-[#ff5500] text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                      {publicRooms.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`pb-3.5 px-6 font-black text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 relative ${activeTab === 'history'
                    ? 'border-[#ff5500] text-[#ff5500]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  History
                </button>
              </div>

              {/* User Profile and Logout */}
              <div className="flex items-center gap-3 pb-3.5 px-6 sm:px-0 self-start sm:self-auto">
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full border border-white/20" />
                )}
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{user.displayName}</span>
                <button
                  onClick={logout}
                  className="px-2.5 py-1 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-[9px] font-black text-gray-400 hover:text-red-400 uppercase tracking-widest transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── CREATE TAB ─── */}
              {activeTab === 'new' && (
                <motion.form
                  key="create-tab"
                  onSubmit={handleFormSubmit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="mb-4 ml-1">
                      <h4 className="text-[13px] font-black uppercase text-gray-400 tracking-wider">Franchise</h4>
                      <p className="text-[11px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">Choose the team you'll manage.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {TEAMS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTeam(t.id)}
                          className={`relative group/team flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${selectedTeam === t.id
                            ? 'bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                            : 'bg-[#151515] border border-transparent hover:bg-white/[0.04]'
                            }`}
                        >
                          {selectedTeam === t.id && (
                            <div className="absolute top-2.5 right-2.5 text-white">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                          <div className={`w-12 h-12 rounded-2xl bg-white/5 p-1.5 flex items-center justify-center mb-2 transition-transform duration-200 ${selectedTeam === t.id ? 'scale-105' : 'group-hover/team:scale-105'}`}>
                            <img src={t.logo} alt={`${t.name} Logo`} className="w-full h-full object-contain filter" />
                          </div>
                          <span className={`text-[8px] font-black uppercase text-center tracking-tighter truncate w-full ${selectedTeam === t.id ? 'text-white' : 'text-gray-500'}`}>
                            {t.name.split(' ').slice(0, 1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 ml-1">
                      <h4 className="text-[13px] font-black uppercase text-gray-400 tracking-wider">Mode</h4>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setAuctionType('mega')}
                        className={`flex-1 p-4 rounded-2xl transition-all duration-200 text-left relative overflow-hidden group/mode ${auctionType === 'mega'
                          ? 'bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                          : 'bg-[#151515] border border-transparent hover:bg-white/[0.04]'
                          }`}
                      >
                        {auctionType === 'mega' && (
                          <div className="absolute top-3.5 right-3.5 text-white"><Check size={12} strokeWidth={3} /></div>
                        )}
                        <div className="flex items-center gap-2 mb-1.5">
                          <Trophy size={14} className={auctionType === 'mega' ? 'text-white' : 'text-gray-600'} />
                          <span className={`text-[10px] font-black uppercase tracking-tight ${auctionType === 'mega' ? 'text-white' : 'text-gray-500'}`}>Mega Auction</span>
                        </div>
                        <div className="space-y-0.5 text-[8px] font-bold text-gray-600 uppercase tracking-wide">
                          <div>25 Players</div>
                          <div>₹120 Cr Budget</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuctionType('sprint11')}
                        className={`flex-1 p-4 rounded-2xl transition-all duration-200 text-left relative overflow-hidden group/mode ${auctionType === 'sprint11'
                          ? 'bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                          : 'bg-[#151515] border border-transparent hover:bg-white/[0.04]'
                          }`}
                      >
                        {auctionType === 'sprint11' && (
                          <div className="absolute top-3.5 right-3.5 text-white"><Check size={12} strokeWidth={3} /></div>
                        )}
                        <div className="flex items-center gap-2 mb-1.5">
                          <Star size={14} className={auctionType === 'sprint11' ? 'text-white' : 'text-gray-600'} />
                          <span className={`text-[10px] font-black uppercase tracking-tight ${auctionType === 'sprint11' ? 'text-white' : 'text-gray-500'}`}>11-Player Classic</span>
                        </div>
                        <div className="space-y-0.5 text-[8px] font-bold text-gray-600 uppercase tracking-wide">
                          <div>11 Players</div>
                          <div>₹90 Cr Budget</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuctionType('sprint5')}
                        className={`flex-1 p-4 rounded-2xl transition-all duration-200 text-left relative overflow-hidden group/mode ${auctionType === 'sprint5'
                          ? 'bg-[#1b1b1b] border border-white/[0.12] scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                          : 'bg-[#151515] border border-transparent hover:bg-white/[0.04]'
                          }`}
                      >
                        {auctionType === 'sprint5' && (
                          <div className="absolute top-3.5 right-3.5 text-white"><Check size={12} strokeWidth={3} /></div>
                        )}
                        <div className="flex items-center gap-2 mb-1.5">
                          <Zap size={14} className={auctionType === 'sprint5' ? 'text-white' : 'text-gray-600'} fill={auctionType === 'sprint5' ? 'currentColor' : 'none'} />
                          <span className={`text-[10px] font-black uppercase tracking-tight ${auctionType === 'sprint5' ? 'text-white' : 'text-gray-500'}`}>5-Player Sprint</span>
                        </div>
                        <div className="space-y-0.5 text-[8px] font-bold text-gray-600 uppercase tracking-wide">
                          <div>5 Players</div>
                          <div>₹60 Cr Budget</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Room Visibility Toggle */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                        Public Room Visibility
                      </h4>
                      <p className="text-[9px] text-gray-500 font-medium">
                        {isPublicRoom ? 'Listed in the Public Rooms Directory for anyone to join' : 'Private room — accessible only via Room Code link'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPublicRoom(!isPublicRoom)}
                      className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                        isPublicRoom ? 'bg-orange-600 justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-4 h-4 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                      <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-xs">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Start Auction</span><ChevronRight size={16} className="group-hover/submit:translate-x-1 transition-transform" /></>}
                      </div>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ─── JOIN TAB ─── */}
              {activeTab === 'join' && (
                <motion.div
                  key="join-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="relative group">
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Access Token / Room Code</label>
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/50 transition-all text-white font-black uppercase tracking-[0.5em] text-center text-lg placeholder:tracking-normal placeholder:text-xs placeholder:text-gray-700"
                        placeholder="Enter Room Code"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !roomCode.trim()}
                      className="w-full h-12 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                      <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-xs">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Join by Code</span><ChevronRight size={16} className="group-hover/submit:translate-x-1 transition-transform" /></>}
                      </div>
                    </button>
                  </form>

                  <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                    <span className="relative bg-[#0c0c0c] px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                       Or join a public lobby
                    </span>
                  </div>

                  {/* Public Lobbies Directory Section */}
                  <div className="space-y-3 pt-1">
                    {/* Responsive Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                      <div className="relative w-full sm:flex-1">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search room code or manager..."
                          className="w-full bg-white/[0.03] border border-white/10 focus:border-orange-500/50 rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs text-white placeholder:text-gray-600 focus:outline-none transition-all font-medium"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto custom-scrollbar no-scrollbar py-0.5">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'mega', label: 'Mega' },
                          { id: 'sprint11', label: '11-Classic' },
                          { id: 'sprint5', label: '5-Sprint' }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setFilterMode(mode.id)}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                              filterMode === mode.id
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-transparent text-gray-500 hover:text-gray-300 border border-transparent'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Responsive Lobbies Directory List */}
                    {lobbiesLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <Loader2 size={18} className="animate-spin mb-2 text-orange-500" />
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">Scanning active rooms...</p>
                      </div>
                    ) : filteredPublicRooms.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">No Active Public Lobbies</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-600 font-medium">No open public rooms right now. Create one to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[260px] sm:max-h-[310px] overflow-y-auto custom-scrollbar pr-0.5">
                        {filteredPublicRooms.map((room) => (
                          <div
                            key={room.roomId}
                            className="p-2.5 sm:p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 flex flex-row items-center justify-between gap-2 sm:gap-3 group"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              {/* Clean Room Code Pill */}
                              <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-black text-[10px] sm:text-xs tracking-wider shrink-0">
                                {room.roomId}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-tight truncate max-w-[110px] xs:max-w-[160px] sm:max-w-none">
                                    {room.hostName}'s Arena
                                  </h4>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Lobby Open" />
                                </div>

                                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-500 font-medium mt-0.5 truncate">
                                  <span className="flex items-center gap-0.5 sm:gap-1 text-gray-400 font-bold shrink-0">
                                    <Users size={10} className="text-orange-500/80" />
                                    {room.playerCount}/10
                                  </span>
                                  <span className="shrink-0">•</span>
                                  <span className="text-gray-400 truncate">
                                    {room.auctionType === 'sprint5' ? '5-Sprint' : room.auctionType === 'sprint11' ? '11-Classic' : 'Mega'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const displayName = user.displayName || 'Manager';
                                joinRoomDb(room.roomId, user.uid, { name: displayName, team: '' });
                                navigate(`/lobby/${room.roomId}`);
                              }}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                            >
                              <span>Join</span>
                              <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─── HISTORY TAB ─── */}
              {activeTab === 'history' && (
                <motion.div
                  key="history-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">Syncing Database...</p>
                    </div>
                  ) : historyData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-white/5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center mb-4">
                        <History size={28} className="text-gray-700" />
                      </div>
                      <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">No Auctions Yet</h4>
                      <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Create or join a room to start bidding!</p>
                    </div>
                  ) : (
                    <>
                      {/* Session List */}
                      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {historyData.map((session) => {
                          const teamMeta = TEAMS.find(t => t.id === session.teamId);
                          const isExpanded = expandedSession === session.id;
                          const overseasCount = session.squad.filter(p => p?.country !== 'IND').length;

                          return (
                            <div key={session.id} className="space-y-1">
                              <button
                                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                                className={`w-full text-left p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${isExpanded ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/[0.03] border-white/5 hover:bg-white/5'
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1 sm:p-1.5 flex items-center justify-center shrink-0">
                                    <img src={teamMeta?.logo} alt={`${teamMeta?.name || 'Team'} Logo`} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="text-xs sm:text-sm font-black uppercase tracking-tight truncate">{teamMeta?.name || session.teamName}</h5>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5">
                                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Room: {session.roomId}</span>
                                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${session.mode === 'mega' ? 'bg-orange-500/10 text-orange-500'
                                        : session.mode === 'sprint11' ? 'bg-yellow-500/10 text-yellow-500'
                                          : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {session.mode}
                                      </span>
                                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${session.status === 'completed' ? 'bg-green-500/10 text-green-500'
                                        : session.status === 'active' ? 'bg-yellow-500/10 text-yellow-500'
                                          : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {session.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
                                  <div className="text-right">
                                    <span className="text-[10px] sm:text-xs font-black italic text-yellow-500 block">₹{session.spent.toFixed(1)} Cr</span>
                                    <span className="block text-[7px] sm:text-[8px] font-bold text-gray-500">{session.squad.length} players</span>
                                  </div>
                                  <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </button>

                              {/* Expanded Squad */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-[#111] border border-white/5 rounded-2xl p-3 sm:p-4 space-y-3 mt-1">
                                      {/* Quick Stats */}
                                      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 text-[8px] sm:text-[9px] font-black uppercase tracking-tight px-1.5 py-1 bg-white/[0.02] rounded-xl border border-white/5">
                                        <span className="text-gray-400">Budget Left: <span className="text-green-400">₹{session.budgetRemaining?.toFixed(1)} Cr</span></span>
                                        <span className="text-gray-400">Overseas: <span className="text-purple-400">{overseasCount}/8</span></span>
                                        <span className="text-gray-400">Squad: <span className="text-white">{session.squad.length}/25</span></span>
                                      </div>

                                      {/* Players by Role */}
                                      {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                                        const rolePlayers = session.squad.filter(p => p?.role === role);
                                        if (rolePlayers.length === 0) return null;

                                        return (
                                          <div key={role}>
                                            <div className="flex items-center gap-2 px-1 mb-1.5">
                                              <span className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase tracking-widest">{role}s</span>
                                              <div className="flex-1 h-px bg-white/5" />
                                              <span className="text-[8px] font-black text-gray-600">{rolePlayers.length}</span>
                                            </div>
                                            <div className="space-y-1">
                                              {rolePlayers.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/5 transition-all p-2 sm:p-2.5 rounded-xl">
                                                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                                    <img src={p?.image} alt={p?.name} className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded-md bg-white/5 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                      <h6 className="text-[10px] sm:text-[11px] font-black leading-tight truncate">{p?.name}</h6>
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="text-[7px] font-bold text-gray-500 uppercase">{p?.type}</span>
                                                        {p?.country !== 'IND' && <Wifi size={8} className="text-purple-400 rotate-90 shrink-0" />}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <span className="text-[9px] sm:text-[10px] font-black italic text-yellow-500 shrink-0">₹{(p?.bid || 0).toFixed(2)} Cr</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {session.squad.length === 0 && (
                                        <p className="text-center text-[10px] text-gray-600 font-bold py-4 uppercase">No players acquired in this session</p>
                                      )}

                                      {/* View Full Summary / Resume Auction Button */}
                                      {session.status === 'completed' ? (
                                        <button
                                          onClick={() => navigate(`/summary/${session.roomId}`)}
                                          className="w-full mt-2 py-2.5 sm:py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                          <Trophy size={12} /> View Full Summary
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => navigate(`/lobby/${session.roomId}`)}
                                          className="w-full mt-2 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                          <Zap size={12} /> Resume / Join Auction
                                        </button>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-red-500 font-bold text-center">{error}</motion.p>
            )}
          </div>
        </div>
      </motion.div>

      <Footer />
    </motion.div>
  );
};

export default LandingPage;