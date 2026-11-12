import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  db,
  enterLocalMode,
  exitLocalMode,
  getActiveServer,
  getAvailableServers,
  getRtdb,
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
import { isSoloBotRoom, simulateBotLot, simulateRemainingAuction } from '../lib/botSimulation';
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
import { pausedRemainingMs, toFiniteNumber } from '../lib/auctionDisplay';
import {
  countAuctionTeams,
  finalizedLotRecoveryDelay,
  generatePlayerOrder,
  getNextBidAmount,
  getSquadConstraintError,
  getStartDisposition,
  mapRoomPlayers,
  mergeRoomPlayer,
  MIN_TEAMS_TO_START,
  resolveDisconnectAction,
  shouldArmDisconnectPause,
  shuffleArray,
} from '../lib/auctionRules';
import {
  transactAdvance,
  transactBid,
  transactRoomPlayersSale,
  transactSale,
  transactTeamSale,
} from '../lib/auctionTransactions';
import { createServerSessionTracker } from '../lib/serverSessions';
import {
  DEFAULT_AUCTION_SERVER,
  PRIMARY_SERVER,
  SECONDARY_SERVER,
  SERVER_LOCAL,
  getAuctionServer,
  getServerMeta,
  normalizeServer,
  withServerParam,
} from '../lib/auctionServers';
import {
  isLocalRoom,
  loadLocalSoloRoom,
  saveLocalSoloRoom,
  localAuctionReducer,
  acquireSoloRoomLock,
  buildSoloPersistPayload,
} from '../lib/localAuctionEngine';
import {
  fetchAuctionRecord,
  insertAuctionWithServer,
  upsertAuctionWithServer,
} from '../lib/auctionServerDirectory';
import {
  createSoloBotLoop,
  createSoloStateManager,
  handleSoloEndAuction,
  handleSoloSendMessage,
} from '../lib/soloAuctionSession';
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

// One write path for manual and host-offline pauses. The transaction keeps the
// pause idempotent when several peers notice the same presence transition.
const pauseLiveLot = (rtdbInstance, roomId, nowMs) =>
  runTransactionRtdb(ref(rtdbInstance, `auctions/${roomId}/live`), (live) => {
    if (!live || live.status !== 'bidding') return;
    const remainingMs = (live.timerEndsAt || 0) - nowMs;
    if (remainingMs < 2000) return;
    return { ...live, status: 'paused', remainingMs: Math.max(0, remainingMs) };
  });

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

