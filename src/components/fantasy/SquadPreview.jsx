import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Star, 
  Edit3, 
  Zap, 
  ChevronRight, 
  Shield, 
  Sword, 
  Target,
  User
} from 'lucide-react';
import { IPL_PLAYERS } from '../../data/players';

const SquadPreview = ({ 
  ownedPlayers = [], 
  currentSquad = null, 
  onEdit, 
  isLocked = false 
}) => {
  const selectedPlayers = useMemo(() => {
    if (!currentSquad?.players) return [];
    return currentSquad.players.map(pId => {
      const p = IPL_PLAYERS.find(op => op.id === pId);
      return { ...p };
    }).filter(p => !!p);
  }, [currentSquad, ownedPlayers]);

  const impactPlayer = useMemo(() => {
    if (!currentSquad?.impactPlayer) return null;
    return IPL_PLAYERS.find(p => p.id === currentSquad.impactPlayer);
  }, [currentSquad]);

  const roles = [
    { name: 'Batsman', icon: Sword, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Wicket-Keeper', icon: User, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { name: 'All-Rounder', icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { name: 'Bowler', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' }
  ];

  if (!currentSquad) {
    return (
      <div className="bg-white/[0.02] border border-white/5 p-16 rounded-[2.5rem] text-center">
        <Users size={48} className="mx-auto mb-4 text-gray-700" />
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2 italic">Select Your XI</h2>
        <p className="text-xs text-gray-500 mb-8 max-w-sm mx-auto">You haven't configured your Playing 11 yet. Create your squad to start earning fantasy points.</p>
        <button 
          onClick={onEdit} 
          className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-[#ff5500] hover:text-white transition-all shadow-xl active:scale-95"
        >
          Create Squad Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight italic mb-2">Final XI <span className="text-[#ff5500]">Dashboard</span></h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            Selection Status: <span className="text-green-500">Confirmed</span> • Refreshed Recently
          </p>
        </div>

        <button 
          disabled={isLocked}
          onClick={onEdit}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 ${
            isLocked 
              ? 'bg-white/5 text-gray-600 border border-white/5' 
              : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black hover:border-white'
          }`}
        >
          <Edit3 size={16} /> {isLocked ? 'Locked for Match' : 'Edit Squad'}
        </button>
      </div>

      {/* Grid of Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map(role => {
          const players = selectedPlayers.filter(p => p.role === role.name);
          if (players.length === 0) return null;

          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={role.name} 
              className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${role.bg}`}>
                    <role.icon size={14} className={role.color} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{role.name}s</span>
                </div>
                <span className="text-[10px] font-black text-white/20">{players.length}</span>
              </div>

              <div className="space-y-3">
                {players.map(player => {
                  const isCaptain = currentSquad.captain === player.id;
                  const isVice = currentSquad.viceCaptain === player.id;

                  return (
                    <div key={player.id} className="group relative flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl transition-all hover:bg-white/5 hover:border-white/10">
                       <div className="w-10 h-10 bg-black/60 rounded-lg border border-white/5 p-0.5 shrink-0 overflow-hidden relative">
                          <img src={player.image} alt="" className="w-full h-full object-cover " />
                       </div>
                       <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-black uppercase tracking-tight truncate flex items-center gap-2">
                             {player.name}
                             {isCaptain && <Crown size={10} className="text-yellow-500" />}
                             {isVice && <Star size={10} className="text-purple-500" />}
                          </h4>
                          <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{player.teamId} • {player.type}</p>
                       </div>
                       {(isCaptain || isVice) && (
                          <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isCaptain ? 'bg-yellow-500/10 text-yellow-500' : 'bg-purple-500/10 text-purple-500'}`}>
                             {isCaptain ? 'C' : 'VC'}
                          </div>
                       )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Impact Player Detail */}
      {impactPlayer && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md bg-gradient-to-r from-orange-600/10 to-transparent border-l-4 border-orange-600 p-8 rounded-r-3xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-orange-500 fill-orange-500" />
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Impact Player Selected</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black/60 rounded-2xl border border-orange-500/20 p-1 shrink-0 overflow-hidden shadow-2xl">
              <img src={impactPlayer.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">{impactPlayer.name}</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{impactPlayer.role} • {impactPlayer.teamId}</p>
              <div className="mt-2 text-[9px] font-black text-orange-600 uppercase tracking-tighter">
                Available to activate mid-innings
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SquadPreview;
