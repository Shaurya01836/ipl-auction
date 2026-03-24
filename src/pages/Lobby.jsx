import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import {
  Loader2,
  Users,
  Crown,
  UserMinus,
  LogOut,
  Gavel,
  ShieldAlert,
  Copy,
  Share2,
  MessageSquare,
  Settings as SettingsIcon,
  CheckCircle2,
  Rocket,
  AlertCircle
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

const Lobby = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { joinAuction, currentAuction, kickPlayer, updatePlayerTeam, updateRoomSettings, startAuction } = useAuction();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('players');
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSelectingTeam, setIsSelectingTeam] = useState(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const isAdmin = currentAuction?.hostId === user?.uid;
  const players = currentAuction?.players || [];
  const currentUserPlayer = players.find(p => p.id === user?.uid);

  // Track which teams are taken and by whom
  const teamAssignments = players.reduce((acc, p) => {
    acc[p.team] = p.name;
    return acc;
  }, {});

  useEffect(() => {
    const unsub = joinAuction(id);
    return () => unsub();
  }, [id]);

  const handleStartAuction = async () => {
    if (isAdmin) {
      setIsStarting(true);
      try {
        await startAuction(id);
        navigate(`/auction/${id}`);
      } catch (error) {
        setIsStarting(false);
        console.error("Failed to start auction:", error);
      }
    }
  };

  const handleKickPlayer = async (playerObj) => {
    if (isAdmin) await kickPlayer(id, playerObj);
  };

  const handleTeamSelect = async (teamId) => {
    if (teamAssignments[teamId] && teamId !== currentUserPlayer?.team) return;
    setIsSelectingTeam(teamId);
    try {
      await updatePlayerTeam(id, user.uid, teamId);
    } finally {
      setIsSelectingTeam(null);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Join my IPL Auction room! Code: ${id}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleUpdateBidTimer = async (seconds) => {
    if (!isAdmin) return;
    setIsUpdatingSettings(true);
    try {
      await updateRoomSettings(id, { 
        ...currentAuction.settings,
        bidTimer: seconds 
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center py-6 px-4 font-sans text-white overflow-x-hidden">
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-8 px-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-bold uppercase text-sm tracking-widest">Room:</span>
          <span className="text-yellow-500 text-2xl font-black tracking-[0.2em]">{id}</span>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button
              onClick={handleStartAuction}
              disabled={isStarting}
              className="bg-[#ff8c00] hover:bg-[#ff5500] text-white font-black px-6 py-2 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,140,0,0.3)] group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? <Loader2 size={18} className="animate-spin" /> : <Gavel size={18} className="group-hover:rotate-12 transition-transform" />}
              {isStarting ? 'Starting...' : 'Start'}
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        {/* Invite Friends Section */}
        <section className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4 text-[#ff8c00] font-bold text-sm">
            <Share2 size={16} /> Invite Friends
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium truncate">
              {window.location.href}
            </div>
            <button onClick={copyLink} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors relative cursor-pointer">
              {copied ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>
            <button onClick={shareWhatsApp} className="p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-xl border border-[#25D366]/20 transition-colors text-[#25D366] cursor-pointer">
              <MessageSquare size={20} />
            </button>
            <button className="bg-[#ff8c00] text-black font-black px-6 rounded-xl text-sm flex items-center gap-2 cursor-pointer">
              <Share2 size={16} /> Share
            </button>
          </div>
        </section>

        {/* Select Your Team Grid */}
        <section className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[#ff8c00] font-bold text-sm">
              <Users size={16} /> Select Your Team
            </div>
            {currentUserPlayer && currentUserPlayer.team ? (
              <div className="flex items-center gap-2 bg-[#ff8c00]/10 border border-[#ff8c00]/30 px-3 py-1.5 rounded-lg">
                <div className={`w-5 h-5 rounded-full ${TEAMS.find(t => t.id === currentUserPlayer.team)?.color}`} />
                <span className="text-xs font-black text-[#ff8c00] uppercase italic">
                  {TEAMS.find(t => t.id === currentUserPlayer.team)?.name}
                </span>
              </div>
            ) : (
              <div className="text-[10px] font-black text-red-500 uppercase animate-pulse flex items-center gap-1">
                <AlertCircle size={12} /> Please Select a Team
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {TEAMS.map((team) => {
              const isTaken = teamAssignments[team.id];
              const isMine = currentUserPlayer?.team === team.id;

              return (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team.id)}
                  disabled={!!isTaken && !isMine}
                  className={`relative flex flex-col items-center justify-center h-28 rounded-2xl border transition-all duration-300 cursor-pointer ${isMine
                      ? 'bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                      : isTaken
                        ? 'bg-black/40 border-white/5 opacity-40 cursor-not-allowed'
                        : 'bg-[#181818] border-white/5 hover:border-white/20 hover:bg-[#202020]'
                    } ${isSelectingTeam === team.id ? 'animate-pulse scale-95' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm mb-2 shadow-lg ${team.color}`}>
                    {isSelectingTeam === team.id ? <Loader2 size={20} className="animate-spin" /> : team.id}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isMine ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {isTaken ? isTaken : team.name}
                  </span>
                  {isMine && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] text-black"><CheckCircle2 size={10} /></div>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tabs and Player List */}
        <section className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/5">
            {[
              { id: 'players', icon: Users, label: `Players ${players.length}/10` },
              { id: 'chat', icon: MessageSquare, label: 'Chat' },
              { id: 'settings', icon: SettingsIcon, label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${activeTab === tab.id
                    ? 'bg-white/5 text-yellow-500 border-b-2 border-yellow-500'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                  }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'players' && (
              <div className="space-y-3">
                <AnimatePresence>
                  {players.map((player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between bg-black/20 border border-white/5 p-4 rounded-xl group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center font-black shadow-inner ${TEAMS.find(t => t.id === player.team)?.color || 'bg-gray-800'}`}>
                          {player.team || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-200">{player.name} {player.id === user?.uid && '(You)'}</p>
                            {player.isHost && <Crown size={14} className="text-yellow-500" />}
                          </div>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            {TEAMS.find(t => t.id === player.team)?.name || (player.team === '' ? 'Selecting Team...' : player.team)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        {isAdmin && !player.isHost && (
                          <button
                            onClick={() => handleKickPlayer(player)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {activeTab === 'chat' && (
              <div className="h-40 flex flex-col items-center justify-center text-gray-600 gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center">
                   <MessageSquare size={20} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Chat section coming soon</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                 <div>
                    <div className="flex items-center justify-between mb-4">
                       <div>
                          <h4 className="font-bold text-gray-200">Bid Timer</h4>
                          <p className="text-xs text-gray-500">Time allowed for each player auction</p>
                       </div>
                       <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-yellow-500 font-black text-sm">
                          {currentAuction?.settings?.bidTimer || 10}s
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                       {[5, 10, 15, 20, 25].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleUpdateBidTimer(s)}
                            disabled={!isAdmin || isUpdatingSettings}
                            className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${
                              currentAuction?.settings?.bidTimer === s
                                ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                            } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'} disabled:opacity-50`}
                          >
                            {isUpdatingSettings && currentAuction?.settings?.bidTimer !== s && (
                               <Loader2 size={12} className="animate-spin" />
                            )}
                            {s}s
                          </button>
                       ))}
                    </div>
                 </div>

                 {!isAdmin && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 items-start">
                       <ShieldAlert size={18} className="text-blue-500 mt-0.5" />
                       <p className="text-xs text-blue-200 font-medium">Only the room host can modify auction settings.</p>
                    </div>
                 )}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-12 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 opacity-30">
        <ShieldAlert size={12} /> Fair Play Guidelines Enabled
      </footer>
    </div>
  );
};

export default Lobby;