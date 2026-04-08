import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Crown, 
  Star, 
  Lock, 
  Unlock, 
  Zap, 
  ChevronRight, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const SquadSelector = ({ 
  ownedPlayers = [], 
  currentSquad = null, 
  playerStats = {},
  onSave, 
  isLocked = false,
  deadline = null 
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [impactId, setImpactId] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);

  // Sync state when currentSquad prop changes (handles async loading)
  useEffect(() => {
    if (currentSquad) {
      setSelectedIds(currentSquad.players || []);
      setImpactId(currentSquad.impactPlayer || null);
      setCaptainId(currentSquad.captain || null);
      setViceCaptainId(currentSquad.viceCaptain || null);
    }
  }, [currentSquad]);

  const togglePlayer = (id) => {
    if (isLocked) return;
    const player = ownedPlayers.find(p => p.id === id);
    if (!player) return;

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pId => pId !== id));
      if (captainId === id) setCaptainId(null);
      if (viceCaptainId === id) setViceCaptainId(null);
    } else {
      if (selectedIds.length >= 11) return;
      
      // Overseas Limit Check
      const overseasCount = selectedIds.filter(pId => {
        const p = ownedPlayers.find(op => op.id === pId);
        return p && p.country !== 'IND';
      }).length;

      if (player.country !== 'IND' && overseasCount >= 4) {
        alert("Maximum 4 overseas players allowed in the XI.");
        return;
      }

      // If this player is currently the Impact Player, remove from impact
      if (impactId === id) setImpactId(null);
      
      setSelectedIds([...selectedIds, id]);
    }
  };

  const setAsImpact = (id) => {
    if (isLocked) return;
    const player = ownedPlayers.find(p => p.id === id);
    if (!player) return;

    // Check if player is overseas
    const isOverseas = player.country !== 'IND';
    
    // Impact Player Overseas Rule: 
    // Usually in IPL, if you have 4 overseas in XI, Impact must be Indian.
    const overseasInXI = selectedIds.filter(pId => {
        const p = ownedPlayers.find(op => op.id === pId);
        return p && p.country !== 'IND';
      }).length;

    if (isOverseas && overseasInXI >= 4) {
      alert("Impact player cannot be overseas if 4 overseas players are already in the XI.");
      return;
    }

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pId => pId !== id));
    }
    setImpactId(impactId === id ? null : id);
  };

  const handleSave = () => {
    if (selectedIds.length < 5) { // Minimum threshold
      alert("Please select at least 5 players.");
      return;
    }
    if (!captainId || !viceCaptainId) {
      alert("Please select a Captain and Vice-Captain.");
      return;
    }
    onSave({
      players: selectedIds,
      impactPlayer: impactId,
      captain: captainId,
      viceCaptain: viceCaptainId,
      lastUpdated: new Date().toISOString()
    });
  };

  const roles = ['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'];

  return (
    <div className="space-y-8 bg-black/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black uppercase tracking-tight italic">Draft Your XI</h2>
            {isLocked ? (
              <span className="px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-full border border-red-500/20 flex items-center gap-2">
                <Lock size={12} /> Selection Locked
              </span>
            ) : (
              <span className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full border border-green-500/20 flex items-center gap-2">
                <Unlock size={12} /> Edits Open
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            Select 11 Players + 1 Impact Player from your auction squad
          </p>
        </div>

        {!isLocked && (
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-[#ff5500] hover:text-white transition-all shadow-xl active:scale-95"
          >
            Save Squad Configuration
          </button>
        )}
      </div>

      {/* Constraints Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Playing XI', val: `${selectedIds.length}/11`, icon: Users, color: selectedIds.length === 11 ? 'text-green-500' : 'text-blue-400' },
          { label: 'Impact Player', val: impactId ? 'Selected' : 'None', icon: Zap, color: impactId ? 'text-orange-500' : 'text-gray-600' },
          { label: 'Captain', val: captainId ? 'Set' : 'Missing', icon: Crown, color: captainId ? 'text-yellow-500' : 'text-gray-600' },
          { label: 'Vice-Captain', val: viceCaptainId ? 'Set' : 'Missing', icon: Star, color: viceCaptainId ? 'text-purple-500' : 'text-gray-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={12} className={stat.color} />
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className={`text-sm font-black ${stat.color}`}>{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="space-y-12 h-[600px] overflow-y-auto pr-4 custom-scrollbar">
        {roles.map(role => {
          const players = ownedPlayers.filter(p => p.role === role);
          if (players.length === 0) return null;

          return (
            <div key={role} className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">{role}s</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map(player => {
                  const isSelected = selectedIds.includes(player.id);
                  const isImpact = impactId === player.id;
                  const isCaptain = captainId === player.id;
                  const isVice = viceCaptainId === player.id;

                  return (
                    <div 
                      key={player.id}
                      className={`group relative bg-[#0a0a0a] border rounded-3xl transition-all p-4 ${
                        isSelected ? 'border-blue-500/50 bg-blue-500/5' : 
                        isImpact ? 'border-orange-500/50 bg-orange-500/5' : 
                        'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-black/60 rounded-xl border border-white/10 p-1 shrink-0 overflow-hidden relative">
                           <img src={player.image} className="w-full h-full object-cover" />
                           {isCaptain && <div className="absolute top-0 right-0 p-1 bg-yellow-500 text-black rounded-bl-lg"><Crown size={10} /></div>}
                           {isVice && <div className="absolute top-0 right-0 p-1 bg-purple-500 text-white rounded-bl-lg"><Star size={10} /></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[12px] font-black uppercase tracking-tight truncate">{player.name}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{player.teamId} • {player.type}</p>
                            {playerStats[player.id] && (
                              <span className="text-[8px] font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded leading-none">
                                Avg: {(playerStats[player.id].totalPoints / playerStats[player.id].matches).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          disabled={isLocked || (selectedIds.length >= 11 && !isSelected)}
                          onClick={() => togglePlayer(player.id)}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white disabled:opacity-30'
                          }`}
                        >
                          {isSelected ? 'In 11' : 'Add to 11'}
                        </button>
                        <button
                          disabled={isLocked}
                          onClick={() => setAsImpact(player.id)}
                          className={`px-3 py-2 rounded-xl transition-all ${
                            isImpact 
                              ? 'bg-orange-600 text-white' 
                              : 'bg-white/5 text-gray-500 hover:bg-white/10'
                          }`}
                        >
                          <Zap size={14} fill={isImpact ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {isSelected && !isLocked && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => { setCaptainId(isCaptain ? null : player.id); if (isVice) setViceCaptainId(null); }}
                            className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                              isCaptain ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-white/5 border-transparent text-gray-600 hover:text-white'
                            }`}
                          >
                            Captain
                          </button>
                          <button
                            onClick={() => { setViceCaptainId(isVice ? null : player.id); if (isCaptain) setCaptainId(null); }}
                            className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                              isVice ? 'bg-purple-500/20 border-purple-500/50 text-purple-500' : 'bg-white/5 border-transparent text-gray-600 hover:text-white'
                            }`}
                          >
                            V-Cap
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SquadSelector;
