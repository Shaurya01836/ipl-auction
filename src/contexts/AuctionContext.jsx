import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { db, getServerTime, rtdb } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { IPL_PLAYERS } from '../data/players';
import { evaluateBotBid } from '../lib/botEngine';
import { 
  ref, 
  set, 
  get, 
  remove,
  update as updateRtdb, 
  onValue, 
  onDisconnect,
  runTransaction as runTransactionRtdb,
  push,
  serverTimestamp as serverTimestampRtdb,
  query as queryRtdb,
  limitToLast
} from 'firebase/database';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
  collection,
  runTransaction,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useQuota } from './QuotaContext';


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

const AuctionContext = createContext();

export const useAuction = () => useContext(AuctionContext);

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const AuctionProvider = ({ children }) => {
  const { user } = useAuth();
  const { handleFirebaseError } = useQuota();
  const [currentAuction, setCurrentAuction] = useState(null);
  const [team, setTeam] = useState(null);
  const [roomTeams, setRoomTeams] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endingPlayerRef = React.useRef(false);


  // Server-authoritative time using Firebase RTDB offset.
  // getServerTime() returns Date.now() + serverOffset, synced across all clients.
  const getSyncedTime = useCallback(() => {
    return getServerTime();
  }, []);

  // Create a new room in DB (RTDB + Supabase index, zero Firestore load)
  const createRoom = useCallback(async (roomId, userId, playerDetails, auctionType = 'mega', isPublic = true) => {
    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);
    
    // Mode-specific configurations
    const isSprint5 = auctionType === 'sprint5';
    const isSprint11 = auctionType === 'sprint11';
    
    const budget = isSprint5 ? 60.0 : isSprint11 ? 90.0 : 120.0;
    const squadLimit = isSprint5 ? 5 : isSprint11 ? 11 : 25;
    const overseasLimit = isSprint5 ? 2 : isSprint11 ? 4 : 8;

    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    await set(liveRef, { status: 'waiting' });

    // Instantly set host online presence in RTDB
    const hostPresenceRef = ref(rtdb, `auctions/${roomId}/presence/${userId}`);
    await set(hostPresenceRef, {
      online: true,
      lastSeen: serverTimestampRtdb()
    });

    // Sync to RTDB for real-time reads
    const rtdbRoomRef = ref(rtdb, `auctions/${roomId}/room`);
    await set(rtdbRoomRef, {
      hostId: userId,
      hostName: playerDetails.name,
      status: 'waiting',
      auctionType,
      isPublic: !!isPublic,
      squadLimit,
      overseasLimit,
      players: [{
        id: userId,
        name: playerDetails.name,
        team: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        isHost: true
      }],
      bannedPlayers: [],
      settings: {
        bidTimer: 10,
        budget
      }
    });

    if (playerDetails.team) {
      const rtdbTeamRef = ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`);
      await set(rtdbTeamRef, {
        auctionId: roomId,
        userId: userId,
        teamId: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: budget,
        spent: 0,
        squad: []
      });
    }

    // Write to Supabase (primary database index, 0 Firestore cost)
    try {
      if (supabase) {
        await supabase.from('auctions').upsert({
          id: roomId,
          host_id: userId,
          host_name: playerDetails.name,
          is_public: !!isPublic,
          status: 'waiting',
          auction_type: auctionType,
          squad_limit: squadLimit,
          overseas_limit: overseasLimit,
          players: [{
            id: userId,
            name: playerDetails.name,
            team: playerDetails.team,
            teamName: teamDetails?.name || 'Unknown',
            isHost: true
          }],
          settings: { bidTimer: 10, budget }
        });

        if (playerDetails.team) {
          await supabase.from('teams').upsert({
            id: `${roomId}_${userId}`,
            auction_id: roomId,
            user_id: userId,
            team_id: playerDetails.team,
            team_name: teamDetails?.name || 'Unknown',
            budget_remaining: budget,
            spent: 0,
            squad: []
          });
        }
      }
    } catch (sErr) {
      // Non-blocking Supabase fallback
    }
  }, []);
  
  // Helper to flush complete room & teams data from RTDB to Supabase in single batch call
  const flushAuctionToFirestore = useCallback(async (roomId) => {
    try {
      const roomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
      const teamsSnap = await get(ref(rtdb, `auctions/${roomId}/teams`));

      if (!roomSnap.exists()) return;

      const roomData = roomSnap.val();
      const teamsData = teamsSnap.exists() ? teamsSnap.val() : {};

      // Flush to Supabase (0 Firestore cost)
      if (supabase) {
        await supabase.from('auctions').upsert({
          id: roomId,
          host_id: roomData.hostId || '',
          host_name: roomData.hostName || 'Manager',
          is_public: roomData.isPublic !== false,
          status: roomData.status || 'waiting',
          auction_type: roomData.auctionType || 'mega',
          players: roomData.players || [],
          settings: roomData.settings || {},
          banned_players: roomData.bannedPlayers || [],
          ...(roomData.playerOrder ? { player_order: roomData.playerOrder } : {})
        });

        const supabaseTeams = Object.entries(teamsData).map(([docId, teamVal]) => ({
          id: docId,
          auction_id: roomId,
          user_id: teamVal.userId,
          team_id: teamVal.teamId || '',
          team_name: teamVal.teamName || 'Unknown',
          budget_remaining: teamVal.budgetRemaining ?? 120.0,
          spent: teamVal.spent ?? 0,
          squad: teamVal.squad || []
        }));

        if (supabaseTeams.length > 0) {
          await supabase.from('teams').upsert(supabaseTeams);
        }
      }
    } catch (err) {
      // Graceful error handling
    }
  }, []);

  const startAuction = useCallback(async (roomId) => {
    // Generate randomized order within sets
    const sets = [...new Set(IPL_PLAYERS.map(p => p.set))];
    let randomizedIndices = [];
    sets.forEach(setName => {
      const setIndices = IPL_PLAYERS.map((p, i) => p.set === setName ? i : -1).filter(i => i !== -1);
      randomizedIndices = [...randomizedIndices, ...shuffleArray(setIndices)];
    });

    const rtdbRoomRef = ref(rtdb, `auctions/${roomId}/room`);
    const playerOrderRef = ref(rtdb, `auctions/${roomId}/playerOrder`);
    
    // Store playerOrder in room node (matching RTDB rules) and attempt subnode update
    await updateRtdb(rtdbRoomRef, {
      status: 'active',
      playerOrder: randomizedIndices
    });

    try {
      await set(playerOrderRef, randomizedIndices);
    } catch (e) {
      // Graceful fallback if RTDB sub-path rule is pending deploy
    }

    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    await set(liveRef, {
      playerId: IPL_PLAYERS[randomizedIndices[0]].id,
      currentBid: 0,
      highBidderId: '',
      highBidderName: 'No Bids',
      timerEndsAt: getSyncedTime() + 15000,
      status: 'bidding'
    });
    
    // Add to messages collection for chronological sorting
    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction has started!`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });

  }, [getSyncedTime]);

  const endPlayerAuction = useCallback(async (roomId) => {
    // Prevent duplicate calls from the timer interval
    if (endingPlayerRef.current) return;
    endingPlayerRef.current = true;

    try {
      const liveRef = ref(rtdb, `auctions/${roomId}/live`);
      
      // Use RTDB transaction to atomically claim the "end" action
      const txResult = await runTransactionRtdb(liveRef, (currentData) => {
        if (!currentData) return currentData;
        // Only proceed if still in bidding state
        if (currentData.status !== 'bidding') return; // abort
        
        const isSold = !!currentData.highBidderId;
        currentData.status = isSold ? 'sold' : 'unsold';
        return currentData;
      });

      // If transaction was aborted (already sold/unsold), bail out
      if (!txResult.committed) {
        endingPlayerRef.current = false;
        return;
      }

      const auctionState = txResult.snapshot.val();
      const isSold = auctionState.status === 'sold';
      const player = IPL_PLAYERS.find(p => p.id === auctionState.playerId);
      const teamDetails = TEAMS.find(t => t.id === auctionState.highBidderTeamId);

      const playerNameStr = player?.name || 'Player';
      const logText = `${playerNameStr} ${isSold ? `SOLD to ${teamDetails?.name || auctionState.highBidderName} for ₹${auctionState.currentBid} Cr` : 'UNSOLD'}`;

      let updatedPlayers = null;
      let teamDocId = null;
      let newTeamData = null;

      if (isSold) {
        teamDocId = `${roomId}_${auctionState.highBidderId}`;

        // Get current room players from RTDB to update squadCount & spent in RTDB live state (0 Firestore cost!)
        const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
        if (rtdbRoomSnap.exists()) {
          const roomData = rtdbRoomSnap.val();
          updatedPlayers = (roomData.players || []).map(p => {
            if (p.id === auctionState.highBidderId) {
              return {
                ...p,
                spent: (p.spent || 0) + auctionState.currentBid,
                squadCount: (p.squadCount || 0) + 1
              };
            }
            return p;
          });
        }

        // Get current team data from RTDB to update RTDB team node (0 Firestore cost!)
        const rtdbTeamSnap = await get(ref(rtdb, `auctions/${roomId}/teams/${teamDocId}`));
        const tData = rtdbTeamSnap.exists() ? rtdbTeamSnap.val() : {};
        const defaultBudget = 120.0;
        newTeamData = {
          auctionId: roomId,
          userId: auctionState.highBidderId,
          teamId: auctionState.highBidderTeamId || tData.teamId || '',
          teamName: teamDetails?.name || auctionState.highBidderName || tData.teamName || 'Unknown',
          budgetRemaining: Math.max(0, (tData.budgetRemaining ?? defaultBudget) - auctionState.currentBid),
          spent: (tData.spent || 0) + auctionState.currentBid,
          squad: [...(tData.squad || []), { id: auctionState.playerId, bid: auctionState.currentBid }]
        };
      }

      // Sync live state to RTDB in parallel (0 Firestore cost!)
      const syncPromises = [];
      if (updatedPlayers) {
        syncPromises.push(updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers }));
      }
      if (newTeamData && teamDocId) {
        syncPromises.push(updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${teamDocId}`), newTeamData));
      }
      syncPromises.push(push(ref(rtdb, `auctions/${roomId}/messages`), {
        userId: 'system',
        userName: 'System',
        text: logText,
        type: isSold ? 'sold_card' : 'log',
        metadata: isSold ? {
          playerId: auctionState.playerId,
          teamId: auctionState.highBidderTeamId,
          bid: auctionState.currentBid,
          buyerId: auctionState.highBidderId,
          buyerName: auctionState.highBidderName
        } : null,
        timestamp: serverTimestampRtdb()
      }));
      await Promise.all(syncPromises);

      const waitTime = isSold ? 5000 : 2000;

      // Get player order and settings directly from RTDB snapshot
      const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
      const roomData = rtdbRoomSnap.exists() ? rtdbRoomSnap.val() : {};

      let playerOrder = roomData.playerOrder;
      if (!playerOrder) {
        const orderSnap = await get(ref(rtdb, `auctions/${roomId}/playerOrder`));
        if (orderSnap.exists()) playerOrder = orderSnap.val();
      }

      setTimeout(async () => {
        if (roomData.status !== 'active') return;

        const settings = roomData.settings;
        const currentPlayerId = auctionState.playerId;
        const order = playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
        const currentPlayerIndexInOrder = order.findIndex(idx => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === currentPlayerId);
        const nextIndexInOrder = currentPlayerIndexInOrder !== -1 ? order[currentPlayerIndexInOrder + 1] : order[0];
        
        if (nextIndexInOrder !== undefined) {
          const nextPlayer = IPL_PLAYERS[nextIndexInOrder];
          await set(liveRef, {
            playerId: nextPlayer.id,
            currentBid: 0,
            highBidderId: '',
            highBidderName: 'No Bids',
            timerEndsAt: getSyncedTime() + (settings?.bidTimer || 10) * 1000,
            status: 'bidding'
          });
        } else {
          // Flush final completed status & all teams to Supabase once at end of auction!
          await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { status: 'completed' });
          await flushAuctionToFirestore(roomId);

          // Optimization 4: Clean up completed room from RTDB after 30 seconds to keep RTDB size near 0MB
          setTimeout(async () => {
            try {
              await remove(ref(rtdb, `auctions/${roomId}`));
            } catch (cleanErr) {
              // Ignore cleanup error if already removed
            }
          }, 30000);
        }
        endingPlayerRef.current = false;
      }, waitTime);
    } catch (err) {
      endingPlayerRef.current = false;
    }
  }, [getSyncedTime, flushAuctionToFirestore]);

  const joinRoomDb = useCallback(async (roomId, userId, playerDetails) => {
    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);
    
    // Fetch current room state from RTDB (0 Firestore cost!)
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    let data = null;
    
    if (rtdbRoomSnap.exists()) {
      data = rtdbRoomSnap.val();
    } else {
      // Fallback: Fetch from Firestore only if RTDB room node does not exist yet
      const roomSnap = await getDoc(doc(db, 'auctions', roomId));
      if (!roomSnap.exists()) throw new Error("Room not found!");
      data = roomSnap.data();
    }

    if (data.bannedPlayers && data.bannedPlayers.includes(userId)) {
      throw new Error("You have been kicked from this room and cannot rejoin.");
    }

    if (data.status === 'completed') {
      throw new Error("This auction has already ended.");
    }

    const existingPlayers = data.players || [];
    const playerExists = existingPlayers.find(p => p.id === userId);
    
    const updatedPlayer = {
      id: userId,
      name: playerDetails.name || (playerExists ? playerExists.name : 'Manager'),
      team: playerDetails.team || (playerExists ? playerExists.team : ''),
      teamName: teamDetails?.name || (playerExists ? playerExists.teamName : 'Unknown'),
      isHost: playerExists ? playerExists.isHost : false
    };

    const updatedPlayers = existingPlayers.filter(p => p.id !== userId);
    updatedPlayers.push(updatedPlayer);

    // Update RTDB (0 Firestore cost in lobby!)
    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });

    // Create/Update team in RTDB if team is provided
    if (playerDetails.team) {
      const rtdbTeamSnap = await get(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`));
      if (!rtdbTeamSnap.exists()) {
        const teamDataToSet = {
          auctionId: roomId,
          userId: userId,
          teamId: playerDetails.team,
          teamName: teamDetails?.name || 'Unknown',
          budgetRemaining: data.settings?.budget || 120.0,
          spent: 0,
          squad: []
        };
        await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`), teamDataToSet);
      } else {
        const tData = rtdbTeamSnap.val();
        if (tData.teamId !== playerDetails.team) {
          await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`), {
            teamId: playerDetails.team,
            teamName: teamDetails?.name || 'Unknown'
          });
        }
      }
    }
  }, []);

  // Kick a player from the room
  const kickPlayer = useCallback(async (roomId, playerObj) => {
    try {
      const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
      if (!rtdbRoomSnap.exists()) return;
      const data = rtdbRoomSnap.val();

      // 1. Filter out the player and add to banned list
      const updatedPlayers = (data.players || []).filter(p => p.id !== playerObj.id);
      const updatedBanned = [...(data.bannedPlayers || []), playerObj.id];

      // 2. Update RTDB
      await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { 
        players: updatedPlayers,
        bannedPlayers: updatedBanned 
      });

      // 3. Delete team in RTDB
      await set(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${playerObj.id}`), null);

      // 4. Add to messages collection
      const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
      await push(msgRef, {
        userId: 'system',
        userName: 'System',
        text: `${playerObj.name} has been removed from the session.`,
        type: 'log',
        timestamp: serverTimestampRtdb()
      });
    } catch (err) {
      // Error kicking player
    }
  }, []);

  // Listen to current auction state live
  const joinAuction = useCallback((auctionId, userId) => {
    if (!userId) return () => {};
    
    setLoading(true);
    let auctionLoaded = false;
    let teamsLoaded = false;
    let messagesLoaded = false;

    const checkLoaded = () => {
      if (auctionLoaded && teamsLoaded && messagesLoaded) {
        setLoading(false);
      }
    };

    // Auto-timeout for loading
    const loadTimeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    // ─── Real Presence Logic ───
    // Track online status in RTDB
    const myPresenceRef = ref(rtdb, `auctions/${auctionId}/presence/${userId}`);
    const connectedRef = ref(rtdb, '.info/connected');
    
    // Set presence status on connect/disconnect
    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected)! Do something and set onDisconnect
        set(myPresenceRef, { 
          online: true, 
          lastSeen: serverTimestampRtdb() 
        });
        
        // When I disconnect, update this to offline
        onDisconnect(myPresenceRef).set({ 
          online: false, 
          lastSeen: serverTimestampRtdb() 
        });
      }
    });

    let currentRoomData = null;
    let currentRtdbData = null;
    let currentPresences = {};

    const checkAndSet = () => {
      if (currentRoomData) {
        // Map presence data to players array
        const playersWithPresence = (currentRoomData.players || []).map(p => ({
          ...p,
          isOnline: !!currentPresences[p.id]?.online,
          lastSeen: currentPresences[p.id]?.lastSeen || null
        }));

        setCurrentAuction({ 
          id: auctionId, 
          ...currentRoomData,
          players: playersWithPresence,
          currentAuction: currentRtdbData || currentRoomData.currentAuction
        });
      }
    };

    // Presence listener (all users' presence)
    const presenceRef = ref(rtdb, `auctions/${auctionId}/presence`);
    const unsubPresence = onValue(presenceRef, (snap) => {
      currentPresences = snap.val() || {};
      checkAndSet();
    });

    let didFallbackFetch = false;
    let didTeamsFallback = false;

    const unsubAuction = onValue(ref(rtdb, `auctions/${auctionId}/room`), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // PROACTIVE BAN CHECK: Kick user if they are banned
        if (data.bannedPlayers && data.bannedPlayers.includes(userId)) {
           window.location.href = '/?error=kicked';
           return;
        }

        auctionLoaded = true;
        if (!data.playerOrder) {
          get(ref(rtdb, `auctions/${auctionId}/playerOrder`)).then(oSnap => {
            if (oSnap.exists()) data.playerOrder = oSnap.val();
            currentRoomData = data;
            checkAndSet();
          }).catch(() => {});
        }
        currentRoomData = data;
        checkAndSet();
        checkLoaded();
      } else if (!didFallbackFetch) {
        didFallbackFetch = true;
        // Wait 1.5s grace period before hitting Firestore to allow RTDB initialization to complete
        setTimeout(async () => {
          if (auctionLoaded) return;
          try {
            const fsDoc = await getDoc(doc(db, 'auctions', auctionId));
            if (fsDoc.exists()) {
              const data = fsDoc.data();
              if (data.bannedPlayers && data.bannedPlayers.includes(userId)) {
                 window.location.href = '/?error=kicked';
                 return;
              }
              auctionLoaded = true;
              currentRoomData = data;
              checkAndSet();
              checkLoaded();
              await updateRtdb(ref(rtdb, `auctions/${auctionId}/room`), data);
            }
          } catch(e) { handleFirebaseError(e); }
        }, 1500);
      }
    }, (error) => {
      setLoading(false);
      handleFirebaseError(error);
    });

    const unsubLive = onValue(ref(rtdb, `auctions/${auctionId}/live`), (snapshot) => {
      currentRtdbData = snapshot.val();
      checkAndSet();
    }, (error) => {
      handleFirebaseError(error);
    });


    const unsubTeams = onValue(ref(rtdb, `auctions/${auctionId}/teams`), async (snapshot) => {
      if (snapshot.exists()) {
        teamsLoaded = true;
        const teamsObj = snapshot.val();
        const teamsArr = Object.values(teamsObj).map(t => ({ id: `${auctionId}_${t.userId}`, ...t }));
        setRoomTeams(teamsArr);
        
        if (userId) {
          const myTeam = teamsArr.find(t => t.id === `${auctionId}_${userId}`);
          if (myTeam) setTeam(myTeam);
          else setTeam(null);
        }
        checkLoaded();
      } else if (!didTeamsFallback) {
        didTeamsFallback = true;
        // Wait 1.5s grace period before hitting Firestore
        setTimeout(async () => {
          if (teamsLoaded) return;
          try {
            const tq = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
            const tSnap = await getDocs(tq);
            if (!tSnap.empty) {
              teamsLoaded = true;
              const teamsArr = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setRoomTeams(teamsArr);
              
              if (userId) {
                const myTeam = teamsArr.find(t => t.id === `${auctionId}_${userId}`);
                if (myTeam) setTeam(myTeam);
                else setTeam(null);
              }
              checkLoaded();
              
              const teamsToSync = {};
              tSnap.docs.forEach(doc => {
                teamsToSync[doc.id] = doc.data();
              });
              await updateRtdb(ref(rtdb, `auctions/${auctionId}/teams`), teamsToSync);
            } else {
               // no teams yet
               teamsLoaded = true;
               setRoomTeams([]);
               setTeam(null);
               checkLoaded();
            }
          } catch(e) { handleFirebaseError(e); }
        }, 1500);
      }
    }, (error) => {
      setLoading(false);
      handleFirebaseError(error);
    });

    const msgQuery = queryRtdb(ref(rtdb, `auctions/${auctionId}/messages`), limitToLast(25));
    const unsubMessages = onValue(msgQuery, (snapshot) => {
      messagesLoaded = true;
      if (snapshot.exists()) {
        const msgs = [];
        snapshot.forEach(child => {
          msgs.push({ id: child.key, ...child.val() });
        });
        setMessages(msgs);
      } else {
        setMessages([]);
      }
      checkLoaded();
    }, (error) => {
      setLoading(false);
      handleFirebaseError(error);
    });

    return () => {
      clearTimeout(loadTimeout);
      unsubConnected();
      unsubPresence();
      unsubAuction();
      unsubLive();
      unsubTeams();
      unsubMessages();
      // Set offline on component unmount
      set(myPresenceRef, { online: false, lastSeen: serverTimestampRtdb() });
      setCurrentAuction(null);
      setTeam(null);
      setRoomTeams([]);
      setMessages([]);
    };
  }, [user]);

  const sendMessage = useCallback(async (roomId, text, type = 'text') => {
    if (!user) return;
    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: user.uid,
      userName: user.displayName || 'Manager',
      text,
      type,
      timestamp: serverTimestampRtdb()
    });
  }, [user]);

  const placeBid = useCallback(async (amount) => {
    if (!currentAuction) throw new Error("Auction not found!");
    if (!user) throw new Error("Please log in to bid!");
    if (!team) throw new Error("You must select a team in the lobby to participate!");
    if (currentAuction.bannedPlayers && currentAuction.bannedPlayers.includes(user.uid)) {
      throw new Error("You have been removed from this auction and cannot bid.");
    }
    if (currentAuction.currentAuction?.status !== 'bidding') throw new Error("Auction is not accepting bids right now.");
    if (currentAuction.currentAuction?.highBidderId === user.uid) throw new Error("You are already the highest bidder!");
    
    // Squad limit check
    const squadLimit = currentAuction.squadLimit || 25;
    if (team.squad && team.squad.length >= squadLimit) {
      throw new Error(`You have reached the squad limit of ${squadLimit} players!`);
    }

    // Overseas limit check
    const player = IPL_PLAYERS.find(p => p.id === currentAuction.currentAuction?.playerId);
    const isOverseas = player && player.country !== 'IND';
    const overseasLimit = currentAuction.overseasLimit || 8;
    
    if (isOverseas && team.squad) {
      const currentOverseasCount = team.squad.reduce((count, s) => {
        const pInfo = IPL_PLAYERS.find(p => p.id === (typeof s === 'string' ? s : s.id));
        return pInfo && pInfo.country !== 'IND' ? count + 1 : count;
      }, 0);
      
      if (currentOverseasCount >= overseasLimit) {
        throw new Error(`You have reached the overseas quota of ${overseasLimit} players for this mode!`);
      }
    }

    const auctionDoc = doc(db, 'auctions', currentAuction.id);
    let finalAmount = amount;

    const liveRef = ref(rtdb, `auctions/${currentAuction.id}/live`);
    await runTransactionRtdb(liveRef, (currentData) => {
      if (!currentData) return currentData;
      if (currentData.status !== 'bidding') return; // abort
      if (currentData.highBidderId === user.uid) return; // abort
      
      const cBid = currentData.currentBid || 0;
      const inc = cBid < 5 ? 0.20 : 0.25;
      const nAmount = cBid === 0 ? IPL_PLAYERS.find(p => p.id === currentData.playerId)?.basePrice || 0 : cBid + inc;
      
      if (team.budgetRemaining < nAmount) return; // abort

      finalAmount = nAmount;
      currentData.currentBid = nAmount;
      currentData.highBidderId = user.uid;
      currentData.highBidderName = user.displayName || 'Manager';
      currentData.highBidderTeamId = team.teamId;
      currentData.timerEndsAt = getSyncedTime() + (currentAuction.settings?.bidTimer || 10) * 1000;
      
      return currentData;
    });

    // Add to messages collection for chronological sorting
    const msgRef = ref(rtdb, `auctions/${currentAuction.id}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `New bid: ₹${finalAmount.toFixed(2)} Cr by ${user.displayName || 'Manager'} (${team.teamId})`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [currentAuction, user, team]);

  const updatePlayerTeam = useCallback(async (roomId, userId, newTeamId) => {
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    
    const data = rtdbRoomSnap.val();
    const teamDetails = TEAMS.find(t => t.id === newTeamId);
    
    const updatedPlayers = (data.players || []).map(p => 
      p.id === userId ? { ...p, team: newTeamId, teamName: teamDetails?.name || 'Unknown' } : p
    );
    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });

    // Update RTDB team node (0 Firestore cost in lobby!)
    const rtdbTeamSnap = await get(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`));
    if (rtdbTeamSnap.exists()) {
      await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`), {
        teamId: newTeamId,
        teamName: teamDetails?.name || 'Unknown'
      });
    } else {
      const teamDataToSet = {
        auctionId: roomId,
        userId: userId,
        teamId: newTeamId,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: data.settings?.budget || 120.0,
        spent: 0,
        squad: []
      };
      await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`), teamDataToSet);
    }
  }, []);
  
  const updateRoomSettings = useCallback(async (roomId, settings) => {
    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { settings });
  }, []);

  const pauseAuction = useCallback(async (roomId) => {
    if (!user || !currentAuction || currentAuction.hostId !== user.uid) return;

    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    
    // Fire both writes in parallel — no Firestore read needed
    await Promise.all([
      updateRtdb(liveRef, { status: 'paused' }),
      push(msgRef, {
        userId: 'system',
        userName: 'System',
        text: `Auction PAUSED by Admin`,
        type: 'log',
        timestamp: serverTimestampRtdb()
      })
    ]);
  }, [user, currentAuction]);

  const resumeAuction = useCallback(async (roomId) => {
    if (!user || !currentAuction || currentAuction.hostId !== user.uid) return;
    
    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    
    // Use cached settings — no Firestore read needed
    await Promise.all([
      updateRtdb(liveRef, { 
        status: 'bidding',
        timerEndsAt: getSyncedTime() + (currentAuction.settings?.bidTimer || 10) * 1000
      }),
      push(msgRef, {
        userId: 'system',
        userName: 'System',
        text: `Auction RESUMED by Admin`,
        type: 'log',
        timestamp: serverTimestampRtdb()
      })
    ]);
  }, [getSyncedTime, user, currentAuction]);

  const endAuction = useCallback(async (roomId) => {
    if (!user || !currentAuction || currentAuction.hostId !== user.uid) return;

    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { status: 'completed' });
    await flushAuctionToFirestore(roomId);
    await push(ref(rtdb, `auctions/${roomId}/messages`), {
      userId: 'system',
      userName: 'System',
      text: `Auction COMPLETED by Admin`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [user, currentAuction, flushAuctionToFirestore]);

  // ─── Bot Management & Bidding Engine ───
  const placeBotBid = useCallback(async (roomId, botUserId, botTeamId, botName, amount) => {
    if (!roomId) return;
    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    let finalAmount = amount;

    await runTransactionRtdb(liveRef, (currentData) => {
      if (!currentData) return currentData;
      if (currentData.status !== 'bidding') return; // abort
      if (currentData.highBidderId === botUserId) return; // abort
      
      const cBid = currentData.currentBid || 0;
      const inc = cBid < 5 ? 0.20 : 0.25;
      const nAmount = cBid === 0 ? IPL_PLAYERS.find(p => p.id === currentData.playerId)?.basePrice || 0 : cBid + inc;

      finalAmount = nAmount;
      currentData.currentBid = nAmount;
      currentData.highBidderId = botUserId;
      currentData.highBidderName = botName;
      currentData.highBidderTeamId = botTeamId;
      currentData.timerEndsAt = getSyncedTime() + 10000;
      
      return currentData;
    });

    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `New bid: ₹${finalAmount.toFixed(2)} Cr by ${botName} (${botTeamId})`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [getSyncedTime]);

  const addBotTeam = useCallback(async (roomId, teamId) => {
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    const data = rtdbRoomSnap.val();
    const teamDetails = TEAMS.find(t => t.id === teamId);
    if (!teamDetails) return;

    const botUserId = `bot_${teamId}`;
    const botName = `${teamDetails.name} Bot`;

    const existingPlayers = data.players || [];
    if (existingPlayers.some(p => p.id === botUserId || p.team === teamId)) return;

    const updatedPlayers = [...existingPlayers, {
      id: botUserId,
      name: botName,
      team: teamId,
      teamName: teamDetails.name,
      isHost: false,
      isBot: true
    }];

    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });

    const teamDataToSet = {
      auctionId: roomId,
      userId: botUserId,
      teamId,
      teamName: teamDetails.name,
      budgetRemaining: data.settings?.budget || 120.0,
      spent: 0,
      squad: []
    };
    await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${botUserId}`), teamDataToSet);
  }, []);

  const removeBotTeam = useCallback(async (roomId, botUserId) => {
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    const data = rtdbRoomSnap.val();

    const updatedPlayers = (data.players || []).filter(p => p.id !== botUserId);
    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });
    await set(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${botUserId}`), null);
  }, []);

  const fillEmptyTeamsWithBots = useCallback(async (roomId) => {
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    const data = rtdbRoomSnap.val();

    const existingPlayers = data.players || [];
    const takenTeamIds = new Set(existingPlayers.map(p => p.team).filter(Boolean));

    const updatedPlayers = [...existingPlayers];
    const teamsToSet = {};

    TEAMS.forEach(t => {
      if (!takenTeamIds.has(t.id)) {
        const botUserId = `bot_${t.id}`;
        const botName = `${t.name} Bot`;
        updatedPlayers.push({
          id: botUserId,
          name: botName,
          team: t.id,
          teamName: t.name,
          isHost: false,
          isBot: true
        });
        teamsToSet[`${roomId}_${botUserId}`] = {
          auctionId: roomId,
          userId: botUserId,
          teamId: t.id,
          teamName: t.name,
          budgetRemaining: data.settings?.budget || 120.0,
          spent: 0,
          squad: []
        };
      }
    });

    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });
    if (Object.keys(teamsToSet).length > 0) {
      await updateRtdb(ref(rtdb, `auctions/${roomId}/teams`), teamsToSet);
    }
  }, []);

  // Host Bidding Bot Loop Effect
  useEffect(() => {
    if (!currentAuction || !user || currentAuction.hostId !== user.uid) return;
    if (currentAuction.currentAuction?.status !== 'bidding') return;

    const botPlayers = (currentAuction.players || []).filter(p => p.isBot || p.id.startsWith('bot_'));
    if (botPlayers.length === 0) return;

    const live = currentAuction.currentAuction;
    if (!live || live.status !== 'bidding') return;

    const player = IPL_PLAYERS.find(p => p.id === live.playerId);
    if (!player) return;

    const now = getSyncedTime();
    const timerSec = currentAuction.settings?.bidTimer || 10;
    const timerMs = timerSec * 1000;
    const remainingMs = Math.max(0, (live.timerEndsAt || 0) - now);
    const cBid = live.currentBid || 0;

    // ─── Timer-Adaptive & Mixed Pacing Engine ───
    // Dynamically scales to host's timer setting (5s, 10s, 15s, 20s)
    let delayMs = 400;
    const randMode = Math.random();

    if (cBid < 3.0) {
      // Early Price Stage: 70% rapid impulse, 30% mid-timer hesitation
      if (randMode < 0.70) {
        delayMs = Math.min(900, timerMs * (0.05 + Math.random() * 0.10));
      } else {
        delayMs = timerMs * (0.25 + Math.random() * 0.25);
      }
    } else {
      // High Price / Intense Stage: Mixed blend (Impulse vs Mid-Timer vs Clutch Sniping)
      if (randMode < 0.35) {
        // Instant Impulse Reaction
        delayMs = Math.min(1000, timerMs * (0.08 + Math.random() * 0.12));
      } else if (randMode < 0.70) {
        // Mid-Timer Re-evaluation
        delayMs = timerMs * (0.30 + Math.random() * 0.25);
      } else {
        // Late Clutch Sniping (Target final 15% - 30% of countdown)
        const targetRemainMs = timerMs * (0.15 + Math.random() * 0.15);
        if (remainingMs > targetRemainMs) {
          delayMs = remainingMs - targetRemainMs;
        } else {
          delayMs = 500 + Math.random() * 500;
        }
      }
    }

    // Ensure delay is bounded safely between 350ms and remainingMs - 300ms
    delayMs = Math.max(350, Math.min(delayMs, Math.max(350, remainingMs - 300)));

    const timer = setTimeout(async () => {
      // Pick suitable bot team that is not the current high bidder
      const eligibleBots = shuffleArray(botPlayers.filter(p => p.id !== live.highBidderId));
      for (const botP of eligibleBots) {
        const botTeam = roomTeams.find(t => t.userId === botP.id);
        if (!botTeam) continue;

        const bidDecision = evaluateBotBid({
          player,
          currentBid: live.currentBid || 0,
          highBidderId: live.highBidderId,
          botTeam,
          squadLimit: currentAuction.squadLimit || 25,
          overseasLimit: currentAuction.overseasLimit || 8
        });

        if (bidDecision && bidDecision.shouldBid) {
          try {
            await placeBotBid(currentAuction.id, botP.id, botP.team, botP.name, bidDecision.nextBid);
          } catch (e) {
            // Graceful bot bid fail
          }
          break; // 1 bid per delay tick
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [currentAuction, user, roomTeams, placeBotBid, getSyncedTime]);

  const value = {
    currentAuction,
    team,
    roomTeams,
    loading,
    createRoom,
    joinRoomDb,
    kickPlayer,
    joinAuction,
    placeBid,
    updatePlayerTeam,
    updateRoomSettings,
    startAuction,
    endPlayerAuction,
    pauseAuction,
    resumeAuction,
    endAuction,
    sendMessage,
    messages,
    addBotTeam,
    removeBotTeam,
    fillEmptyTeamsWithBots,
    getSyncedTime
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
};