export const AuctionProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleFirebaseError } = useQuota();
  const { reportConnectionTrouble, clearConnectionAlert } = useConnectionAlert();
  const [currentAuction, setCurrentAuction] = useState(null);
  const [team, setTeam] = useState(null);
  const [roomTeams, setRoomTeams] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [soloLockStatus, setSoloLockStatus] = useState('active'); // 'active' | 'blocked' | 'taken_over'
  const isSoloLockHeldRef = React.useRef(false);
  const soloBotLoopRef = React.useRef(null);
  const soloStateManagerRef = React.useRef(null);
  const endingPlayerRef = React.useRef(false);
  const serverSessionsRef = React.useRef(null);
  if (!serverSessionsRef.current) {
    serverSessionsRef.current = createServerSessionTracker();
  }
  const localSoloStateRef = React.useRef(null);
  const localSoloLockReleaseRef = React.useRef(null);
  const localSoloStealFnRef = React.useRef(null);
  const localSoloTimerIntervalRef = React.useRef(null);

  // Server-authoritative time in cloud mode, Date.now() in device-local solo mode
  const getSyncedTime = useCallback(() => {
    if (isLocalRoom(currentAuction?.id, currentAuction?.server)) {
      return Date.now();
    }
    return getServerTime();
  }, [currentAuction?.id, currentAuction?.server]);

  // Create a new room in DB (RTDB + Supabase index, zero Firestore load)
  const createRoom = useCallback(async (
    roomId,
    userId,
    playerDetails,
    auctionType = 'mega',
    isPublic = true,
    server = DEFAULT_AUCTION_SERVER,
  ) => {
    if (isLocalRoom(roomId, server)) {
      return;
    }
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
      const candidates = getAvailableServers()
        .map((s) => s.id)
        .filter((id) => id !== actualServer);

      for (const candidate of candidates) {
        if (await tryServer(candidate)) {
          actualServer = candidate;
          connected = true;
          break;
        }
      }
    }

    if (!connected) {
      // The last probe can switch the active binding even when it fails. Close
      // whichever server is active now, not just the originally requested one.
      goOfflineServer(getActiveServer());
      throw new Error(
        'All auction servers are at capacity right now. Please try again in a minute.',
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
      handleFirebaseError(rtdbErr);
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
  // Returns true only when the full room + team snapshot reached Supabase.
  // Callers use that to decide whether the RTDB room is safe to delete.
  const flushAuctionToFirestore = useCallback(async (roomId, serverHint) => {
    let persisted = false;
    try {
      const server = normalizeServer(serverHint || currentAuction?.server || getActiveServer());
      const rtdbInstance = getRtdb(server);
      const roomSnap = await get(ref(rtdbInstance, `auctions/${roomId}/room`));
      const teamsSnap = await get(ref(rtdbInstance, `auctions/${roomId}/teams`));

      if (!roomSnap.exists() || !supabase) return false;

      const roomData = roomSnap.val();
      const teamsData = teamsSnap.exists() ? teamsSnap.val() : {};

      // Flush to Supabase (0 Firestore cost)
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
      } else {
        persisted = true;
      }

      const supabaseTeams = Object.entries(teamsData).map(([docId, teamVal]) => {
        const rawSquad = teamVal.squad;
        const squadArr = Array.isArray(rawSquad) ? rawSquad : (rawSquad ? Object.values(rawSquad) : []);
        return {
          id: docId,
          auction_id: roomId,
          user_id: teamVal.userId || docId.split('_').slice(1).join('_'),
          team_id: teamVal.teamId || '',
          team_name: teamVal.teamName || 'Unknown',
          budget_remaining: teamVal.budgetRemaining ?? 120.0,
          spent: teamVal.spent ?? 0,
          squad: squadArr
        };
      });

      if (supabaseTeams.length > 0) {
        const { error: teamsErr } = await supabase.from('teams').upsert(supabaseTeams);
        if (teamsErr) {
          console.warn('[auction] Failed to flush teams to Supabase', teamsErr);
          persisted = false;
        }
      }

      return persisted;
    } catch (err) {
      // Lobby sync is best-effort; Realtime Database remains the live source.
      console.warn('[auction] Failed to sync lobby teams to Supabase', err);
      return false;
    }
  }, [currentAuction?.server]);

  // Persist a finished device-local solo auction so its summary survives this
  // browser. Runs only when the player explicitly ends the auction.
  const persistSoloAuction = useCallback(async (state) => {
    if (!supabase) return false;
    const payload = buildSoloPersistPayload(state);
    if (!payload) return false;
    try {
      const { error } = await upsertAuctionWithServer(payload.auction, SERVER_LOCAL);
      if (error) throw error;
      if (payload.teams.length > 0) {
        const { error: teamsError } = await supabase.from('teams').upsert(payload.teams);
        if (teamsError) throw teamsError;
      }
      return true;
    } catch (err) {
      console.warn('[solo] Failed to save completed auction to Supabase', err);
      return false;
    }
  }, []);

  const startAuction = useCallback(async (roomId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) return;
    try {
      const rtdbRoomRef = ref(rtdb, `auctions/${roomId}/room`);
      const liveRef = ref(rtdb, `auctions/${roomId}/live`);
      const [roomSnap, liveSnap] = await Promise.all([get(rtdbRoomRef), get(liveRef)]);
      if (!roomSnap.exists()) throw new Error('Room not found!');

      let roomData = roomSnap.val();
      const liveData = liveSnap.exists() ? liveSnap.val() : null;
      const disposition = getStartDisposition(roomData, liveData);

      // Starting twice must never re-shuffle the order or reset a live lot.
      if (disposition === 'running') return;
      if (disposition === 'completed') {
        // Heal a room whose final status write was interrupted.
        if (roomData.status !== 'completed') {
          await updateRtdb(rtdbRoomRef, { status: 'completed' }).catch(() => {});
        }
        return;
      }
      if (disposition === 'missing') throw new Error('Room not found!');

      // A fresh auction needs at least two franchises. Recovery of an already
      // active room is exempt so a completed start can always be healed.
      if (
        disposition === 'start' &&
        countAuctionTeams(roomData.players) < MIN_TEAMS_TO_START
      ) {
        throw new Error(`Add at least ${MIN_TEAMS_TO_START} teams to start the auction.`);
      }

      let playerOrder =
        Array.isArray(roomData.playerOrder) && roomData.playerOrder.length > 0
          ? roomData.playerOrder
          : generatePlayerOrder(roomData.auctionType || 'mega');
      if (playerOrder.length === 0) {
        throw new Error('No players available for this auction.');
      }

      if (disposition === 'start') {
        const claim = await runTransactionRtdb(rtdbRoomRef, (currentRoom) => {
          if (!currentRoom) return;
          if (currentRoom.status === 'completed') return;
          if (
            currentRoom.status === 'active' &&
            Array.isArray(currentRoom.playerOrder) &&
            currentRoom.playerOrder.length > 0
          ) {
            return; // another tab won the start race
          }
          return { ...currentRoom, status: 'active', playerOrder };
        });

        if (!claim.committed) {
          // Another client may have claimed the start. Only continue if its live
          // lot is still missing (i.e. that client died between room and live).
          const [latestRoomSnap, latestLiveSnap] = await Promise.all([
            get(rtdbRoomRef),
            get(liveRef),
          ]);
          roomData = latestRoomSnap.exists() ? latestRoomSnap.val() : null;
          const latestLive = latestLiveSnap.exists() ? latestLiveSnap.val() : null;
          const latest = getStartDisposition(roomData, latestLive);
          if (!roomData || latest === 'running' || latest === 'completed' || latest === 'missing') {
            return;
          }
          if (Array.isArray(roomData.playerOrder) && roomData.playerOrder.length > 0) {
            playerOrder = roomData.playerOrder;
          }
        } else {
          const claimedRoom = claim.snapshot.val();
          if (claimedRoom?.playerOrder?.length) playerOrder = claimedRoom.playerOrder;
        }
      } else if (!Array.isArray(roomData.playerOrder) || roomData.playerOrder.length === 0) {
        await updateRtdb(rtdbRoomRef, { playerOrder });
      }

      // Check if room is 1 human vs AI bots
      const isSolo = isSoloBotRoom(roomData?.players || []);
      if (isSolo) {
        await updateRtdb(rtdbRoomRef, { isSoloBotRoom: true });
      }

      const firstPlayer = IPL_PLAYERS[playerOrder[0]];
      if (!firstPlayer) throw new Error('No players available for this auction.');

      await set(liveRef, {
        playerId: firstPlayer.id,
        currentBid: 0,
        highBidderId: '',
        highBidderName: 'No Bids',
        timerEndsAt: getSyncedTime() + 15000,
        status: 'bidding'
      });

      try {
        await set(ref(rtdb, `auctions/${roomId}/playerOrder`), playerOrder);
      } catch {
        // Graceful fallback if the RTDB sub-path rule is pending deploy.
      }

      if (supabase) {
        try {
          await supabase.from('auctions').update({ status: 'active' }).eq('id', roomId);
        } catch (sErr) {
          // Non-fatal: RTDB status remains authoritative for the live auction.
          console.warn('[auction] Failed to mirror active status to Supabase', sErr);
        }
      }

      if (disposition === 'start') {
        try {
          // Add to messages collection for chronological sorting
          await push(ref(rtdb, `auctions/${roomId}/messages`), {
            userId: 'system',
            userName: 'System',
            text: `Auction has started!`,
            type: 'log',
            timestamp: serverTimestampRtdb()
          });
        } catch (msgErr) {
          // The auction is already live; a missing log line must not fail it.
          console.warn('[auction] Failed to write start message', msgErr);
        }
      }
    } catch (err) {
      handleFirebaseError(err);
      throw err;
    }
  }, [getSyncedTime, handleFirebaseError]);

  const endPlayerAuction = useCallback(async (roomId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) {
      const live = currentAuction?.currentAuction || currentAuction?.currentLot;
      if (live && (live.status === 'sold' || live.status === 'unsold')) {
        updateLocalSoloState({ type: 'ADVANCE_LOT', now: Date.now() });
      } else {
        updateLocalSoloState({ type: 'RESOLVE_LOT', now: Date.now(), celebrate: true });
      }
      return;
    }

    // Prevent duplicate calls from the timer interval
    if (endingPlayerRef.current) return;
    endingPlayerRef.current = true;

    try {
      const liveRef = ref(rtdb, `auctions/${roomId}/live`);
      
      // Use RTDB transaction to atomically claim the "end" action. It aborts if
      // a new bid extended the timer, or another client already finalized.
      const txResult = await runTransactionRtdb(liveRef, (currentData) =>
        transactSale(currentData, getSyncedTime()),
      );

      let auctionState = txResult.committed ? txResult.snapshot.val() : null;
      if (!auctionState) {
        // Recovery path: if a prior transaction committed status but the subsequent write failed,
        // or if a retry occurs while live status is sold/unsold, recover the lot state
        const liveSnap = await get(liveRef);
        const liveVal = liveSnap.exists() ? liveSnap.val() : null;
        if (liveVal && (liveVal.status === 'sold' || liveVal.status === 'unsold')) {
          auctionState = liveVal;
        } else {
          endingPlayerRef.current = false;
          return;
        }
      }

      const isSold = auctionState.status === 'sold';
      const targetPlayerId = auctionState.playerId || auctionState.id || currentAuction?.currentAuction?.playerId || IPL_PLAYERS[0]?.id;
      const player = IPL_PLAYERS.find(p => p.id === targetPlayerId);
      const teamDetails = TEAMS.find(t => t.id === auctionState.highBidderTeamId);

      const playerNameStr = player?.name || 'Player';
      const logText = `${playerNameStr} ${isSold ? `SOLD to ${teamDetails?.name || auctionState.highBidderName} for \u20b9${auctionState.currentBid} Cr` : 'UNSOLD'}`;

      let committedTotalSpent = 0;
      let committedSquadCount = 0;
      let teamDocId = null;

      // ── Bug Fix 5: Single get(room) call — eliminates TOCTOU window and halves RTDB reads ──
      // Fetch room data once up front; reuse for both player-update and player-order logic.
      const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
      const roomData = rtdbRoomSnap.exists() ? rtdbRoomSnap.val() : {};
      const initialBudget = toFiniteNumber(roomData.settings?.budget, 120.0);

      if (isSold) {
        teamDocId = `${roomId}_${auctionState.highBidderId}`;
        const teamRef = ref(rtdb, `auctions/${roomId}/teams/${teamDocId}`);

        // Update team squad and purse atomically using transaction to prevent stale snapshot overwrites
        const teamTx = await runTransactionRtdb(teamRef, (currentTeam) =>
          transactTeamSale(currentTeam, {
            roomId,
            playerId: targetPlayerId,
            bid: auctionState.currentBid,
            winnerId: auctionState.highBidderId,
            winnerTeamId: auctionState.highBidderTeamId,
            winnerName: teamDetails?.name || auctionState.highBidderName,
            initialBudget,
          }),
        );

        const committedTeam = teamTx?.snapshot?.val();
        if (committedTeam) {
          committedTotalSpent = toFiniteNumber(committedTeam.spent, 0);
          committedSquadCount = Array.isArray(committedTeam.squad) ? committedTeam.squad.length : 0;
        }

        // Monotonically update room.players spent & squadCount via transaction
        const roomRef = ref(rtdb, `auctions/${roomId}/room`);
        await runTransactionRtdb(roomRef, (currentRoom) =>
          transactRoomPlayersSale(currentRoom, {
            winnerId: auctionState.highBidderId,
            totalSpent: committedTotalSpent,
            squadCount: committedSquadCount,
          }),
        );
      }

      // Check if system message for this lot already exists before writing to prevent duplicate logs or UI jitter
      const lotMsgKey = `lot_${targetPlayerId}`;
      const msgRef = ref(rtdb, `auctions/${roomId}/messages/${lotMsgKey}`);
      const existingMsgSnap = await get(msgRef);
      if (!existingMsgSnap.exists()) {
        await set(msgRef, {
          userId: 'system',
          userName: 'System',
          text: logText,
          type: isSold ? 'sold_card' : 'log',
          metadata: isSold ? {
            playerId: targetPlayerId,
            teamId: auctionState.highBidderTeamId,
            bid: auctionState.currentBid,
            buyerId: auctionState.highBidderId,
            buyerName: auctionState.highBidderName
          } : null,
          timestamp: serverTimestampRtdb()
        });
      }

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
          const roomStatus = roomData.status || currentAuction?.status || 'active';
          if (roomStatus !== 'active') return;

          const settings = roomData.settings;
          const currentPlayerId = targetPlayerId;
          const order = playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
          const currentPlayerIndexInOrder = order.findIndex(idx => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === currentPlayerId);
          const nextIndexInOrder = currentPlayerIndexInOrder !== -1 ? order[currentPlayerIndexInOrder + 1] : order[0];

          if (nextIndexInOrder !== undefined && IPL_PLAYERS[nextIndexInOrder]) {
            const nextPlayer = IPL_PLAYERS[nextIndexInOrder];
            // Atomic advance: aborts if another client already advanced or started bidding on the next player
            await runTransactionRtdb(liveRef, (currentLive) =>
              transactAdvance(currentLive, {
                currentPlayerId,
                nextPlayerId: nextPlayer.id,
                timerEndsAt: getSyncedTime() + (settings?.bidTimer || 10) * 1000,
              }),
            );
          } else {
            const server = normalizeServer(currentAuction?.server || getActiveServer());
            const rtdbInstance = getRtdb(server);
            // 1. Cancel onDisconnect so a connection drop does not auto-pause an ending auction.
            await onDisconnect(ref(rtdbInstance, `auctions/${roomId}/live`)).cancel().catch(() => {});
            // 2. Mark the room completed (authoritative status, triggers redirect to /summary).
            await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/room`), { status: 'completed' });
            // 3. Mark the lot completed (or paused as fallback if deployed database rules haven't whitelisted 'completed' yet)
            //    so pending timers/transactions abort cleanly without blocking completion.
            try {
              await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/live`), { status: 'completed' });
            } catch {
              try {
                await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/live`), { status: 'paused' });
              } catch {}
            }
            // 4. Persist the completed room. Keep the RTDB copy if this failed:
            //    AuctionSummary can still reconstruct the result from it.
            const persisted = await flushAuctionToFirestore(roomId, server);

            if (persisted) {
              setTimeout(async () => {
                try {
                  await remove(ref(rtdbInstance, `auctions/${roomId}`));
                } catch {
                  // Best-effort cleanup: the room may already be gone.
                }
              }, 30000);
            }
          }
        } finally {
          // Always release the lock — even if any async step above throws or component unmounts
          endingPlayerRef.current = false;
        }
      };

      setTimeout(advanceToNextPlayer, waitTime);
    } catch (err) {
      console.error('[auction] endPlayerAuction failed', err);
      handleFirebaseError(err);
      endingPlayerRef.current = false;
    }
  }, [getSyncedTime, flushAuctionToFirestore]);

  // Ref guards against duplicate fast-forward / pass actions
  const isSimulatingRef = React.useRef(false);

  const updateLocalSoloState = useCallback((action) => {
    if (soloStateManagerRef.current) {
      return soloStateManagerRef.current.updateState(action);
    }
    if (!isSoloLockHeldRef.current) {
      console.warn('[solo] Refusing to update local solo state: lock is not held by this window.');
      return null;
    }
    const prev = localSoloStateRef.current;
    if (!prev) return null;
    const next = localAuctionReducer(prev, action);
    localSoloStateRef.current = next;
    saveLocalSoloRoom(next);

    const liveLot = next.currentAuction || next.currentLot;
    setCurrentAuction({
      ...next,
      currentAuction: liveLot,
      currentLot: liveLot,
      isSoloBotRoom: true,
      server: SERVER_LOCAL,
    });
    const teamsList = next.roomTeams || next.teams || [];
    setRoomTeams(teamsList);
    setMessages(next.messages || []);
    const humanTeam = teamsList.find(
      (t) => t.userId === user?.uid || !String(t.userId).startsWith('bot_'),
    );
    if (humanTeam) {
      setTeam({
        ...humanTeam,
        id: humanTeam.teamId || humanTeam.id,
        teamId: humanTeam.teamId || humanTeam.id,
        team: humanTeam.teamId || humanTeam.id,
      });
    }
    return next;
  }, [user?.uid]);

  /**
   * Fast-pass the current lot in solo-bot mode:
   * Cancels pending timer, immediately resolves the lot among bots, advances without human delay.
   */
  const skipCurrentPlayerSolo = useCallback(async (roomId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) {
      const live = currentAuction?.currentAuction || currentAuction?.currentLot;
      if (live && (live.status === 'sold' || live.status === 'unsold')) {
        updateLocalSoloState({ type: 'ADVANCE_LOT', now: Date.now() });
      } else {
        updateLocalSoloState({ type: 'SKIP_LOT', now: Date.now() });
      }
      return;
    }

    if (isSimulatingRef.current || endingPlayerRef.current) return;
    isSimulatingRef.current = true;
    endingPlayerRef.current = true;

    try {
      const liveRef = ref(rtdb, `auctions/${roomId}/live`);
      const roomRef = ref(rtdb, `auctions/${roomId}/room`);
      const [liveSnap, roomSnap] = await Promise.all([get(liveRef), get(roomRef)]);
      if (!liveSnap.exists() || !roomSnap.exists()) return;

      const live = liveSnap.val();
      const room = roomSnap.val();
      if (live.status !== 'bidding') return;

      const player = IPL_PLAYERS.find((p) => p.id === live.playerId);
      if (!player) return;

      const initialBudget = toFiniteNumber(room.settings?.budget, 120.0);
      const squadLimit = toFiniteNumber(room.squadLimit, 25);
      const overseasLimit = toFiniteNumber(room.overseasLimit, 8);

      // Fetch fresh teams
      const teamsSnap = await get(ref(rtdb, `auctions/${roomId}/teams`));
      const teamsVal = teamsSnap.exists() ? teamsSnap.val() : {};
      const allTeams = Object.values(teamsVal);

      // Explicitly reject if cloud room is not a solo bot room!
      if (!isSoloBotRoom(room.players || allTeams)) {
        console.warn('[auction] skipCurrentPlayerSolo rejected: not a solo bot room');
        return;
      }

      const botTeams = allTeams.filter((t) => t.userId && (t.userId.startsWith('bot_') || t.userId !== user?.uid));

      // Simulate lot strictly among bots
      const lotRes = simulateBotLot({
        player,
        botTeams,
        currentBid: live.currentBid || 0,
        highBidderId: live.highBidderId || '',
        highBidderName: live.highBidderName || '',
        highBidderTeamId: live.highBidderTeamId || '',
        squadLimit,
        overseasLimit,
        initialBudget,
      });

      const now = getSyncedTime();
      if (lotRes.isSold) {
        // Atomic update of winning bot team
        const winnerDocKey = `${roomId}_${lotRes.winnerId}`;
        const winningTeam = allTeams.find((t) => t.userId === lotRes.winnerId);
        const existingSquad = winningTeam?.squad || [];
        const updatedSquad = [
          ...existingSquad,
          {
            id: player.id,
            name: player.name,
            role: player.role,
            bid: lotRes.finalBid,
            team: lotRes.winnerTeamId,
          },
        ];
        const newSpent = toFiniteNumber(winningTeam?.spent, 0) + lotRes.finalBid;
        const newBudgetRemaining = Math.max(0, toFiniteNumber(winningTeam?.budgetRemaining, initialBudget) - lotRes.finalBid);

        await updateRtdb(ref(rtdb, `auctions/${roomId}/teams/${winnerDocKey}`), {
          squad: updatedSquad,
          spent: newSpent,
          budgetRemaining: newBudgetRemaining,
        });

        // Set lot sold
        await set(liveRef, {
          ...live,
          status: 'sold',
          currentBid: lotRes.finalBid,
          highBidderId: lotRes.winnerId,
          highBidderName: lotRes.winnerName,
          highBidderTeamId: lotRes.winnerTeamId,
          timerEndsAt: now,
        });
      } else {
        // Set lot unsold
        await set(liveRef, {
          ...live,
          status: 'unsold',
          currentBid: 0,
          highBidderId: '',
          highBidderName: 'No Bids',
          highBidderTeamId: '',
          timerEndsAt: now,
        });
      }

      // Quick advance without waiting 5 seconds
      const order = room.playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
      const curIdx = order.findIndex((idx) => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === player.id);
      const nextIdx = curIdx !== -1 ? order[curIdx + 1] : order[0];

      if (nextIdx !== undefined && IPL_PLAYERS[nextIdx]) {
        const nextPlayer = IPL_PLAYERS[nextIdx];
        await set(liveRef, {
          playerId: nextPlayer.id,
          currentBid: 0,
          highBidderId: '',
          highBidderName: 'No Bids',
          timerEndsAt: now + (room.settings?.bidTimer || 10) * 1000,
          status: 'bidding',
        });
      } else {
        // Last player: complete room
        const server = normalizeServer(currentAuction?.server || getActiveServer());
        const rtdbInstance = getRtdb(server);
        await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/room`), { status: 'completed' });
        await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/live`), { status: 'completed' });
        await flushAuctionToFirestore(roomId, server);
      }
    } catch (err) {
      console.error('[auction] skipCurrentPlayerSolo error', err);
    } finally {
      isSimulatingRef.current = false;
      endingPlayerRef.current = false;
    }
  }, [user?.uid, getSyncedTime, currentAuction?.server, flushAuctionToFirestore]);

  /**
   * Fast-forward entire remaining auction:
   * Simulates all remaining lots for bots in memory, commits teams, and finishes auction.
   */
  const fastForwardAuctionSolo = useCallback(async (roomId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) {
      updateLocalSoloState({ type: 'FAST_FORWARD', now: Date.now() });
      return;
    }

    if (isSimulatingRef.current || endingPlayerRef.current) return;
    isSimulatingRef.current = true;
    endingPlayerRef.current = true;

    try {
      const liveRef = ref(rtdb, `auctions/${roomId}/live`);
      const roomRef = ref(rtdb, `auctions/${roomId}/room`);
      const teamsRef = ref(rtdb, `auctions/${roomId}/teams`);

      const [liveSnap, roomSnap, teamsSnap] = await Promise.all([
        get(liveRef),
        get(roomRef),
        get(teamsRef),
      ]);

      if (!roomSnap.exists()) return;
      const room = roomSnap.val();
      const live = liveSnap.exists() ? liveSnap.val() : null;
      const teamsVal = teamsSnap.exists() ? teamsSnap.val() : {};
      const allTeams = Object.values(teamsVal);

      // Explicitly reject if cloud room is not a solo bot room!
      if (!isSoloBotRoom(room.players || allTeams)) {
        console.warn('[auction] fastForwardAuctionSolo rejected: not a solo bot room');
        return;
      }

      const order = room.playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
      const currentPlayerId = live?.playerId;
      const currentIdx = order.findIndex((idx) => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === currentPlayerId);

      const { simulatedTeams } = simulateRemainingAuction({
        playerOrder: order,
        currentPlayerIndex: currentIdx !== -1 ? currentIdx : 0,
        currentLive: live,
        humanUserId: user?.uid,
        humanTeamId: team?.teamId,
        teams: allTeams,
        settings: room.settings || {},
        squadLimit: toFiniteNumber(room.squadLimit, 25),
        overseasLimit: toFiniteNumber(room.overseasLimit, 8),
      });

      // Commit simulated teams to RTDB
      const teamUpdates = {};
      simulatedTeams.forEach((t) => {
        teamUpdates[`auctions/${roomId}/teams/${roomId}_${t.userId}`] = t;
      });
      await updateRtdb(ref(rtdb), teamUpdates);

      // Mark room and live status completed with fastForwarded tag
      const server = normalizeServer(currentAuction?.server || getActiveServer());
      const rtdbInstance = getRtdb(server);
      await onDisconnect(ref(rtdbInstance, `auctions/${roomId}/live`)).cancel().catch(() => {});
      await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/room`), {
        status: 'completed',
        fastForwarded: true,
      });
      await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/live`), {
        status: 'completed',
      });

      // Flush final state to Supabase / Firestore
      await flushAuctionToFirestore(roomId, server);
    } catch (err) {
      console.error('[auction] fastForwardAuctionSolo error', err);
    } finally {
      isSimulatingRef.current = false;
      endingPlayerRef.current = false;
    }
  }, [user?.uid, team?.teamId, currentAuction?.server, flushAuctionToFirestore]);

  // A finished lot is normally advanced by the client that finalized it. If
  // that client drops before its timer fires, any other client finishes the
  // sale/advance. Every step is idempotent, so duplicate attempts are harmless.
  const liveLotStatus = currentAuction?.currentAuction?.status;
  useEffect(() => {
    if (!currentAuction?.id) return undefined;

    const delay = finalizedLotRecoveryDelay(liveLotStatus);
    if (!delay) return undefined;

    const roomId = currentAuction.id;
    let timer = null;
    let attempts = 0;
    const attempt = () => {
      timer = setTimeout(async () => {
        attempts += 1;
        try {
          await endPlayerAuction(roomId);
        } catch (err) {
          console.warn('[auction] Finalized lot recovery failed', err);
        }
        // A transient failure must not leave the lot stuck; a state change
        // (advance/completion) unmounts this effect and clears the retry.
        if (attempts < 3) attempt();
      }, delay);
    };
    attempt();
    return () => clearTimeout(timer);
  }, [currentAuction?.id, currentAuction?.server, liveLotStatus, endPlayerAuction]);

  const joinRoomDb = useCallback(async (roomId, userId, playerDetails, serverHint) => {
    if (isLocalRoom(roomId, serverHint)) {
      return SERVER_LOCAL;
    }
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

      if (
        directoryServer &&
        directoryServer !== targetServer &&
        isServerAvailable(directoryServer)
      ) {
        targetServer = directoryServer;
        goOnlineServer(targetServer);
        connected = await waitForServerConnection(rtdb, 6000);
      } else {
        const otherServers = getAvailableServers()
          .map((s) => s.id)
          .filter((id) => id !== targetServer);

        for (const candidate of otherServers) {
          goOnlineServer(candidate);
          const probeConnected = await waitForServerConnection(rtdb, 4000);
          if (probeConnected) {
            targetServer = candidate;
            connected = true;
            break;
          }
        }
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

    // Multi-server probe: if the room is absent from the target database, check
    // all other configured servers so legacy, unmirrored, or misrouted rooms still load.
    if (!rtdbRoomSnap.exists()) {
      const candidates = getAvailableServers()
        .map((s) => s.id)
        .filter((id) => id !== targetServer);

      for (const candidate of candidates) {
        if (isServerAvailable(candidate)) {
          goOnlineServer(candidate);
          const probeConnected = await waitForServerConnection(getRtdb(candidate), 3000);
          if (probeConnected) {
            const probeSnap = await get(ref(getRtdb(candidate), `auctions/${roomId}/room`));
            if (probeSnap.exists()) {
              targetServer = candidate;
              connected = true;
              rtdbRoomSnap = probeSnap;
              break;
            }
          }
        }
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

    const existingPlayers = mapRoomPlayers(data.players, (p) => p);
    const playerExists = existingPlayers.find(p => p.id === userId);

    // Solo Bot Room Lock: if the room was started as a solo-vs-bots game, deny new human managers
    if (data.isSoloBotRoom && !playerExists) {
      throw new Error("This is a single-player bot auction and cannot be joined.");
    }
    
    // Preserve stats and bot flags from an existing entry; a re-join (e.g. a
    // refresh during an active auction) must not erase spent/squadCount.
    const updatedPlayer = {
      ...(playerExists || {}),
      id: userId,
      name: playerDetails.name || (playerExists ? playerExists.name : 'Manager'),
      team: playerDetails.team || (playerExists ? playerExists.team : ''),
      teamName: teamDetails?.name || (playerExists ? playerExists.teamName : 'Unknown'),
      isHost: playerExists ? playerExists.isHost : false,
      spent: toFiniteNumber(playerExists?.spent, 0),
      squadCount: toFiniteNumber(playerExists?.squadCount, 0),
    };

    const updatedPlayers = mergeRoomPlayer(existingPlayers, updatedPlayer);

    // Update RTDB (0 Firestore cost in lobby!). If the RTDB room node was
    // missing, write the full directory/Firestore snapshot so joinAuction does
    // not latch onto a partial `{ players }` room.
    const roomRef = ref(rtdb, `auctions/${roomId}/room`);
    if (roomWasMissing) {
      await set(roomRef, { ...data, players: updatedPlayers });
    } else {
      // Transaction on the roster only: two managers joining at once must both
      // survive, and the rule for room/players allows any member to write it.
      await runTransactionRtdb(ref(rtdb, `auctions/${roomId}/room/players`), (currentPlayers) =>
        mergeRoomPlayer(currentPlayers, updatedPlayer),
      );
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
    if (isLocalRoom(roomId, currentAuction?.server)) return;
    try {
      // 1+2. Remove the player and ban them in one transaction so a concurrent
      // join cannot resurrect the kicked manager's roster entry.
      const roomRef = ref(rtdb, `auctions/${roomId}/room`);
      const roomTx = await runTransactionRtdb(roomRef, (currentRoom) => {
        if (!currentRoom) return; // abort: the room is already gone
        const bannedPlayers = Array.isArray(currentRoom.bannedPlayers)
          ? currentRoom.bannedPlayers
          : Object.values(currentRoom.bannedPlayers || {});
        return {
          ...currentRoom,
          players: mapRoomPlayers(currentRoom.players, (player) => player).filter(
            (player) => player.id !== playerObj.id && player.userId !== playerObj.id,
          ),
          bannedPlayers: bannedPlayers.includes(playerObj.id)
            ? bannedPlayers
            : [...bannedPlayers, playerObj.id],
        };
      });
      if (!roomTx.committed) return;

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

  const takeOverSoloAuction = useCallback(async () => {
    if (localSoloStealFnRef.current) {
      try {
        const stolen = await localSoloStealFnRef.current();
        if (stolen?.acquired) {
          isSoloLockHeldRef.current = true;
          localSoloLockReleaseRef.current = stolen.release;
          setSoloLockStatus('active');
          soloBotLoopRef.current?.start();
        }
      } catch (err) {
        console.error('[solo] Failed to take over session lock', err);
      }
    }
  }, []);

  const joinLocalSoloAuction = useCallback((auctionId, userId) => {
    clearConnectionAlert();
    setLoading(true);

    const saved = loadLocalSoloRoom(auctionId);
    if (!saved) {
      setCurrentAuction(null);
      setLoading(false);
      return () => {};
    }

    enterLocalMode();
    localSoloStateRef.current = saved;
    const initialLot = saved.currentAuction || saved.currentLot;
    setCurrentAuction({
      ...saved,
      currentAuction: initialLot,
      currentLot: initialLot,
      isSoloBotRoom: true,
      server: SERVER_LOCAL,
    });
    const teamsList = saved.roomTeams || saved.teams || [];
    setRoomTeams(teamsList);
    setMessages(saved.messages || []);
    const humanTeam = teamsList.find(
      (t) => t.userId === userId || t.userId === user?.uid || !String(t.userId).startsWith('bot_'),
    );
    if (humanTeam) {
      setTeam({
        ...humanTeam,
        id: humanTeam.teamId || humanTeam.id,
        teamId: humanTeam.teamId || humanTeam.id,
        team: humanTeam.teamId || humanTeam.id,
      });
    }
    setLoading(false);

    let lockActive = true;
    isSoloLockHeldRef.current = false;

    // Use createSoloStateManager to manage local solo room transitions & lease verification
    const stateManager = createSoloStateManager({
      initialState: saved,
      isLockHeldRef: isSoloLockHeldRef,
      onSave: saveLocalSoloRoom,
      onStateChange: (next) => {
        localSoloStateRef.current = next;
        const activeLot = next.currentAuction || next.currentLot;
        setCurrentAuction({
          ...next,
          currentAuction: activeLot,
          currentLot: activeLot,
          isSoloBotRoom: true,
          server: SERVER_LOCAL,
        });
        const updatedTeamsList = next.roomTeams || next.teams || [];
        setRoomTeams(updatedTeamsList);
        setMessages(next.messages || []);
        const nextHumanTeam = updatedTeamsList.find(
          (t) => t.userId === userId || t.userId === user?.uid || !String(t.userId).startsWith('bot_'),
        );
        if (nextHumanTeam) {
          setTeam({
            ...nextHumanTeam,
            id: nextHumanTeam.teamId || nextHumanTeam.id,
            teamId: nextHumanTeam.teamId || nextHumanTeam.id,
            team: nextHumanTeam.teamId || nextHumanTeam.id,
          });
        }
        if (next.status === 'completed' && !next.synced) {
          persistSoloAuction(next).then((saved) => {
            if (saved) {
              saveLocalSoloRoom(next, true);
            }
          }).catch((err) => {
            console.warn('[solo] Auto-persist to Supabase failed', err);
          });
        }
      },
    });
    soloStateManagerRef.current = stateManager;

    // Use createSoloBotLoop for StrictMode safety and timestamp-driven bidding
    const botLoop = createSoloBotLoop({
      getState: () => soloStateManagerRef.current?.getState() || localSoloStateRef.current,
      updateState: (action) => updateLocalSoloState(action),
      intervalMs: 200,
      celebrate: true,
      pacing: true,
    });
    soloBotLoopRef.current = botLoop;

    const onStealCallback = () => {
      isSoloLockHeldRef.current = false;
      setSoloLockStatus('taken_over');
      soloBotLoopRef.current?.stop();
    };

    acquireSoloRoomLock(auctionId, undefined, onStealCallback).then((lockResult) => {
      if (!lockActive) {
        lockResult.release?.();
        return;
      }
      if (!lockResult.acquired) {
        isSoloLockHeldRef.current = false;
        setSoloLockStatus('blocked');
        localSoloStealFnRef.current = lockResult.steal;
        soloBotLoopRef.current?.stop();
        return;
      }
      isSoloLockHeldRef.current = true;
      localSoloLockReleaseRef.current = lockResult.release;
      setSoloLockStatus('active');
      soloBotLoopRef.current?.start();
    });

    return () => {
      lockActive = false;
      isSoloLockHeldRef.current = false;
      soloBotLoopRef.current?.stop();
      soloBotLoopRef.current = null;
      if (localSoloLockReleaseRef.current) {
        localSoloLockReleaseRef.current();
        localSoloLockReleaseRef.current = null;
      }
      localSoloStateRef.current = null;
      soloStateManagerRef.current = null;
      exitLocalMode();
    };
  }, [clearConnectionAlert, updateLocalSoloState]);

  // Listen to current auction state live
  const joinAuction = useCallback((auctionId, userId, serverHint) => {
    if (!userId) return () => {};

    const localStoreExists = Boolean(loadLocalSoloRoom(auctionId));
    if (isLocalRoom(auctionId, serverHint, localStoreExists)) {
      return joinLocalSoloAuction(auctionId, userId);
    }

    const preferredServer = normalizeServer(serverHint || getActiveServer());
    const roomServer = isServerAvailable(preferredServer)
      ? preferredServer
      : DEFAULT_AUCTION_SERVER;
    try {
      goOnlineServer(roomServer);
    } catch {
      // The watchdog below reports an unusable socket.
    }
    // Keep the room's database; the exported `rtdb` binding can move if another
    // room on a different server is opened before this cleanup runs.
    const roomRtdb = getRtdb(roomServer);

    setLoading(true);
    const sessions = serverSessionsRef.current;
    sessions.acquire(roomServer);
    let alive = true;
    const pendingTimeouts = new Set();
    const schedule = (fn, ms) => {
      const id = setTimeout(() => {
        pendingTimeouts.delete(id);
        if (alive) fn();
      }, ms);
      pendingTimeouts.add(id);
      return id;
    };

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
    const myPresenceRef = ref(roomRtdb, `auctions/${auctionId}/presence/${userId}`);
    const connectedRef = ref(roomRtdb, '.info/connected');
    const roomLiveRef = ref(roomRtdb, `auctions/${auctionId}/live`);
    
    // ── Bug Fix: Declare shared state vars BEFORE any onValue subscriptions that reference them ──
    // Previously currentRoomData was declared at line 658 but referenced inside the onValue(connectedRef)
    // callback above at line 648. JavaScript 'let' is in the TDZ until its declaration line runs,
    // so if the callback fired before that point it threw: "Cannot access before initialization".
    let currentRoomData = null;
    let currentRtdbData = null;
    let currentPresences = {};
    let presenceLoaded = false;
    let hostWasOnline = null; // true -> false is the only auto-pause trigger
    let disconnectPauseArmed = false;
    let armedLotId = null;

    // Multi-tab coordination for host onDisconnect handling:
    // Only the primary host tab arms onDisconnect to avoid background tabs
    // accidentally pausing the lot when closed.
    const tabId = Math.random().toString(36).slice(2);
    let isPrimaryHostTab = true;
    let hostChannel = null;

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        hostChannel = new BroadcastChannel(`auction_host_${auctionId}_${userId}`);
        hostChannel.onmessage = (event) => {
          const msg = event?.data;
          if (!msg) return;
          if (msg.type === 'claim_primary') {
            if (msg.tabId !== tabId && isPrimaryHostTab) {
              isPrimaryHostTab = false;
              disarmDisconnectPause();
            }
          } else if (msg.type === 'release_primary') {
            if (msg.tabId !== tabId && !isPrimaryHostTab && socketConnected) {
              isPrimaryHostTab = true;
              syncDisconnectPause();
            }
          }
        };
        hostChannel.postMessage({ type: 'claim_primary', tabId });
      } catch {
        // BroadcastChannel unavailable
      }
    }

    const disarmDisconnectPause = () => {
      if (disconnectPauseArmed) {
        disconnectPauseArmed = false;
        armedLotId = null;
        onDisconnect(roomLiveRef).cancel().catch(() => {});
      }
    };

    // Server-side fallback: if the host's connection drops mid-lot (tab closed,
    // crash, network loss), RTDB writes the pause itself even with no peers left.
    // The timestamp lets resume/display recover the exact remaining time.
    const syncDisconnectPause = () => {
      const isHost = currentRoomData?.hostId === userId;
      const currentLotId = currentRtdbData?.playerId;

      const shouldArm = shouldArmDisconnectPause({
        socketConnected,
        isHost,
        isPrimaryTab: isPrimaryHostTab,
        roomStatus: currentRoomData?.status,
        liveStatus: currentRtdbData?.status,
        playerId: currentLotId,
      });

      const action = resolveDisconnectAction({
        shouldArm,
        currentlyArmed: disconnectPauseArmed,
        armedLotId,
        currentLotId,
      });

      if (action === 'rearm') {
        onDisconnect(roomLiveRef).cancel().catch(() => {});
        disconnectPauseArmed = true;
        armedLotId = currentLotId;
        onDisconnect(roomLiveRef)
          .update({
            status: 'paused',
            pausedAt: serverTimestampRtdb(),
            remainingMs: null,
          })
          .catch(() => {
            disconnectPauseArmed = false;
            armedLotId = null;
          });
      } else if (action === 'arm') {
        disconnectPauseArmed = true;
        armedLotId = currentLotId;
        onDisconnect(roomLiveRef)
          .update({
            status: 'paused',
            pausedAt: serverTimestampRtdb(),
            remainingMs: null,
          })
          .catch(() => {
            disconnectPauseArmed = false;
            armedLotId = null;
          });
      } else if (action === 'cancel') {
        disarmDisconnectPause();
      }
    };

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

        // Re-arm the live-lot fallback after a reconnect. The server discards
        // onDisconnect operations once it runs them, so this is the safe reset.
        disconnectPauseArmed = false;
        armedLotId = null;
        syncDisconnectPause();
      } else {
        disconnectPauseArmed = false;
        armedLotId = null;
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
        const reporterId = Object.keys(currentPresences)
          .filter((uid) => currentPresences[uid]?.online)
          .sort()[0];
        if (reporterId === userId) {
          syncHostOnline(!!currentPresences[currentRoomData.hostId]?.online);
        }

        // Host went online -> offline: pause the live lot. This reuses the
        // presence node that host_online mirrors, so it adds no listener and no
        // Supabase call. One elected reporter writes; the pause transaction is
        // idempotent if the election changes during the transition.
        if (presenceLoaded && currentRoomData.hostId && currentRoomData.hostId !== userId) {
          const hostOnline = !!currentPresences[currentRoomData.hostId]?.online;
          const isReporter = !reporterId || reporterId === userId;
          if (hostWasOnline === true && !hostOnline && isReporter) {
            void pauseLiveLot(roomRtdb, auctionId, getSyncedTime());
          }
          hostWasOnline = hostOnline;
        }

        // Multiple host tabs recovery: if another host tab abruptly died and caused
        // a server-side disconnect pause (pausedAt without remainingMs), but this host tab
        // is still connected and online, take over leadership and resume the lot.
        if (
          presenceLoaded &&
          currentRoomData.hostId === userId &&
          !isPrimaryHostTab &&
          socketConnected &&
          currentRtdbData?.status === 'paused' &&
          currentRtdbData?.pausedAt &&
          currentRtdbData?.remainingMs == null
        ) {
          isPrimaryHostTab = true;
          void resumeAuction(auctionId);
        }

        syncDisconnectPause();

        setCurrentAuction({ 
          id: auctionId, 
          ...currentRoomData,
          players: playersWithPresence,
          currentAuction: currentRtdbData || currentRoomData.currentAuction
        });
      }
    };

    // Presence listener (all users' presence)
    const presenceRef = ref(roomRtdb, `auctions/${auctionId}/presence`);
    const unsubPresence = onValue(presenceRef, (snap) => {
      currentPresences = snap.val() || {};
      presenceLoaded = true;
      if (socketConnected && userId && currentPresences[userId]?.online === false) {
        // Multi-tab/reconnect healing: if this tab is connected but presence says false,
        // restore online status so peers don't trigger a false offline pause.
        set(myPresenceRef, {
          online: true,
          lastSeen: serverTimestampRtdb(),
        });
      }
      checkAndSet();
    });

    let didFallbackFetch = false;
    let didTeamsFallback = false;

    const unsubAuction = onValue(ref(roomRtdb, `auctions/${auctionId}/room`), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // PROACTIVE BAN CHECK: Kick user if they are banned
        if (data.bannedPlayers && data.bannedPlayers.includes(userId)) {
           window.location.href = withServerParam('/?error=kicked', roomServer);
           return;
        }

        auctionLoaded = true;
        if (!data.playerOrder) {
          get(ref(roomRtdb, `auctions/${auctionId}/playerOrder`)).then(oSnap => {
            if (!alive) return;
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
        schedule(async () => {
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
            if (!alive) return;

            if (data) {
              if (data.bannedPlayers && data.bannedPlayers.includes(userId)) {
                 window.location.href = withServerParam('/?error=kicked', roomServer);
                 return;
              }
              auctionLoaded = true;
              currentRoomData = data;
              checkAndSet();
              checkLoaded();
              // Only restore a genuinely absent room. Writing unconditionally
              // could overwrite a live auction with a stale directory snapshot.
              await runTransactionRtdb(
                ref(roomRtdb, `auctions/${auctionId}/room`),
                (current) => current ?? data,
              );
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

    const unsubLive = onValue(ref(roomRtdb, `auctions/${auctionId}/live`), (snapshot) => {
      currentRtdbData = snapshot.val();
      checkAndSet();
    }, (error) => {
      handleFirebaseError(error);
    });


    const unsubTeams = onValue(ref(roomRtdb, `auctions/${auctionId}/teams`), async (snapshot) => {
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
        schedule(async () => {
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
            if (!alive) return;

            teamsLoaded = true;
            setRoomTeams(teamsArr);

            if (userId) {
              const myTeam = teamsArr.find(t => t.id === `${auctionId}_${userId}` || t.userId === userId);
              if (myTeam) setTeam(myTeam);
              else setTeam(null);
            }
            checkLoaded();

            if (teamsArr.length > 0) {
              // Fill only absent team nodes: a delayed fallback must never reset
              // a purse/squad that live clients have already updated.
              await Promise.all(
                teamsArr.map((team) =>
                  runTransactionRtdb(
                    ref(roomRtdb, `auctions/${auctionId}/teams/${team.id}`),
                    (current) => current ?? team,
                  ),
                ),
              );
            }
          } catch(e) { handleFirebaseError(e); }
        }, 500);
      }
    }, (error) => {
      setLoading(false);
      handleFirebaseError(error);
    });

    const msgQuery = queryRtdb(ref(roomRtdb, `auctions/${auctionId}/messages`), limitToLast(50));
    const unsubMessages = onValue(msgQuery, (snapshot) => {
      messagesLoaded = true;
      if (snapshot.exists()) {
        const msgs = [];
        snapshot.forEach(child => {
          msgs.push({ id: child.key, ...child.val() });
        });
        // Sort chronologically ascending by timestamp so deterministic keys (e.g. lot_*) sort properly
        msgs.sort((a, b) => {
          const ta = toFiniteNumber(typeof a.timestamp === 'number' ? a.timestamp : a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0, 0);
          const tb = toFiniteNumber(typeof b.timestamp === 'number' ? b.timestamp : b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0, 0);
          if (ta !== tb) return ta - tb;
          return String(a.id || '').localeCompare(String(b.id || ''));
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
      // Stop delayed fallbacks/presence work belonging to this closed room.
      alive = false;
      for (const id of pendingTimeouts) clearTimeout(id);
      pendingTimeouts.clear();
      sessions.release(roomServer);

      if (hostChannel) {
        try {
          if (isPrimaryHostTab) {
            hostChannel.postMessage({ type: 'release_primary', tabId });
          }
          hostChannel.close();
        } catch {}
      }

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
        // The socket stays open for a few seconds after unmount, so onDisconnect
        // does not fire yet. Pause directly; peers do the same on the presence flip.
        void pauseLiveLot(roomRtdb, auctionId, getSyncedTime());
        // Clean navigation away from the room disarms onDisconnect so it does not
        // fire 5s later when the delayed socket closure runs.
        disarmDisconnectPause();
      }

      setCurrentAuction(null);
      setTeam(null);
      setRoomTeams([]);
      setMessages([]);

      // Allow in-flight writes and transactions to settle cleanly before closing
      // the socket, but never close it while another room on this server is open.
      setTimeout(() => {
        if (sessions.has(roomServer)) return;
        try { goOfflineServer(roomServer); } catch { /* best-effort cleanup */ }
      }, 5000);
    };
  }, [user]);

  const sendMessage = useCallback(async (roomId, text, type = 'text') => {
    return handleSoloSendMessage({
      roomId,
      server: currentAuction?.server,
      user,
      text,
      type,
      onCloudSend: async () => {
        const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
        await push(msgRef, {
          userId: user.uid,
          userName: user.displayName || 'Manager',
          text,
          type,
          timestamp: serverTimestampRtdb()
        });
      },
    });
  }, [user, currentAuction?.server]);

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

    const currentPlayerId = currentAuction.currentAuction?.playerId;
    const player = IPL_PLAYERS.find(p => p.id === currentPlayerId);
    if (!player) throw new Error("Current player not found");

    // Read the team fresh: the React `team` snapshot can be a render behind a
    // sale or another tab, which used to let a full squad/overseas team bid.
    const isLocal = isLocalRoom(currentAuction.id, currentAuction.server);
    let authoritativeTeam = team;
    if (isLocal) {
      const found = (localSoloStateRef.current?.roomTeams || roomTeams || []).find(
        (t) => t.userId === user.uid || !String(t.userId).startsWith('bot_')
      );
      if (found) authoritativeTeam = found;
    } else {
      const teamDocId = `${currentAuction.id}_${user.uid}`;
      try {
        const teamSnap = await get(ref(rtdb, `auctions/${currentAuction.id}/teams/${teamDocId}`));
        if (teamSnap.exists()) authoritativeTeam = teamSnap.val();
      } catch {
        // Offline/read failure: the live transaction still enforces the purse.
      }
    }

    const constraintError = getSquadConstraintError({
      team: authoritativeTeam,
      player,
      squadLimit: toFiniteNumber(currentAuction.squadLimit, 25),
      overseasLimit: toFiniteNumber(currentAuction.overseasLimit, 8),
      playerIndex: IPL_PLAYERS,
    });
    if (constraintError) throw new Error(constraintError);

    const authoritativeBudget = toFiniteNumber(
      authoritativeTeam.budgetRemaining,
      toFiniteNumber(team.budgetRemaining, 0),
    );
    const nextBidSnapshot = getNextBidAmount(player, currentAuction.currentAuction?.currentBid);
    if (authoritativeBudget < nextBidSnapshot) {
      throw new Error('Insufficient budget to place this bid.');
    }

    if (isLocalRoom(currentAuction.id, currentAuction.server)) {
      updateLocalSoloState({
        type: 'PLACE_BID',
        amount: nextBidSnapshot,
        bidderId: user.uid,
        bidderName: user.displayName || 'Manager',
        bidderTeam: authoritativeTeam.teamId || team.teamId,
        now: Date.now(),
      });
      return;
    }

    try {
      const liveRef = ref(rtdb, `auctions/${currentAuction.id}/live`);
      const txResult = await runTransactionRtdb(liveRef, (currentData) => transactBid(currentData, {
        userId: user.uid,
        userName: user.displayName || 'Manager',
        teamId: authoritativeTeam.teamId || team.teamId,
        playerId: currentPlayerId,
        now: getSyncedTime(),
        timerMs: (currentAuction.settings?.bidTimer || 10) * 1000,
        budget: authoritativeBudget,
        basePrice: player.basePrice,
      }));

      if (!txResult.committed) {
        throw new Error("Bid failed: Another manager placed a higher bid or timer expired.");
      }
    } catch (err) {
      handleFirebaseError(err);
      throw err;
    }
  }, [currentAuction, user, team, getSyncedTime, handleFirebaseError]);

  const updatePlayerTeam = useCallback(async (roomId, userId, newTeamId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) return;
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    
    const data = rtdbRoomSnap.val();
    const teamDetails = TEAMS.find(t => t.id === newTeamId);

    // Transaction on the roster only: a concurrent join/kick must not be lost.
    await runTransactionRtdb(ref(rtdb, `auctions/${roomId}/room/players`), (currentPlayers) =>
      mapRoomPlayers(currentPlayers, (p) =>
        p.id === userId
          ? { ...p, team: newTeamId, teamName: teamDetails?.name || 'Unknown' }
          : p,
      ),
    );

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
    if (isLocalRoom(roomId, currentAuction?.server)) {
      updateLocalSoloState({ type: 'UPDATE_SETTINGS', settings, now: Date.now() });
      return;
    }
    await updateRtdb(ref(rtdb, `auctions/${roomId}/room`), { settings });
  }, [currentAuction?.server, updateLocalSoloState]);

  const pauseAuction = useCallback(async (roomId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) {
      updateLocalSoloState({ type: 'PAUSE_AUCTION', now: Date.now() });
      return;
    }

    if (!user || !currentAuction || currentAuction.hostId !== user.uid) return;

    // Prevent pause race condition: only pause if actively bidding and > 2s remaining
    const tx = await pauseLiveLot(rtdb, roomId, getSyncedTime());

    if (!tx.committed) return;

    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction PAUSED by Admin`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [user, currentAuction, getSyncedTime, updateLocalSoloState]);

  const resumeAuction = useCallback(async (roomId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) {
      updateLocalSoloState({ type: 'RESUME_AUCTION', now: Date.now() });
      return;
    }

    if (!user || !currentAuction || currentAuction.hostId !== user.uid) return;
    
    const liveRef = ref(rtdb, `auctions/${roomId}/live`);
    const now = getSyncedTime();

    // Only resume if currently paused; restore remainingMs (minimum 2s)
    const tx = await runTransactionRtdb(liveRef, (currentLive) => {
      if (!currentLive || currentLive.status !== 'paused') return;
      // A server-side disconnect pause carries only pausedAt, not remainingMs.
      const resumeMs = Math.max(
        2000,
        pausedRemainingMs(currentLive) || (currentAuction.settings?.bidTimer || 10) * 1000,
      );
      return {
        ...currentLive,
        status: 'bidding',
        timerEndsAt: now + resumeMs,
        remainingMs: null,
        pausedAt: null
      };
    });

    if (!tx.committed) return;

    const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
    await push(msgRef, {
      userId: 'system',
      userName: 'System',
      text: `Auction RESUMED by Admin`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });
  }, [getSyncedTime, user, currentAuction]);

  const endAuction = useCallback(async (roomId) => {
    const isLocal = isLocalRoom(roomId, currentAuction?.server);
    if (!isLocal && (!user || !currentAuction || currentAuction.hostId !== user.uid)) return;

    const soloResult = await handleSoloEndAuction({
      roomId,
      server: currentAuction?.server,
      isHost: isLocal ? true : currentAuction.hostId === user?.uid,
      updateLocalSoloState,
      saveLocalSoloRoom,
      navigate,
      onPersist: persistSoloAuction,
    });
    if (soloResult.handled) {
      return;
    }

    const server = normalizeServer(currentAuction?.server || getActiveServer());
    const rtdbInstance = getRtdb(server);

    // 1. Cancel onDisconnect immediately so it cannot fire on an ending auction.
    await onDisconnect(ref(rtdbInstance, `auctions/${roomId}/live`)).cancel().catch(() => {});

    // 2. Mark the room completed (authoritative status, triggers redirect to /summary).
    await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/room`), { status: 'completed' });
    await push(ref(rtdbInstance, `auctions/${roomId}/messages`), {
      userId: 'system',
      userName: 'System',
      text: `Auction COMPLETED by Admin`,
      type: 'log',
      timestamp: serverTimestampRtdb()
    });

    // 3. Mark the lot completed (or paused as fallback if deployed database rules haven't whitelisted 'completed' yet)
    //    so pending timers/transactions abort cleanly without blocking completion.
    try {
      await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/live`), { status: 'completed' });
    } catch {
      try {
        await updateRtdb(ref(rtdbInstance, `auctions/${roomId}/live`), { status: 'paused' });
      } catch {}
    }

    // 3. Delete only after the completed snapshot reached Supabase.
    const persisted = await flushAuctionToFirestore(roomId, server);
    if (persisted) {
      setTimeout(async () => {
        try {
          await remove(ref(rtdbInstance, `auctions/${roomId}`));
        } catch {
          // Best-effort cleanup: the room may already be gone.
        }
      }, 30000);
    }
  }, [user, currentAuction, updateLocalSoloState, navigate, flushAuctionToFirestore, persistSoloAuction]);



  // ─── Bot Management & Bidding Engine ───

  const placeBotBid = useCallback(async (roomId, botUserId, botTeamId, botName, timerSeconds = 10, maxValuation = Infinity, botBudget = Infinity, expectedPlayerId) => {
    if (!roomId) return;
    const liveRef = ref(rtdb, `auctions/${roomId}/live`);

    await runTransactionRtdb(liveRef, (currentData) => {
      if (!currentData) return currentData;
      if (currentData.status !== 'bidding') return; // abort
      // A delayed bot decision must never bid on the lot that replaced it.
      if (expectedPlayerId && currentData.playerId !== expectedPlayerId) return;
      if (currentData.highBidderId === botUserId) return; // abort

      const now = getSyncedTime();
      // Reject if timer has already expired server-side
      if (currentData.timerEndsAt && now >= currentData.timerEndsAt) return;

      const player = IPL_PLAYERS.find(p => p.id === currentData.playerId);
      const nAmount = getNextBidAmount(player, currentData.currentBid);

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
    if (isLocalRoom(roomId, currentAuction?.server)) return;
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    const data = rtdbRoomSnap.val();
    const teamDetails = TEAMS.find(t => t.id === teamId);
    if (!teamDetails) return;

    const botUserId = `bot_${teamId}`;
    const botName = `${teamDetails.name} Bot`;

    const playersTx = await runTransactionRtdb(
      ref(rtdb, `auctions/${roomId}/room/players`),
      (currentPlayers) => {
        const players = mapRoomPlayers(currentPlayers, (p) => p);
        if (players.some(p => p.id === botUserId || p.team === teamId)) return; // abort
        return [...players, {
          id: botUserId,
          name: botName,
          team: teamId,
          teamName: teamDetails.name,
          isHost: false,
          isBot: true,
        }];
      },
    );
    if (!playersTx.committed) return;

    const teamDataToSet = {
      auctionId: roomId,
      userId: botUserId,
      teamId,
      teamName: teamDetails.name,
      budgetRemaining: toFiniteNumber(data.settings?.budget, 120.0),
      spent: 0,
      squad: []
    };
    await runTransactionRtdb(
      ref(rtdb, `auctions/${roomId}/teams/${roomId}_${botUserId}`),
      (current) => current ?? teamDataToSet,
    );
  }, []);

  const removeBotTeam = useCallback(async (roomId, botUserId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) return;
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;

    await runTransactionRtdb(
      ref(rtdb, `auctions/${roomId}/room/players`),
      (currentPlayers) =>
        mapRoomPlayers(currentPlayers, (p) => p).filter(p => p.id !== botUserId),
    );

    await set(ref(rtdb, `auctions/${roomId}/teams/${roomId}_${botUserId}`), null);
  }, []);

  const fillEmptyTeamsWithBots = useCallback(async (roomId) => {
    if (isLocalRoom(roomId, currentAuction?.server)) return;
    const rtdbRoomSnap = await get(ref(rtdb, `auctions/${roomId}/room`));
    if (!rtdbRoomSnap.exists()) return;
    const data = rtdbRoomSnap.val();
    const budget = toFiniteNumber(data.settings?.budget, 120.0);

    const playersTx = await runTransactionRtdb(
      ref(rtdb, `auctions/${roomId}/room/players`),
      (currentPlayers) => {
        const players = mapRoomPlayers(currentPlayers, (p) => p);
        const takenTeamIds = new Set(players.map(p => p.team).filter(Boolean));
        const bots = TEAMS
          .filter(t => !takenTeamIds.has(t.id))
          .map(t => ({
            id: `bot_${t.id}`,
            name: `${t.name} Bot`,
            team: t.id,
            teamName: t.name,
            isHost: false,
            isBot: true,
          }));
        return bots.length > 0 ? [...players, ...bots] : players;
      },
    );

    // Create only absent team nodes so a concurrent live sale is never reset.
    const players = mapRoomPlayers(playersTx.snapshot.val(), (p) => p);
    await Promise.all(
      players
        .filter(p => p.isBot && String(p.id).startsWith('bot_'))
        .map((p) => {
          const teamDetails = TEAMS.find(t => t.id === p.team);
          if (!teamDetails) return null;
          return runTransactionRtdb(
            ref(rtdb, `auctions/${roomId}/teams/${roomId}_${p.id}`),
            (current) => current ?? {
              auctionId: roomId,
              userId: p.id,
              teamId: teamDetails.id,
              teamName: teamDetails.name,
              budgetRemaining: budget,
              spent: 0,
              squad: [],
            },
          );
        })
        .filter(Boolean),
    );
  }, []);

  // Guard ref: track the last timer cycle that a bot bid was queued for.
  // currentAuction re-renders on every snapshot (including presence), so the
  // scheduled timer must survive those renders instead of being cancelled.
  const lastBotBidCycleRef = React.useRef(null);
  const botTimerRef = React.useRef(null);
  const cancelBotTimer = React.useCallback(() => {
    if (!botTimerRef.current) return;
    clearTimeout(botTimerRef.current);
    botTimerRef.current = null;
  }, []);

  useEffect(() => () => cancelBotTimer(), [cancelBotTimer]);

  // Host Bidding Bot Loop Effect (Cloud RTDB)
  useEffect(() => {
    if (!currentAuction || !user || currentAuction.hostId !== user.uid) {
      cancelBotTimer();
      return;
    }
    if (currentAuction.currentAuction?.status !== 'bidding') {
      cancelBotTimer();
      return;
    }

    const botPlayers = (currentAuction.players || []).filter(p => p.isBot || p.id.startsWith('bot_'));
    if (botPlayers.length === 0) {
      cancelBotTimer();
      return;
    }

    const live = currentAuction.currentAuction;
    if (!live || live.status !== 'bidding') {
      cancelBotTimer();
      return;
    }

    const player = IPL_PLAYERS.find(p => p.id === live.playerId);
    if (!player) {
      cancelBotTimer();
      return;
    }

    // A timer cycle is identified by its lot + timerEndsAt. A bid changes
    // timerEndsAt, which legitimately opens a new cycle.
    const cycleKey = `${currentAuction.id}_${live.playerId}_${live.timerEndsAt}`;
    if (lastBotBidCycleRef.current === cycleKey) return;

    const now = getSyncedTime();
    const timerSec = currentAuction.settings?.bidTimer || 10;
    const timerMs = timerSec * 1000;
    const remainingMs = Math.max(0, (live.timerEndsAt || 0) - now);
    const cBid = live.currentBid || 0;

    // If timer has already expired, don't schedule anything
    if (remainingMs <= 0) {
      cancelBotTimer();
      return;
    }
    lastBotBidCycleRef.current = cycleKey;

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

    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    botTimerRef.current = setTimeout(async () => {
      botTimerRef.current = null;
      // Another cycle superseded this one while the timer was pending.
      if (lastBotBidCycleRef.current !== cycleKey) return;

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
              botTeam.budgetRemaining ?? initialBudget,
              live.playerId,
            );
          } catch (e) {
            // A failed bot bid is non-fatal: the auction continues for humans.
            console.warn('[auction] Bot bid attempt failed', e);
          }
          break; // 1 bid per delay tick
        }
      }
    }, delayMs);
  }, [currentAuction, user, roomTeams, placeBotBid, getSyncedTime, cancelBotTimer]);

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
    skipCurrentPlayerSolo,
    fastForwardAuctionSolo,
    getSyncedTime,
    soloLockStatus,
    takeOverSoloAuction
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
};