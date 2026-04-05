import React, { createContext, useContext, useState, useCallback } from 'react';
import { db, getServerTime, rtdb } from '../lib/firebase';
import { IPL_PLAYERS } from '../data/players';
import { 
  ref, 
  set, 
  get, 
  update as updateRtdb, 
  onValue, 
  onDisconnect,
  runTransaction as runTransactionRtdb,
  push,
  serverTimestamp as serverTimestampRtdb
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
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

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

  // Create a new room in DB
  const createRoom = useCallback(async (roomId, userId, playerDetails, auctionType = 'mega') => {
    const roomRef = doc(db, 'auctions', roomId);
    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);
    
    // Mode-specific configurations
    const isSprint5 = auctionType === 'sprint5';
    const isSprint11 = auctionType === 'sprint11';
    
    const budget = isSprint5 ? 60.0 : isSprint11 ? 90.0 : 120.0;
    const squadLimit = isSprint5 ? 5 : isSprint11 ? 11 : 25;
    const overseasLimit = isSprint5 ? 2 : isSprint11 ? 4 : 8;
    
    await setDoc(roomRef, {
      hostId: userId,
      status: 'waiting',
      auctionType,
      squadLimit,
      overseasLimit,
      createdAt: serverTimestamp(),
      players: [{
        id: userId,
        name: playerDetails.name,
        team: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        isHost: true
      }],
      bannedPlayers: [],
      currentAuction: null,
      logs: [],
      settings: {
        bidTimer: 10, // Default 10s
        budget
      }
    });

    // Create the teams document for the host
    if (playerDetails.team) {
      const teamRef = doc(db, 'teams', `${roomId}_${userId}`);
      await setDoc(teamRef, {
        auctionId: roomId,
        userId: userId,
        teamId: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: budget,
        spent: 0,
        squad: [],
        createdAt: serverTimestamp()
      });
    }

    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    await set(liveRef, { status: 'waiting' });

    // Sync to RTDB for real-time reads
    const rtdbRoomRef = ref(rtdb, `auctions/${roomId}/room`);
    await set(rtdbRoomRef, {
      hostId: userId,
      status: 'waiting',
      auctionType,
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
  }, []);
  
  const startAuction = useCallback(async (roomId) => {
    const roomRef = doc(db, 'auctions', roomId);
    
    // Generate randomized order within sets
    const sets = [...new Set(IPL_PLAYERS.map(p => p.set))];
    let randomizedIndices = [];
    sets.forEach(setName => {
      const setIndices = IPL_PLAYERS.map((p, i) => p.set === setName ? i : -1).filter(i => i !== -1);
      randomizedIndices = [...randomizedIndices, ...shuffleArray(setIndices)];
    });

    await updateDoc(roomRef, { 
      status: 'active',
      playerOrder: randomizedIndices
    });

    const rtdbRoomRef = ref(rtdb, `auctions/${roomId}/room`);
    await updateRtdb(rtdbRoomRef, {
      status: 'active',
      playerOrder: randomizedIndices
    });

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

      // Firestore transaction for squad/budget updates
      const roomRef = doc(db, 'auctions', roomId);
      const result = await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return null;
        
        const data = roomSnap.data();
        const { playerOrder } = data;

        const player = IPL_PLAYERS.find(p => p.id === auctionState.playerId);
        const teamDetails = TEAMS.find(t => t.id === auctionState.highBidderTeamId);

        const logText = `${player.name} ${isSold ? `SOLD to ${teamDetails?.name || auctionState.highBidderName} for ₹${auctionState.currentBid} Cr` : 'UNSOLD'}`;

        const nextData = { ...data };
        let newTeamData = null;

        if (isSold) {
          const teamRef = doc(db, 'teams', `${roomId}_${auctionState.highBidderId}`);
          const teamSnap = await transaction.get(teamRef);
          
          if (teamSnap.exists()) {
            const teamData = teamSnap.data();
            newTeamData = {
              budgetRemaining: teamData.budgetRemaining - auctionState.currentBid,
              squad: [...(teamData.squad || []), { id: auctionState.playerId, bid: auctionState.currentBid }]
            };
            transaction.update(teamRef, newTeamData);

            nextData.players = data.players.map(p => {
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
        }

        transaction.update(roomRef, {
          players: nextData.players || data.players
        });

        return { 
          isSold, 
          logText, 
          auctionState, 
          playerOrder, 
          settings: data.settings,
          roomStatus: data.status,
          players: nextData.players || data.players,
          teamDocId: isSold ? `${roomId}_${auctionState.highBidderId}` : null,
          newTeamData
        };
      });

      if (!result) {
        endingPlayerRef.current = false;
        return;
      }

      // Sync to RTDB in parallel for speed
      const syncPromises = [];
      syncPromises.push(updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: result.players }));
      if (result.isSold && result.teamDocId && result.newTeamData) {
        syncPromises.push(updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${result.teamDocId}`), result.newTeamData));
      }
      syncPromises.push(push(ref(rtdb, `auctions/${roomId}/messages`), {
        userId: 'system',
        userName: 'System',
        text: result.logText,
        type: result.isSold ? 'sold_card' : 'log',
        metadata: result.isSold ? {
          playerId: result.auctionState.playerId,
          teamId: result.auctionState.highBidderTeamId,
          bid: result.auctionState.currentBid,
          buyerId: result.auctionState.highBidderId,
          buyerName: result.auctionState.highBidderName
        } : null,
        timestamp: serverTimestampRtdb()
      }));
      await Promise.all(syncPromises);

      const waitTime = result.isSold ? 5000 : 2000;
      
      // Use cached playerOrder & settings from the transaction — no extra getDoc!
      setTimeout(async () => {
        if (result.roomStatus !== 'active') return;

        const { playerOrder, settings } = result;
        const currentPlayerId = result.auctionState.playerId;
        const order = playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
        const currentPlayerIndexInOrder = order.findIndex(idx => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === currentPlayerId);
        const nextIndexInOrder = order[currentPlayerIndexInOrder + 1];
        
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
          const roomRef2 = doc(db, 'auctions', roomId);
          await updateDoc(roomRef2, { status: 'completed' });
          await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { status: 'completed' });
        }
        endingPlayerRef.current = false;
      }, waitTime);
    } catch (err) {
      console.error("Error in endPlayerAuction:", err);
      endingPlayerRef.current = false;
    }
  }, [getSyncedTime]);

  const joinRoomDb = useCallback(async (roomId, userId, playerDetails) => {
    const roomRef = doc(db, 'auctions', roomId);
    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);
    
    // Fetch current players to prevent duplicates and preserve host status
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found!");
    
    const data = roomSnap.data();

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

    await updateDoc(roomRef, { players: updatedPlayers });
    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });

    // Create/Update the teams document if team is provided
    if (playerDetails.team) {
      const teamRef = doc(db, 'teams', `${roomId}_${userId}`);
      const teamDataToSet = {
        auctionId: roomId,
        userId: userId,
        teamId: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: data.settings?.budget || 120.0,
        spent: 0,
        squad: [],
        createdAt: serverTimestamp()
      };
      await setDoc(teamRef, teamDataToSet, { merge: true });
      await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`), teamDataToSet);
    }
  }, []);

  // Kick a player from the room
  const kickPlayer = useCallback(async (roomId, playerObj) => {
    try {
      const roomRef = doc(db, 'auctions', roomId);
      const teamRef = doc(db, 'teams', `${roomId}_${playerObj.id}`);
      
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const data = roomSnap.data();

      // 1. Filter out the player and add to banned list
      const updatedPlayers = (data.players || []).filter(p => p.id !== playerObj.id);
      const updatedBanned = [...(data.bannedPlayers || []), playerObj.id];

      await updateDoc(roomRef, {
        players: updatedPlayers,
        bannedPlayers: updatedBanned
      });

      // 2. Update RTDB
      await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { 
        players: updatedPlayers,
        bannedPlayers: updatedBanned 
      });

      // 3. Delete team document if exists
      try {
        await deleteDoc(teamRef);
      } catch (err) {
        console.warn("Could not delete team doc (might not exist):", err);
      }

      // 2. Add to messages collection
      const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
      await push(msgRef, {
        userId: 'system',
        userName: 'System',
        text: `${playerObj.name} has been removed from the session.`,
        type: 'log',
        timestamp: serverTimestampRtdb()
      });

      // 3. Delete their team document to free up the franchise
      await deleteDoc(teamRef);
      await set(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${playerObj.id}`), null);
    } catch (err) {
      console.error("Error kicking player:", err);
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

    const unsubAuction = onValue(ref(rtdb, `auctions/${auctionId}/room`), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // PROACTIVE BAN CHECK: Kick user if they are banned
        if (data.bannedPlayers && data.bannedPlayers.includes(userId)) {
           window.location.href = '/?error=kicked';
           return;
        }

        auctionLoaded = true;
        currentRoomData = data;
        checkAndSet();
        checkLoaded();
      } else if (!didFallbackFetch) {
        didFallbackFetch = true;
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
        } catch(e) { console.error("Fallback room fetch fail", e); }
      }
    }, (error) => {
      console.error("Auction RTDB error:", error);
      setLoading(false);
    });

    const unsubLive = onValue(ref(rtdb, `auctions/${auctionId}/live`), (snapshot) => {
      currentRtdbData = snapshot.val();
      checkAndSet();
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
        } catch(e) { console.error("Fallback teams fetch fail", e); }
      }
    }, (error) => {
      console.error("Teams RTDB error:", error);
      setLoading(false);
    });

    const unsubMessages = onValue(ref(rtdb, `auctions/${auctionId}/messages`), (snapshot) => {
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
      console.error("Messages snapshot error:", error);
      setLoading(false);
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
    const roomRef = doc(db, 'auctions', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      const data = roomSnap.data();
      const teamDetails = TEAMS.find(t => t.id === newTeamId);
      const updatedPlayers = data.players.map(p => 
        p.id === userId ? { ...p, team: newTeamId, teamName: teamDetails?.name || 'Unknown' } : p
      );
      await updateDoc(roomRef, { players: updatedPlayers });
      await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });

      // Create/Update the teams document for the user
      const teamRef = doc(db, 'teams', `${roomId}_${userId}`);
      const teamDataToSet = {
        auctionId: roomId,
        userId: userId,
        teamId: newTeamId,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: roomSnap.data().settings?.budget || 120.0,
        spent: 0,
        squad: []
      };
      await setDoc(teamRef, teamDataToSet, { merge: true });
      await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`), teamDataToSet);
    }
  }, []);
  
  const updateRoomSettings = useCallback(async (roomId, settings) => {
    const roomRef = doc(db, 'auctions', roomId);
    await updateDoc(roomRef, { settings });
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

    const roomRef = doc(db, 'auctions', roomId);
    
    // Fire all three writes in parallel
    await Promise.all([
      updateDoc(roomRef, { status: 'completed' }),
      updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { status: 'completed' }),
      push(ref(rtdb, `auctions/${roomId}/messages`), {
        userId: 'system',
        userName: 'System',
        text: `Auction COMPLETED by Admin`,
        type: 'log',
        timestamp: serverTimestampRtdb()
      })
    ]);
  }, [user, currentAuction]);

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
    getSyncedTime
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
};