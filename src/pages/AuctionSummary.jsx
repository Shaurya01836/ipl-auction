import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../contexts/AuctionContext';
import { useQuota } from '../contexts/QuotaContext';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import { toPng } from 'html-to-image';
import { supabase } from '../lib/supabase';
import { db, getRtdb, goOnlineServer } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  Trophy,
  Users,
  Home,
  ChevronDown,
  Share2,
  CheckCircle2,
  Wifi,
  LayoutGrid,
  Zap,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SquadRating from '../components/SquadRating';
import PageLoader from '../components/PageLoader';
import useRoomServer from '../hooks/useRoomServer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { isLocalRoom, loadLocalSoloRoom } from '../lib/localAuctionEngine';
import {
  computeTeamSpent,
  countOverseas,
  formatCrores,
  isOverseasPlayer,
  toFiniteNumber,
} from '../lib/auctionDisplay';

const AuctionSummary = () => {
  const { id } = useParams();
  useDocumentTitle(`Auction Summary #${id || ''} | CrickAuction`, 'Final squad rosters and auction summary.', true);
  const navigate = useNavigate();
  const { server, ready: serverReady } = useRoomServer(id);
  const { currentAuction, roomTeams } = useAuction();
  const { handleFirebaseError } = useQuota();
  
  const [activeTab, setActiveTab] = useState('squads');
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [sharingTeamId, setSharingTeamId] = useState(null);
  const [copiedTeamId, setCopiedTeamId] = useState(null);
  const [squadViewMode, setSquadViewMode] = useState('grid');

  const [dbAuction, setDbAuction] = useState(null);
  const [dbTeams, setDbTeams] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);

  const teamCardRefs = React.useRef({});

  const handleShareSquadImage = async (team, squad, manager) => {
    const cardEl = teamCardRefs.current[team.id];
    if (!cardEl) return;

    setSharingTeamId(team.id);

    try {
      // Generate crisp 2x PNG Blob & Data URL from element
      const dataUrl = await toPng(cardEl, {
        cacheBust: false,
        pixelRatio: 2,
        skipFonts: true,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const fileName = `${team.name.replace(/\s+/g, '_')}_Squad.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // If Web Share API supports file sharing (Mobile browsers, Chrome Android, Safari iOS)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${team.name} Squad — IPL Mega Auction`,
          text: `Check out our IPL Mega Auction squad for ${team.name}! Managed by ${manager?.name || 'N/A'}.`,
          files: [file]
        });
        setSharingTeamId(null);
        return;
      }

      // Download fallback for desktop browsers
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setCopiedTeamId(team.id);
      setTimeout(() => setCopiedTeamId(null), 3000);
    } catch (e) {
      console.error('Error generating squad image:', e);
    } finally {
      setSharingTeamId(null);
    }
  };


  // Note: AuctionSummary is for completed auctions; the persistent store
  // (Supabase/Firestore) is authoritative, avoiding unnecessary RTDB
  // connections or quota usage.

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    // If live auction data is already present in memory from this active session, dismiss loading
    if (currentAuction && currentAuction.id === id && roomTeams && roomTeams.length > 0) {
      setSummaryLoading(false);
    }

    const fetchSummaryFromPersistentStore = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const isLocal = isLocalRoom(id, server, true) || (typeof id === 'string' && id.startsWith('SOLO-')) || server === 'local';
        if (isLocal) {
          const localData = loadLocalSoloRoom(id);
          if (localData && isMounted) {
            setDbAuction({
              id: localData.id,
              hostId: localData.players?.[0]?.id || 'solo_host',
              hostName: localData.players?.[0]?.name || 'Manager',
              status: localData.status || 'completed',
              auctionType: localData.auctionType || 'mega',
              squadLimit: localData.squadLimit || 25,
              overseasLimit: localData.overseasLimit || 8,
              players: localData.players || [],
              settings: localData.settings || {},
              fastForwarded: Boolean(localData.fastForwarded),
            });
            setDbTeams(localData.roomTeams || localData.teams || []);
            setSummaryLoading(false);
            return;
          }
          // No local save (cleared browser / another device): the completed
          // auction may still have been copied to Supabase, so fall through.
        }

        // 1. Persistent Supabase store
        if (supabase) {
          // Optimized egress: Exclude heavy player_order column
          const { data: aData, error: auctionError } = await supabase
            .from('auctions')
            .select('id, host_id, host_name, status, auction_type, squad_limit, overseas_limit, players, settings')
            .eq('id', id)
            .maybeSingle();
          if (auctionError) throw auctionError;

          const { data: tData, error: teamsError } = await supabase
            .from('teams')
            .select('id, auction_id, user_id, team_id, team_name, budget_remaining, spent, squad')
            .eq('auction_id', id);
          if (teamsError) throw teamsError;

          if (aData && isMounted) {
            setDbAuction({
              id: aData.id,
              hostId: aData.host_id,
              hostName: aData.host_name,
              status: aData.status || 'completed',
              auctionType: aData.auction_type || 'mega',
              squadLimit: toFiniteNumber(aData.squad_limit, 25),
              overseasLimit: toFiniteNumber(aData.overseas_limit, 8),
              players: aData.players || [],
              settings: aData.settings || { budget: 120, bidTimer: 10 }
            });

            const parsedTeams = (tData || []).map(t => {
              const rawSquad = t.squad;
              const squadArr = Array.isArray(rawSquad) ? rawSquad : (rawSquad ? Object.values(rawSquad) : []);
              return {
                id: t.id,
                auctionId: t.auction_id,
                userId: t.user_id,
                teamId: t.team_id,
                teamName: t.team_name,
                budgetRemaining: t.budget_remaining ?? null,
                spent: toFiniteNumber(t.spent, 0),
                squad: squadArr
              };
            });

            // If Supabase teams already have sold players, use them immediately
            if (parsedTeams.some(t => t.squad && t.squad.length > 0)) {
              setDbTeams(parsedTeams);
              setSummaryLoading(false);
              return;
            }

            // Fallback to RTDB if Supabase flush hasn't arrived or squads are empty
            if (!isLocal) {
              try {
                goOnlineServer(server);
                const rtdbInstance = getRtdb(server);
                const rtdbTeamsSnap = await get(ref(rtdbInstance, `auctions/${id}/teams`));
                if (rtdbTeamsSnap.exists()) {
                  const teamsObj = rtdbTeamsSnap.val() || {};
                  const rtdbTeams = Object.entries(teamsObj).map(([docId, t]) => {
                    const rawSquad = t.squad;
                    return {
                      id: docId,
                      auctionId: id,
                      userId: t.userId,
                      teamId: t.teamId,
                      teamName: t.teamName,
                      budgetRemaining: t.budgetRemaining ?? null,
                      spent: toFiniteNumber(t.spent, 0),
                      squad: Array.isArray(rawSquad) ? rawSquad : (rawSquad ? Object.values(rawSquad) : [])
                    };
                  });
                  if (rtdbTeams.length > 0) {
                    setDbTeams(rtdbTeams);
                    setSummaryLoading(false);
                    return;
                  }
                }
              } catch (rtdbErr) {
                console.warn('[summary] RTDB teams fallback error', rtdbErr);
              }
            }

            setDbTeams(parsedTeams);
            setSummaryLoading(false);
            return;
          }
        }

        // A local solo auction has no RTDB/Firestore copy; stop here.
        if (isLocal) {
          if (isMounted) {
            setSummaryError('device_not_found');
            setSummaryLoading(false);
          }
          return;
        }

        // 2. Fallback to RTDB directly before Firestore
        try {
          goOnlineServer(server);
          const rtdbInstance = getRtdb(server);
          const [roomSnap, teamsSnap] = await Promise.all([
            get(ref(rtdbInstance, `auctions/${id}/room`)),
            get(ref(rtdbInstance, `auctions/${id}/teams`))
          ]);
          if (roomSnap.exists() && isMounted) {
            setDbAuction({ id, ...roomSnap.val() });
            const teamsObj = teamsSnap.exists() ? teamsSnap.val() : {};
            const rtdbTeams = Object.entries(teamsObj).map(([docId, t]) => {
              const rawSquad = t.squad;
              return {
                id: docId,
                auctionId: id,
                userId: t.userId,
                teamId: t.teamId,
                teamName: t.teamName,
                budgetRemaining: t.budgetRemaining ?? null,
                spent: toFiniteNumber(t.spent, 0),
                squad: Array.isArray(rawSquad) ? rawSquad : (rawSquad ? Object.values(rawSquad) : [])
              };
            });
            setDbTeams(rtdbTeams);
            setSummaryLoading(false);
            return;
          }
        } catch (rtdbErr) {
          console.warn('[summary] RTDB direct fetch error', rtdbErr);
        }

        const roomDoc = await getDoc(doc(db, 'auctions', id));
        if (roomDoc.exists() && isMounted) {
          setDbAuction({ id: roomDoc.id, ...roomDoc.data() });

          const tq = query(collection(db, 'teams'), where('auctionId', '==', id));
          const tSnap = await getDocs(tq);
          if (!tSnap.empty && isMounted) {
            setDbTeams(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        } else if (isMounted) {
          setSummaryError('Auction summary not found.');
        }
      } catch (err) {
        console.error('[summary] Failed to load auction summary', err);
        handleFirebaseError(err);
        if (isMounted) {
          setSummaryError('Could not load the auction summary. Please try again.');
        }
      } finally {
        if (isMounted) setSummaryLoading(false);
      }
    };

    fetchSummaryFromPersistentStore();

    return () => { isMounted = false; };
  }, [id, summaryReloadKey]);

  const activeAuction = (currentAuction && currentAuction.id === id) ? currentAuction : dbAuction;
  const activeTeams = (roomTeams && roomTeams.length > 0 && currentAuction?.id === id) ? roomTeams : dbTeams;

  // Derived Data
  const allSoldPlayers = useMemo(() => {
    return (activeTeams || []).flatMap(rt => {
      const rawSquad = rt.squad;
      const squadArr = Array.isArray(rawSquad) ? rawSquad : (rawSquad ? Object.values(rawSquad) : []);
      return squadArr.map(s => {
        const pid = typeof s === 'string' ? s : s.id;
        // Legacy string entries have no bid information: keep it unknown (null)
        // instead of fabricating a 0 value.
        const bidVal = typeof s === 'string' ? null : (s.bid ?? null);
        const teamInfo = TEAMS.find(t => t.id === rt.teamId);
        const pInfo = IPL_PLAYERS.find(p => p.id === pid);
        return { 
          ...pInfo, 
          id: pid,
          name: pInfo?.name || pid,
          bidVal, 
          teamName: teamInfo?.name, 
          teamId: rt.teamId, 
          teamColor: teamInfo?.color,
          teamTextColor: teamInfo?.textColor
        };
      }).filter(p => p && p.id);
    }).sort((a, b) => toFiniteNumber(b.bidVal, -1) - toFiniteNumber(a.bidVal, -1));
  }, [activeTeams]);

  const topPlayers = allSoldPlayers.slice(0, 5);

  if (!activeAuction && summaryError) {
    const isDeviceNotFound = summaryError === 'device_not_found' || (typeof id === 'string' && id.startsWith('SOLO-')) || server === 'local';
    return (
      <div className="h-screen-safe bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-gray-300">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-black uppercase tracking-wider mb-2 text-white">
          {isDeviceNotFound ? 'Local Solo Auction' : 'Summary Unavailable'}
        </h2>
        <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
          {isDeviceNotFound
            ? 'This solo auction lives on the device where it started. No saved data was found in this browser for this room.'
            : summaryError}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!serverReady || (!activeAuction && summaryLoading)) {
    return <PageLoader text="Loading Summary..." />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-white selection:text-black">
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-white/[0.02] blur-[140px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-slate-500/[0.02] blur-[140px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-10 space-y-3 sm:space-y-4"
        >
          {/* Top Bar with Badges + Menu Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap">
              
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full shrink-0">
                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest leading-none">ID:</span>
                <span className="text-white font-mono font-bold tracking-wider text-xs">{id}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white hover:text-black text-slate-300 font-black uppercase text-[10px] sm:text-xs tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95 touch-manipulation shrink-0 ml-auto"
            >
              <Home size={14} className="sm:w-4 sm:h-4" /> Menu
            </button>
          </div>

          {/* Title */}
          <div className="text-center md:text-left pt-1">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-pixel uppercase tracking-tight leading-none text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">
              Auction Complete
            </h1>
          </div>
        </motion.header>

        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-12">
          <div className="bg-[#0c0d10] backdrop-blur-3xl p-1 sm:p-1.5 rounded-2xl border border-white/10 grid grid-cols-3 sm:flex sm:justify-center gap-1 sm:gap-2 max-w-full sm:max-w-max mx-auto shadow-2xl">
            {[
              { id: 'squads', label: 'Squads', fullLabel: 'Team Squads', icon: Users },
              { id: 'leaderboard', label: 'Top 5', fullLabel: 'Top Expensive', icon: Trophy },
              { id: 'fantasy', label: 'Ratings', fullLabel: 'Squad Ratings', icon: Zap },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-tight sm:tracking-[0.16em] transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 touch-manipulation w-full sm:w-auto ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-lg shadow-white/10' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={14} className="shrink-0 sm:w-4 sm:h-4" />
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.fullLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.section
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
            >
              <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-pixel uppercase tracking-tight text-white">Leaderboard</h2>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">The Most Expensive Signings</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {topPlayers.map((player, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    key={player.id}
                    className="group relative bg-[#0e1015]/95 border border-white/5 p-3.5 sm:p-5 rounded-2xl sm:rounded-[1.75rem] transition-all hover:bg-white/[0.04] hover:border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6"
                  >
                    <div className="flex items-center gap-3 sm:gap-6">
                      <span className="text-2xl sm:text-4xl font-black text-white/10 group-hover:text-white/30 transition-colors shrink-0">#{idx + 1}</span>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300 p-1 shrink-0">
                        <img 
                          src={player.image} 
                          alt={player.name}
                          decoding="async"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(player.name || 'Player');
                          }}
                          className="w-full h-full object-cover filter drop-shadow-md" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                          <h3 className="text-base sm:text-xl font-black uppercase tracking-tight italic leading-none truncate text-white">{player.name}</h3>
                          {isOverseasPlayer(player) && <Wifi size={12} className="text-purple-400 rotate-90 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase shrink-0 ${player.teamColor} ${player.teamTextColor}`}>
                            {player.teamId}
                          </div>
                          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                            {player.role} • {player.teamName}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 flex sm:block items-center justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest sm:hidden">Winning Bid</p>
                      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {player.bidVal == null ? (
                          <span>—</span>
                        ) : (
                          <>₹{formatCrores(player.bidVal)}<span className="text-xs ml-1 font-bold not-italic text-slate-400">Cr</span></>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ) : activeTab === 'fantasy' ? (
            <motion.section
              key="fantasy"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-5xl mx-auto"
            >
              <SquadRating 
                roomTeams={activeTeams}
                currentAuction={activeAuction}
              />
            </motion.section>
          ) : (
            <motion.section
              key="squads"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-5xl mx-auto space-y-3 sm:space-y-4"
            >
              {TEAMS.map((t) => {
                const teamDoc = activeTeams.find(doc => doc.teamId === t.id);
                const manager = activeAuction?.players?.find(p => p.team === t.id);
                const isExpanded = expandedTeam === t.id;
                
                const rawSquad = teamDoc?.squad;
                const squadArr = Array.isArray(rawSquad) ? rawSquad : (rawSquad ? Object.values(rawSquad) : []);
                const squad = squadArr.map(s => {
                  const pid = typeof s === 'string' ? s : s.id;
                  const bid = typeof s === 'string' ? null : (s.bid ?? null);
                  const playerInfo = IPL_PLAYERS.find(p => p.id === pid);
                  return { ...(playerInfo || {}), id: pid, name: playerInfo?.name || pid, bid };
                }).filter(p => p && p.id);

                if (squad.length === 0) return null;

                const osCount = countOverseas(teamDoc?.squad, IPL_PLAYERS);
                const totalBudget = toFiniteNumber(activeAuction?.settings?.budget, 120);
                const totalSpent = computeTeamSpent({
                  budget: totalBudget,
                  budgetRemaining: teamDoc?.budgetRemaining,
                  spent: teamDoc?.spent,
                });

                return (
                  <div key={t.id} className="group flex flex-col gap-2">
                    {/* Team Accordion Toggle */}
                    <button
                      onClick={() => setExpandedTeam(isExpanded ? null : t.id)}
                      className={`w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] bg-[#0c0d10] border transition-all duration-300 relative overflow-hidden group active:scale-[0.99] touch-manipulation gap-4 ${
                        isExpanded ? 'border-white/20 bg-white/[0.04] shadow-2xl' : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Massive Background Logo */}
                      <div className="absolute -right-8 -bottom-8 w-40 sm:w-64 h-40 sm:h-64 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none grayscale">
                         <img src={t.logo} alt={`${t.name} Watermark Logo`} decoding="async" loading="lazy" className="w-full h-full object-contain" />
                      </div>

                      <div className="flex items-center gap-3 sm:gap-5 relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-xl shrink-0">
                           <img src={t.logo} alt={`${t.name} Logo`} decoding="async" loading="lazy" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-left min-w-0">
                          <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight group-hover:text-slate-200 transition-colors truncate text-white">{t.name}</h3>
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-none mt-1 truncate">Managed by {manager?.name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 relative z-10 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                        {/* Summary Stats */}
                        <div className="flex items-center gap-4 sm:gap-6 md:gap-10 text-left sm:text-right sm:border-r border-white/10 sm:pr-6 md:pr-10">
                          <div className="shrink-0">
                            <span className="block text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Players</span>
                            <span className="text-xs sm:text-base font-black text-white">{squad.length}</span>
                          </div>
                          <div className="shrink-0">
                            <span className="block text-[7px] sm:text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Overseas</span>
                            <span className="text-xs sm:text-base font-black text-white">{osCount}</span>
                          </div>
                          <div className="shrink-0">
                            <span className="block text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Spent</span>
                            <span className="text-xs sm:text-base font-black text-white">{totalSpent === null ? '—' : `₹${formatCrores(totalSpent, 1)}Cr`}</span>
                          </div>
                        </div>

                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 bg-white text-black' : 'text-slate-400'}`}>
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </button>

                    {/* Squad Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden px-1 sm:px-3 md:px-6 mb-4"
                        >
                          <div 
                             ref={el => teamCardRefs.current[t.id] = el}
                             className="bg-[#0c0d10] border-x border-b border-white/10 rounded-b-2xl sm:rounded-b-[2rem] p-4 sm:p-6 space-y-6 sm:space-y-8 relative overflow-hidden"
                          >
                             {/* Watermark Logo for Exported Image */}
                             <div className="absolute right-4 top-4 w-32 h-32 opacity-5 pointer-events-none grayscale">
                                <img src={t.logo} alt={`${t.name} Logo Watermark`} className="w-full h-full object-contain" />
                             </div>

                             {/* View Mode Toggle */}
                             <div className="flex justify-end relative z-10 mb-2 sm:mb-4">
                               <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex items-center gap-1">
                                 <button 
                                   onClick={() => setSquadViewMode('grid')} 
                                   className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] transition-all ${squadViewMode === 'grid' ? 'bg-white text-black font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
                                 >
                                   List
                                 </button>
                                 <button 
                                   onClick={() => setSquadViewMode('card')} 
                                   className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] transition-all ${squadViewMode === 'card' ? 'bg-white text-black font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
                                 >
                                   Cards
                                 </button>
                               </div>
                             </div>

                             {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                              const rolePlayers = squad.filter(p => p.role === role);
                              if (rolePlayers.length === 0) return null;

                              return (
                                <div key={role} className="space-y-3 sm:space-y-4 relative z-10">
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    <h4 className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] sm:tracking-[0.3em]">{role}s</h4>
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{rolePlayers.length} Members</span>
                                  </div>
                                  
                                  <div className={`grid ${squadViewMode === 'card' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5 sm:gap-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5'}`}>
                                    {rolePlayers.map((p, pidx) => (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: pidx * 0.04 }}
                                        key={p.id} 
                                        className={squadViewMode === 'card' 
                                          ? "bg-[#0e1015]/95 border border-white/10 p-4 sm:p-5 rounded-2xl flex flex-col justify-between group/p relative overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.04]"
                                          : "bg-white/[0.03] border border-white/5 p-2.5 sm:p-3.5 rounded-xl flex items-center justify-between group/p hover:bg-white/[0.06] hover:border-white/10 transition-all"
                                        }
                                      >
                                        {squadViewMode === 'card' ? (
                                           <>
                                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] blur-2xl rounded-full pointer-events-none opacity-0 group-hover/p:opacity-100 transition-opacity" />
                                             <div className="flex items-start justify-between relative z-10 mb-4">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black/40 border border-white/10 rounded-xl p-1 shrink-0 overflow-hidden">
                                                    <img 
                                                      src={p.image} 
                                                      alt={p.name}
                                                      decoding="async"
                                                      loading="lazy"
                                                      onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(p.name || 'Player');
                                                      }}
                                                      className="w-full h-full object-cover" 
                                                    />
                                                  </div>
                                                  <div className="min-w-0">
                                                    <h5 className="text-sm sm:text-base font-black uppercase tracking-tight truncate text-white">{p.name}</h5>
                                                    <div className="flex items-center gap-2 mt-1">
                                                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.type}</span>
                                                      {isOverseasPlayer(p) && <Wifi size={12} className="text-purple-400 rotate-90 shrink-0" />}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                  <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rating</span>
                                                  <span className="text-lg sm:text-xl font-black text-white">{p.rating || 15}</span>
                                                </div>
                                             </div>
                                             <div className="relative z-10 pt-3 border-t border-white/5 flex items-center justify-between">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acquired For</div>
                                                <div className="text-sm sm:text-base font-black text-emerald-400">{p.bid == null ? '—' : `₹${formatCrores(p.bid)}Cr`}</div>
                                             </div>
                                           </>
                                        ) : (
                                           <>
                                             <div className="flex items-center gap-3 min-w-0">
                                               <div className="w-9 h-9 sm:w-11 sm:h-11 bg-black/40 border border-white/10 rounded-lg p-1 shrink-0 overflow-hidden">
                                                 <img 
                                                   src={p.image} 
                                                   alt={p.name}
                                                   decoding="async"
                                                   loading="lazy"
                                                   onError={(e) => {
                                                     e.target.onerror = null;
                                                     e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(p.name || 'Player');
                                                   }}
                                                   className="w-full h-full object-cover" 
                                                 />
                                               </div>
                                               <div className="overflow-hidden min-w-0">
                                                 <h5 className="text-[11px] sm:text-[12px] font-black uppercase tracking-tight truncate text-white">{p.name}</h5>
                                                 <div className="flex items-center gap-1.5">
                                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.type}</span>
                                                   {isOverseasPlayer(p) && <Wifi size={10} className="text-purple-400 rotate-90 shrink-0" />}
                                                 </div>
                                               </div>
                                             </div>
                                             <div className="text-right shrink-0">
                                               <div className="text-[12px] sm:text-[13px] font-black text-emerald-400">{p.bid == null ? '—' : `₹${formatCrores(p.bid)}Cr`}</div>
                                             </div>
                                           </>
                                        )}
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Summary Footer for Team */}
                            <div className="pt-4 sm:pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 opacity-70 hover:opacity-100 transition-opacity relative z-10">
                               <div className="flex items-center gap-3">
                                  <LayoutGrid size={14} className="text-slate-400" />
                                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.4em]">Composition Verified by Arena Engine</p>
                               </div>
                               <div className="flex gap-4">
                                  <button 
                                     onClick={() => handleShareSquadImage(t, squad, manager)}
                                     disabled={sharingTeamId === t.id}
                                     className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-300 hover:text-white transition-colors touch-manipulation cursor-pointer active:scale-95 disabled:opacity-50"
                                  >
                                     {sharingTeamId === t.id ? (
                                       <span className="text-slate-300 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Generating Poster...</span>
                                     ) : copiedTeamId === t.id ? (
                                       <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={12} /> Image Downloaded!</span>
                                     ) : (
                                       <><Share2 size={12} /> Share Squad Image</>
                                     )}
                                  </button>
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.section>
          )}
        </AnimatePresence>

    

      </div>
    </div>
  );
};

export default AuctionSummary;
