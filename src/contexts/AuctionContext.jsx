import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  db,
  getActiveServer,
  getServerTime,
  goOfflineServer,
  goOnlineServer,
  isServerAvailable,
  rtdb,
  waitForServerConnection,
} from '../lib/firebase';
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
  getDoc,
  getDocs,
  collection,
  query,
  where
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useQuota } from './QuotaContext';
import { useConnectionAlert } from './ConnectionAlertContext';
import { shouldReportConnectionTrouble } from '../lib/connectionAlerts';
import { countOverseas, isOverseasPlayer, toFiniteNumber } from '../lib/auctionDisplay';
import {
  DEFAULT_AUCTION_SERVER,
  PRIMARY_SERVER,
  SECONDARY_SERVER,
  getAuctionServer,
  getServerMeta,
  normalizeServer,
  withServerParam,
} from '../lib/auctionServers';
import {
  fetchAuctionRecord,
  insertAuctionWithServer,
  upsertAuctionWithServer,
} from '../lib/auctionServerDirectory';


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

const createRoomCodeTakenError = () => {
  const error = new Error('That room code is already in use. Please try again.');
  error.code = 'ROOM_CODE_TAKEN';
  return error;
};

const mapSupabaseAuction = (sData) => ({
  id: sData.id,
  hostId: sData.host_id,
  hostName: sData.host_name,
  status: sData.status,
  auctionType: sData.auction_type || 'mega',
  isPublic: sData.is_public !== false,
  playerOrder: sData.player_order || [],
  squadLimit: toFiniteNumber(sData.squad_limit, 25),
  overseasLimit: toFiniteNumber(sData.overseas_limit, 8),
  players: sData.players || [],
  bannedPlayers: sData.banned_players || [],
  settings: sData.settings || { bidTimer: 10, budget: 120 },
  server: getAuctionServer(sData),
});

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
  const { reportConnectionTrouble, clearConnectionAlert } = useConnectionAlert();
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
  const createRoom = useCallback(async (
    roomId,
    userId,
    playerDetails,
    auctionType = 'mega',
    isPublic = true,
    server = DEFAULT_AUCTION_SERVER,
  ) => {
    const requestedServer = normalizeServer(server);

    // A full free-plan database never opens its socket. Probe the chosen server
    // first, then retry the same creation on the other configured server.
    const tryServer = async (candidate) => {
      if (!isServerAvailable(candidate)) return false;
      try {
        goOnlineServer(candidate);
        return await waitForServerConnection(rtdb, 6000);
      } catch (err) {
        console.warn(
          `[auction] Could not connect to ${getServerMeta(candidate).label}`,
          err,
        );
        return false;
      }
    };

    let actualServer = requestedServer;
    let connected = await tryServer(actualServer);

    if (!connected) {
      const fallbackServer =
        actualServer === PRIMARY_SERVER ? SECONDARY_SERVER : PRIMARY_SERVER;
      if (fallbackServer !== actualServer && (await tryServer(fallbackServer))) {
        actualServer = fallbackServer;
        connected = true;
      }
    }

    if (!connected) {
      // The last probe can switch the active binding even when it fails. Close
      // whichever server is active now, not just the originally requested one.
      goOfflineServer(getActiveServer());
      throw new Error(
        'Both auction servers are at capacity right now. Please try again in a minute.',
      );
    }

    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);
    
    // Mode-specific configurations
    const isSprint5 = auctionType === 'sprint5';
    const isSprint11 = auctionType === 'sprint11';
    
    const budget = isSprint5 ? 60.0 : isSprint11 ? 90.0 : 120.0;
    const squadLimit = isSprint5 ? 5 : isSprint11 ? 11 : 25;
    const overseasLimit = isSprint5 ? 2 : isSprint11 ? 4 : 8;
    const settings = { bidTimer: 10, budget };

    const roomData = {
      hostId: userId,
      hostName: playerDetails.name,
      status: 'waiting',
      auctionType,
      isPublic: !!isPublic,
      squadLimit,
      overseasLimit,
      server: actualServer,
      players: [{
        id: userId,
        name: playerDetails.name,
        team: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        isHost: true
      }],
      bannedPlayers: [],
      settings
    };

    // Claim the room atomically. This catches a stale room whose Supabase
    // mirror failed, and two clients racing for the same code on this server.
    // The Supabase INSERT below is the cross-server uniqueness guard.
    const rtdbRoomRef = ref(rtdb, `auctions/${roomId}/room`);
    let claim;
    try {
      claim = await runTransactionRtdb(
        rtdbRoomRef,
        (current) => (current ? undefined : roomData),
      );
    } catch (claimError) {
      goOfflineServer(actualServer);
      throw claimError;
    }
    if (!claim.committed) {
      goOfflineServer(actualServer);
      throw createRoomCodeTakenError();
    }

    try {
      const liveRef = ref(rtdb, `auctions/${roomId}/live`);
      await set(liveRef, { status: 'waiting' });

      // Instantly set host online presence in RTDB
      const hostPresenceRef = ref(rtdb, `auctions/${roomId}/presence/${userId}`);
      await set(hostPresenceRef, {
        online: true,
        lastSeen: serverTimestampRtdb()
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
    } catch (rtdbErr) {
      // Do not leave a half-created room behind on the failed server.
      try {
        await remove(ref(rtdb, `auctions/${roomId}`));
      } catch {
        // Best effort cleanup.
      }
      goOfflineServer(actualServer);
      throw rtdbErr;
    }

    // Write to Supabase (shared directory for both RTDBs, 0 Firestore cost).
    // The helper also works before the optional top-level `server` column is
    // migrated by falling back to `settings.server`.
    try {
      if (supabase) {
        // Insert, not upsert: `auctions.id` is the cross-server uniqueness
        // guard. A racing create receives 23505 instead of overwriting the
        // other room, and we clean up the losing RTDB room.
        const mirror = await insertAuctionWithServer({
          id: roomId,
          host_id: userId,
          host_name: playerDetails.name,
          host_online: true,
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
          settings
        }, actualServer);

        if (mirror.error?.code === '23505') {
          try {
            await remove(ref(rtdb, `auctions/${roomId}`));
          } catch {
            // Best effort cleanup.
          }
          goOfflineServer(actualServer);
          throw createRoomCodeTakenError();
        }

        if (mirror.error) {
          // The invite link still carries ?server=, so the room remains usable
          // even if this directory write fails.
          console.warn('[auction] Failed to mirror new room to Supabase', mirror.error);
        }

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
      if (sErr?.code === 'ROOM_CODE_TAKEN') throw sErr;
      // Non-blocking Supabase fallback: RTDB already holds the room.
      console.warn('[auction] Failed to mirror new room to Supabase', sErr);
    }

    return {
      server: actualServer,
      requestedServer,
      fellBack: actualServer !== requestedServer,
    };
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
        const server =
          roomData.server || roomData.settings?.server || getActiveServer();
        const mirror = await upsertAuctionWithServer({
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
        }, server);
        if (mirror.error) {
          console.warn('[auction] Failed to flush room to Supabase', mirror.error);
        }

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
      // Lobby sync is best-effort; Realtime Database remains the live source.
      console.warn('[auction] Failed to sync lobby teams to Supabase', err);
    }
  }, []);

  const startAuction = useCallback(async (roomId) => {
    // Fetch room data to determine auction type
    const rtdbRoomRef = ref(rtdb, `auctions/${roomId}/room`);
    const roomSnap = await get(rtdbRoomRef);
    const roomData = roomSnap.exists() ? roomSnap.val() : {};
    const auctionType = roomData.auctionType || 'mega';

    // Calculate target players
    let targetPlayers = IPL_PLAYERS.length;
    if (auctionType === 'sprint11') targetPlayers = 150;
    else if (auctionType === 'sprint5') targetPlayers = 75;

    // 1. Identify Marquee vs Non-Marquee players
    const marqueeIndices = [];
    const nonMarqueeIndicesByRole = {};
    
    IPL_PLAYERS.forEach((p, i) => {
      if (p.set.includes('Marquee')) {
        marqueeIndices.push(i);
      } else {
        if (!nonMarqueeIndicesByRole[p.role]) nonMarqueeIndicesByRole[p.role] = [];
        nonMarqueeIndicesByRole[p.role].push(i);
      }
    });

    // Always keep all Marquee players
    const selectedPlayersByRole = new Set(marqueeIndices);

    // Calculate fraction based on target players for NON-MARQUEE only
    const nonMarqueeTarget = Math.max(0, targetPlayers - marqueeIndices.length);
    const nonMarqueeTotal = IPL_PLAYERS.length - marqueeIndices.length;
    const fraction = nonMarqueeTotal > 0 ? (nonMarqueeTarget / nonMarqueeTotal) : 1;

    // 2. Select NON-MARQUEE players proportionally by ROLE
    Object.keys(nonMarqueeIndicesByRole).forEach(roleName => {
      const roleIndices = nonMarqueeIndicesByRole[roleName];
      const shuffledRole = shuffleArray(roleIndices);
      
      const limit = auctionType === 'mega' 
        ? shuffledRole.length 
        : Math.max(1, Math.ceil(shuffledRole.length * fraction));
        
      shuffledRole.slice(0, limit).forEach(idx => selectedPlayersByRole.add(idx));
    });

    // 2. Build the final auction order maintaining the realistic SET order (Marquee -> Set 1 -> etc.)
    const sets = [...new Set(IPL_PLAYERS.map(p => p.set))];
    let randomizedIndices = [];
    sets.forEach(setName => {
      // Only include players from this set who were selected in the role balancing phase
      const setIndices = IPL_PLAYERS
        .map((p, i) => (p.set === setName && selectedPlayersByRole.has(i)) ? i : -1)
        .filter(i => i !== -1);
        
      randomizedIndices = [...randomizedIndices, ...shuffleArray(setIndices)];
    });

    const playerOrderRef = ref(rtdb, `auctions/${roomId}/playerOrder`);
    
    // Store playerOrder in room node (matching RTDB rules) and attempt subnode update
    await updateRtdb(rtdbRoomRef, {
      status: 'active',
      playerOrder: randomizedIndices
    });

    if (supabase) {
      try {
        await supabase.from('auctions').update({ status: 'active' }).eq('id', roomId);
      } catch (sErr) {
        // Non-fatal: RTDB status remains authoritative for the live auction.
        console.warn('[auction] Failed to mirror active status to Supabase', sErr);
      }
    }

    try {
      await set(playerOrderRef, randomizedIndices);
    } catch {
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

        // Ensure timer has ACTUALLY expired server-side
        // If a new bid was placed, timerEndsAt was extended into the future, so abort sale!
        const now = getSyncedTime();
        if (currentData.timerEndsAt && now < currentData.timerEndsAt) {
          return; // abort transaction
        }

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
      const logText = `${playerNameStr} ${isSold ? `SOLD to ${teamDetails?.name || auctionState.highBidderName} for \u20b9${auctionState.currentBid} Cr` : 'UNSOLD'}`;

      let updatedPlayers = null;
      let teamDocId = null;
      let newTeamData = null;

      // ── Bug Fix 5: Single get(room) call — eliminates TOCTOU window and halves RTDB reads ──
      // Fetch room data once up front; reuse for both player-update and player-order logic.
      const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
      const roomData = rtdbRoomSnap.exists() ? rtdbRoomSnap.val() : {};

      if (isSold) {
        teamDocId = `${roomId}_${auctionState.highBidderId}`;

        // Update room.players spent/squadCount from the single snapshot already fetched
        if (rtdbRoomSnap.exists()) {
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

        // Get current team data from RTDB to update RTDB team node
        const rtdbTeamSnap = await get(ref(rtdb, `auctions/${roomId}/teams/${teamDocId}`));
        const tData = rtdbTeamSnap.exists() ? rtdbTeamSnap.val() : {};
        const defaultBudget = toFiniteNumber(roomData.settings?.budget, 120.0);
        newTeamData = {
          auctionId: roomId,
          userId: auctionState.highBidderId,
          teamId: auctionState.highBidderTeamId || tData.teamId || '',
          teamName: teamDetails?.name || auctionState.highBidderName || tData.teamName || 'Unknown',
          budgetRemaining: Math.max(0, (tData.budgetRemaining ?? defaultBudget) - auctionState.currentBid),
          spent: (tData.spent || 0) + auctionState.currentBid,
          squad: [...(tData.squad || []), { id: auctionState.playerId, bid: auctionState.currentBid }]
        };

        // Real-time incremental sync to Supabase teams table on every player sale
        /*
        if (supabase) {
          try {
            await supabase.from('teams').upsert({
              id: teamDocId,
              auction_id: roomId,
              user_id: auctionState.highBidderId,
              team_id: auctionState.highBidderTeamId || tData.teamId || '',
              team_name: teamDetails?.name || auctionState.highBidderName || tData.teamName || 'Unknown',
              budget_remaining: newTeamData.budgetRemaining,
              spent: newTeamData.spent,
              squad: newTeamData.squad
            });
          } catch (sErr) {}
        }
        */
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

      // Player order from the single room snapshot already fetched above
      let playerOrder = roomData.playerOrder;
      if (!playerOrder) {
        const orderSnap = await get(ref(rtdb, `auctions/${roomId}/playerOrder`));
        if (orderSnap.exists()) playerOrder = orderSnap.val();
      }

      // ── Bug Fix 2: Always release endingPlayerRef via finally inside the timeout callback ──
      // Previously, component unmount before timeout fired left the ref stuck at true forever.
      const advanceToNextPlayer = async () => {
        try {
          if (roomData.status !== 'active') return;

          const settings = roomData.settings;
          const currentPlayerId = auctionState.playerId;
          const order = playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
          const currentPlayerIndexInOrder = order.findIndex(idx => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === currentPlayerId);
          const nextIndexInOrder = currentPlayerIndexInOrder !== -1 ? order[currentPlayerIndexInOrder + 1] : order[0];

          if (nextIndexInOrder !== undefined && IPL_PLAYERS[nextIndexInOrder]) {
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

            // Clean up completed room from RTDB after 30 seconds
            setTimeout(async () => {
              try {
                await remove(ref(rtdb, `auctions/${roomId}`));
              } catch {
                // Best-effort cleanup: the room may already be gone.
              }
            }, 30000);
          }
        } finally {
          // Always release the lock — even if any async step above throws or component unmounts
          endingPlayerRef.current = false;
        }
      };

      setTimeout(advanceToNextPlayer, waitTime);
    } catch (err) {
      // Release the lock on any outer error so future players can be ended
      console.error('[auction] endPlayerAuction failed', err);
      endingPlayerRef.current = false;
    }
  }, [getSyncedTime, flushAuctionToFirestore]);

  const joinRoomDb = useCallback(async (roomId, userId, playerDetails, serverHint) => {
    const teamDetails = TEAMS.find(t => t.id === playerDetails.team);

    let targetServer = normalizeServer(serverHint, null);
    let directoryRecord = null;

    // A bare room code needs the shared Supabase directory. Invite links carry
    // ?server= and skip this read, except as a fallback if the room is missing.
    if (!targetServer) {
      try {
        directoryRecord = await fetchAuctionRecord(roomId);
        if (directoryRecord) targetServer = getAuctionServer(directoryRecord);
      } catch (sErr) {
        console.warn('[auction] Supabase room directory lookup failed', sErr);
      }
    }

    if (directoryRecord) {
      const directoryServer = getAuctionServer(directoryRecord);
      if (!isServerAvailable(directoryServer)) {
        throw new Error(
          `${getServerMeta(directoryServer).label} is unavailable right now.`,
        );
      }
      targetServer = directoryServer;
    }

    if (!targetServer) targetServer = getActiveServer();
    if (!isServerAvailable(targetServer)) targetServer = DEFAULT_AUCTION_SERVER;

    goOnlineServer(targetServer);
    let connected = await waitForServerConnection(rtdb, 6000);

    // If a stale/incorrect hint pointed at the wrong database, let the shared
    // directory correct it before giving up on capacity. If the directory is
    // down too, still probe the other server once so a room created during a
    // Supabase outage remains joinable.
    if (!connected) {
      if (!directoryRecord) {
        try {
          directoryRecord = await fetchAuctionRecord(roomId);
        } catch {
          // Keep the generic capacity error below.
        }
      }

      const directoryServer = directoryRecord
        ? getAuctionServer(directoryRecord)
        : null;
      const otherServer =
        targetServer === PRIMARY_SERVER ? SECONDARY_SERVER : PRIMARY_SERVER;
      const nextServer = directoryRecord
        ? directoryServer
        : otherServer;

      if (
        nextServer &&
        nextServer !== targetServer &&
        isServerAvailable(nextServer)
      ) {
        targetServer = nextServer;
        goOnlineServer(targetServer);
        connected = await waitForServerConnection(rtdb, 6000);
      }
    }

    if (!connected) {
      throw new Error(
        `${getServerMeta(targetServer).label} is at capacity right now. Please try again in a minute.`,
      );
    }

    // Fetch current room state from the resolved RTDB (0 Firestore cost!).
    let rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));

    if (!rtdbRoomSnap.exists() && !directoryRecord) {
      try {
        directoryRecord = await fetchAuctionRecord(roomId);
      } catch {
        // Fall through to Firestore.
      }
    }

    // If the directory is unavailable too, a bare code can still be a room on
    // the other server (e.g. a create whose Supabase mirror failed). Probe the
    // other database once before declaring the room missing.
    if (!rtdbRoomSnap.exists() && !directoryRecord) {
      const otherServer =
        targetServer === PRIMARY_SERVER ? SECONDARY_SERVER : PRIMARY_SERVER;
      if (isServerAvailable(otherServer)) {
        targetServer = otherServer;
        goOnlineServer(targetServer);
        connected = await waitForServerConnection(rtdb, 6000);
        if (connected) {
          rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
        }
      }
    }

    if (!rtdbRoomSnap.exists() && directoryRecord) {
      const directoryServer = getAuctionServer(directoryRecord);
      if (!isServerAvailable(directoryServer)) {
        throw new Error(
          `${getServerMeta(directoryServer).label} is unavailable right now.`,
        );
      }
      if (directoryServer !== targetServer) {
        targetServer = directoryServer;
        goOnlineServer(targetServer);
        connected = await waitForServerConnection(rtdb, 6000);
        if (!connected) {
          throw new Error(
            `${getServerMeta(targetServer).label} is at capacity right now. Please try again in a minute.`,
          );
        }
        rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
      }
    }

    const roomWasMissing = !rtdbRoomSnap.exists();
    let data = null;
    if (!roomWasMissing) {
      data = rtdbRoomSnap.val();
    } else if (directoryRecord) {
      data = mapSupabaseAuction(directoryRecord);
    } else {
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

    const updatedPlayers = existingPlayers.filter(p => p && p.id !== userId && p.userId !== userId);
    updatedPlayers.push(updatedPlayer);

    // Update RTDB (0 Firestore cost in lobby!). If the RTDB room node was
    // missing, write the full directory/Firestore snapshot so joinAuction does
    // not latch onto a partial `{ players }` room.
    const roomRef = ref(rtdb, `auctions/${roomId}/room`);
    if (roomWasMissing) {
      await set(roomRef, { ...data, players: updatedPlayers });
    } else {
      await updateRtdb(roomRef, { players: updatedPlayers });
    }

    // Create/Update team in RTDB if team is provided
    if (playerDetails.team) {
      const rtdbTeamSnap = await get(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${userId}`));
      if (!rtdbTeamSnap.exists()) {
        const teamDataToSet = {
          auctionId: roomId,
          userId: userId,
          teamId: playerDetails.team,
          teamName: teamDetails?.name || 'Unknown',
          budgetRemaining: toFiniteNumber(data.settings?.budget, 120.0),
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

    return targetServer;
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

      // Sync player removal to Supabase
      /*
      try {
        if (supabase) {
          await supabase.from('auctions').update({ players: updatedPlayers, banned_players: updatedBanned }).eq('id', roomId);
        }
      } catch (sErr) {}
      */

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
      console.error('[auction] Failed to kick player', err);
      throw err;
    }
  }, []);

  // Listen to current auction state live
  const joinAuction = useCallback((auctionId, userId, serverHint) => {
    if (!userId) return () => {};

    const preferredServer = normalizeServer(serverHint || getActiveServer());
    const roomServer = isServerAvailable(preferredServer)
      ? preferredServer
      : DEFAULT_AUCTION_SERVER;
    try {
      goOnlineServer(roomServer);
    } catch {
      // The watchdog below reports an unusable socket.
    }

    setLoading(true);
    let auctionLoaded = false;
    let teamsLoaded = false;
    let messagesLoaded = false;
    // Flips when the RTDB socket is genuinely usable. A database that refused
    // the connection (most often the free plan's 100-session ceiling) never
    // gets here, which is what makes it the discriminator the watchdog needs.
    let socketConnected = false;

    const checkLoaded = () => {
      if (auctionLoaded && teamsLoaded && messagesLoaded) {
        setLoading(false);
      }
    };

    // ─── Connection watchdog ───
    // When a connection is refused the listeners below never fire at all: no
    // snapshot, no error callback, no kill reason. That is why this screen used
    // to load forever, and why the old 5s "timeout" here never helped — it read
    // `loading` from the render in which this callback was created, so it always
    // saw the initial `false`. Reporting "we cannot reach the database" is safe
    // here because a healthy socket connects in well under one tick.
    const watchdog = setInterval(() => {
      if (!shouldReportConnectionTrouble({ socketConnected, auctionLoaded })) return;
      reportConnectionTrouble();
    }, 5000);

    // ─── Real Presence Logic ───
    // Track online status in RTDB
    const myPresenceRef = ref(rtdb, `auctions/${auctionId}/presence/${userId}`);
    const connectedRef = ref(rtdb, '.info/connected');
    
    // ── Bug Fix: Declare shared state vars BEFORE any onValue subscriptions that reference them ──
    // Previously currentRoomData was declared at line 658 but referenced inside the onValue(connectedRef)
    // callback above at line 648. JavaScript 'let' is in the TDZ until its declaration line runs,
    // so if the callback fired before that point it threw: "Cannot access before initialization".
    let currentRoomData = null;
    let currentRtdbData = null;
    let currentPresences = {};

    // Set presence status on connect/disconnect
    const unsubConnected = onValue(connectedRef, async (snap) => {
      socketConnected = snap.val() === true;
      if (snap.val() === true) {
        // Reaching the server means any "cannot connect" notice is stale now.
        clearConnectionAlert();

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

    // ─── host_online (Supabase directory) ← RTDB presence mirror ───
    // The public directory reads a plain `host_online` boolean from Supabase, but
    // the RTDB is the source of truth for presence (its server-side onDisconnect
    // flips a member to offline even on a hard crash / closed tab). To keep
    // Supabase in sync WITHOUT a heartbeat, we mirror the derived value to
    // Supabase only when it actually changes, and only from a single elected
    // client (the online member with the lowest uid) so N members never cause
    // N writes per transition.
    let lastHostOnlineSynced = null; // last value we pushed (null = unknown)
    const syncHostOnline = (next) => {
      if (!supabase || next === lastHostOnlineSynced) return;
      lastHostOnlineSynced = next; // optimistic: parallel presence ticks won't double-write
      supabase
        .from('auctions')
        .update({ host_online: next })
        .eq('id', auctionId)
        .then(() => {})
        .catch(() => { lastHostOnlineSynced = null; }); // allow a later retry
    };


    const checkAndSet = () => {
      if (currentRoomData) {
        // Map presence data to players array
        const playersWithPresence = (currentRoomData.players || []).map(p => ({
          ...p,
          isOnline: !!currentPresences[p.id]?.online,
          lastSeen: currentPresences[p.id]?.lastSeen || null
        }));

        // Mirror the host's real presence to Supabase on transitions only.
        // Elect one reporter = the online member with the lowest uid, so exactly
        // one client writes per transition. Peers/spectators can be the reporter
        // too, which is what lets an abrupt host disconnect be reflected (the
        // RTDB onDisconnect flips presence server-side even if the host crashes).
        if (Object.keys(currentPresences).length > 0) {
          const reporterId = Object.keys(currentPresences)
            .filter((uid) => currentPresences[uid]?.online)
            .sort()[0];
          if (reporterId === userId) {
            syncHostOnline(!!currentPresences[currentRoomData.hostId]?.online);
          }
        }

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
           window.location.href = withServerParam('/?error=kicked', roomServer);
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
        // Wait 500ms grace period before hitting persistent store fallback
        setTimeout(async () => {
          if (auctionLoaded) return;
          try {
            let data = null;
            if (supabase) {
              const { data: sData } = await supabase.from('auctions').select('*').eq('id', auctionId).maybeSingle();
              if (sData) {
                data = mapSupabaseAuction(sData);
              }
            }

            if (!data) {
              const fsDoc = await getDoc(doc(db, 'auctions', auctionId));
              if (fsDoc.exists()) data = fsDoc.data();
            }

            if (data) {
              if (data.bannedPlayers && data.bannedPlayers.includes(userId)) {
                 window.location.href = withServerParam('/?error=kicked', roomServer);
                 return;
              }
              auctionLoaded = true;
              currentRoomData = data;
              checkAndSet();
              checkLoaded();
              await updateRtdb(ref(rtdb, `auctions/${auctionId}/room`), data);
            } else {
              // Room not found in any store
              setLoading(false);
            }
          } catch(e) { handleFirebaseError(e); }
        }, 500);
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
        setTimeout(async () => {
          if (teamsLoaded) return;
          try {
            let teamsArr = [];
            if (supabase) {
              const { data: sTeams } = await supabase.from('teams').select('*').eq('auction_id', auctionId);
              if (sTeams && sTeams.length > 0) {
                teamsArr = sTeams.map(t => ({
                  id: t.id,
                  auctionId: t.auction_id,
                  userId: t.user_id,
                  teamId: t.team_id,
                  teamName: t.team_name,
                  budgetRemaining: t.budget_remaining ?? 120,
                  spent: t.spent || 0,
                  squad: t.squad || []
                }));
              }
            }

            if (teamsArr.length === 0) {
              const tq = query(collection(db, 'teams'), where('auctionId', '==', auctionId));
              const tSnap = await getDocs(tq);
              if (!tSnap.empty) {
                teamsArr = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              }
            }

            teamsLoaded = true;
            setRoomTeams(teamsArr);

            if (userId) {
              const myTeam = teamsArr.find(t => t.id === `${auctionId}_${userId}` || t.userId === userId);
              if (myTeam) setTeam(myTeam);
              else setTeam(null);
            }
            checkLoaded();

            if (teamsArr.length > 0) {
              const teamsToSync = {};
              teamsArr.forEach(t => {
                teamsToSync[t.id] = t;
              });
              await updateRtdb(ref(rtdb, `auctions/${auctionId}/teams`), teamsToSync);
            }
          } catch(e) { handleFirebaseError(e); }
        }, 500);
      }
    }, (error) => {
      setLoading(false);
      handleFirebaseError(error);
    });

    const msgQuery = queryRtdb(ref(rtdb, `auctions/${auctionId}/messages`), limitToLast(10));
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
      clearInterval(watchdog);
      unsubConnected();
      unsubPresence();
      unsubAuction();
      unsubLive();
      unsubTeams();
      unsubMessages();
      // Set offline on component unmount
      set(myPresenceRef, { online: false, lastSeen: serverTimestampRtdb() });

      // Mark the room offline in the directory when the HOST leaves. This is the
      // only writer for the "lone host leaves / no peers left to mirror" case;
      // otherwise the peer-elected presence mirror handles offline transitions.
      if (currentRoomData && currentRoomData.hostId === userId) {
        syncHostOnline(false);
      }

      setCurrentAuction(null);
      setTeam(null);
      setRoomTeams([]);
      setMessages([]);

      // Immediately close RTDB connection when leaving auction room/lobby to free up connection quota
      try { goOfflineServer(roomServer); } catch { /* RTDB reconnects automatically */ }
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

  // The bid amount is recomputed from live room state; callers may pass a
  // hint, but it is intentionally ignored.
  const placeBid = useCallback(async () => {
    if (!currentAuction) throw new Error("Auction not found!");
    if (!user) throw new Error("Please log in to bid!");
    if (!team) throw new Error("You must select a team in the lobby to participate!");
    if (currentAuction.bannedPlayers && currentAuction.bannedPlayers.includes(user.uid)) {
      throw new Error("You have been removed from this auction and cannot bid.");
    }
    if (currentAuction.currentAuction?.status !== 'bidding') throw new Error("Auction is not accepting bids right now.");
    if (currentAuction.currentAuction?.highBidderId === user.uid) throw new Error("You are already the highest bidder!");

    // Squad limit check
    const squadLimit = toFiniteNumber(currentAuction.squadLimit, 25);
    if (team.squad && team.squad.length >= squadLimit) {
      throw new Error(`You have reached the squad limit of ${squadLimit} players!`);
    }

    // Overseas limit check
    const player = IPL_PLAYERS.find(p => p.id === currentAuction.currentAuction?.playerId);
    const isOverseas = player ? isOverseasPlayer(player) : false;
    const overseasLimit = toFiniteNumber(currentAuction.overseasLimit, 8);
    if (isOverseas && team.squad) {
      const currentOverseasCount = countOverseas(team.squad, IPL_PLAYERS);
      if (currentOverseasCount >= overseasLimit) {
        throw new Error(`You have reached the overseas quota of ${overseasLimit} players for this mode!`);
      }
    }

    // ── Bug Fix 1: Budget pre-flight check OUTSIDE the transaction ──
    // The transaction update function is retried by Firebase on conflicts — using team.budgetRemaining
    // inside it reads a stale React closure each retry, not the live DB value. We do the check here
    // (from the most recent RTDB-synced team state) and rely on the server to enforce it atomically.
    const cBidSnapshot = toFiniteNumber(currentAuction.currentAuction?.currentBid, 0);
    const incSnapshot = cBidSnapshot < 5 ? 0.20 : 0.25;
    const nextBidSnapshot = cBidSnapshot === 0
      ? toFiniteNumber(player?.basePrice, 0)
      : parseFloat((cBidSnapshot + incSnapshot).toFixed(2));
    const myBudget = toFiniteNumber(team.budgetRemaining, 0);
    if (myBudget < nextBidSnapshot) {
      throw new Error('Insufficient budget to place this bid.');
    }

    const liveRef = ref(rtdb, `auctions/${currentAuction.id}/live`);
    const txResult = await runTransactionRtdb(liveRef, (currentData) => {
      if (!currentData) return currentData;
      if (currentData.status !== 'bidding') return; // abort
      if (currentData.highBidderId === user.uid) return; // abort

      const now = getSyncedTime();
      // Server-side guard: Reject late bids if timer has already expired
      if (currentData.timerEndsAt && now >= currentData.timerEndsAt) {
        return; // abort transaction
      }

      const cBid = currentData.currentBid || 0;
      const inc = cBid < 5 ? 0.20 : 0.25;
      const nAmount = cBid === 0
        ? (IPL_PLAYERS.find(p => p.id === currentData.playerId)?.basePrice || 0)
        : parseFloat((cBid + inc).toFixed(2));

      // Guard: Abort retried transaction if updated bid exceeds user's budget
      if (nAmount > myBudget) return;

      currentData.currentBid = nAmount;
      currentData.highBidderId = user.uid;
      currentData.highBidderName = user.displayName || 'Manager';
      currentData.highBidderTeamId = team.teamId;
      currentData.timerEndsAt = now + (currentAuction.settings?.bidTimer || 10) * 1000;

      return currentData;
    });

    if (!txResult.committed) {
      throw new Error("Bid failed: Another manager placed a higher bid or timer expired.");
    }
  }, [currentAuction, user, team, getSyncedTime]);

  const updatePlayerTeam = useCallback(async (roomId, userId, newTeamId) => {
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    
    const data = rtdbRoomSnap.val();
    const teamDetails = TEAMS.find(t => t.id === newTeamId);
    
    const updatedPlayers = (data.players || []).map(p => 
      p.id === userId ? { ...p, team: newTeamId, teamName: teamDetails?.name || 'Unknown' } : p
    );
    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });

    /*
    try {
      if (supabase) {
        await supabase.from('auctions').update({ players: updatedPlayers }).eq('id', roomId);
      }
    } catch (sErr) {}
    */

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
        budgetRemaining: toFiniteNumber(data.settings?.budget, 120.0),
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

    // Clean up completed room node from RTDB after 5 seconds to keep RTDB size at 0MB
    setTimeout(async () => {
      try {
        await remove(ref(rtdb, `auctions/${roomId}`));
      } catch {
        // Best-effort cleanup: the room may already be gone.
      }
    }, 5000);
  }, [user, currentAuction, flushAuctionToFirestore]);



  // ─── Bot Management & Bidding Engine ───

  const placeBotBid = useCallback(async (roomId, botUserId, botTeamId, botName, timerSeconds = 10, maxValuation = Infinity, botBudget = Infinity) => {
    if (!roomId) return;
    const liveRef = ref(rtdb, `auctions/${roomId}/live`);

    await runTransactionRtdb(liveRef, (currentData) => {
      if (!currentData) return currentData;
      if (currentData.status !== 'bidding') return; // abort
      if (currentData.highBidderId === botUserId) return; // abort

      const now = getSyncedTime();
      // Reject if timer has already expired server-side
      if (currentData.timerEndsAt && now >= currentData.timerEndsAt) return;
      
      const cBid = currentData.currentBid || 0;
      const inc = cBid < 5 ? 0.20 : 0.25;
      const nAmount = cBid === 0 ? toFiniteNumber(IPL_PLAYERS.find(p => p.id === currentData.playerId)?.basePrice, 0) : parseFloat((cBid + inc).toFixed(2));

      // Guard: Abort retried transaction if updated bid exceeds bot's max valuation or remaining budget
      if (nAmount > maxValuation || nAmount > botBudget) return;

      currentData.currentBid = nAmount;
      currentData.highBidderId = botUserId;
      currentData.highBidderName = botName;
      currentData.highBidderTeamId = botTeamId;
      // Use the room's configured timer, NOT a hardcoded 10 seconds
      currentData.timerEndsAt = now + (timerSeconds * 1000);
      
      return currentData;
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

    /*
    try {
      if (supabase) {
        await supabase.from('auctions').update({ players: updatedPlayers }).eq('id', roomId);
      }
    } catch (sErr) {}
    */

    const teamDataToSet = {
      auctionId: roomId,
      userId: botUserId,
      teamId,
      teamName: teamDetails.name,
      budgetRemaining: toFiniteNumber(data.settings?.budget, 120.0),
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

    /*
    try {
      if (supabase) {
        await supabase.from('auctions').update({ players: updatedPlayers }).eq('id', roomId);
      }
    } catch (sErr) {}
    */

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
          budgetRemaining: toFiniteNumber(data.settings?.budget, 120.0),
          spent: 0,
          squad: []
        };
      }
    });

    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { players: updatedPlayers });

    /*
    try {
      if (supabase) {
        await supabase.from('auctions').update({ players: updatedPlayers }).eq('id', roomId);
      }
    } catch (sErr) {}
    */

    if (Object.keys(teamsToSet).length > 0) {
      await updateRtdb(ref(rtdb, `auctions/${roomId}/teams`), teamsToSet);
    }
  }, []);

  // Guard ref: track the last timer cycle (timerEndsAt) that a bot bid was queued for.
  // Prevents multiple bot bids from being scheduled when currentAuction re-renders
  // multiple times during the same countdown cycle.
  const lastBotBidCycleRef = React.useRef(null);

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

    // ─── Deduplicate: skip if we already queued a bot bid for this exact timer cycle ───
    // A timer cycle is identified by the timerEndsAt value.
    // When a bid is placed (human or bot), timerEndsAt changes → new cycle → new bid allowed.
    const cycleKey = `${live.playerId}_${live.timerEndsAt}`;
    if (lastBotBidCycleRef.current === cycleKey) return;
    lastBotBidCycleRef.current = cycleKey;

    const now = getSyncedTime();
    const timerSec = currentAuction.settings?.bidTimer || 10;
    const timerMs = timerSec * 1000;
    const remainingMs = Math.max(0, (live.timerEndsAt || 0) - now);
    const cBid = live.currentBid || 0;

    // If timer has already expired, don't schedule anything
    if (remainingMs <= 0) return;

    // ─── Timer-Adaptive & Mixed Pacing Engine ───
    // Dynamically scales to host's configured timer (5s, 10s, 15s, 20s)
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
        // Late Clutch Sniping (final 15–30% of countdown)
        const targetRemainMs = timerMs * (0.15 + Math.random() * 0.15);
        delayMs = remainingMs > targetRemainMs
          ? remainingMs - targetRemainMs
          : 300 + Math.random() * 400;
      }
    }

    // Bound delay safely: minimum 300ms, maximum (remainingMs - 300ms)
    delayMs = Math.max(300, Math.min(delayMs, Math.max(300, remainingMs - 300)));

    const initialBudget = toFiniteNumber(currentAuction.settings?.budget, 120.0);

    const timer = setTimeout(async () => {
      // Pick a suitable bot team that is not the current high bidder
      const eligibleBots = shuffleArray(botPlayers.filter(p => p.id !== live.highBidderId));
      for (const botP of eligibleBots) {
        const botTeam = roomTeams.find(t => t.userId === botP.id);
        if (!botTeam) continue;

        const bidDecision = evaluateBotBid({
          player,
          currentBid: live.currentBid || 0,
          highBidderId: live.highBidderId,
          botTeam,
          squadLimit: toFiniteNumber(currentAuction.squadLimit, 25),
          overseasLimit: toFiniteNumber(currentAuction.overseasLimit, 8),
          initialBudget,
        });

        if (bidDecision && bidDecision.shouldBid) {
          try {
            // Pass room timer setting, maxValuation, and budgetRemaining to enforce bounds on retries
            await placeBotBid(
              currentAuction.id,
              botP.id,
              botP.team,
              botP.name,
              timerSec,
              bidDecision.maxValuation,
              botTeam.budgetRemaining ?? initialBudget
            );
          } catch (e) {
            // A failed bot bid is non-fatal: the auction continues for humans.
            console.warn('[auction] Bot bid attempt failed', e);
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