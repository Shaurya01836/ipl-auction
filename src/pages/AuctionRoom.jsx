import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { TEAM_SLOGANS } from '../data/slogans';
import confetti from 'canvas-confetti';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { IPL_PLAYERS } from '../data/players';
import {
   History,
   AlertCircle,
   Timer,
   Copy,
   MessageSquare,
   Settings as SettingsIcon,
   Home,
   Pause,
   XCircle,
   Users,
   List,
   Download,
   Gavel,
   X,
   CheckCircle2,
   PlayCircle,
   ChevronDown,
   ShieldAlert,
   Eye,
   FastForward,
   SkipForward,
   Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TEAMS } from '../data/teams';
import TextChat from '../components/TextChat';
import PageLoader from '../components/PageLoader';
import PageBackground from '../components/PageBackground';
import ConfirmDialog from '../components/ConfirmDialog';
import AuctionCountdown from '../components/AuctionCountdown';
import AdSlot, { DEFAULT_AUCTION_ROOM_SLOT } from '../components/AdSlot';
import useRoomServer from '../hooks/useRoomServer';
import { SERVER_LOCAL, withServerParam } from '../lib/auctionServers';
import { isLocalRoom } from '../lib/localAuctionEngine';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getNextBidAmount } from '../lib/auctionRules';
import {
   computeTeamSpent,
   countOverseas,
   formatCrores,
   getPlayerAvatar,
   isOverseasPlayer,
   toFiniteNumber,
} from '../lib/auctionDisplay';

