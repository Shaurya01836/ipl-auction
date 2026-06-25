import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import {
  Zap,
  Gavel,
  KeyRound,
  Loader2,
  Users,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Check,
  Star,
  History,
  Trophy,
  Wallet,
  Wifi,
  Globe,
  GitBranchPlusIcon
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

const LandingPage = () => {
  const [selectedTeam, setSelectedTeam] = useState('MI');
  const [activeTab, setActiveTab] = useState('new');
  const [auctionType, setAuctionType] = useState('mega'); // 'mega' or 'sprint5'
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  // Fetch auction history when user switches to history tab
  useEffect(() => {
    if (activeTab !== 'history' || !user?.uid) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const teamsQuery = query(
          collection(db, 'teams'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(teamsQuery);

        // Extract unique auction IDs
        const teamDocsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const auctionIds = [...new Set(teamDocsData.map(t => t.auctionId))].filter(Boolean);

        // Fetch auction room metadata in batches of 30
        const auctionDataMap = {};
        for (let i = 0; i < auctionIds.length; i += 30) {
          const chunk = auctionIds.slice(i, i + 30);
          const auctionsQuery = query(
            collection(db, 'auctions'),
            where(documentId(), 'in', chunk)
          );
          const auctionsSnap = await getDocs(auctionsQuery);
          auctionsSnap.forEach(d => {
            auctionDataMap[d.id] = d.data();
          });
        }

        // Map team documents with pre-fetched auction metadata
        const sessions = teamDocsData.map((teamData) => {
          const auctionData = auctionDataMap[teamData.auctionId];
          const totalBudget = auctionData?.settings?.budget || 120;
          const spent = totalBudget - (teamData.budgetRemaining || totalBudget);

          return {
            id: teamData.id,
            roomId: teamData.auctionId,
            teamId: teamData.teamId,
            teamName: teamData.teamName,
            budgetRemaining: teamData.budgetRemaining,
            spent,
            squad: (teamData.squad || []).map(s => {
              const pid = typeof s === 'string' ? s : s.id;
              const bid = typeof s === 'string' ? 0 : s.bid;
              const playerInfo = IPL_PLAYERS.find(p => p.id === pid);
              return { ...playerInfo, bid };
            }),
            status: auctionData?.status || 'unknown',
            mode: auctionData?.auctionType || 'mega',
            playerCount: auctionData?.players?.length || 0,
            createdAt: teamData.createdAt || auctionData?.createdAt || null
          };
        });

        // Sorting: Strictly Time (latest first)
        sessions.sort((a, b) => {
          const timeA = a.createdAt?.seconds || a.createdAt?._seconds || 0;
          const timeB = b.createdAt?.seconds || b.createdAt?._seconds || 0;
          return timeB - timeA;
        });
        setHistoryData(sessions);
      } catch (err) {
        // Failed to fetch history
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [activeTab, user?.uid]);

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
        await createRoom(newRoomId, user.uid, { name: displayName, team: selectedTeam }, auctionType);
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
      <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-10 px-4 font-sans text-white overflow-x-hidden">
        <GithubStarButton />
        <BuyMeACoffee />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
        >
          🏏 LIVE IPL AUCTION
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-4 z-10 relative max-w-3xl px-4"
        >
          <h1 className="sr-only">IPL Mega Auction Simulation Game</h1>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-extrabold tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            CREATE YOUR
          </div>
          <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black tracking-tighter text-[#ff5500] leading-none uppercase mt-1 italic drop-shadow-[0_4px_12px_rgba(255,85,0,0.2)]">
            AUCTION ROOM
          </div>

          <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto mt-3.5 leading-relaxed">
            Host live IPL auctions with friends. Choose a franchise, bid in real time, and build your championship squad.
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
        <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 z-10 relative" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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
      </div>
    );
  }

  // ─── Signed In: Show Create / Join / History ───
  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-10 px-4 font-sans text-white overflow-x-hidden">
      <GithubStarButton />
      <BuyMeACoffee />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Top Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
      >
        🏏 LIVE IPL AUCTION
      </motion.div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-4 z-10 relative max-w-3xl px-4"
      >
        <h1 className="sr-only">IPL Mega Auction Simulation Game</h1>
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-extrabold tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          CREATE YOUR
        </div>
        <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black tracking-tighter text-[#ff5500] leading-none uppercase mt-1 italic drop-shadow-[0_4px_12px_rgba(255,85,0,0.2)]">
          AUCTION ROOM
        </div>

        <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xl mx-auto mt-3.5 leading-relaxed">
          Host live IPL auctions with friends. Choose a franchise, bid in real time, and build your championship squad.
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
      <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4 z-10 relative" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                  className={`pb-3.5 px-6 font-black text-[11px] uppercase tracking-wider transition-all duration-200 border-b-2 relative ${activeTab === 'join'
                    ? 'border-[#ff5500] text-[#ff5500]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  Join
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
                  className="space-y-8"
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

                  <div className="pt-4 mt-6">
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
                <motion.form
                  key="join-tab"
                  onSubmit={handleFormSubmit}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="relative group">
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Access Token</label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500/50 transition-all text-white font-black uppercase tracking-[0.5em] text-center text-lg placeholder:tracking-normal placeholder:text-xs placeholder:text-gray-700"
                      placeholder="Enter Room Code"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                    <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><KeyRound size={16} /><span>Enter Portal</span><ChevronRight size={18} className="group-hover/submit:translate-x-1 transition-transform" /></>}
                    </div>
                  </button>
                </motion.form>
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
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${isExpanded ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/[0.03] border-white/5 hover:bg-white/5'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center shadow-2xl relative`}>
                                    <img src={teamMeta?.logo} alt={`${teamMeta?.name || 'Team'} Logo`} className="w-full h-full object-contain" />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-black uppercase tracking-tight">{teamMeta?.name || session.teamName}</h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Room: {session.roomId}</span>
                                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${session.mode === 'mega' ? 'bg-orange-500/10 text-orange-500'
                                        : session.mode === 'sprint11' ? 'bg-yellow-500/10 text-yellow-500'
                                          : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {session.mode}
                                      </span>
                                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${session.status === 'completed' ? 'bg-green-500/10 text-green-500'
                                        : session.status === 'active' ? 'bg-yellow-500/10 text-yellow-500'
                                          : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {session.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <span className="text-[10px] sm:text-xs font-black italic text-yellow-500">₹{session.spent.toFixed(1)} Cr</span>
                                    <span className="block text-[7px] sm:text-[8px] font-bold text-gray-600">{session.squad.length} players</span>
                                  </div>
                                  <ChevronDown size={16} className={`text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
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
                                    <div className="bg-[#111] border border-white/5 rounded-2xl p-4 space-y-3 mt-1">
                                      {/* Quick Stats */}
                                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-tight px-2">
                                        <span className="text-gray-500">Budget Left: <span className="text-green-500">₹{session.budgetRemaining?.toFixed(1)} Cr</span></span>
                                        <span className="text-gray-500">Overseas: <span className="text-purple-400">{overseasCount}/8</span></span>
                                        <span className="text-gray-500">Squad: <span className="text-white">{session.squad.length}/25</span></span>
                                      </div>

                                      {/* Players by Role */}
                                      {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                                        const rolePlayers = session.squad.filter(p => p?.role === role);
                                        if (rolePlayers.length === 0) return null;

                                        return (
                                          <div key={role}>
                                            <div className="flex items-center gap-2 px-2 mb-2">
                                              <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">{role}s</span>
                                              <div className="flex-1 h-px bg-white/5" />
                                              <span className="text-[8px] font-black text-gray-700">{rolePlayers.length}</span>
                                            </div>
                                            <div className="space-y-1">
                                              {rolePlayers.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/5 transition-all p-2.5 rounded-xl">
                                                  <div className="flex items-center gap-2.5">
                                                    <img src={p?.image} alt={p?.name} className="w-7 h-7 object-contain rounded-md bg-white/5" />
                                                    <div>
                                                      <h6 className="text-[10px] font-black leading-tight">{p?.name}</h6>
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="text-[7px] font-bold text-gray-500 uppercase">{p?.type}</span>
                                                        {p?.country !== 'IND' && <Wifi size={8} className="text-purple-400 rotate-90" />}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <span className="text-[10px] font-black italic text-yellow-500">₹{(p?.bid || 0).toFixed(2)} Cr</span>
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
                                          className="w-full mt-2 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
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
    </div>
  );
};

export default LandingPage;