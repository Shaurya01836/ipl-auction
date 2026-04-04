import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { IPL_PLAYERS } from '../data/players';
import { 
  Users, 
  Search, 
  ArrowUpRight, 
  Plus,
  BarChart3,
  Trophy,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const FantasyAdmin = () => {
  const { user, loading, loginWithGoogle } = useAuth();
  const [playerAverages, setPlayerAverages] = useState({});
  const [playerMatches, setPlayerMatches] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

  // Sync data from Firestore
  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    // Averages (Existing playerPoints document)
    const avgRef = doc(db, 'fantasyConfig', 'playerPoints');
    const unsubAvg = onSnapshot(avgRef, (snap) => {
      if (snap.exists()) setPlayerAverages(snap.data());
    });

    // Match Counts (New metadata document)
    const matchRef = doc(db, 'fantasyConfig', 'playerMatches');
    const unsubMatch = onSnapshot(matchRef, (snap) => {
      if (snap.exists()) setPlayerMatches(snap.data());
    });

    return () => {
      unsubAvg();
      unsubMatch();
    };
  }, []);

  // Search logic
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return [];
    return IPL_PLAYERS.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 12);
  }, [searchTerm]);

  const handleNewMatchPoint = async (playerId, todayPoints) => {
    if (isNaN(todayPoints)) return;
    setIsUpdating(true);
    
    try {
      const avgRef = doc(db, 'fantasyConfig', 'playerPoints');
      const matchRef = doc(db, 'fantasyConfig', 'playerMatches');

      // Use a transaction to ensure both update atomically
      await runTransaction(db, async (transaction) => {
        const avgSnap = await transaction.get(avgRef);
        const matchSnap = await transaction.get(matchRef);

        const currentAvgs = avgSnap.exists() ? avgSnap.data() : {};
        const currentMatches = matchSnap.exists() ? matchSnap.data() : {};

        const oldAvg = Number(currentAvgs[playerId]) || 0;
        const oldCount = Number(currentMatches[playerId]) || 0;
        
        // Calculate New Average: (Avg * Count + NewMatch) / (Count + 1)
        const newCount = oldCount + 1;
        const newAvg = Number(((oldAvg * oldCount + todayPoints) / newCount).toFixed(1));

        transaction.set(avgRef, { ...currentAvgs, [playerId]: newAvg });
        transaction.set(matchRef, { ...currentMatches, [playerId]: newCount });
        
        const playerName = IPL_PLAYERS.find(p => p.id === playerId)?.name;
        setMessage({ type: 'success', text: `Match Added! ${playerName} avg: ${oldAvg} -> ${newAvg} (${newCount} matches)` });
      });

      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Update failed. Check Firestore connection.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const setManualAverage = async (playerId, value) => {
    if (isNaN(value)) return;
    const avgRef = doc(db, 'fantasyConfig', 'playerPoints');
    await setDoc(avgRef, { ...playerAverages, [playerId]: Number(value) }, { merge: true });
  };

  const setManualMatches = async (playerId, value) => {
    if (isNaN(value)) return;
    const matchRef = doc(db, 'fantasyConfig', 'playerMatches');
    await setDoc(matchRef, { ...playerMatches, [playerId]: Number(value) }, { merge: true });
  };

  if (loading) return null;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 p-12 rounded-[3.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl shadow-2xl">
           <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl mx-auto flex items-center justify-center">
              <LogIn className="text-red-500" size={32} />
           </div>
           <div className="space-y-4">
             <h1 className="text-3xl font-black uppercase tracking-tighter italic">Restricted <span className="text-red-500">Access</span></h1>
             <p className="text-gray-500 text-sm font-medium leading-relaxed">
               This portal is restricted to authorized administrators only. 
               Please sign in with the **authorized administrator account** to proceed.
             </p>
           </div>
           
           {!user ? (
             <button 
               onClick={loginWithGoogle}
               className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl"
             >
               Sign In With Google
             </button>
           ) : (
             <div className="pt-4 space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Current User</p>
                   <p className="text-xs font-bold truncate">{user.email}</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-gray-500 hover:text-white text-[8px] font-black uppercase tracking-widest transition-colors"
                >
                  Return To Dashboard
                </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.4)]">
                  <Trophy size={24} className="text-white" />
               </div>
               <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                 Fantasy <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-800">Admin Portal</span>
               </h1>
            </div>
            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] ml-1">Automated Average Point Calculator</p>
          </div>
          
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-6 rounded-[2rem] shadow-2xl backdrop-blur-3xl border ${
                  message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                }`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <Plus className={message.type === 'success' ? 'text-green-500' : 'text-red-500'} size={14} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed max-w-[200px]">{message.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Section */}
        <div className="relative group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-700 transition-colors group-focus-within:text-orange-500" size={24} />
          <input 
            type="text"
            placeholder="TYPE PLAYER NAME TO FIND..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[3rem] py-8 pl-20 pr-8 text-2xl font-black uppercase tracking-tighter transition-all focus:border-orange-500/50 focus:bg-white/[0.08] outline-none placeholder:text-gray-800 italic"
          />
        </div>

        {/* Results Area */}
        <div className="grid grid-cols-1 gap-6">
           {filteredPlayers.length > 0 ? (
             filteredPlayers.map((p, idx) => (
               <motion.div 
                 key={p.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:border-orange-500/20 transition-all group sticky top-0 md:relative"
               >
                 {/* Player Info */}
                 <div className="flex items-center gap-8 min-w-[300px]">
                   <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-2 flex items-center justify-center shadow-2xl relative z-10 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute -inset-2 bg-orange-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div>
                     <h3 className="text-3xl font-black uppercase tracking-tight italic mb-1 group-hover:text-orange-500 transition-colors">
                       {p.name}
                     </h3>
                     <div className="flex gap-4">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{p.role}</span>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-l border-white/10 pl-4">{p.set}</span>
                     </div>
                   </div>
                 </div>

                 {/* Stats Controls */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 flex-1">
                    {/* Average Point Display */}
                    <div className="bg-white/[0.03] p-6 rounded-[2rem] text-center border border-white/5">
                       <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest mb-3">CURRENT AVERAGE</span>
                       <div 
                         className="text-4xl font-black text-white italic cursor-pointer hover:text-orange-500 transition-colors"
                         onClick={() => {
                           const val = prompt('Set manual average:', playerAverages[p.id]);
                           if(val) setManualAverage(p.id, val);
                         }}
                       >
                         {playerAverages[p.id] || 0}
                       </div>
                    </div>

                    {/* Matches Display */}
                    <div className="bg-white/[0.03] p-6 rounded-[2rem] text-center border border-white/5">
                       <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest mb-3">MATCHES PLAYED</span>
                       <div 
                         className="text-4xl font-black text-blue-500 italic cursor-pointer hover:text-blue-400 transition-colors"
                          onClick={() => {
                           const val = prompt('Set manual match count:', playerMatches[p.id]);
                           if(val) setManualMatches(p.id, val);
                         }}
                       >
                         {playerMatches[p.id] || 0}
                       </div>
                    </div>

                    {/* Action Input */}
                    <div className="flex flex-col justify-center gap-3">
                       <button 
                         disabled={isUpdating}
                         onClick={() => {
                           const pts = prompt(`Enter score for ${p.name}'s new match:`);
                           if (pts !== null && !isNaN(pts) && pts !== '') {
                             handleNewMatchPoint(p.id, Number(pts));
                           }
                         }}
                         className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 text-white p-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_10px_40px_rgba(234,88,12,0.2)]"
                       >
                         {isUpdating ? 'CALCULATING...' : (<><Plus size={20} /> <span className="font-black text-xs uppercase tracking-widest">Add Today's Points</span></>)}
                       </button>
                    </div>
                 </div>
               </motion.div>
             ))
           ) : searchTerm ? (
             <div className="py-40 text-center bg-white/5 rounded-[4rem] border border-white/5 border-dashed">
                <BarChart3 size={48} className="mx-auto mb-6 text-gray-800" />
                <p className="text-xl font-black uppercase tracking-[0.3em] text-gray-700">No Registry Found</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-40">
                {[
                  { icon: History, title: 'Preserve matches', desc: 'System tracks total matches played per player to ensure average accuracy with every update.' },
                  { icon: ArrowUpRight, title: 'Insta-Update', desc: 'Points sync instantly across all devices. No refresh required for your managers.' },
                  { icon: Users, title: 'Verify IDs', desc: 'Using internal ID registry (p_xxx) to ensure zero point collisions during data merges.' }
                ].map(feature => (
                  <div key={feature.title} className="p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-6">
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                        <feature.icon size={24} />
                     </div>
                     <div className="space-y-3">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white">{feature.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{feature.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
      
      {/* Footer Nav */}
      <div className="fixed bottom-12 right-12 z-50">
         <button 
           onClick={() => window.location.href = '/'}
           className="group bg-white flex items-center gap-4 pl-8 pr-12 py-5 rounded-full text-black transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(255,255,255,0.2)]"
         >
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white transition-transform group-hover:-rotate-45">
               <ArrowUpRight size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest italic">Exit Portal</span>
         </button>
      </div>
    </div>
  );
};

export default FantasyAdmin;
