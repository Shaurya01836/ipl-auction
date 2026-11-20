import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { IPL_PLAYERS } from '../data/players';
import { TEAMS } from '../data/teams';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { fetchAuctionRecord, fetchTeamsForAuction } from '../lib/directoryApi';
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
  AlertCircle,Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SquadRating from '../components/SquadRating';
import PageLoader from '../components/PageLoader';
import { MultiplexAdSlot } from '../components/AdSlot';
import useRoomServer from '../hooks/useRoomServer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { isLocalRoom, loadLocalSoloRoom } from '../lib/localAuctionEngine';
import {
  computeTeamSpent,
  countOverseas,
  formatCrores,
  getPlayerAvatar,
  isOverseasPlayer,
  toFiniteNumber,
} from '../lib/auctionDisplay';


const AuctionSummary = () => {
  const { id } = useParams();
  useDocumentTitle(`Auction Summary #${id || ''} | CrickAuction`, 'Final squad rosters and auction summary.', true);
  const navigate = useNavigate();
  const { server, ready: serverReady } = useRoomServer(id);
  const { currentAuction, roomTeams } = useAuction();
  const { user } = useAuth();
  const { handleFirebaseError } = useQuota();
  
  const [activeTab, setActiveTab] = useState('squads');
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [sharingTeamId, setSharingTeamId] = useState(null);
  const [copiedTeamId, setCopiedTeamId] = useState(null);
    const posterRefs = React.useRef({});

  const [dbAuction, setDbAuction] = useState(null);
  const [dbTeams, setDbTeams] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);

  const teamCardRefs = React.useRef({});

  const handleShareSquadImage = async (team, squad, manager) => {
    const cardEl = posterRefs.current[team.id] || teamCardRefs.current[team.id];
    if (!cardEl) return;

    setSharingTeamId(team.id);

    try {
      if (typeof confetti === 'function') {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ffffff']
          });
        } catch (_) {}
      }

      const width = 800;
      const height = Math.max(cardEl.scrollHeight || 0, cardEl.offsetHeight || 0, 700);

      // Generate crisp 2x PNG Blob & Data URL from element
      const dataUrl = await toPng(cardEl, {
        width,
        height,
        backgroundColor: '#0c0d10',
        pixelRatio: 2,
        skipFonts: true,
        cacheBust: false,
        style: {
          position: 'static',
          left: '0',
          top: '0',
          margin: '0',
          transform: 'none',
          visibility: 'visible',
          opacity: '1',
        },
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

        // 1. Persistent Directory store
        const aData = await fetchAuctionRecord(id);
        const tData = aData ? await fetchTeamsForAuction(id) : [];

        if (aData && isMounted) {
          const finalTeams = Array.isArray(aData.settings?.finalTeams) ? aData.settings.finalTeams : [];
          const rawTeams = (tData && tData.length > 0) ? tData : finalTeams;

          setDbAuction({
            id: aData.id,
            hostId: aData.host_id || aData.hostId,
            hostName: aData.host_name || aData.hostName,
            status: aData.status || 'completed',
            auctionType: aData.auction_type || aData.auctionType || 'mega',
            squadLimit: toFiniteNumber(aData.squad_limit || aData.squadLimit, 25),
            overseasLimit: toFiniteNumber(aData.overseas_limit || aData.overseasLimit, 8),
            players: aData.players || [],
            settings: aData.settings || { budget: 120, bidTimer: 10 }
          });

          const parsedTeams = (rawTeams || []).map(t => {
            const rawSquad = t.squad;
            const squadArr = Array.isArray(rawSquad) ? rawSquad : (rawSquad ? Object.values(rawSquad) : []);
            return {
              id: t.id,
              auctionId: t.auction_id || t.auctionId,
              userId: t.user_id || t.userId,
              teamId: t.team_id || t.teamId,
              teamName: t.team_name || t.teamName,
              budgetRemaining: t.budget_remaining ?? t.budgetRemaining ?? null,
              spent: toFiniteNumber(t.spent, 0),
              squad: squadArr
            };
          });

          // If directory teams already have sold players, use them immediately
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

  const isLocalSoloOwner = Boolean(
    (isLocalRoom(id, server, true) || server === 'local' || (typeof id === 'string' && id.startsWith('SOLO-'))) &&
    loadLocalSoloRoom(id)
  );

  const roomCreatorId = activeAuction?.hostId || activeAuction?.host_id || activeAuction?.createdBy;
  const isHost = Boolean(
    isLocalSoloOwner ||
    (user?.uid && (
      (roomCreatorId && roomCreatorId === user.uid) ||
      activeAuction?.players?.some(p => (p?.id === user.uid || p?.userId === user.uid) && Boolean(p?.isHost))
    ))
  );

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
              { id: 'fantasy', label: 'Ratings', fullLabel: 'Squad Ratings', icon: Sparkles },
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
                            e.target.src = getPlayerAvatar(player?.name);
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
                            {player.role} • {player.teamId || TEAMS.find(t => t.id === player.team)?.name || player.teamName}
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
                auctionId={id || activeAuction?.id}
                isHost={isHost}
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
                const teamDoc = activeTeams.find(doc => (doc.teamId || doc.team_id) === t.id);
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
                      className={`w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] bg-[#0c0d10] border transition-colors duration-200 relative overflow-hidden group active:scale-[0.98] touch-manipulation gap-4 ${
                        isExpanded ? 'border-white/20 bg-white/[0.04] shadow-2xl' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Subtle Background Watermark Logo */}
                      <div className="absolute -right-8 -bottom-8 w-40 sm:w-64 h-40 sm:h-64 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none grayscale">
                         <img src={t.logo} alt="" decoding="async" loading="lazy" className="w-full h-full object-contain" />
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shadow-lg shrink-0">
                           <img src={t.logo} alt="" decoding="async" loading="lazy" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-left min-w-0">
                          <h3 className="text-base sm:text-xl font-pixel uppercase tracking-tight text-white group-hover:text-slate-200 transition-colors truncate">{t.name}</h3>
                          <p className="text-[8px] sm:text-[9px] font-pixel text-slate-400 uppercase tracking-wider leading-none mt-1 truncate">Managed by {manager?.name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 relative z-10 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                        {/* Summary Stats */}
                        <div className="flex items-center gap-3 sm:gap-5 md:gap-7 text-left sm:text-right sm:border-r border-white/10 sm:pr-4 md:pr-7">
                          <div className="shrink-0">
                            <span className="block text-[7px] sm:text-[8px] font-pixel text-slate-400 uppercase tracking-wider mb-0.5">Players</span>
                            <span className="text-xs sm:text-base font-black text-white">{squad.length}</span>
                          </div>
                          <div className="shrink-0">
                            <span className="block text-[7px] sm:text-[8px] font-pixel text-purple-400 uppercase tracking-wider mb-0.5">Overseas</span>
                            <span className="text-xs sm:text-base font-black text-white">{osCount}</span>
                          </div>
                          <div className="shrink-0">
                            <span className="block text-[7px] sm:text-[8px] font-pixel text-slate-400 uppercase tracking-wider mb-0.5">Spent</span>
                            <span className="text-xs sm:text-base font-black text-white">{totalSpent === null ? '—' : `₹${formatCrores(totalSpent, 1)}Cr`}</span>
                          </div>
                        </div>

                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-200 shrink-0 ${isExpanded ? 'rotate-180 bg-white text-black' : 'text-slate-400 group-hover:text-white group-hover:bg-white/10'}`}>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </button>

                    {/* Squad Content (Hardware-Accelerated CSS Grid Accordion) */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] px-1 sm:px-3 md:px-6 mb-4 ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div 
                           ref={el => teamCardRefs.current[t.id] = el}
                           className="bg-[#0c0d10] border-x border-b border-white/10 rounded-b-2xl sm:rounded-b-[1.75rem] p-4 sm:p-6 space-y-6 sm:space-y-8 relative overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]"
                        >
                           {/* Watermark Logo for Exported Image */}
                           <div className="absolute right-4 top-4 w-32 h-32 opacity-5 pointer-events-none grayscale">
                              <img src={t.logo} alt="" decoding="async" loading="lazy" className="w-full h-full object-contain" />
                           </div>

                           {/* Top Toolbar: Primary Share CTA */}
                           <div className="flex items-center justify-end gap-3 relative z-10 mb-4 sm:mb-6 pb-4 border-b border-white/10">
                             <button 
                               onClick={() => handleShareSquadImage(t, squad, manager)}
                               disabled={sharingTeamId === t.id}
                               className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider transition-colors duration-150 shadow-[0_10px_30px_rgba(255,255,255,0.08)] active:scale-[0.98] cursor-pointer disabled:opacity-50 touch-manipulation shrink-0"
                             >
                               {sharingTeamId === t.id ? (
                                 <><Loader2 size={13} className="animate-spin" /> Generating Poster...</>
                               ) : copiedTeamId === t.id ? (
                                 <><CheckCircle2 size={13} /> Poster Saved / Shared!</>
                               ) : (
                                 <><Share2 size={13} /> Share Squad Poster</>
                               )}
                             </button>
                           </div>

                           {/* Role-Grouped Squad List View (Zero-Jank CSS rendering) */}
                           {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                             const rolePlayers = squad.filter(p => p.role === role);
                             if (rolePlayers.length === 0) return null;

                             return (
                               <div key={role} className="space-y-3 sm:space-y-4 relative z-10">
                                 <div className="flex items-center gap-3 sm:gap-4">
                                   <h4 className="text-[9px] sm:text-[10px] font-pixel uppercase tracking-wider text-slate-300">{role}s</h4>
                                   <div className="flex-1 h-px bg-white/10" />
                                   <span className="text-[8px] sm:text-[9px] font-pixel uppercase tracking-wider text-slate-400">{rolePlayers.length} Members</span>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                                   {rolePlayers.map((p) => (
                                     <div 
                                       key={p.id} 
                                       className="transform-gpu bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] p-2.5 sm:p-3.5 rounded-xl flex items-center justify-between group/p transition-colors duration-150 active:scale-[0.98]"
                                     >
                                       <div className="flex items-center gap-3 min-w-0">
                                         <div className="w-9 h-9 sm:w-11 sm:h-11 bg-black/40 border border-white/10 rounded-lg p-1 shrink-0 overflow-hidden">
                                           <img 
                                             src={p.image} 
                                             alt={p.name}
                                             decoding="async"
                                             loading="lazy"
                                             onError={(e) => {
                                               e.target.onerror = null;
                                               e.target.src = getPlayerAvatar(p?.name);
                                             }}
                                             className="w-full h-full object-cover" 
                                           />
                                         </div>
                                         <div className="overflow-hidden min-w-0">
                                           <h5 className="text-[11px] sm:text-[12px] font-bold uppercase tracking-tight truncate text-white">{p.name}</h5>
                                           <div className="flex items-center gap-1.5">
                                             <span className="text-[8px] font-pixel text-slate-400 uppercase tracking-wider">{p.type}</span>
                                             {isOverseasPlayer(p) && <Wifi size={10} className="text-purple-400 rotate-90 shrink-0" />}
                                           </div>
                                         </div>
                                       </div>
                                       <div className="text-right shrink-0">
                                         <div className="text-[12px] sm:text-[13px] font-black text-white">{p.bid == null ? '—' : `₹${formatCrores(p.bid)}Cr`}</div>
                                       </div>
                                     </div>
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
                      </div>
                    </div>

                    {/* Hidden Container for crisp 2x PNG poster export */}
                    <div
                      style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '800px',
                        height: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        zIndex: -9999,
                      }}
                    >
                      <div
                        ref={(el) => (posterRefs.current[t.id] = el)}
                        style={{
                          width: '800px',
                          backgroundColor: '#0c0d10',
                          color: '#ffffff',
                        }}
                        className="bg-[#0c0d10] text-white p-8 rounded-3xl border border-white/15 font-sans"
                      >
                        {/* Watermark logo */}
                        <div className="absolute -right-10 -bottom-10 w-72 h-72 opacity-[0.04] pointer-events-none grayscale">
                          <img src={t.logo} alt="" className="w-full h-full object-contain" />
                        </div>

                        {/* Poster Header */}
                        <div className="relative z-10 flex items-center justify-between pb-5 border-b border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 p-2 flex items-center justify-center">
                              <img src={t.logo} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="text-[9px] font-pixel uppercase tracking-widest text-slate-400">IPL Auction • Official Squad</div>
                              <h2 className="text-2xl font-pixel uppercase tracking-tight text-white mt-0.5">{t.name}</h2>
                              <p className="text-[10px] font-sans text-slate-400 uppercase tracking-wider mt-0.5">
                                Managed by {manager?.name || 'Franchise Management'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-pixel uppercase tracking-wider text-white">CrickAuction</div>
                            <div className="text-[9px] font-mono text-slate-500">crickauction.in</div>
                          </div>
                        </div>

                        {/* Stats Ribbon */}
                        <div className="relative z-10 grid grid-cols-3 gap-3 py-4 border-b border-white/10 text-center">
                          <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                            <div className="text-[8px] font-pixel uppercase tracking-wider text-slate-400 mb-1">Squad Size</div>
                            <div className="text-base font-black text-white">{squad.length} Players</div>
                          </div>
                          <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                            <div className="text-[8px] font-pixel uppercase tracking-wider text-purple-400 mb-1">Overseas</div>
                            <div className="text-base font-black text-white">{osCount} / 8</div>
                          </div>
                          <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                            <div className="text-[8px] font-pixel uppercase tracking-wider text-slate-400 mb-1">Purse Spent</div>
                            <div className="text-base font-black text-white">₹{totalSpent === null ? '—' : formatCrores(totalSpent)}Cr</div>
                          </div>
                        </div>

                        {/* Complete Squad Roster Grid */}
                        <div className="relative z-10 pt-4">
                          <div className="text-[11px] font-pixel uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Complete Squad Roster ({squad.length})
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {squad.map((p, idx) => (
                              <div key={p.id || idx} className="bg-white/[0.03] border border-white/10 p-2 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-5 h-5 rounded bg-white/5 text-slate-300 border border-white/10 font-pixel text-[9px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0">
                                    <img 
                                      src={p.image || getPlayerAvatar(p.name)} 
                                      alt="" 
                                      crossOrigin="anonymous"
                                      loading="eager"
                                      onError={(e) => { e.target.onerror = null; e.target.src = getPlayerAvatar(p?.name); }}
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-black text-white uppercase truncate">{p.name}</div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[8px] font-pixel uppercase tracking-wider text-slate-400">{p.type || p.role}</span>
                                      {isOverseasPlayer(p) && <span className="text-[7px] font-pixel uppercase text-purple-400">✈ OS</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-black text-white">{p.bid == null ? '—' : `₹${formatCrores(p.bid)}Cr`}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="relative z-10 mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[8px] font-pixel uppercase tracking-widest text-slate-500">
                          <span>Verified by CrickAuction Simulation Engine</span>
                          <span className="font-mono">crickauction.in</span>
                        </div>
                      </div>
                    </div>
                  </div>
                                );
              })}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Post-Auction Multiplex Ad Section */}
        <MultiplexAdSlot className="mt-10 sm:mt-14 mb-6" />

      </div>
    </div>
  );
};

export default AuctionSummary;
