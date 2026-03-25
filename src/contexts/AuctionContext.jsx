import React, { createContext, useContext, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { IPL_PLAYERS } from '../data/players';
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
      playerOrder: randomizedIndices,
      currentAuction: {
        playerId: IPL_PLAYERS[randomizedIndices[0]].id,
        currentBid: 0,
        highBidderId: '',
        highBidderName: 'No Bids',
        timerEndsAt: Date.now() + 15000,
        status: 'bidding'
      },
      logs: arrayUnion(`Auction has started!`)
    });
    
    // Add to messages collection for chronological sorting
    const msgRef = collection(db, 'auctions', roomId, 'messages');
    await addDoc(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction has started!`,
      type: 'log',
      timestamp: serverTimestamp()
    });
  }, []);

  const endPlayerAuction = useCallback(async (roomId) => {
    try {
      const roomRef = doc(db, 'auctions', roomId);
      
      const result = await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return null;
        
        const data = roomSnap.data();
        const { currentAuction, playerOrder } = data;
        
        // Race condition guard
        if (currentAuction.status === 'sold' || currentAuction.status === 'unsold') {
          return null; 
        }

        const isSold = !!currentAuction.highBidderId;
        const player = IPL_PLAYERS.find(p => p.id === currentAuction.playerId);
        const teamDetails = TEAMS.find(t => t.id === currentAuction.highBidderTeamId);

        const status = isSold ? 'sold' : 'unsold';
        const logText = `${player.name} ${isSold ? `SOLD to ${teamDetails?.name || currentAuction.highBidderName} for ₹${currentAuction.currentBid} Cr` : 'UNSOLD'}`;

        // Prepare updates
        const nextData = {
          ...data,
          'currentAuction.status': status,
          logs: [...(data.logs || []), logText]
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
          'currentAuction.status': status,
          logs: nextData.logs,
          players: nextData.players || data.players
        });

        return { isSold, logText, currentAuction, playerOrder, settings: data.settings };
      });

      if (!result) return;

      // System Log Message
      const msgRef = collection(db, 'auctions', roomId, 'messages');
      await addDoc(msgRef, {
        userId: 'system',
        userName: 'System',
        text: result.logText,
        type: 'log',
        timestamp: serverTimestamp()
      });

      const waitTime = result.isSold ? 5000 : 2000;
      
      setTimeout(async () => {
        const checkSnap = await getDoc(roomRef);
        if (!checkSnap.exists() || checkSnap.data().status !== 'active') return;

        const { currentAuction, playerOrder, settings } = checkSnap.data();
        const currentPlayerId = result.currentAuction.playerId;
        const order = playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
        const currentPlayerIndexInOrder = order.findIndex(idx => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === currentPlayerId);
        const nextIndexInOrder = order[currentPlayerIndexInOrder + 1];
        
        if (nextIndexInOrder !== undefined) {
          const nextPlayer = IPL_PLAYERS[nextIndexInOrder];
          await updateDoc(roomRef, {
            currentAuction: {
              playerId: nextPlayer.id,
              currentBid: 0,
              highBidderId: '',
              highBidderName: 'No Bids',
              timerEndsAt: Date.now() + (settings?.bidTimer || 10) * 1000,
              status: 'bidding'
            }
          });
        } else {
          await updateDoc(roomRef, { status: 'completed' });
        }
      }, waitTime);
    } catch (err) {
      console.error("Error in endPlayerAuction:", err);
    }
  }, []);
  // Join an existing room in DB
  const joinRoomDb = useCallback(async (roomId, userId, playerDetails) => {
    const roomRef = doc(db, 'auctions', roomId);
    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);
    
    // Fetch current players to prevent duplicates and preserve host status
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    
    const data = roomSnap.data();
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
        logs: arrayUnion(`${playerObj.name} has been removed from the session by Admin.`)
      });

      // 2. Add to messages collection
      const msgRef = collection(db, 'auctions', roomId, 'messages');
      await addDoc(msgRef, {
        userId: 'system',
        userName: 'System',
        text: `${playerObj.name} has been removed from the session.`,
        type: 'log',
        timestamp: serverTimestamp()
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

    const unsubAuction = onSnapshot(doc(db, 'auctions', auctionId), (snapshot) => {
      auctionLoaded = true;
      if (snapshot.exists()) {
        setCurrentAuction({ id: snapshot.id, ...snapshot.data() });
      }
      checkLoaded();
    }, (error) => {
      console.error("Auction snapshot error:", error);
      setLoading(false);
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

    const unsubMessages = onSnapshot(query(collection(db, 'auctions', auctionId, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      messagesLoaded = true;
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      checkLoaded();
    }, (error) => {
      console.error("Messages snapshot error:", error);
      setLoading(false);
    });

    return () => {
      clearTimeout(loadTimeout);
      unsubAuction();
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
    const msgRef = collection(db, 'auctions', roomId, 'messages');
    await addDoc(msgRef, {
      userId: user.uid,
      userName: user.displayName || 'Manager',
      text,
      type,
      timestamp: serverTimestamp()
    });
  }, [user]);

  const placeBid = useCallback(async (amount) => {
    if (!currentAuction) throw new Error("Auction not found!");
    if (!user) throw new Error("Please log in to bid!");
    if (!team) throw new Error("You must select a team in the lobby to participate!");
    if (currentAuction.currentAuction?.status !== 'bidding') throw new Error("Auction is not accepting bids right now.");
    if (currentAuction.currentAuction?.highBidderId === user.uid) throw new Error("You are already the highest bidder!");
    
    const auctionDoc = doc(db, 'auctions', currentAuction.id);
    
    if (team.budgetRemaining < amount) {
      throw new Error(`Insufficient budget! You need ₹${amount.toFixed(2)} Cr but only have ₹${team.budgetRemaining.toFixed(2)} Cr remaining.`);
    }

    await updateDoc(auctionDoc, {
      'currentAuction.currentBid': amount,
      'currentAuction.highBidderId': user.uid,
      'currentAuction.highBidderName': user.displayName || 'Manager',
      'currentAuction.highBidderTeamId': team.teamId, // Store team ID directly
      'currentAuction.timerEndsAt': Date.now() + (currentAuction?.settings?.bidTimer || 10) * 1000,
      logs: arrayUnion(`New bid: ₹${amount.toFixed(2)} Cr by ${user.displayName || 'Manager'}`)
    });

    // Add to messages collection for chronological sorting
    const msgRef = collection(db, 'auctions', currentAuction.id, 'messages');
    await addDoc(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `New bid: ₹${amount.toFixed(2)} Cr by ${user.displayName || 'Manager'} (${team.teamId})`,
      type: 'log',
      timestamp: serverTimestamp()
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
    const roomRef = doc(db, 'auctions', roomId);
    await updateDoc(roomRef, { 
      'currentAuction.status': 'paused',
      logs: arrayUnion(`Auction PAUSED by Admin`)
    });
    
    // Add to messages collection for chronological sorting
    const msgRef = collection(db, 'auctions', roomId, 'messages');
    await addDoc(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction PAUSED by Admin`,
      type: 'log',
      timestamp: serverTimestamp()
    });
  }, []);

  const resumeAuction = useCallback(async (roomId) => {
    const roomRef = doc(db, 'auctions', roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const data = roomSnap.data();
    
    await updateDoc(roomRef, { 
      'currentAuction.status': 'bidding',
      'currentAuction.timerEndsAt': Date.now() + (data.settings?.bidTimer || 10) * 1000,
      logs: arrayUnion(`Auction RESUMED by Admin`)
    });

    // Add to messages collection for chronological sorting
    const msgRef = collection(db, 'auctions', roomId, 'messages');
    await addDoc(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction RESUMED by Admin`,
      type: 'log',
      timestamp: serverTimestamp()
    });
  }, []);

  const endAuction = useCallback(async (roomId) => {
    const roomRef = doc(db, 'auctions', roomId);
    await updateDoc(roomRef, { 
      status: 'completed',
      logs: arrayUnion(`Auction COMPLETED by Admin`)
    });

    // Add to messages collection for chronological sorting
    const msgRef = collection(db, 'auctions', roomId, 'messages');
    await addDoc(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction COMPLETED by Admin`,
      type: 'log',
      timestamp: serverTimestamp()
    });
  }, []);

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
    messages
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
};