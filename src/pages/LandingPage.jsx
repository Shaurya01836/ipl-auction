import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
  Star,
  History,
  Trophy,
  Wallet,
  Wifi,
  Globe,
  GitBranchPlusIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        
        const sessions = await Promise.all(
          snapshot.docs.map(async (teamDoc) => {
            const teamData = teamDoc.data();
            
            // Fetch auction room metadata
            let auctionData = null;
            try {
              const auctionSnap = await getDoc(doc(db, 'auctions', teamData.auctionId));
              if (auctionSnap.exists()) {
                auctionData = auctionSnap.data();
              }
            } catch (e) {
              // Room may have been deleted
            }

            const totalBudget = auctionData?.settings?.budget || 120;
            const spent = totalBudget - (teamData.budgetRemaining || totalBudget);
            
            return {
              id: teamDoc.id,
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
          })
        );
        
        // Sorting: Strictly Time (latest first)
        sessions.sort((a, b) => {
          const timeA = a.createdAt?.seconds || a.createdAt?._seconds || 0;
          const timeB = b.createdAt?.seconds || b.createdAt?._seconds || 0;
          return timeB - timeA;
        });
        setHistoryData(sessions);
      } catch (err) {
        console.error('Failed to fetch history:', err);
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
      console.error('Google sign-in failed:', err);
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
    } catch (err) {
      console.error('Guest sign-in failed:', err);
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
      console.error("Action failed:", error.code, error.message);
      setError(error.message || 'Failed to create/join room. Please try again.');
      setTimeout(() => setError(''), 3000);
      setIsSubmitting(false);
    }
  };

  // ─── Not Signed In: Show Google / Guest Login ───
  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-10 px-4 font-sans text-white overflow-x-hidden">
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
        >
          <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping" />
          <Gavel size={12} strokeWidth={3} /> IPL Auction Live
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-10 z-10 relative"
        >
          <h1 className="sr-only">IPL Mega Auction Simulation Game</h1>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-1 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 leading-tight">
            BUILD YOUR
          </div>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#ff5500] italic leading-tight uppercase">
            Dream Team
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1.5"><Users size={12} /> Multiplayer</span>
            <span className="w-0.5 h-0.5 bg-gray-700 rounded-full" />
            <span className="flex items-center gap-1.5"><Zap size={12} /> Real-time</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-[2rem] p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative"
        >
          <div className="bg-[#0c0c0c] rounded-[1.75rem] p-8 md:p-10 border border-white/5 flex flex-col items-center">
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

        <footer className="mt-32 mb-16 flex flex-col items-center z-10 w-full px-4 border-t border-white/5 pt-16">
        <div className="relative z-10 w-full max-w-xl">
          {/* Minimal Developer Showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center gap-8"
          >
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] leading-none mb-1">Developed & Designed by</p>
              <a 
                href="https://shaurya-upadhyay.me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:scale-[1.02] transition-transform duration-500"
              >
                <h3 className="text-2xl md:text-3xl font-black font-black text-gray-600 ">
                  SHAURYA UPADHYAY
                </h3>
              </a>
            </div>

            <div className="flex gap-4">
              {[
                { icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>, href: "https://github.com/Shaurya01836", label: "GitHub" },
                { icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, href: "https://shaurya-upadhyay.me", label: "Portfolio" },
                { icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, href: "https://www.linkedin.com/in/this-is-shaurya-upadhyay/", label: "LinkedIn" }
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5, scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300"
                  title={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>

            <motion.a
              href="https://shaurya-upadhyay.me"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ opacity: 0.7 }}
              className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] mt-2 block"
            >
              Building the Future of Auction Simulation
            </motion.a>
          </motion.div>
        </div>
      </footer>
      </div>
    );
  }

  // ─── Signed In: Show Create / Join / History ───
  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-10 px-4 font-sans text-white overflow-x-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Top Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
      >
        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping" />
        <Gavel size={12} strokeWidth={3} /> IPL Auction Live
      </motion.div>

      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8 z-10 relative"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-1 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 leading-tight">
          BUILD YOUR
        </h1>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#ff5500] italic leading-tight">
          DREAM TEAM
        </h1>
        <div className="mt-2 flex items-center justify-center gap-4 text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">
          <span className="flex items-center gap-1.5"><Users size={12} /> Multiplayer</span>
          <span className="w-0.5 h-0.5 bg-gray-700 rounded-full" />
          <span className="flex items-center gap-1.5"><Zap size={12} /> Real-time</span>
        </div>
      </motion.div>

      {/* Signed-in user badge */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6 backdrop-blur-md"
      >
        {user.photoURL && (
          <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full border border-white/20" />
        )}
        <span className="text-sm font-black text-white">{user.displayName}</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <button 
          onClick={logout}
          className="ml-1 px-3 py-1 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-[9px] font-black text-gray-400 hover:text-red-400 uppercase tracking-widest transition-all cursor-pointer"
        >
          Logout
        </button>
      </motion.div>

      {/* Main Action Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-[2rem] p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative"
      >
        <div className="bg-[#0c0c0c] rounded-[1.75rem] p-6 md:p-8 border border-white/5 relative">
          
          {/* 3-Tab Navigation: Create / Join / History */}
          <div className="flex bg-white/5 p-1 rounded-xl mb-6">
            <button 
              type="button"
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-3 rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                activeTab === 'new' 
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Zap size={14} fill={activeTab === 'new' ? 'white' : 'none'} /> Create
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-3 rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                activeTab === 'join' 
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <KeyRound size={14} /> Join
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                activeTab === 'history' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <History size={14} /> History
            </button>
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
                  <div className="flex items-center justify-between mb-4 ml-1">
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Select Franchise</label>
                    <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded italic flex items-center gap-1">
                       <Star size={10} fill="currentColor" /> CHOOSE WISELY
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {TEAMS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTeam(t.id)}
                        className={`relative group/team flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border ${
                          selectedTeam === t.id 
                            ? 'border-yellow-400 bg-white/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]' 
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        {selectedTeam === t.id && (
                          <motion.div 
                            layoutId="sel-badge"
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center z-20 shadow-lg shadow-yellow-400/20"
                          >
                            <CheckCircle2 size={10} className="text-black" />
                          </motion.div>
                        )}
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 p-1.5 flex items-center justify-center mb-2 transition-all duration-300 ${selectedTeam === t.id ? 'scale-110 border-yellow-400/50 shadow-lg' : 'group-hover/team:scale-105 opacity-60 group-hover/team:opacity-100'}`}>
                          <img src={t.logo} alt={`${t.name} Logo`} className="w-full h-full object-contain filter" />
                        </div>
                        <span className={`text-[8px] font-black uppercase text-center tracking-tighter truncate w-full ${selectedTeam === t.id ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {t.name.split(' ').slice(0, 1)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 ml-1">
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Auction Mode</label>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setAuctionType('mega')}
                      className={`flex-1 p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group/mode ${
                        auctionType === 'mega' 
                          ? 'border-orange-500 bg-orange-500/5' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {auctionType === 'mega' && (
                        <div className="absolute top-0 right-0 p-2"><CheckCircle2 size={12} className="text-orange-500" /></div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy size={14} className={auctionType === 'mega' ? 'text-orange-500' : 'text-gray-600'} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${auctionType === 'mega' ? 'text-white' : 'text-gray-500'}`}>Mega Auction</span>
                      </div>
                      <p className="text-[8px] font-bold text-gray-600 uppercase leading-tight">25 Players • Max 8 Overseas • 120 Cr Budget</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuctionType('sprint11')}
                      className={`flex-1 p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group/mode ${
                        auctionType === 'sprint11' 
                          ? 'border-yellow-500 bg-yellow-500/5' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {auctionType === 'sprint11' && (
                        <div className="absolute top-0 right-0 p-2"><CheckCircle2 size={12} className="text-yellow-500" /></div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={14} className={auctionType === 'sprint11' ? 'text-yellow-500' : 'text-gray-600'} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${auctionType === 'sprint11' ? 'text-white' : 'text-gray-500'}`}>11-Player Classic</span>
                      </div>
                      <p className="text-[8px] font-bold text-gray-600 uppercase leading-tight">11 Players • Max 4 Overseas • 90 Cr Budget</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuctionType('sprint5')}
                      className={`flex-1 p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group/mode ${
                        auctionType === 'sprint5' 
                          ? 'border-blue-500 bg-blue-500/5' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {auctionType === 'sprint5' && (
                        <div className="absolute top-0 right-0 p-2"><CheckCircle2 size={12} className="text-blue-500" /></div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className={auctionType === 'sprint5' ? 'text-blue-500' : 'text-gray-600'} fill={auctionType === 'sprint5' ? 'currentColor' : 'none'} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${auctionType === 'sprint5' ? 'text-white' : 'text-gray-500'}`}>5-Player Sprint</span>
                      </div>
                      <p className="text-[8px] font-bold text-gray-600 uppercase leading-tight">5 Players • Max 2 Overseas • 60 Cr Budget</p>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
                  <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Zap size={16} fill="white" /><span>Initialize Hub</span><ChevronRight size={18} className="group-hover/submit:translate-x-1 transition-transform" /></>}
                  </div>
                </button>
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
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                                isExpanded ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/[0.03] border-white/5 hover:bg-white/5'
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
                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                                      session.mode === 'mega' ? 'bg-orange-500/10 text-orange-500' 
                                      : session.mode === 'sprint11' ? 'bg-yellow-500/10 text-yellow-500' 
                                      : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                      {session.mode}
                                    </span>
                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                                      session.status === 'completed' ? 'bg-green-500/10 text-green-500' 
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
      </motion.div>

      <footer className="mt-32 mb-16 flex flex-col items-center z-10 w-full px-4 border-t border-white/5 pt-16">
        <div className="relative z-10 w-full max-w-xl">
          {/* Minimal Developer Showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center gap-8"
          >
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] leading-none mb-1">Developed & Designed by</p>
              <a 
                href="https://shaurya-upadhyay.me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:scale-[1.02] transition-transform duration-500"
              >
                <h3 className="text-2xl md:text-3xl font-black font-black text-gray-600 ">
                  SHAURYA UPADHYAY
                </h3>
              </a>
            </div>

            <div className="flex gap-4">
              {[
                { icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>, href: "https://github.com/Shaurya01836", label: "GitHub" },
                { icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, href: "https://shaurya-upadhyay.me", label: "Portfolio" },
                { icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, href: "https://www.linkedin.com/in/this-is-shaurya-upadhyay/", label: "LinkedIn" }
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300"
                  title={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>

            <motion.a
              href="https://shaurya-upadhyay.me"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ opacity: 0.7 }}
              className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] mt-2 block"
            >
              Building the Future of Auction Simulation
            </motion.a>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;