import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { 
  Zap, 
  Gavel, 
  KeyRound, 
  Loader2, 
  Users, 
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TEAMS = [
  { id: 'MI', name: 'Mumbai Indians', color: 'bg-blue-600', textColor: 'text-white' },
  { id: 'CSK', name: 'Chennai Super Kings', color: 'bg-yellow-400', textColor: 'text-black' },
  { id: 'RCB', name: 'Royal Challengers Bengaluru', color: 'bg-red-600', textColor: 'text-white' },
  { id: 'KKR', name: 'Kolkata Knight Riders', color: 'bg-purple-800', textColor: 'text-white' },
  { id: 'DC', name: 'Delhi Capitals', color: 'bg-blue-500', textColor: 'text-white' },
  { id: 'PBKS', name: 'Punjab Kings', color: 'bg-red-500', textColor: 'text-white' },
  { id: 'RR', name: 'Rajasthan Royals', color: 'bg-pink-600', textColor: 'text-white' },
  { id: 'SRH', name: 'Sunrisers Hyderabad', color: 'bg-orange-500', textColor: 'text-white' },
  { id: 'GT', name: 'Gujarat Titans', color: 'bg-slate-700', textColor: 'text-white' },
  { id: 'LSG', name: 'Lucknow Super Giants', color: 'bg-pink-800', textColor: 'text-white' },
];

const LandingPage = () => {
  const [userName, setUserName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('MI');
  const [activeTab, setActiveTab] = useState('new');
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { loginAnonymously } = useAuth();
  const { createRoom, joinRoomDb } = useAuction();
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!userName) return;
    
    setIsSubmitting(true);
    try {
      const loggedInUser = await loginAnonymously(userName);
      
      if (activeTab === 'new') {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        await createRoom(newRoomId, loggedInUser.uid, { name: userName, team: selectedTeam });
        navigate(`/lobby/${newRoomId}`);
      } else if (activeTab === 'join') {
        if (!roomCode) {
          setIsSubmitting(false);
          return;
        }
        const code = roomCode.toUpperCase();
        await joinRoomDb(code, loggedInUser.uid, { name: userName, team: '' });
        navigate(`/lobby/${code}`);
      }
    } catch (error) {
      console.error("Login/Join failed:", error.code, error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center py-10 px-4 font-sans text-white overflow-x-hidden">
      
      {/* Premium Background Elements */}
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
        <Gavel size={12} strokeWidth={3} /> IPL 2026 Auction Live
      </motion.div>

      {/* Hero Titles */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8 z-10 relative"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-1 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 leading-tight">
          BUILD YOUR
        </h1>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[#ff5500] italic leading-tight">
          DREAM TEAM
        </h1>
        <div className="mt-2 flex items-center justify-center gap-4 text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">
          <span className="flex items-center gap-1.5"><Users size={12} /> Multiplayer</span>
          <span className="w-0.5 h-0.5 bg-gray-700 rounded-full" />
          <span className="flex items-center gap-1.5"><Zap size={12} /> Real-time</span>
        </div>
      </motion.div>

      {/* Main Action Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-[2rem] p-3 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative"
      >
        <div className="bg-[#0c0c0c] rounded-[1.75rem] p-6 md:p-8 border border-white/5 relative">
          
          {/* Tabs */}
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
              <Zap size={14} fill={activeTab === 'new' ? 'white' : 'none'} /> Create Room
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
              <KeyRound size={14} /> Join Room
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="relative group">
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Manager Identity</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/50 transition-all text-sm text-white font-bold placeholder:text-gray-700"
                  placeholder="Enter Name"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-orange-500 transition-colors">
                  <ShieldCheck size={16} />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'join' ? (
                <motion.div 
                  key="join-fields"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative group"
                >
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Access Token</label>
                  <input 
                    type="text" 
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500/50 transition-all text-white font-black uppercase tracking-[0.5em] text-center text-lg placeholder:tracking-normal placeholder:text-xs placeholder:text-gray-700"
                    placeholder="Enter Room Code"
                    required={activeTab === 'join'}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="create-fields"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 ml-1">
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Select Franchise</label>
                      <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded italic flex items-center gap-1">
                         <Star size={10} fill="currentColor" /> CHOOSE WISELY
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
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

                          <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center ${t.textColor} font-black text-[11px] mb-2 transition-transform duration-300 ${selectedTeam === t.id ? 'scale-110 shadow-lg' : 'group-hover/team:scale-105 opacity-60 group-hover/team:opacity-100'}`}>
                            {t.id}
                          </div>
                          
                          <span className={`text-[8px] font-black uppercase text-center tracking-tighter truncate w-full ${selectedTeam === t.id ? 'text-yellow-400' : 'text-gray-500'}`}>
                            {t.name.split(' ').slice(0, 1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 relative overflow-hidden group/submit rounded-xl shadow-[0_10px_30px_rgba(255,85,0,0.2)] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] to-[#ff8c00] transition-transform duration-500 group-hover/submit:scale-105" />
              <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-sm">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {activeTab === 'new' ? <Zap size={16} fill="white" /> : <KeyRound size={16} />}
                    <span>{activeTab === 'new' ? 'Initialize Hub' : 'Enter Portal'}</span>
                    <ChevronRight size={18} className="group-hover/submit:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </motion.div>

      {/* Footer Decoration */}
      <footer className="mt-12 mb-8 flex flex-col items-center gap-4 z-10 w-full px-4">
        <div className="flex gap-6 text-[8px] font-black uppercase tracking-[0.4em] text-gray-700">
          <span className="hover:text-gray-400 transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-gray-400 transition-colors cursor-pointer text-orange-500/50">Fair Play</span>
          <span className="hover:text-gray-400 transition-colors cursor-pointer text-blue-500/50">Discord</span>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-800">
          © 2026 STADIUM ENGINE • ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;