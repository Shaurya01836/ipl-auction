import React, { createContext, useContext, useState, useCallback } from 'react';
import { db, getServerTime, rtdb } from '../lib/firebase';
import { IPL_PLAYERS } from '../data/players';
import { 
  ref, 
  set, 
  get, 
  update as updateRtdb, 
  onValue, 
  runTransaction as runTransactionRtdb,
  push,
  serverTimestamp as serverTimestampRtdb
} from 'firebase/database';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  getDoc,
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

  // Server-authoritative time using Firebase RTDB offset.
  // getServerTime() returns Date.now() + serverOffset, synced across all clients.
  const getSyncedTime = useCallback(() => {
    return getServerTime();
  }, []);

  // Create a new room in DB
  const createRoom = useCallback(async (roomId, userId, playerDetails) => {
    const roomRef = doc(db, 'auctions', roomId);
    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);
    
    await setDoc(roomRef, {
      hostId: userId,
      status: 'waiting',
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
        bidTimer: 10 // Default 10s
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
        budgetRemaining: 120.0,
        spent: 0,
        squad: []
      });
    }

    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    await set(liveRef, { status: 'waiting' });
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
    try {
      const roomRef = doc(db, 'auctions', roomId);
      const liveRef = ref(rtdb, `auctions/${roomId}/live`);
      
      const liveSnap = await get(liveRef);
      if (!liveSnap.exists()) return;
      const currentAuction = liveSnap.val();
      
      // Race condition guard
      if (currentAuction.status === 'sold' || currentAuction.status === 'unsold') {
        return; 
      }

      const isSold = !!currentAuction.highBidderId;
      const status = isSold ? 'sold' : 'unsold';
      await updateRtdb(liveRef, { status });

      const result = await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return null;
        
        const data = roomSnap.data();
        const { playerOrder } = data;

        const player = IPL_PLAYERS.find(p => p.id === currentAuction.playerId);
        const teamDetails = TEAMS.find(t => t.id === currentAuction.highBidderTeamId);

        const logText = `${player.name} ${isSold ? `SOLD to ${teamDetails?.name || currentAuction.highBidderName} for ₹${currentAuction.currentBid} Cr` : 'UNSOLD'}`;

        // Prepare updates
        const nextData = {
          ...data
        };

        if (isSold) {
          const teamRef = doc(db, 'teams', `${roomId}_${currentAuction.highBidderId}`);
          const teamSnap = await transaction.get(teamRef);
          
          if (teamSnap.exists()) {
            const teamData = teamSnap.data();
            transaction.update(teamRef, {
              budgetRemaining: teamData.budgetRemaining - currentAuction.currentBid,
              squad: [...(teamData.squad || []), { id: currentAuction.playerId, bid: currentAuction.currentBid }]
            });

            // Also update the players array in the room
            nextData.players = data.players.map(p => {
              if (p.id === currentAuction.highBidderId) {
                return { 
                  ...p, 
                  spent: (p.spent || 0) + currentAuction.currentBid, 
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

        return { isSold, logText, currentAuction, playerOrder, settings: data.settings };
      });

      if (!result) return;

      // System Log Message
      const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
      await push(msgRef, {
        userId: 'system',
        userName: 'System',
        text: result.logText,
        type: result.isSold ? 'sold_card' : 'log',
        metadata: result.isSold ? {
          playerId: result.currentAuction.playerId,
          teamId: result.currentAuction.highBidderTeamId,
          bid: result.currentAuction.currentBid,
          buyerId: result.currentAuction.highBidderId,
          buyerName: result.currentAuction.highBidderName
        } : null,
        timestamp: serverTimestampRtdb()
      });

      const waitTime = result.isSold ? 5000 : 2000;
      
      setTimeout(async () => {
        const checkSnap = await getDoc(roomRef);
        if (!checkSnap.exists() || checkSnap.data().status !== 'active') return;

        const { playerOrder, settings } = checkSnap.data();
        const currentPlayerId = result.currentAuction.playerId;
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
          await updateDoc(roomRef, { status: 'completed' });
        }
      }, waitTime);
    } catch (err) {
      console.error("Error in endPlayerAuction:", err);
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
      name: playerDetails.name,
      team: playerDetails.team,
      teamName: teamDetails?.name || 'Unknown',
      isHost: playerExists ? playerExists.isHost : false
    };

    const updatedPlayers = existingPlayers.filter(p => p.id !== userId);
    updatedPlayers.push(updatedPlayer);

    await updateDoc(roomRef, { players: updatedPlayers });

    // Create/Update the teams document if team is provided
    if (playerDetails.team) {
      const teamRef = doc(db, 'teams', `${roomId}_${userId}`);
      await setDoc(teamRef, {
        auctionId: roomId,
        userId: userId,
        teamId: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: 120.0,
        spent: 0,
        squad: []
      }, { merge: true });
    }
  }, []);

  // Kick a player from the room
  const kickPlayer = useCallback(async (roomId, playerObj) => {
    try {
      const roomRef = doc(db, 'auctions', roomId);
      const teamRef = doc(db, 'teams', `${roomId}_${playerObj.id}`);
      
      // 1. Remove from players array in room
      await updateDoc(roomRef, {
        players: arrayRemove(playerObj),
        bannedPlayers: arrayUnion(playerObj.id)
      });

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
    } catch (err) {
      console.error("Error kicking player:", err);
    }
  }, []);

  // Listen to current auction state live
  const joinAuction = useCallback((auctionId, userId) => {
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

    let currentFirestoreData = null;
    let currentRtdbData = null;

    const checkAndSet = () => {
      if (currentFirestoreData) {
        setCurrentAuction({ 
          id: auctionId, 
          ...currentFirestoreData,
          currentAuction: currentRtdbData || currentFirestoreData.currentAuction
        });
      }
    };

    const unsubAuction = onSnapshot(doc(db, 'auctions', auctionId), (snapshot) => {
      auctionLoaded = true;
      if (snapshot.exists()) {
        currentFirestoreData = snapshot.data();
        checkAndSet();
      }
      checkLoaded();
    }, (error) => {
      console.error("Auction snapshot error:", error);
      setLoading(false);
    });

    const unsubLive = onValue(ref(rtdb, `auctions/${auctionId}/live`), (snapshot) => {
      currentRtdbData = snapshot.val();
      checkAndSet();
    });

    const teamsQuery = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
    const unsubTeams = onSnapshot(teamsQuery, (snapshot) => {
      teamsLoaded = true;
      const teamsArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoomTeams(teamsArr);
      
      if (userId) {
        const myTeam = teamsArr.find(t => t.id === `${auctionId}_${userId}`);
        if (myTeam) setTeam(myTeam);
        else setTeam(null); // Explicitly clear if not found
      }
      checkLoaded();
    }, (error) => {
      console.error("Teams snapshot error:", error);
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
      unsubAuction();
      unsubLive();
      unsubTeams();
      unsubMessages();
      setCurrentAuction(null);
      setTeam(null);
      setRoomTeams([]);
      setMessages([]);
    };
  }, []);

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
    if (currentAuction.currentAuction?.status !== 'bidding') throw new Error("Auction is not accepting bids right now.");
    if (currentAuction.currentAuction?.highBidderId === user.uid) throw new Error("You are already the highest bidder!");
    
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

      // Create/Update the teams document for the user
      const teamRef = doc(db, 'teams', `${roomId}_${userId}`);
      await setDoc(teamRef, {
        auctionId: roomId,
        userId: userId,
        teamId: newTeamId,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: 120.0,
        spent: 0,
        squad: []
      }, { merge: true });
    }
  }, []);
  
  const updateRoomSettings = useCallback(async (roomId, settings) => {
    const roomRef = doc(db, 'auctions', roomId);
    await updateDoc(roomRef, { settings });
  }, []);

  const pauseAuction = useCallback(async (roomId) => {
    if (!user) return;
    const roomRef = doc(db, 'auctions', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists() || roomSnap.data().hostId !== user.uid) return;

    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    await updateRtdb(liveRef, { status: 'paused' });
    
    // Add to messages collection for chronological sorting
    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction PAUSED by Admin`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [user]);

  const resumeAuction = useCallback(async (roomId) => {
    if (!user) return;
    const roomRef = doc(db, 'auctions', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists() || roomSnap.data().hostId !== user.uid) return;
    const data = roomSnap.data();
    
    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    await updateRtdb(liveRef, { 
      status: 'bidding',
      timerEndsAt: getSyncedTime() + (data.settings?.bidTimer || 10) * 1000
    });

    // Add to messages collection for chronological sorting
    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction RESUMED by Admin`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [getSyncedTime, user]);

  const endAuction = useCallback(async (roomId) => {
    if (!user) return;
    const roomRef = doc(db, 'auctions', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists() || roomSnap.data().hostId !== user.uid) return;

    await updateDoc(roomRef, { 
      status: 'completed'
    });

    // Add to messages collection for chronological sorting
    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction COMPLETED by Admin`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [user]);

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