import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext'; // Added import
import { Zap, History, Flame, Rocket, Coffee, Globe, Gavel, KeyRound, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TEAMS = [
  { id: 'MI', color: 'bg-blue-600' },
  { id: 'CSK', color: 'bg-yellow-400 text-black' },
  { id: 'RCB', color: 'bg-red-600' },
  { id: 'KKR', color: 'bg-purple-800' },
  { id: 'DC', color: 'bg-blue-500' },
  { id: 'PBKS', color: 'bg-red-500' },
  { id: 'RR', color: 'bg-pink-600' },
  { id: 'SRH', color: 'bg-orange-500' },
  { id: 'GT', color: 'bg-slate-700' },
  { id: 'LSG', color: 'bg-pink-800' },
];

const LandingPage = () => {
  const [userName, setUserName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('MI');
  const [activeTab, setActiveTab] = useState('new');
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { loginAnonymously } = useAuth();
  const { createRoom, joinRoomDb } = useAuction(); // Destructure context functions
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!userName) return;
    
    setIsSubmitting(true);
    try {
      // Get the logged-in user object back from auth
      const loggedInUser = await loginAnonymously(userName);
      
      if (activeTab === 'new') {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Save to DB before navigating
        await createRoom(newRoomId, loggedInUser.uid, { name: userName, team: selectedTeam });
        navigate(`/lobby/${newRoomId}`);
      } else if (activeTab === 'join') {
        if (!roomCode) {
          setIsSubmitting(false);
          return;
        }
        const code = roomCode.toUpperCase();
        // Add to DB before navigating
        await joinRoomDb(code, loggedInUser.uid, { name: userName, team: '' });
        navigate(`/lobby/${code}`);
      }
    } catch (error) {
      console.error("Login/Join failed:", error.code, error.message);
      alert(`Login failed: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center py-12 px-4 font-sans text-white overflow-x-hidden">
      {/* Decorative Red Circle */}
      <div className="absolute top-12 right-[10%] md:right-[20%] w-20 h-20 bg-red-600 rounded-full border-[1px] border-dashed border-white/40 shadow-[0_0_30px_rgba(220,38,38,0.4)]" />

      {/* Top Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 border border-yellow-600/50 bg-yellow-900/10 text-yellow-500 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
      >
        <Gavel size={14} /> IPL 2026 Auction Ready
      </motion.div>

      {/* Hero Titles */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-10 z-10"
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2">
          Play IPL Auction
        </h1>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#ff5500]">
          with Friends
        </h1>
      </motion.div>

      {/* Notification Banners */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl space-y-3 mb-8 z-10"
      >
        <div className="flex items-center justify-between bg-[#2a1a08] border border-orange-900/50 p-3 rounded-xl">
          <div className="flex items-center gap-3 text-sm font-semibold text-orange-200">
            <Flame className="text-orange-500 w-5 h-5" />
            2026 Official List • 350 players
          </div>
          <span className="text-[10px] font-bold bg-orange-600/20 text-orange-500 px-2 py-1 rounded">NEW</span>
        </div>
      </motion.div>

      {/* Main Action Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl z-10"
      >
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button 
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 pb-4 font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'new' 
                ? 'border-b-2 border-yellow-500 text-yellow-500' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Zap className="w-4 h-4" /> Create Room
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 pb-4 font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'join' 
                ? 'border-b-2 border-yellow-500 text-yellow-500' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Join Room
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Your Name</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-yellow-500/50 transition-colors text-white font-medium"
              placeholder="Enter your manager name"
              required
            />
          </div>

          {/* Conditional Room Code Input */}
          {activeTab === 'join' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm font-bold text-gray-400 mb-2">Room Code</label>
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-yellow-500/50 transition-colors text-white font-medium uppercase tracking-widest"
                placeholder="e.g. A1B2C3"
                required={activeTab === 'join'}
              />
            </motion.div>
          )}

          {/* Team Selection - Only for New Room */}
          {activeTab === 'new' && (
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-3">Choose Your Team</label>
              <div className="flex flex-wrap gap-3">
                {TEAMS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTeam(t.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${t.color} ${
                      selectedTeam === t.id 
                        ? 'ring-4 ring-yellow-500 ring-offset-2 ring-offset-[#141414] scale-110' 
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {t.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 space-y-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r from-[#ff8c00] to-[#ff5500] text-white font-black py-4 rounded-xl hover:from-[#ff9d2e] hover:to-[#ff6a1a] transition-all flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(255,140,0,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : activeTab === 'new' ? (
                <><Zap className="w-5 h-5 fill-white" /> Create New Room</>
              ) : (
                <><KeyRound className="w-5 h-5" /> Join Existing Room</>
              )}
            </button>
            
            <button 
              type="button"
              className="w-full bg-[#1f1f1f] border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-2 group"
            >
              <Globe className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              Browse Live Auction Rooms
              <span className="ml-2 bg-green-900/50 text-green-500 text-[10px] px-2 py-1 rounded font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                140
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LandingPage;