const AuctionRoom = () => {
   const { id } = useParams();
   useDocumentTitle(`Auction Room #${id || ''} | CrickAuction`, 'Live multiplayer IPL Auction bidding arena.', true);
   const navigate = useNavigate();
   const { server, ready: serverReady } = useRoomServer(id);
   const {
      currentAuction,
      team: contextTeam,
      roomTeams,
      loading,
      placeBid,
      joinAuction,
      joinRoomDb,
      endPlayerAuction,
      pauseAuction,
      resumeAuction,
      endAuction,
      messages,
      updateRoomSettings,
      kickPlayer,
      skipCurrentPlayerSolo,
      fastForwardAuctionSolo,
      getSyncedTime,
      soloLockStatus,
      takeOverSoloAuction
   } = useAuction();
   const { user } = useAuth();
   const [error, setError] = useState('');
   const [copied, setCopied] = useState(false);
   const [showPlayersOverlay, setShowPlayersOverlay] = useState(false);
   const [activeOverlayTab, setActiveOverlayTab] = useState('upcoming');
   const [searchQuery] = useState('');
   const [selectedTeamId, setSelectedTeamId] = useState(null);
   const [mobileTab, setMobileTab] = useState('arena'); // arena, squad, activity, chat
   const [showSettings, setShowSettings] = useState(false);
   const [showParticipantsOverlay, setShowParticipantsOverlay] = useState(false);
   const [showEndConfirm, setShowEndConfirm] = useState(false);
   const [isEnding, setIsEnding] = useState(false);
   const [sidebarTab, setSidebarTab] = useState('activity'); // activity or chat
   const celebrationAudioRef = useRef(null);
   const fallbackAudioRef = useRef(null);
   const redirectedToLobbyRef = useRef(false);
   const [newTimerValue, setNewTimerValue] = useState(currentAuction?.settings?.bidTimer || 10);
   const [optimisticState, setOptimisticState] = useState(null);
   const [joiningTeam, setJoiningTeam] = useState(null);
   const [banError, setBanError] = useState(null);
   const [isBiddingInFlight, setIsBiddingInFlight] = useState(false);
   const [spectateMode, setSpectateMode] = useState(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('spectate') === 'true';
   });

   // Clear optimistic state when DB catches up, player changes, or lot finalizes
   useEffect(() => {
      if (!optimisticState) return;
      const dbLive = currentAuction?.currentAuction;
      if (!dbLive) return;

      const shouldClear =
         dbLive.playerId !== optimisticState.playerId ||
         dbLive.currentBid >= optimisticState.currentBid ||
         dbLive.status !== 'bidding' ||
         dbLive.highBidderId === user?.uid;

      if (shouldClear) {
         setOptimisticState(null);
      }
   }, [
      currentAuction?.currentAuction?.currentBid,
      currentAuction?.currentAuction?.playerId,
      currentAuction?.currentAuction?.status,
      currentAuction?.currentAuction?.highBidderId,
      optimisticState,
      user?.uid
   ]);

   const displayAuctionState = optimisticState || currentAuction?.currentAuction || currentAuction?.currentLot;

   // Solo vs AI bots detection: strictly device-local rooms
   const isSoloVsBots = useMemo(() => {
      return server === SERVER_LOCAL || isLocalRoom(id, server);
   }, [server, id]);

   // Effective team: use context team, or in solo rooms derive the human team from roomTeams/currentAuction
   const team = useMemo(() => {
      const t = contextTeam || (isSoloVsBots ? (roomTeams || []).find(doc => doc.userId === user?.uid || !String(doc.userId).startsWith('bot_')) : null);
      if (!t) return null;
      return {
         ...t,
         id: t.teamId || t.id,
         teamId: t.teamId || t.id,
         team: t.teamId || t.id,
      };
   }, [contextTeam, isSoloVsBots, roomTeams, user?.uid]);

   const [isSkippingLot, setIsSkippingLot] = useState(false);
   const [isFastForwarding, setIsFastForwarding] = useState(false);
   const [showFastForwardConfirm, setShowFastForwardConfirm] = useState(false);

   const handleSoloSkip = async () => {
      if (isSkippingLot || displayAuctionState?.status !== 'bidding') return;
      setIsSkippingLot(true);
      try {
         await skipCurrentPlayerSolo(id);
      } catch (err) {
         console.warn('[auction] Solo skip error', err);
      } finally {
         setTimeout(() => setIsSkippingLot(false), 500);
      }
   };

   const handleSoloFastForward = async () => {
      if (isFastForwarding) return;
      setIsFastForwarding(true);
      try {
         await fastForwardAuctionSolo(id);
         navigate(withServerParam(`/summary/${id}`, server));
      } catch (err) {
         console.warn('[auction] Fast-forward error', err);
         setIsFastForwarding(false);
      }
   };

   const configuredBidTimer = toFiniteNumber(currentAuction?.settings?.bidTimer, 10);
   const isTimerPaused = displayAuctionState?.status === 'paused';

   // Real-time team ratings calculated entirely in browser memory (0 DB / infra cost)
   const liveTeamRatings = useMemo(() => {
      const playerMap = new Map(IPL_PLAYERS.map(p => [p.id, p]));
      const ratingMap = {};

      TEAMS.forEach(team => {
         const teamDoc = roomTeams.find(doc => doc.teamId === team.id);
         const squad = teamDoc?.squad || [];

         let totalRating = 0;
         let ratedPlayersCount = 0;

         squad.forEach(member => {
            const pid = typeof member === 'string' ? member : member.id;
            const pInfo = playerMap.get(pid);
            if (pInfo?.rating) {
               totalRating += pInfo.rating;
               ratedPlayersCount += 1;
            }
         });

         const avgRating = ratedPlayersCount > 0 ? (totalRating / ratedPlayersCount).toFixed(1) : null;

         ratingMap[team.id] = {
            totalRating,
            avgRating,
            playerCount: squad.length
         };
      });

      // Sorted ranking descending by avgRating, then totalRating, then team name
      const rankedTeams = [...TEAMS].sort((a, b) => {
         const rA = ratingMap[a.id]?.avgRating ? parseFloat(ratingMap[a.id].avgRating) : 0;
         const rB = ratingMap[b.id]?.avgRating ? parseFloat(ratingMap[b.id].avgRating) : 0;
         if (rB !== rA) return rB - rA;

         const tA = ratingMap[a.id]?.totalRating || 0;
         const tB = ratingMap[b.id]?.totalRating || 0;
         if (tB !== tA) return tB - tA;

         return a.name.localeCompare(b.name);
      });

      return { ratingMap, rankedTeams };
   }, [roomTeams, IPL_PLAYERS]);


   // Audio unlocker for mobile devices
   useEffect(() => {
      if (!celebrationAudioRef.current) {
         celebrationAudioRef.current = new Audio();
      }
      const unlockAudio = () => {
         if (celebrationAudioRef.current) {
            celebrationAudioRef.current.src = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
            celebrationAudioRef.current.play().then(() => {
               celebrationAudioRef.current.pause();
               celebrationAudioRef.current.currentTime = 0;
            }).catch(() => { });
         }
      };

      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });

      return () => {
         window.removeEventListener('click', unlockAudio);
         window.removeEventListener('touchstart', unlockAudio);
      };
   }, []);


   // Sync room status (redirect if waiting or completed)
   useEffect(() => {
      if (!serverReady) return;
      if (currentAuction?.status === 'completed') {
         navigate(withServerParam(`/summary/${id}`, server), { replace: true });
      } else if (currentAuction?.status === 'waiting') {
         navigate(withServerParam(`/lobby/${id}`, server), { replace: true });
      }
   }, [currentAuction?.status, id, navigate, server, serverReady]);

   // Missing-auth redirects must happen in an effect, never during render.
   useEffect(() => {
      if (!serverReady) return;
      if (!user && !loading && !redirectedToLobbyRef.current) {
         redirectedToLobbyRef.current = true;
         navigate(withServerParam(`/lobby/${id}`, server), { replace: true });
      }
   }, [user, loading, id, navigate, server, serverReady]);

   const TEAM_SONGS = {
      'csk': '/CSK.mp3',
      'mi': '/MI.mp3',
      'rcb': '/RCB.mp3',
      'kkr': '/KKR.mp3',
      'dc': '/DC.mp3',
      'pbks': '/PBKS.mp3',
      'rr': '/RR.mp3',
      'srh': '/SRH.mp3',
      'lsg': '/LSG.mp3',
      'gt': '/GT.mp3',
   };

   useEffect(() => {
      if (user) setSelectedTeamId(user.uid);
   }, [user]);


   const currentPlayer = useMemo(() => {
      return IPL_PLAYERS.find(p => p.id === displayAuctionState?.playerId) || IPL_PLAYERS[0];
   }, [displayAuctionState?.playerId]);

   const [isTtsEnabled, setIsTtsEnabled] = useState(true);
   const [ttsSpeed, setTtsSpeed] = useState(1.15); // configurable pace
   const [ttsPitch, setTtsPitch] = useState(0.95); // configurable pitch
   const [availableVoices, setAvailableVoices] = useState([]);
   const [selectedVoiceName, setSelectedVoiceName] = useState('');

   const lastSpokenPlayerIdRef = useRef(null);
   const lastSpokenBidRef = useRef(0);
   const lastSpokenStatusRef = useRef(null);

   // Indian currency speech formatter
   const formatPriceForSpeech = (amount) => {
      if (amount === 0) return "zero crores";
      if (amount < 1) {
         const lakhs = Math.round(amount * 100);
         return `${lakhs} lakh${lakhs !== 1 ? 's' : ''}`;
      } else {
         const crores = Math.floor(amount);
         const lakhs = Math.round((amount - crores) * 100);
         if (lakhs === 0) {
            return `${crores} crore${crores !== 1 ? 's' : ''}`;
         }
         return `${crores} crore${crores !== 1 ? 's' : ''} ${lakhs} lakh${lakhs !== 1 ? 's' : ''}`;
      }
   };

   // Curated list of high-quality, natural-sounding English voice patterns
   const getVoiceLabel = (name) => {
      const cleanName = name.toLowerCase();
      if (cleanName.includes("neerja")) return "Neerja (Authentic Indian Female)";
      if (cleanName.includes("rishi")) return "Rishi (Authentic Indian Male)";
      if (cleanName.includes("daniel")) return "Daniel (Classic UK Auctioneer)";
      if (cleanName.includes("david")) return "David (Professional Deep Male)";
      if (cleanName.includes("samantha")) return "Samantha (Natural US Female)";
      if (cleanName.includes("google us")) return "Google US English (Clear)";
      if (cleanName.includes("google uk male")) return "Google UK Male (Sleek)";
      if (cleanName.includes("google uk female")) return "Google UK Female (Refined)";

      return name.replace("Microsoft", "").replace("Google", "").replace("Desktop", "").replace("Natural", "").trim();
   };

   // Fetch browser English voices (curated list of 3-5 real-sounding voices)
   useEffect(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
         const updateVoices = () => {
            const voices = window.speechSynthesis.getVoices();

            const targetPatterns = [
               "Microsoft David",
               "David",
               "Google US English",
               "Google UK English Male",
               "Google UK English Female",
               "Neerja",
               "Daniel",
               "Samantha",
               "Rishi"
            ];

            let filtered = voices.filter(v =>
               v.lang.startsWith('en') &&
               targetPatterns.some(pattern => v.name.toLowerCase().includes(pattern.toLowerCase()))
            );

            // Deduplicate by display label, preferring "Online" or "Natural" high-quality voice versions
            const uniqueMap = new Map();
            filtered.forEach(v => {
               const label = getVoiceLabel(v.name);
               const cleanName = v.name.toLowerCase();
               if (!uniqueMap.has(label) || cleanName.includes("online") || cleanName.includes("natural")) {
                  uniqueMap.set(label, v);
               }
            });
            filtered = Array.from(uniqueMap.values());

            // Prioritize David at the top
            filtered.sort((a, b) => {
               const aDavid = a.name.toLowerCase().includes("david");
               const bDavid = b.name.toLowerCase().includes("david");
               if (aDavid && !bDavid) return -1;
               if (!aDavid && bDavid) return 1;
               return 0;
            });

            if (filtered.length === 0) {
               filtered = voices.filter(v => v.lang.startsWith('en')).slice(0, 5);
            } else {
               filtered = filtered.slice(0, 5);
            }

            setAvailableVoices(filtered);

            // Set default selected voice (default to David)
            if (!selectedVoiceName && filtered.length > 0) {
               const defaultVoice = filtered.find(v => v.name.toLowerCase().includes("david")) ||
                  filtered.find(v =>
                     v.name.includes("Neerja") ||
                     v.name.includes("Daniel") ||
                     v.name.includes("Rishi") ||
                     v.name.includes("Google US")
                  ) || filtered[0];

               if (defaultVoice) {
                  setSelectedVoiceName(defaultVoice.name);
               }
            }
         };

         updateVoices();
         if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
         }
      }
   }, [selectedVoiceName]);

   // Core Text-to-Speech call
   const speak = (text) => {
      if (!isTtsEnabled) return;
      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel(); // cancel any active or queued speech immediately
         const utterance = new SpeechSynthesisUtterance(text);
         const voices = window.speechSynthesis.getVoices();

         const chosenVoice = voices.find(v => v.name === selectedVoiceName) || voices.find(v => v.name.toLowerCase().includes("david")) || voices.find(v => v.lang.startsWith('en')) || voices[0];
         if (chosenVoice) {
            utterance.voice = chosenVoice;
         }
         utterance.rate = ttsSpeed;
         utterance.pitch = ttsPitch;
         window.speechSynthesis.speak(utterance);
      }
   };

   // TTS Live Auctioneer Sync Hook
   useEffect(() => {
      if (currentAuction?.status !== 'active' || !displayAuctionState) return;

      const playerId = displayAuctionState.playerId;
      const currentBid = displayAuctionState.currentBid || 0;
      const status = displayAuctionState.status;
      const highBidderTeamId = displayAuctionState.highBidderTeamId;

      if (status === 'paused') {
         if (lastSpokenStatusRef.current !== 'paused') {
            lastSpokenStatusRef.current = 'paused';
            if ('speechSynthesis' in window) {
               window.speechSynthesis.cancel();
            }
            speak("Auction paused by Admin.");
         }
         return;
      }

      if (status === 'bidding') {
         // Resuming from pause
         if (lastSpokenStatusRef.current === 'paused') {
            lastSpokenStatusRef.current = 'bidding';
            speak("Auction resumed. Bidding is open.");
            return;
         }

         // 1. A new player is up for bidding
         if (lastSpokenPlayerIdRef.current !== playerId) {
            lastSpokenPlayerIdRef.current = playerId;
            lastSpokenBidRef.current = 0;
            lastSpokenStatusRef.current = 'bidding';

            const pName = currentPlayer?.name || "Player";
            const pRole = currentPlayer?.role || "";
            const baseValStr = formatPriceForSpeech(currentPlayer?.basePrice || 0);
            speak(`Now up for auction: ${pName}, a ${pRole}. Starting with a base price of ${baseValStr}. Do I see a bid?`);
         }
         // 2. A new bid is placed
         else if (currentBid > lastSpokenBidRef.current) {
            lastSpokenBidRef.current = currentBid;
            const teamName = TEAMS.find(t => t.id === highBidderTeamId)?.name || highBidderTeamId || "a manager";
            const bidValStr = formatPriceForSpeech(currentBid);

            const bidPhrases = [
               `We have ${bidValStr} from ${teamName}!`,
               `Bid is ${bidValStr} with ${teamName}!`,
               `${teamName} bids ${bidValStr}!`,
               `${bidValStr} is bid by ${teamName}!`
            ];
            const chosenPhrase = bidPhrases[Math.floor(Math.random() * bidPhrases.length)];
            speak(chosenPhrase);
         }
      } else if (status === 'sold' && lastSpokenStatusRef.current !== 'sold') {
         lastSpokenStatusRef.current = 'sold';
         const teamName = TEAMS.find(t => t.id === highBidderTeamId)?.name || highBidderTeamId || "a franchise";
         const bidValStr = formatPriceForSpeech(currentBid);
         speak(`Sold! ${currentPlayer?.name || "Player"} goes to ${teamName} for ${bidValStr}!`);
      } else if (status === 'unsold' && lastSpokenStatusRef.current !== 'unsold') {
         lastSpokenStatusRef.current = 'unsold';
         speak(`${currentPlayer?.name || "Player"} is unsold.`);
      }
   }, [displayAuctionState?.playerId, displayAuctionState?.currentBid, displayAuctionState?.status, currentAuction?.status, isTtsEnabled, currentPlayer]);

   // Cancel all TTS speech when room is unmounted (cleanup)
   useEffect(() => {
      return () => {
         if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
         }
      };
   }, []);

   const isAdmin = isSoloVsBots || currentAuction?.hostId === user?.uid;
   const currentBid = displayAuctionState?.currentBid || 0;
   const nextBidAmount = getNextBidAmount(currentPlayer, currentBid);
   const playerCategories = useMemo(() => {
      const soldIds = new Set();
      const soldWithBids = {};
      roomTeams.forEach(t => {
         (t.squad || []).forEach(p => {
            soldIds.add(p.id);
            soldWithBids[p.id] = { bid: p.bid, teamId: t.teamId };
         });
      });

      const playerOrder = currentAuction?.playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
      const currentPlayerId = displayAuctionState?.playerId;
      const currentPlayerIndexInOrder = playerOrder.indexOf(IPL_PLAYERS.findIndex(p => p.id === currentPlayerId));

      const upcoming = [];
      const sold = [];
      const unsold = [];

      playerOrder.forEach((idx, i) => {
         const p = IPL_PLAYERS[idx];
         if (!p) return;
         if (soldIds.has(p.id)) {
            sold.push({ ...p, ...soldWithBids[p.id] });
         } else if (i < currentPlayerIndexInOrder) {
            unsold.push(p);
         } else {
            upcoming.push(p);
         }
      });

      return { upcoming, sold, unsold };
   }, [currentAuction?.playerOrder, displayAuctionState?.playerId, roomTeams]);

   const filteredPlayers = useMemo(() => {
      let players = [];
      if (activeOverlayTab === 'upcoming') players = playerCategories.upcoming;
      else if (activeOverlayTab === 'sold') players = playerCategories.sold;
      else if (activeOverlayTab === 'unsold') players = playerCategories.unsold;
      else if (activeOverlayTab === 'leaderboard') {
         players = [...playerCategories.sold].sort((a, b) => b.bid - a.bid);
      }

      return players.filter(p =>
         p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (p.set || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
   }, [activeOverlayTab, playerCategories, searchQuery]);

   const groupedUpcomingPlayers = useMemo(() => {
      if (activeOverlayTab !== 'upcoming') return null;
      const groups = {};
      filteredPlayers.forEach(p => {
         const setName = p.set || 'General Pool';
         if (!groups[setName]) groups[setName] = [];
         groups[setName].push(p);
      });
      return groups;
   }, [activeOverlayTab, filteredPlayers]);

   useEffect(() => {
      if (!serverReady || !id || !user?.uid) return;
      const unsub = joinAuction(id, user.uid, server);

      const autoJoin = async () => {
         if (server === SERVER_LOCAL || isLocalRoom(id, server)) return;
         try {
            await joinRoomDb(id, user.uid, { name: user.displayName || 'Manager' }, server);
         } catch (e) {
            if (e?.message?.includes("kicked")) {
               setBanError(e.message);
            } else {
               // Non-blocking: the live subscription still connects the user.
               console.warn('[auction] Auto-join failed', e);
            }
         }
      };
      autoJoin();

      return () => unsub();
   }, [id, user?.uid, user?.displayName, joinAuction, joinRoomDb, server, serverReady]);

   useEffect(() => {
      if (currentAuction && user) {
         const isUserBanned = currentAuction.bannedPlayers?.includes(user.uid);
         if (isUserBanned) {
            setBanError("You have been kicked from this room and cannot rejoin.");
         }
      }
   }, [currentAuction, user]);

   const audioCtxRef = useRef(null);
   const playBeep = useCallback((freq = 440, duration = 0.1) => {
      if (displayAuctionState?.status === 'paused') return;
      try {
         if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
         }
         const audioCtx = audioCtxRef.current;
         if (audioCtx.state === 'suspended') {
            audioCtx.resume();
         }
         const oscillator = audioCtx.createOscillator();
         const gainNode = audioCtx.createGain();

         oscillator.type = 'sine';
         oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
         gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
         gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

         oscillator.connect(gainNode);
         gainNode.connect(audioCtx.destination);

         oscillator.start();
         oscillator.stop(audioCtx.currentTime + duration);
      } catch {
         // AudioContext can be unavailable or blocked; beeps are non-critical.
      }
   }, [displayAuctionState?.status]);

   // Release only resources owned by this component when it unmounts.
   useEffect(() => {
      return () => {
         const audio = celebrationAudioRef.current;
         if (audio) {
            try {
               audio.pause();
               audio.currentTime = 0;
               audio.removeAttribute('src');
               audio.load();
            } catch (e) {
               console.warn('[auction audio] Failed to release celebration audio', e);
            }
         }

         const fallback = fallbackAudioRef.current;
         if (fallback) {
            try {
               fallback.pause();
               fallback.currentTime = 0;
               fallback.removeAttribute('src');
               fallback.load();
            } catch (e) {
               console.warn('[auction audio] Failed to release fallback audio', e);
            }
            fallbackAudioRef.current = null;
         }

         const ctx = audioCtxRef.current;
         if (ctx && ctx.state !== 'closed') {
            ctx.close().catch(() => {
               // The context may already be closing; nothing else to release.
            });
         }

         if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
         }
      };
   }, []);


   const lastHandledSoundStatusRef = useRef(null);

   useEffect(() => {
      const status = displayAuctionState?.status;
      let rafId;

      if (status === 'sold') {
         const currentKey = `sold_${displayAuctionState?.highBidderTeamId}_${displayAuctionState?.currentBid}`;
         if (lastHandledSoundStatusRef.current !== currentKey) {
            lastHandledSoundStatusRef.current = currentKey;

            const teamId = displayAuctionState?.highBidderTeamId;
            const colorMap = {
               'MI': ['#004BA0', '#FFFFFF', '#0080FF'],
               'CSK': ['#FFFF00', '#0000FF', '#FDB913'],
               'RCB': ['#EC1C24', '#2c30a7ff', '#FFD700'],
               'KKR': ['#3A225D', '#B38B2D', '#D1AB3E'],
               'DC': ['#000080', '#FF0000', '#0000CD'],
               'PBKS': ['#ED1B24', '#FFFFFF', '#D71921'],
               'RR': ['#EA1A85', '#004B8D', '#254AA5'],
               'SRH': ['#FF8228', '#000000', '#F26522'],
               'GT': ['#1B2133', '#C1AA77', '#0B132B'],
               'LSG': ['#0057E7', '#D11D55', '#01153E']
            };
            const colors = teamId && colorMap[teamId] ? colorMap[teamId] : ['#FFD700', '#FFA500', '#FF4500'];

            // High-performance smooth confetti bursts (avoids frame drops on mobile/laptop)
            confetti({
               particleCount: 50,
               spread: 70,
               origin: { y: 0.6 },
               colors: colors,
               scalar: 1.1,
               disableForReducedMotion: true
            });
            const t1 = setTimeout(() => {
               confetti({
                  particleCount: 35,
                  angle: 60,
                  spread: 50,
                  origin: { x: 0.05, y: 0.65 },
                  colors: colors,
                  disableForReducedMotion: true
               });
               confetti({
                  particleCount: 35,
                  angle: 120,
                  spread: 50,
                  origin: { x: 0.95, y: 0.65 },
                  colors: colors,
                  disableForReducedMotion: true
               });
            }, 200);

            if (teamId && TEAM_SONGS[teamId.toLowerCase()]) {
               if (!celebrationAudioRef.current) celebrationAudioRef.current = new Audio();
               const audio = celebrationAudioRef.current;
               try {
                  audio.pause();
                  audio.src = TEAM_SONGS[teamId.toLowerCase()];
                  audio.volume = 0.5;
                  audio.play().catch(() => {
                     // Autoplay can be blocked until a user gesture; non-fatal.
                  });
               } catch (e) {
                  console.warn('[auction audio] Celebration playback failed', e);
               }
            }
         }
      } else if (status === 'unsold') {
         const currentKey = `unsold_${displayAuctionState?.playerId}`;
         if (lastHandledSoundStatusRef.current !== currentKey) {
            lastHandledSoundStatusRef.current = currentKey;

            const unsoldAudios = ['/unsold1.mpeg'];
            const randomAudio = unsoldAudios[Math.floor(Math.random() * unsoldAudios.length)];
            const audio = celebrationAudioRef.current;

            if (audio) {
               try {
                  audio.pause();
                  audio.src = randomAudio;
                  audio.volume = 0.7;
                  const playPromise = audio.play();
                  if (playPromise !== undefined) {
                     playPromise.catch(() => {
                        // Mobile fallback Audio object
                        if (fallbackAudioRef.current) {
                           fallbackAudioRef.current.pause();
                        }
                        const fallbackAudio = new Audio(randomAudio);
                        fallbackAudio.volume = 0.7;
                        fallbackAudioRef.current = fallbackAudio;
                        fallbackAudio.play().catch(() => {
                           // Autoplay can be blocked until a user gesture; non-fatal.
                        });
                     });
                  }
               } catch (e) {
                  console.warn('[auction audio] Unsold playback failed', e);
               }
            }
         }
      } else {
         lastHandledSoundStatusRef.current = null;
         const audio = celebrationAudioRef.current;
         if (audio) {
            audio.pause();
            audio.currentTime = 0;
         }
      }

      return () => {
         if (rafId) cancelAnimationFrame(rafId);
      };
   }, [displayAuctionState?.status, displayAuctionState?.highBidderTeamId, displayAuctionState?.playerId, displayAuctionState?.currentBid]);





   const handleBid = async () => {
      if (isBiddingInFlight) return;
      if (displayAuctionState?.highBidderId === user?.uid) return;

      // Budget Guard
      if ((team?.budgetRemaining || 0) < nextBidAmount) {
         setError('Insufficient Budget');
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
         return;
      }

      // Squad Size Guard
      const squadLimit = toFiniteNumber(currentAuction?.squadLimit, 25);
      if ((team?.squad?.length || 0) >= squadLimit) {
         setError(`Squad Full (Max ${squadLimit} Players)`);
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
         return;
      }

      // Overseas Limit Check
      const isOverseas = isOverseasPlayer(currentPlayer);
      const overseasLimit = toFiniteNumber(currentAuction?.overseasLimit, 8);
      if (isOverseas) {
         const overseasCount = countOverseas(team?.squad, IPL_PLAYERS);

         if (overseasCount >= overseasLimit) {
            setError(`Overseas Player Limit Reached (Max ${overseasLimit})`);
            playBeep(220, 0.3); // Low error beep
            setTimeout(() => setError(''), 3000);
            return;
         }
      }

      playBeep(660, 0.1);
      setError('');
      setIsBiddingInFlight(true);

      setOptimisticState({
         ...displayAuctionState,
         currentBid: nextBidAmount,
         highBidderId: user?.uid,
         highBidderName: user?.displayName || 'Manager',
         highBidderTeamId: team?.teamId,
         timerEndsAt: getSyncedTime() + (currentAuction?.settings?.bidTimer || 10) * 1000
      });

      try {
         await placeBid(nextBidAmount);
      } catch (err) {
         setOptimisticState(null);
         setError(err?.message || 'Bid failed');
         playBeep(220, 0.3);
         setTimeout(() => setError(''), 3000);
      } finally {
         setIsBiddingInFlight(false);
         // Safety: ensure optimistic state never outlives the bid request
         setTimeout(() => setOptimisticState(null), 1000);
      }
   };

   const copyRoomId = () => {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   if (currentAuction?.id === id && currentAuction?.status === 'completed') {
      return <Navigate to={withServerParam(`/summary/${id}`, server)} replace />;
   }

   if (banError) {
      return (
         <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 font-primary text-white relative overflow-hidden">
            <PageBackground showArt={false} />
            <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-md w-full bg-[#0c0d10] border border-white/10 p-8 sm:p-12 rounded-[2.5rem] text-center backdrop-blur-3xl relative z-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
               <div className="absolute bottom-0 left-0 p-8 w-32 h-32 bg-red-500/10 rounded-full -ml-16 -mb-16 blur-3xl" />

               <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-red-500/20 relative group">
                  <ShieldAlert size={48} className="text-red-500 group-hover:scale-110 transition-transform duration-500" />
               </div>

               <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter text-red-500">BANNED FROM ROOM</h1>
               <p className="text-gray-400 font-bold text-sm leading-relaxed uppercase tracking-widest mb-10 opacity-70">
                  {banError}
               </p>

               <button
                  onClick={() => navigate('/')}
                  className="w-full py-6 bg-white text-black font-black uppercase tracking-widest rounded-[2rem] hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                  <Home size={20} />
                  BACK TO HOME
               </button>
            </motion.div>
         </div>
      );
   }

   if (!user && !loading) {
      return <PageLoader text="Authenticating..." />;
   }

   if (!serverReady || loading || !currentAuction || currentAuction.id !== id) {
      const isLocalAuction = server === SERVER_LOCAL || isLocalRoom(id, server) || (typeof id === 'string' && id.startsWith('SOLO-'));
      if (serverReady && !loading && isLocalAuction && (!currentAuction || currentAuction.id !== id)) {
         return (
            <div className="h-screen-safe bg-[#000000] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden">
               <PageBackground showArt={false} />
               <div className="relative z-10 flex flex-col items-center w-full max-w-md bg-[#0c0d10] border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-gray-300">
                     <AlertCircle size={24} />
                  </div>
                  <h2 className="text-base font-black uppercase tracking-wider mb-2">Local Solo Auction</h2>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
                     This solo auction lives on the device where it started. No saved data was found in this browser for room <span className="font-mono text-white font-bold">{id}</span>.
                  </p>
                  <button
                     onClick={() => navigate('/')}
                     className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                     Back to Home
                  </button>
               </div>
            </div>
         );
      }
      return <PageLoader text="Entering Auction Room..." />;
   }

   if (currentAuction?.status === 'completed') {
      return <Navigate to={withServerParam(`/summary/${id}`, server)} replace />;
   }

   // Manual team selection for late joiners

   const handleQuickJoin = async (selectedTeam) => {
      if (joiningTeam) return;
      setJoiningTeam(selectedTeam.id);
      try {
         await joinRoomDb(id, user.uid, {
            name: user.displayName || 'Manager',
            team: selectedTeam.id
         }, server);
      } catch (err) {
         console.error('[auction] Failed to join selected team', err);
         setError('Failed to join that team. Please try again.');
         setTimeout(() => setError(''), 3000);
         setJoiningTeam(null);
      }
   };

   // Team Selection Guard — show team picker or "room full" error (unless in Spectate Mode or Local Solo Room)
   if (!spectateMode && !team && !loading && user && !isSoloVsBots) {
      const takenTeamIds = new Set(roomTeams.map(t => t.teamId));
      (currentAuction?.players || []).forEach(p => { if (p.team) takenTeamIds.add(p.team); });
      const availableTeams = TEAMS.filter(t => !takenTeamIds.has(t.id));

      return (
         <div className="h-screen-safe bg-[#000000] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden">
            <PageBackground showArt={false} />
            <div className="relative z-10 flex flex-col items-center w-full max-w-xl bg-[#0c0d10] border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl">
               {availableTeams.length > 0 ? (
                  <>
                     <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-300 mb-5 shadow-xl">
                        <Gavel size={32} strokeWidth={2.5} />
                     </div>
                     <h2 className="text-3xl md:text-4xl font-pixel uppercase tracking-tight text-white mb-2 drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">Claim Your Franchise</h2>
                     <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mb-8">The auction is live! Pick a team to jump straight in.</p>

                     <div className="grid grid-cols-5 gap-3 md:gap-4 w-full max-w-xl">
                        {TEAMS.map((t) => {
                           const isTaken = takenTeamIds.has(t.id);
                           const isJoining = joiningTeam === t.id;

                           return (
                              <button
                                 key={t.id}
                                 onClick={() => !isTaken && handleQuickJoin(t)}
                                 disabled={isTaken || !!joiningTeam}
                                 className={`relative group flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl transition-all duration-300 border cursor-pointer ${isJoining
                                    ? 'border-white/30 bg-white/10 shadow-lg scale-105'
                                    : isTaken
                                       ? 'border-white/5 opacity-25 grayscale cursor-not-allowed bg-transparent'
                                       : 'border-white/5 bg-[#0e1015]/90 hover:border-white/20 hover:bg-white/[0.05] hover:scale-105 active:scale-95'
                                    }`}
                              >
                                 <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center ${isJoining ? 'animate-pulse' : ''}`}>
                                    <img src={t.logo} alt={`${t.name} Logo`} className="w-full h-full object-contain" />
                                 </div>
                                 <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-tight ${isJoining ? 'text-white' : isTaken ? 'text-slate-600' : 'text-slate-400 group-hover:text-white'}`}>
                                    {isJoining ? 'Joining...' : isTaken ? 'Taken' : t.id}
                                 </span>
                              </button>
                           );
                        })}
                     </div>

                     <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 w-full">
                        <button
                           onClick={() => setSpectateMode(true)}
                           className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                           <Eye size={15} /> Spectate Room
                        </button>
                        <button
                           onClick={() => navigate('/')}
                           className="w-full sm:w-auto px-5 py-2.5 text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest cursor-pointer text-center"
                        >
                           Home
                        </button>
                     </div>
                  </>
               ) : (
                  <>
                     <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-5 shadow-xl">
                        <ShieldAlert size={36} strokeWidth={2.5} />
                     </div>
                     <h2 className="text-3xl sm:text-4xl font-pixel uppercase tracking-tight text-white mb-3">Room Full</h2>
                     <p className="text-slate-400 text-xs sm:text-sm font-medium mb-8 leading-relaxed max-w-md">
                        All 10 IPL franchises have been claimed. You can spectate the live auction stream!
                     </p>
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
                        <button
                           onClick={() => setSpectateMode(true)}
                           className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-200 text-black font-black text-xs rounded-xl hover:scale-105 transition-all active:scale-95 uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
                        >
                           <Eye size={16} /> Spectate Live Auction
                        </button>
                        <button
                           onClick={() => navigate('/')}
                           className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 text-slate-400 font-black text-xs rounded-xl hover:bg-white/10 hover:text-white transition-all active:scale-95 uppercase tracking-widest cursor-pointer text-center"
                        >
                           Home
                        </button>
                     </div>
                  </>
               )}
            </div>
         </div>
      );
   }

   return (
      <div className="h-screen-safe bg-[#000000] text-white font-sans flex flex-col items-center overflow-hidden relative selection:bg-white/20 selection:text-white">
         <PageBackground showArt={false} />

         <header className="w-full h-14 compact:h-12 bg-[#0c0d10] backdrop-blur-md border-b border-white/10 flex flex-row items-center justify-between px-2.5 sm:px-4 md:px-6 z-50 gap-2 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
               <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-[8px] sm:text-[10px] compact:text-[9px] font-black uppercase tracking-widest hidden xs:inline">ID:</span>
                  <span className="text-white font-mono font-bold tracking-widest text-[10px] sm:text-sm compact:text-xs">{id}</span>
                  {spectateMode && (
                     <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-slate-300 font-black text-[8px] sm:text-[9px] compact:text-[8px] uppercase tracking-widest ml-1 shrink-0">
                        <Eye size={10} />
                        <span>SPECTATING</span>
                     </div>
                  )}
               </div>
               <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full" title="Active Team Managers">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                  <span className="text-[9px] compact:text-[8px] font-black text-slate-300">
                     {currentAuction?.players?.filter(p => p.team).length || 0}/10
                  </span>
               </div>
               {isSoloVsBots && (
                  <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-extrabold text-[8px] sm:text-[9px] uppercase tracking-wider" title="Saved locally in browser storage">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                     <span>Saved on this device</span>
                  </div>
               )}
               <div className="flex items-center border-l border-white/10 pl-1.5 sm:pl-3">
                  <button onClick={copyRoomId} className="p-1 sm:p-1.5 bg-white/5 text-slate-400 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Copy Room ID">
                     {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
               {/* Solo vs AI Bots Fast Forward / Finish Button */}
               {isSoloVsBots && !spectateMode && (
                  <button
                     onClick={() => setShowFastForwardConfirm(true)}
                     disabled={isFastForwarding}
                     className="p-1 sm:px-2.5 sm:py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-[10px] compact:text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                     title="Simulate all remaining rounds and finish auction"
                  >
                     {isFastForwarding ? (
                        <Loader2 size={13} className="animate-spin text-slate-400" />
                     ) : (
                        <FastForward size={13} />
                     )}
                     <span className="hidden sm:inline">Fast Forward</span>
                  </button>
               )}

               {isAdmin && (
                  <div className="flex items-center gap-1 sm:gap-2">
                     {displayAuctionState?.status === 'paused' ? (
                        <button
                           onClick={() => {
                              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                              resumeAuction(id);
                           }}
                           className="p-1 sm:px-2.5 sm:py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-[10px] compact:text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                           title="Resume Auction"
                        >
                           <PlayCircle size={13} /> <span className="hidden md:inline">Resume</span>
                        </button>
                     ) : (
                        <button
                           disabled={displayAuctionState?.status !== 'bidding'}
                           onClick={() => {
                              const remainingMs = (displayAuctionState?.timerEndsAt || 0) - getSyncedTime();
                              if (displayAuctionState?.status !== 'bidding' || remainingMs < 2000) return;
                              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                              pauseAuction(id);
                           }}
                           className="p-1 sm:px-2.5 sm:py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-[10px] compact:text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                           title={displayAuctionState?.status !== 'bidding' ? "Cannot pause outside bidding" : "Pause Auction"}
                        >
                           <Pause size={13} /> <span className="hidden md:inline">Pause</span>
                        </button>
                     )}
                     <button
                        onClick={() => setShowEndConfirm(true)}
                        className="p-1 sm:px-2.5 sm:py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-[10px] compact:text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                        title="End Auction"
                     >
                        <XCircle size={13} /> <span className="hidden md:inline">End</span>
                     </button>
                     <button
                        onClick={() => setShowParticipantsOverlay(true)}
                        className="p-1 sm:px-2.5 sm:py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-[10px] compact:text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                        title="Active Participants"
                     >
                        <Users size={13} /> <span className="hidden md:inline">Participants</span>
                     </button>
                  </div>
               )}
               <div className="flex items-center gap-1 border-l border-white/10 pl-1.5 sm:pl-3">
                  <button
                     onClick={() => setShowSettings(!showSettings)}
                     className={`p-1 sm:p-1.5 rounded-lg border transition-all cursor-pointer ${showSettings ? 'bg-white/10 border-white/20 text-white shadow-sm' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                     title="Local & Room Settings"
                  >
                     <SettingsIcon size={14} />
                  </button>
                  <button onClick={() => navigate('/')} className="p-1 sm:p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer" title="Back to Home"><Home size={14} /></button>
               </div>
            </div>
         </header>

         <div className="w-full flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden relative pb-16 md:pb-0">
            <aside className={`${mobileTab === 'squad' ? 'flex' : 'hidden'} md:flex w-full md:w-56 lg:w-64 xl:w-80 bg-[#0c0d10]/90 backdrop-blur-xl border-r border-white/10 flex-col h-full max-h-[calc(100dvh-7.5rem)] md:max-h-[calc(100dvh-3.5rem)] compact:max-h-[calc(100dvh-3rem)] overflow-hidden relative z-10`}>
               <div className="h-14 compact:h-12 border-b border-white/10 bg-[#0c0d10] flex items-center px-6 shrink-0">
                  <span className="text-[10px] compact:text-[9px] font-pixel text-slate-400 uppercase tracking-widest leading-none">Auction Teams</span>
               </div>

               <div className="flex-1 overflow-y-auto p-4 compact:p-3 custom-scrollbar touch-pan-y min-h-0">
                  {(liveTeamRatings?.rankedTeams || TEAMS).map((t, idx) => {
                     const teamDoc = roomTeams.find(doc => doc.teamId === t.id);
                     const manager = currentAuction?.players?.find(p => p.id === teamDoc?.userId);
                     const isMyTeam = manager?.id === user?.uid;
                     const isSelected = selectedTeamId === (manager?.id || t.id);
                     const ratingInfo = liveTeamRatings?.ratingMap[t.id];

                     return (
                        <div key={idx} className="mb-2 last:mb-0">
                           <button
                              onClick={() => setSelectedTeamId(isSelected ? null : (manager?.id || t.id))}
                              className={`w-full text-left py-2.5 compact:py-2 px-3 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${isSelected ? 'bg-[#0e1015] border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]' : 'bg-[#0e1015]/90 border-white/5 hover:bg-white/[0.05] hover:border-white/10'}`}
                           >
                              <div className="flex items-center gap-2.5">
                                 <span className="w-4 text-[10px] compact:text-[9px] font-black text-gray-500 text-center shrink-0">{idx + 1}</span>
                                 <div className="w-8 h-8 compact:w-7 compact:h-7 rounded-lg bg-white/5 p-1 flex items-center justify-center shrink-0">
                                    <img src={t.logo} alt={`${t.name} Logo`} className="w-full h-full object-contain" />
                                 </div>
                                 <div className="overflow-hidden">
                                    <h5 className="text-[11px] compact:text-[10px] font-bold text-white leading-tight truncate max-w-[110px]">{t.name}</h5>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                       {manager ? (
                                          <>
                                             <div className={`w-1.5 h-1.5 rounded-full ${manager.isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)] animate-pulse' : 'bg-gray-600'}`} />
                                             <span className="text-[9px] compact:text-[8px] font-semibold text-gray-400 truncate max-w-[110px]">
                                                {manager.name} {isMyTeam ? '(You)' : ''}
                                             </span>
                                          </>
                                       ) : (
                                          <span className="text-[8px] compact:text-[7px] font-bold text-gray-500 uppercase tracking-wider">
                                             Available
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <span className="text-[10px] compact:text-[9px] font-bold block leading-none text-gray-200">
                                       ₹{formatCrores(teamDoc?.budgetRemaining ?? toFiniteNumber(currentAuction?.settings?.budget, 120))} Cr
                                    </span>
                                    <span className="text-[8px] compact:text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 block">{teamDoc?.squad?.length || 0}/{toFiniteNumber(currentAuction?.squadLimit, 25)}</span>
                                 </div>
                                 <ChevronDown size={12} className={`text-gray-500 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} />
                              </div>
                           </button>

                           <AnimatePresence>
                              {isSelected && (
                                 <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden px-3 pb-3"
                                 >
                                    <div className="space-y-3 pt-2 px-2 pb-2 bg-black/40 border border-white/5 rounded-xl mt-1.5">
                                       {/* Header Stats */}
                                       <div className="flex items-center justify-between text-[9px] compact:text-[8px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 pb-2">
                                          <span>Spent: <span className="text-slate-300 font-bold">{(() => {
                                             const spent = computeTeamSpent({
                                                budget: toFiniteNumber(currentAuction?.settings?.budget, 120),
                                                budgetRemaining: teamDoc?.budgetRemaining,
                                                spent: teamDoc?.spent,
                                             });
                                             return spent === null ? '—' : `₹${formatCrores(spent, 2)} Cr`;
                                          })()}</span></span>
                                          <span>Rating: <span className="text-slate-300 font-extrabold">{ratingInfo?.avgRating ? `${ratingInfo.avgRating}` : 'N/A'}</span></span>
                                          <span>Overseas: <span className="text-slate-300 font-bold">{countOverseas(teamDoc?.squad, IPL_PLAYERS)}/{toFiniteNumber(currentAuction?.overseasLimit, 8)}</span></span>
                                       </div>

                                       {teamDoc?.squad?.length > 0 ? (
                                          <div className="space-y-3">
                                             {['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map(role => {
                                                const squadWithDisplayData = teamDoc.squad.map(s => {
                                                   const pid = typeof s === 'string' ? s : s.id;
                                                   const bidVal = typeof s === 'string' ? null : s.bid;
                                                   const pInfo = IPL_PLAYERS.find(pl => pl.id === pid);
                                                   return { ...pInfo, bidVal };
                                                });

                                                const playersInRole = squadWithDisplayData.filter(p => p?.role === role);

                                                if (playersInRole.length === 0) return null;

                                                return (
                                                   <div key={role} className="space-y-1.5">
                                                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                                         <span className="text-[8px] compact:text-[7px] font-bold text-gray-500 uppercase tracking-widest">{role}</span>
                                                         <span className="text-[9px] compact:text-[8px] font-bold text-gray-400">{playersInRole.length}</span>
                                                      </div>

                                                      <div className="space-y-1">
                                                         {playersInRole.map((p, sidx) => (
                                                            <div key={sidx} className="py-1 flex items-center justify-between group hover:bg-white/[0.01] rounded-lg px-1 transition-all">
                                                               <div className="flex items-center gap-2">
                                                                  <img src={p?.image} alt={p?.name || 'Player'} className="w-5 h-5 object-contain rounded bg-white/5" />
                                                                  <div className="overflow-hidden">
                                                                     <div className="flex items-center gap-1">
                                                                        <h5 className="text-[10px] compact:text-[9px] font-semibold text-gray-200 truncate max-w-[80px]">{p?.name}</h5>
                                                                     </div>
                                                                  </div>
                                                               </div>
                                                               <span className="text-[9px] compact:text-[8px] font-bold text-slate-300">
                                                                  {p?.bidVal == null ? '—' : `₹${formatCrores(p.bidVal)} Cr`}
                                                               </span>
                                                            </div>
                                                         ))}
                                                      </div>
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       ) : (
                                          <div className="py-3 text-center opacity-30">
                                             <p className="text-[9px] compact:text-[8px] font-medium text-gray-500 uppercase tracking-wider">No players joined yet</p>
                                          </div>
                                       )}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     );
                  })}
               </div>
            </aside>

            <div className={`${mobileTab === 'arena' ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full overflow-hidden relative z-10`}>
               {/* Center Scrollable Main Body */}
               <main className="flex-1 overflow-y-auto p-4 md:p-8 compact:p-4 flex flex-col items-center custom-scrollbar">
                  <div className="w-full max-w-4xl flex flex-col gap-4 md:gap-6">
                     <AnimatePresence mode="wait">
                        {(displayAuctionState?.status === 'sold' || displayAuctionState?.status === 'unsold') ? (() => {
                            const isSold = displayAuctionState.status === 'sold';
                            const buyerTeam = isSold ? TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId) : null;
                            const slogan = isSold ? (TEAM_SLOGANS[buyerTeam?.id] || { slogan: 'IPL 2026!', hashtag: '#IPL' }) : null;

                            return (
                               <motion.div
                                  key="celebration"
                                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.97, y: -8 }}
                                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                  className="w-full max-w-sm sm:max-w-md mx-auto will-change-transform"
                               >
                                  <div className="relative w-full rounded-[2rem] overflow-hidden bg-[#0c0d10] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
                                     {/* Franchise Ambient Glow Background */}
                                     <div className={`absolute inset-0 opacity-25 bg-gradient-to-br ${isSold && buyerTeam ? buyerTeam.color.replace('bg-', 'from-') : 'from-red-600'} to-black`} />
                                     <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />

                                     <div className="relative p-5 sm:p-6 compact:p-4 flex flex-col justify-between gap-4 z-10">
                                        {/* Top Bar: Team Logo & Status info */}
                                        <div className="flex justify-between items-start">
                                           {isSold && buyerTeam ? (
                                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/15 shadow-lg">
                                                 <img src={buyerTeam.logo} alt={`${buyerTeam.name} Logo`} className="w-full h-full object-contain" />
                                              </div>
                                           ) : (
                                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/10 backdrop-blur-md rounded-2xl p-2 border border-red-500/20 flex items-center justify-center">
                                                 <span className="text-xl">🏏</span>
                                              </div>
                                           )}

                                           <div className="text-right uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                                              <span className="text-[7.5px] sm:text-[8.5px] font-pixel text-slate-400 block">IPL Auction 2026</span>
                                              {isSold ? (
                                                 <>
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-white/50 leading-none block">Sold to</span>
                                                    <span className="text-xs sm:text-sm font-black text-white block mt-0.5">{displayAuctionState.highBidderName || buyerTeam?.name}</span>
                                                 </>
                                              ) : (
                                                 <span className="text-xs sm:text-sm font-black text-red-400 block mt-0.5">Unsold</span>
                                              )}
                                           </div>
                                        </div>

                                        {/* Center: Player Portrait with Team Glow */}
                                        <div className="flex flex-col justify-center items-center py-1 sm:py-2">
                                           <div className="relative w-32 h-32 sm:w-40 sm:h-40 compact:w-32 compact:h-32 group">
                                              <div className={`absolute inset-0 rounded-full blur-3xl opacity-40 ${isSold && buyerTeam ? buyerTeam.color : 'bg-red-500'}`} />
                                              <motion.img
                                                 initial={{ scale: 0.88, opacity: 0 }}
                                                 animate={{ scale: 1, opacity: 1 }}
                                                 transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                                                 src={currentPlayer?.image}
                                                 className="relative w-full h-full object-contain z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
                                                 alt={currentPlayer?.name || 'Player'}
                                                 onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = getPlayerAvatar(currentPlayer?.name);
                                                 }}
                                              />
                                           </div>
                                           <div className="text-center mt-3">
                                              <h2 className="text-xl sm:text-2xl compact:text-xl font-pixel uppercase tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">
                                                 {currentPlayer?.name}
                                              </h2>
                                              <p className="text-[9.5px] sm:text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.2em] sm:tracking-[0.25em] mt-0.5">
                                                 {currentPlayer?.role} • {currentPlayer?.country}
                                              </p>
                                           </div>
                                        </div>

                                        {/* Bottom Bar: Slogan & Price Badge */}
                                        <div className="space-y-2.5">
                                           {isSold && slogan && (
                                              <div className="text-center">
                                                 <p className="text-xs sm:text-sm font-pixel italic uppercase tracking-wider text-slate-300 drop-shadow-md">
                                                    #{slogan.slogan}
                                                 </p>
                                              </div>
                                           )}

                                           <motion.div
                                              initial={{ scale: 0.92, opacity: 0, y: 6 }}
                                              animate={{ scale: 1, opacity: 1, y: 0 }}
                                              transition={{ duration: 0.3, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                                              className={`backdrop-blur-md border p-3 rounded-2xl text-center ${isSold ? 'bg-white/5 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'bg-red-500/10 border-red-500/20'}`}
                                           >
                                              {isSold ? (
                                                 <p className="text-xl sm:text-2xl compact:text-xl font-black text-white">
                                                    {displayAuctionState?.currentBid == null ? '—' : `₹${formatCrores(displayAuctionState.currentBid)} Cr`}
                                                 </p>
                                              ) : (
                                                 <p className="text-base sm:text-lg font-black text-red-400 uppercase tracking-widest">
                                                    UNSOLD
                                                 </p>
                                              )}
                                           </motion.div>
                                        </div>
                                     </div>
                                  </div>
                               </motion.div>
                            );
                         })() : (
                           <motion.div
                              key="player-card"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                              className="w-full flex-col gap-4 md:gap-6 flex will-change-transform"
                           >
                              <div className="bg-[#0c0d10] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative min-h-[400px] lg:min-h-0">
            {/* Top-of-card progress bar across the flat top edge */}
            <AuctionCountdown
               variant="bar"
               displayAuctionState={displayAuctionState}
               configuredBidTimer={configuredBidTimer}
               getSyncedTime={getSyncedTime}
            />
            <div className="p-0 sm:p-6 lg:p-5 xl:p-10 flex flex-col lg:flex-row items-center sm:gap-6 lg:gap-5 xl:gap-10">
               {/* 1. Hero image: edge-to-edge on mobile, framed box on desktop/tablet */}
               <div className="relative w-full aspect-[4/3] max-h-[42vh] min-h-[300px] sm:aspect-auto sm:max-h-none sm:min-h-0 sm:w-36 sm:h-36 lg:w-36 lg:h-48 xl:w-60 xl:h-80 bg-[#0c0d10] sm:rounded-2xl lg:sm:rounded-[2rem] overflow-hidden sm:border sm:border-white/10 z-10 sm:shadow-[0_12px_40px_rgba(0,0,0,0.4)] group sm:hover:scale-[1.02] transition-transform duration-500 shrink-0">
                  <img
                     src={currentPlayer.image}
                     alt={currentPlayer.name}
                     decoding="async"
                     className="w-full h-full object-cover object-top"
                     onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getPlayerAvatar(currentPlayer?.name);
                     }}
                  />
                  {/* Mobile Gradient Overlay: fades bottom of hero into card without touching player face */}
                  <div className="sm:hidden absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/80 to-transparent pointer-events-none" />

                  {/* Mobile Overlay: Player name & role/type tags (bottom over gradient) */}
                  <div className="sm:hidden absolute bottom-2.5 left-3 right-3 z-20 text-left pointer-events-none">
                     <h2
                        className="text-xl xs:text-2xl font-pixel tracking-tight text-white leading-tight truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                        title={currentPlayer.name}
                     >
                        {currentPlayer.name}
                     </h2>
                     <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 text-[7.5px] font-pixel px-2 py-0.5 rounded-full uppercase tracking-wider">
                           {currentPlayer.role}
                        </span>
                        <span className="text-slate-500 text-[10px]">•</span>
                        <span className="bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 text-[7.5px] font-pixel px-2 py-0.5 rounded-full uppercase tracking-wider">
                           {currentPlayer.type}
                        </span>
                     </div>
                  </div>
               </div>

               {/* 2. Details Column */}
               <div className="flex-1 min-w-0 flex flex-col gap-2.5 sm:gap-4 xl:gap-6 w-full text-center lg:text-left px-3 pt-1 pb-2 sm:p-0">
                  {/* Desktop / Tablet name and badges (hidden on mobile) */}
                  <div className="hidden sm:block">
                     <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2 xl:mb-4">
                        <span className="bg-white/5 border border-white/10 text-slate-300 text-[8px] md:text-[9px] font-pixel px-2.5 py-1 rounded-full uppercase tracking-widest">{currentPlayer.role}</span>
                        <span className="bg-white/5 border border-white/10 text-slate-300 text-[8px] md:text-[9px] font-pixel px-2.5 py-1 rounded-full uppercase tracking-widest">{currentPlayer.type}</span>
                        <span className="bg-white/5 border border-white/10 text-slate-300 text-[8px] md:text-[9px] font-pixel px-2.5 py-1 rounded-full uppercase tracking-wider">
                           Base: ₹{currentPlayer?.basePrice == null ? '—' : `${formatCrores(currentPlayer.basePrice)} Cr`}
                        </span>
                     </div>
                     <h2 className="text-2xl sm:text-3xl xl:text-5xl font-pixel tracking-tight text-white leading-tight truncate drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]" title={currentPlayer.name}>{currentPlayer.name}</h2>
                  </div>

                  {/* Dynamic Role-aware stats */}
                  {(() => {
                     const s = currentPlayer.stats || {};
                     const entries = Object.entries(s).slice(0, 4); // display up to 4 stats
                     const colsCount = Math.max(2, Math.min(entries.length, 4));
                     const colClass = {
                        2: 'grid-cols-2',
                        3: 'xl:grid-cols-3',
                        4: 'xl:grid-cols-4',
                        5: 'xl:grid-cols-5'
                     }[colsCount] || 'xl:grid-cols-4';
                     
                     const labelMap = {
                        matches: 'Matches', runs: 'Runs', wickets: 'Wickets',
                        econ: 'Economy', sr: 'SR', avg: 'Avg',
                        hs: 'HS', bb: 'BBI'
                     };

                     return (
                        <>
                           {/* 3. Mobile Stats: 1 row of 4 columns, no boxed border */}
                           <div className="grid grid-cols-4 gap-1 py-1.5 border-b border-white/5 sm:hidden">
                              {entries.map(([key, value]) => {
                                 const label = labelMap[key] || key;
                                 return (
                                    <div key={key} className="text-center">
                                       <span className="block text-[7.5px] font-pixel text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
                                       <span className="text-xs xs:text-sm font-bold text-slate-200">{value}</span>
                                    </div>
                                 );
                              })}
                           </div>

                           {/* Desktop / Tablet Stats: existing boxed grid */}
                           <div className={`hidden sm:grid grid-cols-2 ${colClass} gap-2 xl:gap-3 bg-[#0e1015]/90 p-2.5 lg:p-3 xl:p-4 rounded-2xl border border-white/10 backdrop-blur-md`}>
                              {entries.map(([key, value], index) => {
                                 const desktopLabelMap = {
                                    matches: 'Matches', runs: 'Runs', wickets: 'Wickets',
                                    econ: 'Economy', sr: 'Strike Rate', avg: 'Average',
                                    hs: 'Highest Score', bb: 'Best Bowling'
                                 };
                                 const label = desktopLabelMap[key] || key;
                                 
                                 return (
                                    <div key={key} className={`text-center ${index > 0 ? 'border-white/5' : ''} ${index % 2 !== 0 ? 'border-l' : ''} ${index > 0 ? 'xl:border-l' : ''}`}>
                                       <span className="block text-[8px] compact:text-[7px] font-pixel text-slate-400 uppercase tracking-widest mb-1 break-words leading-tight">{label}</span>
                                       <span className="text-base sm:text-lg xl:text-xl font-bold text-slate-200">{value}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        </>
                     );
                  })()}

                  {/* 4. Current Bid & Timer Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-1 sm:mt-2 xl:mt-4">
                     <div className="text-left min-w-0 flex-1">
                        <span className="text-[8px] sm:text-[9px] xl:text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-0.5 sm:mb-1">Current Bid</span>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                           <span className="text-xl xs:text-2xl sm:text-lg sm:text-xl xl:text-3xl font-extrabold text-white leading-none whitespace-nowrap">
                              {displayAuctionState?.currentBid == null ? '—' : `₹${formatCrores(displayAuctionState.currentBid)} Cr`}
                           </span>
                           {displayAuctionState?.highBidderTeamId ? (() => {
                              const bidderTeam = TEAMS.find(t => t.id === displayAuctionState.highBidderTeamId);
                              const shortName = bidderTeam?.id || displayAuctionState.highBidderTeamId;
                              const fullName = bidderTeam?.name || shortName;
                              const rawBidderName = displayAuctionState?.highBidderName || shortName;
                              const bidderName = rawBidderName.length > 22 ? `${rawBidderName.slice(0, 22)}...` : rawBidderName;

                              return (
                                 <div
                                    className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 px-2 sm:px-2.5 py-1 rounded-xl max-w-[160px] xs:max-w-[200px] sm:max-w-[240px] md:max-w-[280px]"
                                    title={`${rawBidderName} (${fullName})`}
                                 >
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/5 border border-white/10 p-0.5 flex items-center justify-center shrink-0">
                                       <img src={bidderTeam?.logo} alt="High Bidder Team Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex flex-col min-w-0 text-left">
                                       <span className="text-[7.5px] sm:text-[8px] font-pixel text-slate-400 uppercase tracking-widest truncate leading-tight">
                                          {shortName}
                                       </span>
                                       <span className="text-[8.5px] sm:text-[9.5px] md:text-[10px] font-black text-white uppercase tracking-wider truncate leading-tight">
                                          {bidderName}
                                       </span>
                                    </div>
                                 </div>
                              );
                           })() : (
                              <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.02] border border-white/5 px-2 py-1 rounded-lg">
                                 No Bids
                              </span>
                           )}
                        </div>
                     </div>

                     {/* Timer ring: inline with the bid row on all sizes */}
                     <div className="shrink-0">
                        <AuctionCountdown
                           variant="badge"
                           displayAuctionState={displayAuctionState}
                           configuredBidTimer={configuredBidTimer}
                           isAdmin={isAdmin}
                           roomId={id}
                           endPlayerAuction={endPlayerAuction}
                           getSyncedTime={getSyncedTime}
                           playBeep={playBeep}
                        />
                     </div>
                  </div>
               </div>
            </div>
            {/* 5. Squad / OS / Purse & 6. Sticky Action bar */}
            <div className="bg-[#0a0b0e]/95 backdrop-blur-md border-t border-white/10 p-2.5 sm:p-4 xl:p-6 flex flex-col gap-2.5 sm:gap-3 sticky bottom-0 z-20 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
                                    {/* Franchise Quick Stats Bar right above Bid button (Mobile view only) */}
                                    {team && (() => {
                                       const osCount = countOverseas(team.squad, IPL_PLAYERS);
                                       const totalBudget = toFiniteNumber(currentAuction?.settings?.budget, 120);

                                       return (
                                          <div className="flex md:hidden items-center justify-between bg-[#0e1015] border border-white/10 px-2.5 sm:px-4 py-2 rounded-xl text-[9px] sm:text-xs font-bold text-gray-300">
                                             <div className="flex items-center gap-1" title="Squad Count">
                                                <span className="text-gray-500 uppercase font-black text-[8px] sm:text-[10px]">Squad:</span>
                                                <span className="text-slate-200 font-extrabold">{team.squad?.length || 0}/{toFiniteNumber(currentAuction?.squadLimit, 25)}</span>
                                             </div>
                                             <div className="w-px h-3 bg-white/10" />
                                             <div className="flex items-center gap-1" title="Overseas Players">
                                                <span className="text-gray-500 uppercase font-black text-[8px] sm:text-[10px]">OS:</span>
                                                <span className="text-slate-200 font-extrabold">{osCount}/{toFiniteNumber(currentAuction?.overseasLimit, 8)}</span>
                                             </div>
                                             <div className="w-px h-3 bg-white/10" />
                                             <div className="flex items-center gap-1" title="Purse Left out of Total Budget">
                                                <span className="text-gray-500 uppercase font-black text-[8px] sm:text-[10px]">Purse:</span>
                                                <span className="text-slate-200 font-extrabold">₹{formatCrores(team.budgetRemaining ?? totalBudget)}/{formatCrores(totalBudget, 0)}Cr</span>
                                             </div>
                                             <div className="w-px h-3 bg-white/10 hidden xs:block" />
                                             <div className="items-center gap-1 hidden xs:flex" title="Total Spent">
                                                <span className="text-gray-500 uppercase font-black text-[8px] sm:text-[10px]">Spent:</span>
                                                <span className="text-slate-200 font-extrabold">₹{formatCrores(team.spent, 1)}Cr</span>
                                             </div>
                                          </div>
                                       );
                                    })()}

                                    <div className="flex gap-2 sm:gap-3 md:gap-4">
                                       {/* Solo vs AI Bots Skip / Pass Button */}
                                       {isSoloVsBots && !spectateMode && (
                                          <button
                                             type="button"
                                             onClick={handleSoloSkip}
                                             disabled={isSkippingLot || displayAuctionState?.status !== 'bidding' || displayAuctionState?.highBidderId === user?.uid}
                                             className="px-3 sm:px-4 h-12 sm:h-14 xl:h-18 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-pixel text-[10px] sm:text-xs tracking-wider cursor-pointer shrink-0"
                                             title="Pass player to bots immediately"
                                          >
                                             {isSkippingLot ? (
                                                <Loader2 size={16} className="animate-spin text-slate-400" />
                                             ) : (
                                                <>
                                                   <SkipForward size={14} />
                                                   <span>PASS</span>
                                                </>
                                             )}
                                          </button>
                                       )}

                                       <button
                                          onClick={handleBid}
                                          disabled={spectateMode || !team || displayAuctionState?.status !== 'bidding' || displayAuctionState?.highBidderId === user?.uid}
                                          className={`flex-1 h-12 sm:h-14 xl:h-18 font-black text-sm sm:text-base xl:text-xl rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale cursor-pointer ${spectateMode
                                             ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                             : displayAuctionState?.highBidderId === user?.uid
                                                ? 'bg-white/5 text-green-500 border border-green-500/20 shadow-inner'
                                                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.2)]'
                                             }`}
                                       >
                                          {spectateMode ? (
                                             <span className="flex items-center gap-2 text-xs xl:text-sm font-black uppercase tracking-widest text-blue-400">
                                                <Eye size={18} /> Spectator View (Read Only)
                                             </span>
                                          ) : displayAuctionState?.status === 'paused' ? 'PAUSED' : displayAuctionState?.highBidderId === user?.uid ? "LEADING BIDDER" : `PLACE BID: ₹${formatCrores(nextBidAmount)} Cr`}
                                       </button>
                                       <button onClick={() => setShowPlayersOverlay(true)} className="w-12 h-12 sm:w-14 sm:h-14 xl:w-18 xl:h-18 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all"><List size={20} /></button>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>

                     {/* Arena Ad Slot (strictly visible on mobile screens only; hidden on laptop/desktop) */}
                     <div className="w-full block md:hidden">
                        <AdSlot
                           slot={import.meta.env.VITE_ADSENSE_AUCTION_ROOM_SLOT || DEFAULT_AUCTION_ROOM_SLOT}
                           className="w-full mt-2 mb-6"
                        />
                     </div>
                  </div>
               </main>
            </div>

            <aside className={`${(mobileTab === 'activity' || mobileTab === 'chat') ? 'flex' : 'hidden'} md:flex w-full md:w-64 lg:w-72 xl:w-96 bg-[#0c0d10]/90 backdrop-blur-xl border-l border-white/10 flex-col h-full max-h-[calc(100dvh-7.5rem)] md:max-h-[calc(100dvh-3.5rem)] compact:max-h-[calc(100dvh-3rem)] overflow-hidden relative z-10`}>
               {/* Premium Tabs Header */}
               <div className="h-14 compact:h-12 bg-[#0c0d10] border-b border-white/10 flex items-center shrink-0 w-full">
                  <button
                     onClick={() => {
                        setSidebarTab('activity');
                        setMobileTab('activity');
                     }}
                     className={`h-full flex-1 flex items-center justify-center gap-2 transition-all cursor-pointer ${sidebarTab === 'activity'
                        ? 'bg-white/[0.08] text-white border-b-2 border-white font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border-b-2 border-transparent font-bold'
                        }`}
                  >
                     <History size={14} />
                     <span className="text-[10px] compact:text-[9px] uppercase tracking-widest">Live Activity</span>
                  </button>
                  {!isSoloVsBots && (
                     <button
                        onClick={() => {
                           setSidebarTab('chat');
                           setMobileTab('chat');
                        }}
                        className={`h-full flex-1 flex items-center justify-center gap-2 transition-all cursor-pointer ${sidebarTab === 'chat'
                           ? 'bg-white/[0.08] text-white border-b-2 border-white font-black'
                           : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border-b-2 border-transparent font-bold'
                           }`}
                     >
                        <MessageSquare size={14} />
                        <span className="text-[10px] compact:text-[9px] uppercase tracking-widest">Chat</span>
                     </button>
                  )}
               </div>

               {/* Tab Panels */}
               <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
                  <AnimatePresence mode="wait">
                     {sidebarTab === 'activity' || isSoloVsBots ? (
                        <motion.div
                           key="activity"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           className="flex-1 flex flex-col min-h-0 overflow-hidden h-full"
                        >
                           <div className="flex-1 overflow-y-auto p-3 sm:p-4 compact:p-3 custom-scrollbar relative touch-pan-y min-h-0 pb-16 sm:pb-4">
                              {/* Timeline line */}
                              <div className="absolute left-6 sm:left-10 top-6 bottom-6 w-[1px] bg-white/5 pointer-events-none" />

                              <div className="space-y-3 sm:space-y-4 relative">
                                 {[...messages.filter(m => (m.type === 'log' || m.type === 'sold_card' || m.type === 'system' || m.type === 'sold' || m.type === 'unsold') && !(m.text || '').includes('New bid:'))]
                                    .sort((a, b) => {
                                       const ta = typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0);
                                       const tb = typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0);
                                       return tb - ta;
                                    })
                                    .map((msg, index) => {
                                    const isSold = (msg.type === 'sold_card' || msg.type === 'sold') && msg.metadata?.playerId;

                                    // Relative timestamp
                                    let timeAgo = '';
                                    if (msg.timestamp) {
                                       const tsValue = typeof msg.timestamp === 'number' ? msg.timestamp : (msg.timestamp?.toDate ? msg.timestamp.toDate().getTime() : Date.now());

                                       // Prevent negative time due to clock drift
                                       let diffMs = Date.now() - tsValue;
                                       if (diffMs < 0) diffMs = 0;

                                       const diffSec = Math.floor(diffMs / 1000);
                                       if (diffSec < 60) timeAgo = `${diffSec}s ago`;
                                       else if (diffSec < 3600) timeAgo = `${Math.floor(diffSec / 60)}m ago`;
                                       else timeAgo = `${Math.floor(diffSec / 3600)}h ago`;
                                    }

                                    if (isSold) {
                                       return (
                                          <motion.div
                                             key={`log-${msg.id || index}`}
                                             initial={index === 0 ? { opacity: 0, y: -10 } : false}
                                             animate={{ opacity: 1, y: 0 }}
                                             className="py-1 sm:py-2"
                                          >
                                             <SoldCard msg={msg} />
                                          </motion.div>
                                       );
                                    }

                                    const text = msg.text || '';
                                    let displayText = text;
                                    if (text.includes('PAUSED')) {
                                       displayText = 'Auction paused by Admin';
                                    } else if (text.includes('RESUMED')) {
                                       displayText = 'Auction resumed by Admin';
                                    } else if (text.endsWith('UNSOLD')) {
                                       const pName = text.replace('UNSOLD', '').trim();
                                       displayText = `${pName} went unsold`;
                                    } else if (text.includes('started')) {
                                       displayText = 'Auction started';
                                    }

                                    return (
                                       <motion.div
                                          key={`log-${msg.id || index}`}
                                          initial={index === 0 ? { opacity: 0, y: -10 } : false}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="flex gap-2.5 sm:gap-3 items-start p-2.5 bg-[#0e1015]/90 border border-white/5 hover:border-white/10 rounded-xl transition-all relative group mb-2"
                                       >
                                          {/* Timeline tiny dot node */}
                                          <div className="relative z-10 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                                             <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
                                          </div>

                                          {/* Minimal Text content */}
                                          <div className="flex-1 min-w-0">
                                             <p className="text-[10px] sm:text-[11px] md:text-[12px] compact:text-[10px] font-medium leading-relaxed text-gray-300">
                                                {displayText}
                                             </p>
                                             {timeAgo && <span className="text-[8px] compact:text-[7px] font-bold text-gray-600 uppercase tracking-widest mt-0.5 block">{timeAgo}</span>}
                                          </div>
                                       </motion.div>
                                    );
                                 })}
                              </div>

                              {messages.filter(m => (m.type === 'log' || m.type === 'sold_card' || m.type === 'system' || m.type === 'sold' || m.type === 'unsold') && !(m.text || '').includes('New bid:')).length === 0 && (
                                 <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                                    <History size={24} className="text-gray-700 mb-2" />
                                    <p className="text-[10px] compact:text-[9px] font-black text-gray-600 uppercase tracking-widest">No activity yet</p>
                                 </div>
                              )}
                           </div>
                        </motion.div>
                     ) : !isSoloVsBots ? (
                        <motion.div
                           key="chat"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           className="flex-1 flex flex-col min-h-0 h-full p-2 pb-16 sm:pb-2 overflow-hidden"
                        >
                           <TextChat roomId={id} />
                        </motion.div>
                     ) : null}
                  </AnimatePresence>
               </div>
            </aside>
         </div>

         {/* Mobile Bottom Navigation Bar: fixed to bottom on mobile screens, hidden on laptop/desktop */}
         <div className="fixed bottom-0 inset-x-0 w-full bg-[#0c0d10]/95 backdrop-blur-2xl border-t border-white/10 flex md:hidden z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex w-full h-14 items-center justify-around px-2 sm:px-4">
               <button onClick={() => setMobileTab('squad')} className={`flex flex-col items-center justify-center w-14 sm:w-16 gap-0.5 transition-all duration-300 ${mobileTab === 'squad' ? 'text-white translate-y-0' : 'text-gray-500 hover:text-gray-400 translate-y-0.5'}`}>
                  <div className={`p-1 rounded-lg transition-colors duration-300 ${mobileTab === 'squad' ? 'bg-white/10 text-white' : 'bg-transparent text-gray-400'}`}>
                     <Users size={16} strokeWidth={mobileTab === 'squad' ? 2.5 : 2} />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${mobileTab === 'squad' ? 'text-slate-200 opacity-100' : 'text-gray-500 opacity-70'}`}>Squads</span>
               </button>

               <button onClick={() => setMobileTab('arena')} className={`flex flex-col items-center justify-center w-14 sm:w-16 gap-0.5 transition-all duration-300 ${mobileTab === 'arena' ? 'text-white translate-y-0' : 'text-gray-500 hover:text-gray-400 translate-y-0.5'}`}>
                  <div className={`p-1 rounded-lg transition-colors duration-300 ${mobileTab === 'arena' ? 'bg-white/10 text-white' : 'bg-transparent text-gray-400'}`}>
                     <Gavel size={16} strokeWidth={mobileTab === 'arena' ? 2.5 : 2} />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${mobileTab === 'arena' ? 'text-slate-200 opacity-100' : 'text-gray-500 opacity-70'}`}>Arena</span>
               </button>

               <button onClick={() => { setMobileTab('activity'); setSidebarTab('activity'); }} className={`flex flex-col items-center justify-center w-14 sm:w-16 gap-0.5 transition-all duration-300 ${mobileTab === 'activity' ? 'text-white translate-y-0' : 'text-gray-500 hover:text-gray-400 translate-y-0.5'}`}>
                  <div className={`p-1 rounded-lg transition-colors duration-300 ${mobileTab === 'activity' ? 'bg-white/10 text-white' : 'bg-transparent text-gray-400'}`}>
                     <History size={16} strokeWidth={mobileTab === 'activity' ? 2.5 : 2} />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${mobileTab === 'activity' ? 'text-slate-200 opacity-100' : 'text-gray-500 opacity-70'}`}>Logs</span>
               </button>

               {!isSoloVsBots && (
                  <button onClick={() => { setMobileTab('chat'); setSidebarTab('chat'); }} className={`flex flex-col items-center justify-center w-14 sm:w-16 gap-0.5 transition-all duration-300 ${mobileTab === 'chat' ? 'text-white translate-y-0' : 'text-gray-500 hover:text-gray-400 translate-y-0.5'}`}>
                     <div className={`p-1 rounded-lg transition-colors duration-300 ${mobileTab === 'chat' ? 'bg-white/10 text-white' : 'bg-transparent text-gray-400'}`}>
                        <MessageSquare size={16} strokeWidth={mobileTab === 'chat' ? 2.5 : 2} />
                     </div>
                     <span className={`text-[7px] font-black uppercase tracking-widest ${mobileTab === 'chat' ? 'text-slate-200 opacity-100' : 'text-gray-500 opacity-70'}`}>Chat</span>
                  </button>
               )}
            </div>
         </div>

         <AnimatePresence>
            {showPlayersOverlay && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-4 md:p-8 flex flex-col items-center">
                  <div className="w-full max-w-7xl flex flex-col gap-6 h-full">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div><h2 className="text-xl md:text-2xl font-pixel uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">Mega Auction Roster</h2><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Complete Player Inventory</p></div>
                        </div>
                        <button onClick={() => setShowPlayersOverlay(false)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"><X size={20} /></button>
                     </div>
                     <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5 no-scrollbar snap-x snap-mandatory shrink-0">
                        {['upcoming', 'sold', 'unsold', 'leaderboard'].map(tab => (
                           <button
                              key={tab}
                              onClick={() => setActiveOverlayTab(tab)}
                              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all uppercase text-xs sm:text-sm font-black whitespace-nowrap snap-start cursor-pointer border ${activeOverlayTab === tab
                                 ? 'bg-white/10 text-white border-white/20 shadow-sm'
                                 : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                                 }`}
                           >
                              {tab}
                           </button>
                        ))}
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-12">
                        {filteredPlayers.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 mb-4 shadow-xl">
                                 <Users size={32} className="opacity-50" />
                              </div>
                              <h4 className="text-base font-black uppercase tracking-wider text-gray-300 mb-1">
                                 No {activeOverlayTab} players found
                              </h4>
                              <p className="text-xs text-gray-500 font-medium max-w-sm">
                                 {activeOverlayTab === 'unsold' && "No players have gone unsold in this auction yet."}
                                 {activeOverlayTab === 'sold' && "No players have been bought by any team yet."}
                                 {activeOverlayTab === 'leaderboard' && "Top sold players will appear here once bidding starts."}
                                 {activeOverlayTab === 'upcoming' && "No upcoming players remaining in the inventory."}
                              </p>
                           </div>
                        ) : activeOverlayTab === 'upcoming' ? (
                           <div className="space-y-8 sm:space-y-12">
                              {Object.entries(groupedUpcomingPlayers || {}).map(([setName, players]) => (
                                 <div key={setName} className="space-y-4 sm:space-y-6">
                                    <div className="flex items-center gap-4 sm:gap-6">
                                       <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                       <h3 className="text-xs sm:text-sm font-pixel text-white uppercase tracking-widest bg-white/5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border border-white/10 whitespace-nowrap">
                                          {setName}
                                       </h3>
                                       <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                                       {players.map(p => (
                                          <div key={p.id} className="bg-white/5 border border-white/5 p-2.5 sm:p-3 rounded-2xl hover:bg-white/10 transition-all group flex flex-col justify-between">
                                             <div>
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3 border border-white/10 group-hover:scale-105 transition-transform mx-auto">
                                                   <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                                </div>
                                                <div className="text-center">
                                                   <h5 className="text-[11px] sm:text-xs font-black truncate mb-0.5 leading-tight">{p.name}</h5>
                                                   <div className="flex items-center justify-center gap-1.5 mb-2">
                                                      <span className="text-[8px] font-bold text-gray-400 uppercase bg-white/5 px-1.5 py-0.5 rounded">{p.role}</span>
                                                   </div>
                                                </div>
                                             </div>
                                             <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 text-center">
                                                <span className="text-[9px] sm:text-[10px] font-pixel text-slate-300">
                                                   ₹{formatCrores(p.basePrice)} Cr
                                                </span>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                              {filteredPlayers.map(p => (
                                 <div key={p.id} className="bg-white/5 border border-white/5 p-2.5 sm:p-3 rounded-2xl hover:bg-white/10 transition-all group flex flex-col justify-between">
                                    <div>
                                       <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3 border border-white/10 group-hover:scale-105 transition-transform mx-auto">
                                          <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                       </div>
                                       <div className="text-center">
                                          <h5 className="text-[11px] sm:text-xs font-black truncate mb-0.5 leading-tight">{p.name}</h5>
                                          <div className="flex items-center justify-center gap-1.5 mb-2">
                                             <span className="text-[8px] font-bold text-gray-400 uppercase bg-white/5 px-1.5 py-0.5 rounded">{p.role}</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 text-center">
                                       <span className="text-[9px] sm:text-[10px] font-pixel text-slate-300">
                                          ₹{formatCrores(activeOverlayTab === 'sold' || activeOverlayTab === 'leaderboard' ? p.bid : p.basePrice)} Cr
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {error && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-20 md:bottom-12 bg-red-500/20 border border-red-500/50 p-4 md:p-6 rounded-3xl flex items-center gap-4 text-red-500 font-black z-[110]">
                  <AlertCircle size={16} /><span className="text-xs md:text-base">{error}</span>
               </motion.div>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {showSettings && (
               <>
                  {/* Backdrop scrim to close on tap/click outside and dim background */}
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.2 }}
                     onClick={() => setShowSettings(false)}
                     className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95]"
                  />

                  {/* Settings Modal Container: centered on mobile, right-aligned on tablet/laptop */}
                  <div className="fixed inset-0 z-[100] flex items-start justify-center sm:justify-end p-3 sm:p-6 sm:pt-16 pointer-events-none">
                     <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: -12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="pointer-events-auto relative w-full max-w-[calc(100vw-1.5rem)] sm:w-96 bg-[#0c0d10] border border-white/10 p-5 sm:p-6 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl will-change-transform"
                     >
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                     <div className="flex items-center gap-2.5">

                        <div>
                           <h3 className="text-xs font-pixel text-white uppercase tracking-wider">Room & Voice Settings</h3>
                           <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Customize Experience</p>
                        </div>
                     </div>
                     <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"><X size={15} /></button>
                  </div>

                  <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                     {/* Host Settings Section */}
                     {isAdmin && (
                        <div className="bg-gradient-to-b from-slate-500/10 to-transparent border border-slate-500/20 p-4 rounded-2xl relative overflow-hidden">
                           <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Bid Timer (Host)</span>
                              </div>
                              <span className="text-xs font-black text-slate-300 bg-slate-500/15 px-2 py-0.5 rounded-full border border-slate-500/30">
                                 {newTimerValue} Seconds
                              </span>
                           </div>

                           {/* Timer Choice Blocks (5s, 10s, 15s, 20s) */}
                           <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                              {[
                                 { value: 5, label: '5s', tag: 'Fast' },
                                 { value: 10, label: '10s', tag: 'Standard' },
                                 { value: 15, label: '15s', tag: 'Relaxed' },
                                 { value: 20, label: '20s', tag: 'Chill' },
                              ].map((opt) => {
                                 const isSelected = newTimerValue === opt.value;
                                 return (
                                    <button
                                       key={opt.value}
                                       type="button"
                                       onClick={() => setNewTimerValue(opt.value)}
                                       className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl border transition-all cursor-pointer ${
                                          isSelected
                                             ? 'bg-white text-black border-white shadow-md shadow-white/10'
                                             : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                                       }`}
                                    >
                                       <span className="text-xs sm:text-sm font-black leading-tight">{opt.label}</span>
                                       <span className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-wider mt-0.5 ${
                                          isSelected ? 'text-black/70 font-black' : 'text-gray-500'
                                       }`}>
                                          {opt.tag}
                                       </span>
                                    </button>
                                 );
                              })}
                           </div>

                           <button
                              type="button"
                              onClick={async () => {
                                 await updateRoomSettings(id, { ...(currentAuction?.settings || {}), bidTimer: newTimerValue });
                              }}
                              className="w-full bg-white hover:bg-slate-200 text-black py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all mt-3 shadow-[0_10px_30px_rgba(255,255,255,0.08)] active:scale-95 cursor-pointer"
                           >
                              Apply Timer Settings
                           </button>
                        </div>
                     )}

                     {/* Voice Auctioneer Settings Section */}
                     <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                           <div className="flex items-center gap-2">

                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Voice Auctioneer</span>
                           </div>

                           {/* Toggle Switch */}
                           <button
                              onClick={() => {
                                 const newTtsVal = !isTtsEnabled;
                                 setIsTtsEnabled(newTtsVal);
                                 if (!newTtsVal) {
                                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                                 } else {
                                    speak("Voice Auctioneer enabled.");
                                 }
                              }}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${isTtsEnabled ? 'bg-slate-300' : 'bg-white/10'}`}
                           >
                              <motion.div
                                 layout
                                 transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                 className={`w-4 h-4 rounded-full bg-black shadow-md ${isTtsEnabled ? 'ml-5' : 'ml-0'}`}
                              />
                           </button>
                        </div>

                        {/* Speed Slider */}
                        <div className={isTtsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
                           <div className="flex justify-between items-center mb-1.5">
                              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Speaking Speed</label>
                              <span className="text-[10px] font-black text-slate-300">{ttsSpeed.toFixed(2)}x</span>
                           </div>
                           <input type="range" min="0.70" max="1.80" step="0.05" value={ttsSpeed} onChange={(e) => setTtsSpeed(parseFloat(e.target.value))} className="w-full accent-slate-400 bg-white/10 h-1.5 rounded-lg cursor-pointer" />
                        </div>

                        {/* Pitch Slider */}
                        <div className={isTtsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
                           <div className="flex justify-between items-center mb-1.5">
                              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Voice Pitch</label>
                              <span className="text-[10px] font-black text-slate-300">{ttsPitch.toFixed(2)}</span>
                           </div>
                           <input type="range" min="0.60" max="1.40" step="0.05" value={ttsPitch} onChange={(e) => setTtsPitch(parseFloat(e.target.value))} className="w-full accent-slate-400 bg-white/10 h-1.5 rounded-lg cursor-pointer" />
                        </div>

                        {/* Voice Selector */}
                        {availableVoices.length > 0 && (
                           <div className={isTtsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
                              <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Voice</label>
                              <select
                                 value={selectedVoiceName}
                                 onChange={(e) => {
                                    const newVoiceName = e.target.value;
                                    setSelectedVoiceName(newVoiceName);
                                    setTimeout(() => {
                                       if ('speechSynthesis' in window) {
                                          window.speechSynthesis.cancel();
                                          const previewUtterance = new SpeechSynthesisUtterance("Voice selected.");
                                          const voices = window.speechSynthesis.getVoices();
                                          const vMatch = voices.find(v => v.name === newVoiceName);
                                          if (vMatch) previewUtterance.voice = vMatch;
                                          previewUtterance.rate = ttsSpeed;
                                          previewUtterance.pitch = ttsPitch;
                                          window.speechSynthesis.speak(previewUtterance);
                                       }
                                    }, 100);
                                 }}
                                 className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-gray-200 font-bold focus:outline-none focus:border-slate-400/50 transition-colors cursor-pointer"
                              >
                                 {availableVoices.map(v => (
                                    <option key={v.name} value={v.name} className="bg-[#0c0d12] text-white">
                                       {getVoiceLabel(v.name)}
                                    </option>
                                 ))}
                              </select>
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            </div>
         </>
      )}
   </AnimatePresence>

         <AnimatePresence>
            {showParticipantsOverlay && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-4 md:p-8 flex flex-col items-center overflow-y-auto">
                  <div className="w-full max-w-2xl flex flex-col gap-6 my-auto max-h-[90vh]">
                     <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                           <div><h2 className="text-xl md:text-2xl font-pixel uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">Active Participants</h2><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Manage Room Connectivity</p></div>
                        </div>
                        <button onClick={() => setShowParticipantsOverlay(false)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-500 transition-all cursor-pointer"><X size={20} /></button>
                     </div>
                     <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar max-h-[calc(90vh-100px)] touch-pan-y">
                        {(currentAuction.players || []).map((player) => (
                           <div key={player.id} className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center`}>
                                    <img src={TEAMS.find(t => t.id === player.team)?.logo} alt="Player Team Logo" className="w-full h-full object-contain" />
                                 </div>
                                 <div><h5 className="text-sm font-black uppercase flex items-center gap-2">{player.name}{player.isHost && <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 border border-white/10 font-pixel text-[8px] rounded-md">HOST</span>}</h5><p className="text-[10px] font-bold text-gray-500 uppercase">{player.teamName}</p></div>
                              </div>
                              {!player.isHost && (
                                 <button onClick={async () => { if (window.confirm(`Are you sure you want to kick ${player.name}?`)) { try { await kickPlayer(id, player); } catch { setError('Failed to remove that manager. Please try again.'); setTimeout(() => setError(''), 3000); } } }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 cursor-pointer">Kick Player</button>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Two-Tab Lock: Blocked by another active window */}
         {isSoloVsBots && soloLockStatus === 'blocked' && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">
               <div className="relative z-10 flex flex-col items-center w-full max-w-md bg-[#0c0d10] border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                     <AlertCircle size={24} />
                  </div>
                  <h2 className="text-base font-black uppercase tracking-wider mb-2 text-white">Active in Another Window</h2>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
                     This solo auction is currently running in another tab or window on this device. You can take over the session here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                     <button
                        onClick={takeOverSoloAuction}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                     >
                        Take Over Here
                     </button>
                     <button
                        onClick={() => navigate('/')}
                        className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                     >
                        Back to Home
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Two-Tab Lock: Taken over by another window */}
         {isSoloVsBots && soloLockStatus === 'taken_over' && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">
               <div className="relative z-10 flex flex-col items-center w-full max-w-md bg-[#0c0d10] border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
                     <AlertCircle size={24} />
                  </div>
                  <h2 className="text-base font-black uppercase tracking-wider mb-2 text-white">Session Taken Over</h2>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
                     This solo auction was taken over by another window on this device. Bidding in this tab is paused.
                  </p>
                  <button
                     onClick={() => navigate('/')}
                     className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                     Back to Home
                  </button>
               </div>
            </div>
         )}

         <ConfirmDialog
            isOpen={showFastForwardConfirm}
            title="Fast Forward to Finish?"
            description={
               (team?.squad?.length || 0) < toFiniteNumber(currentAuction?.squadLimit, 25)
                  ? `Your squad currently has ${team?.squad?.length || 0}/${toFiniteNumber(currentAuction?.squadLimit, 25)} players. The remaining lots will be simulated exclusively among the AI bots, and your squad will remain as-is. Finish and review final results?`
                  : "Simulate all remaining rounds for the AI bots and advance straight to the final review page?"
            }
            detail={`Room ${id}`}
            confirmLabel="Simulate & Finish"
            cancelLabel="Keep Playing"
            loading={isFastForwarding}
            onConfirm={async () => {
               setShowFastForwardConfirm(false);
               await handleSoloFastForward();
            }}
            onCancel={() => !isFastForwarding && setShowFastForwardConfirm(false)}
         />

         <ConfirmDialog
            isOpen={showEndConfirm}
            title="End This Auction?"
            description="This finalizes every squad, saves the results to history, and closes the live room for all participants. This action cannot be undone."
            detail={`Room ${id}`}
            confirmLabel="End Auction"
            cancelLabel="Cancel"
            loading={isEnding}
            onConfirm={async () => {
               setIsEnding(true);
               try {
                  await endAuction(id);
                  setShowEndConfirm(false);
               } catch {
                  setError('Failed to end the auction. Please try again.');
                  setTimeout(() => setError(''), 3000);
               } finally {
                  setIsEnding(false);
               }
            }}
            onCancel={() => !isEnding && setShowEndConfirm(false)}
         />
      </div>
   );
};

const SoldCard = ({ msg }) => {
   const cardRef = useRef(null);
   const player = IPL_PLAYERS.find(p => p.id === msg.metadata.playerId);
   const team = TEAMS.find(t => t.id === msg.metadata.teamId);
   const slogan = TEAM_SLOGANS[msg.metadata.teamId] || { slogan: 'IPL 2025!', hashtag: '#IPL' };

   const handleSave = async () => {
      if (cardRef.current === null) return;
      try {
         const dataUrl = await toPng(cardRef.current, {
            cacheBust: false,
            pixelRatio: 2,
            skipFonts: true,
            imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
         });
         const link = document.createElement('a');
         link.download = `${player.name}_Sold.png`;
         link.href = dataUrl;
         link.click();
      } catch (err) {
         console.error('Error saving image:', err);
      }
   };

   return (
      <div className="space-y-2 mb-4 sm:mb-6">
         <div ref={cardRef} className="relative w-full min-h-[400px] max-h-[480px] h-auto aspect-[4/5] rounded-2xl sm:rounded-[2rem] overflow-hidden bg-[#0c0d10] border border-white/10 shadow-2xl">
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${team?.color.replace('bg-', 'from-')} to-black`} />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

            <div className="relative h-full flex flex-col p-4 sm:p-6 z-10 justify-between">
               <div className="flex justify-between items-start mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/10">
                     <img src={team?.logo} alt={`${team?.name || 'Franchise'} Logo`} className="w-full h-full object-contain " />
                  </div>
                  <div className="text-right uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                     <p className="text-[7px] sm:text-[8px] font-pixel text-slate-400 mb-0.5">IPL Auction</p>
                     <p className="text-[9px] sm:text-[10px] font-bold text-white/50 leading-none">Sold to</p>
                     <p className="text-[11px] sm:text-[12px] font-black text-white">{msg.metadata.buyerName}</p>
                  </div>
               </div>

               <div className="flex-1 flex flex-col justify-center items-center py-2 sm:py-4">
                  <div className="relative w-28 h-28 sm:w-40 sm:h-40 group">
                     <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 ${team?.color}`} />
                     <img
                        src={player?.image}
                        className="relative w-full h-full object-contain z-10 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        alt={player?.name || 'Sold Player'}
                        onError={(e) => {
                           e.target.onerror = null;
                           e.target.src = getPlayerAvatar(player?.name);
                        }}
                     />
                  </div>
                  <div className="text-center mt-2 sm:mt-4">
                     <h2 className="text-xl sm:text-2xl compact:text-xl font-black uppercase tracking-tight text-white leading-tight">{player?.name}</h2>
                     <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">{player?.role} • {player?.country}</p>
                  </div>
               </div>

               <div className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                     <p className="text-sm sm:text-[16px] font-pixel italic uppercase tracking-wider text-slate-300 drop-shadow-lg">#{slogan.slogan}</p>

                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center">

                     <p className="text-xl sm:text-2xl compact:text-xl font-black text-white">₹{formatCrores(msg.metadata?.bid)} Cr</p>
                  </div>
               </div>
            </div>
         </div>
         <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 text-gray-400 hover:text-white">
            <Download size={14} /> Save Player Card
         </button>
      </div>
   );
};

export default AuctionRoom;
