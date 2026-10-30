import { IPL_PLAYERS } from '../data/players.js';
import { evaluateBotBid } from './botEngine.js';
import { toFiniteNumber } from './auctionDisplay.js';

export const TEAMS = [
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

const LOCAL_STORAGE_PREFIX = 'ipl-auction:local-room:';

// In-memory fallback if localStorage is disabled or in non-browser env
const memoryStore = new Map();

let activeSupabase = null;

export function setSupabaseClient(client) {
  activeSupabase = client;
}

export function getLocalRoomKey(roomId) {
  return `${LOCAL_STORAGE_PREFIX}${roomId}`;
}

/**
 * Push room state to the local hotspot dev bridge server.
 * Enables sync across Incognito, different browsers, and other devices on local Wi-Fi.
 */
export async function syncRoomToServer(roomId, roomData) {
  if (typeof window === 'undefined' || !window.fetch) return;
  try {
    await fetch(`/api/hotspot-room/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
  } catch {
    // Ignore fetch errors (e.g. offline or static server)
  }
}

/**
 * Fetch room state from the local hotspot dev bridge server.
 */
export async function fetchRoomFromServer(roomId) {
  if (typeof window === 'undefined' || !window.fetch) return null;
  try {
    const res = await fetch(`/api/hotspot-room/${encodeURIComponent(roomId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        memoryStore.set(roomId, data);
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(getLocalRoomKey(roomId), JSON.stringify(data));
          } catch {
            // Ignore storage errors
          }
        }
        return data;
      }
    }
  } catch {
    // Ignore network errors
  }
  return null;
}

export function readLocalRoom(roomId) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(getLocalRoomKey(roomId));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[hotspot] Failed to read from localStorage', e);
    }
  }
  return memoryStore.get(roomId) || null;
}

export function writeLocalRoom(roomId, roomData) {
  const serialized = JSON.stringify(roomData);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(getLocalRoomKey(roomId), serialized);
    } catch (e) {
      console.warn('[hotspot] Failed to write to localStorage', e);
    }
  }
  memoryStore.set(roomId, roomData);

  // Sync to local bridge server (bridges normal tabs, incognito, and LAN devices)
  syncRoomToServer(roomId, roomData);

  // Broadcast to other tabs & windows in the same profile
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(`hotspot_room_${roomId}`);
      channel.postMessage({ type: 'ROOM_UPDATE', roomId, state: roomData });
      channel.close();
    } catch {
      // Ignore broadcast channel errors
    }
  }

  // Dispatch custom in-window event for instant intra-window subscriber updates
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('hotspot-room-update', {
          detail: { roomId, state: roomData },
        }),
      );
    } catch {
      // Ignore event dispatch errors
    }
  }

  return roomData;
}

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate randomized player order maintaining Marquee precedence and role balancing
 */
export function generateLocalPlayerOrder(auctionType = 'mega') {
  let targetPlayers = IPL_PLAYERS.length;
  if (auctionType === 'sprint11') targetPlayers = 150;
  else if (auctionType === 'sprint5') targetPlayers = 75;

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

  const selectedPlayersByRole = new Set(marqueeIndices);
  const nonMarqueeTarget = Math.max(0, targetPlayers - marqueeIndices.length);
  const nonMarqueeTotal = IPL_PLAYERS.length - marqueeIndices.length;
  const fraction = nonMarqueeTotal > 0 ? nonMarqueeTarget / nonMarqueeTotal : 1;

  Object.keys(nonMarqueeIndicesByRole).forEach((roleName) => {
    const roleIndices = nonMarqueeIndicesByRole[roleName];
    const shuffledRole = shuffleArray(roleIndices);
    const limit =
      auctionType === 'mega'
        ? shuffledRole.length
        : Math.max(1, Math.ceil(shuffledRole.length * fraction));
    shuffledRole.slice(0, limit).forEach((idx) => selectedPlayersByRole.add(idx));
  });

  const sets = [...new Set(IPL_PLAYERS.map((p) => p.set))];
  let randomizedIndices = [];
  sets.forEach((setName) => {
    const setIndices = IPL_PLAYERS
      .map((p, i) => (p.set === setName && selectedPlayersByRole.has(i) ? i : -1))
      .filter((i) => i !== -1);
    randomizedIndices = [...randomizedIndices, ...shuffleArray(setIndices)];
  });

  return randomizedIndices;
}

/**
 * Create a new offline hotspot room.
 */
export function createLocalRoom(
  roomId,
  userId,
  playerDetails,
  auctionType = 'mega',
  isPublic = false,
) {
  const isSprint5 = auctionType === 'sprint5';
  const isSprint11 = auctionType === 'sprint11';
  const budget = isSprint5 ? 60.0 : isSprint11 ? 90.0 : 120.0;
  const squadLimit = isSprint5 ? 5 : isSprint11 ? 11 : 25;
  const overseasLimit = isSprint5 ? 2 : isSprint11 ? 4 : 8;
  const settings = { bidTimer: 10, budget };

  const teamDetails = TEAMS.find((t) => t.id === playerDetails.team);

  const initialTeams = {};
  if (playerDetails.team) {
    const teamDocId = `${roomId}_${userId}`;
    initialTeams[teamDocId] = {
      id: teamDocId,
      auctionId: roomId,
      userId,
      teamId: playerDetails.team,
      teamName: teamDetails?.name || 'Unknown',
      budgetRemaining: budget,
      spent: 0,
      squad: [],
    };
  }

  const roomData = {
    id: roomId,
    hostId: userId,
    hostName: playerDetails.name || 'Manager',
    status: 'waiting',
    auctionType,
    isPublic: !!isPublic,
    squadLimit,
    overseasLimit,
    server: 'local',
    isLocal: true,
    createdAt: Date.now(),
    players: [
      {
        id: userId,
        name: playerDetails.name || 'Manager',
        team: playerDetails.team || '',
        teamName: teamDetails?.name || 'Unknown',
        isHost: true,
        isOnline: true,
        spent: 0,
        squadCount: 0,
      },
    ],
    bannedPlayers: [],
    settings,
    teams: initialTeams,
    live: {
      status: 'waiting',
      playerId: null,
      currentBid: 0,
      highBidderId: '',
      highBidderName: 'No Bids',
      highBidderTeamId: '',
      timerEndsAt: 0,
    },
    messages: [
      {
        id: `msg_sys_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: 'Hotspot Room created. Ready for local play!',
        type: 'log',
        timestamp: Date.now(),
      },
    ],
    presences: {
      [userId]: { online: true, lastSeen: Date.now() },
    },
  };

  writeLocalRoom(roomId, roomData);
  return {
    server: 'local',
    requestedServer: 'local',
    fellBack: false,
  };
}

/**
 * Join an existing local room or register the player in it.
 */
export async function joinLocalRoomDb(roomId, userId, playerDetails) {
  let room = readLocalRoom(roomId);
  if (!room) {
    room = await fetchRoomFromServer(roomId);
  }
  const teamDetails = TEAMS.find((t) => t.id === playerDetails?.team);

  if (!room) {
    // If joining a local room without an existing template, initialize as host/guest
    const budget = 120.0;
    room = {
      id: roomId,
      hostId: userId,
      hostName: playerDetails?.name || 'Manager',
      status: 'waiting',
      auctionType: 'mega',
      isPublic: false,
      squadLimit: 25,
      overseasLimit: 8,
      server: 'local',
      isLocal: true,
      createdAt: Date.now(),
      players: [],
      bannedPlayers: [],
      settings: { bidTimer: 10, budget },
      teams: {},
      live: { status: 'waiting' },
      messages: [],
      presences: {},
    };
  }

  // Proactive ban check
  if (room.bannedPlayers && room.bannedPlayers.includes(userId)) {
    throw new Error('You have been kicked from this local room.');
  }

  const existingPlayers = room.players || [];
  const playerIndex = existingPlayers.findIndex((p) => p.id === userId);
  const isHost = room.hostId === userId || existingPlayers.length === 0;

  const playerObj = {
    id: userId,
    name: playerDetails?.name || (playerIndex >= 0 ? existingPlayers[playerIndex].name : 'Manager'),
    team: playerDetails?.team || (playerIndex >= 0 ? existingPlayers[playerIndex].team : ''),
    teamName: teamDetails?.name || (playerIndex >= 0 ? existingPlayers[playerIndex].teamName : 'Unknown'),
    isHost,
    isOnline: true,
    spent: playerIndex >= 0 ? existingPlayers[playerIndex].spent || 0 : 0,
    squadCount: playerIndex >= 0 ? existingPlayers[playerIndex].squadCount || 0 : 0,
  };

  if (playerIndex >= 0) {
    existingPlayers[playerIndex] = { ...existingPlayers[playerIndex], ...playerObj };
  } else {
    existingPlayers.push(playerObj);
  }
  room.players = existingPlayers;

  if (playerDetails?.team) {
    const teamDocId = `${roomId}_${userId}`;
    if (!room.teams[teamDocId]) {
      const budget = toFiniteNumber(room.settings?.budget, 120.0);
      room.teams[teamDocId] = {
        id: teamDocId,
        auctionId: roomId,
        userId,
        teamId: playerDetails.team,
        teamName: teamDetails?.name || 'Unknown',
        budgetRemaining: budget,
        spent: 0,
        squad: [],
      };
    }
  }

  if (!room.presences) room.presences = {};
  room.presences[userId] = { online: true, lastSeen: Date.now() };

  writeLocalRoom(roomId, room);
  return 'local';
}

/**
 * Update player team selection in local room.
 */
export function updateLocalPlayerTeam(roomId, userId, newTeamId) {
  const room = readLocalRoom(roomId);
  if (!room) return;

  const teamDetails = TEAMS.find((t) => t.id === newTeamId);
  const budget = toFiniteNumber(room.settings?.budget, 120.0);

  room.players = (room.players || []).map((p) => {
    if (p.id === userId) {
      return {
        ...p,
        team: newTeamId,
        teamName: teamDetails?.name || 'Unknown',
      };
    }
    return p;
  });

  const teamDocId = `${roomId}_${userId}`;
  const existingTeam = room.teams ? room.teams[teamDocId] : null;

  if (!room.teams) room.teams = {};
  room.teams[teamDocId] = {
    id: teamDocId,
    auctionId: roomId,
    userId,
    teamId: newTeamId,
    teamName: teamDetails?.name || 'Unknown',
    budgetRemaining: existingTeam?.budgetRemaining ?? budget,
    spent: existingTeam?.spent ?? 0,
    squad: existingTeam?.squad || [],
  };

  writeLocalRoom(roomId, room);
}

/**
 * Fill all unassigned teams with bot players.
 */
export function fillLocalEmptyTeamsWithBots(roomId) {
  const room = readLocalRoom(roomId);
  if (!room) return;

  const existingPlayers = room.players || [];
  const takenTeamIds = new Set(existingPlayers.map((p) => p.team).filter(Boolean));
  const defaultBudget = toFiniteNumber(room.settings?.budget, 120.0);

  if (!room.teams) room.teams = {};

  TEAMS.forEach((t) => {
    if (!takenTeamIds.has(t.id)) {
      const botUserId = `bot_${t.id}`;
      const botName = `${t.name} Bot`;
      existingPlayers.push({
        id: botUserId,
        name: botName,
        team: t.id,
        teamName: t.name,
        isHost: false,
        isBot: true,
        isOnline: true,
        spent: 0,
        squadCount: 0,
      });

      const teamDocId = `${roomId}_${botUserId}`;
      room.teams[teamDocId] = {
        id: teamDocId,
        auctionId: roomId,
        userId: botUserId,
        teamId: t.id,
        teamName: t.name,
        budgetRemaining: defaultBudget,
        spent: 0,
        squad: [],
      };
    }
  });

  room.players = existingPlayers;
  writeLocalRoom(roomId, room);
}

/**
 * Remove a bot team from local room.
 */
export function removeLocalBotTeam(roomId, botUserId) {
  const room = readLocalRoom(roomId);
  if (!room) return;

  room.players = (room.players || []).filter((p) => p.id !== botUserId);
  const teamDocId = `${roomId}_${botUserId}`;
  if (room.teams && room.teams[teamDocId]) {
    delete room.teams[teamDocId];
  }

  writeLocalRoom(roomId, room);
}

/**
 * Start the local auction.
 */
export function startLocalAuction(roomId) {
  const room = readLocalRoom(roomId);
  if (!room) return;

  const playerOrder = generateLocalPlayerOrder(room.auctionType || 'mega');
  const firstPlayer = IPL_PLAYERS[playerOrder[0]];

  room.status = 'active';
  room.playerOrder = playerOrder;
  room.live = {
    playerId: firstPlayer.id,
    currentBid: 0,
    highBidderId: '',
    highBidderName: 'No Bids',
    highBidderTeamId: '',
    timerEndsAt: Date.now() + 15000,
    status: 'bidding',
  };

  if (!room.messages) room.messages = [];
  room.messages.push({
    id: `msg_sys_${Date.now()}`,
    userId: 'system',
    userName: 'System',
    text: 'Auction has started!',
    type: 'log',
    timestamp: Date.now(),
  });

  writeLocalRoom(roomId, room);
}

/**
 * Place a bid in the local auction.
 */
export function placeLocalBid(roomId, userId, teamId, userName, teamName) {
  const room = readLocalRoom(roomId);
  if (!room || !room.live) throw new Error('Auction not found');
  if (room.live.status !== 'bidding') throw new Error('Bidding is not open');
  if (room.live.highBidderId === userId) throw new Error('You are already the highest bidder');

  const now = Date.now();
  if (room.live.timerEndsAt && now >= room.live.timerEndsAt) {
    throw new Error('Timer has expired');
  }

  const player = IPL_PLAYERS.find((p) => p.id === room.live.playerId);
  if (!player) throw new Error('Current player not found');

  const cBid = room.live.currentBid || 0;
  const inc = cBid < 5 ? 0.20 : 0.25;
  const nextBid =
    cBid === 0
      ? toFiniteNumber(player.basePrice, 0)
      : parseFloat((cBid + inc).toFixed(2));

  // Verify bidder budget
  const teamDocId = `${roomId}_${userId}`;
  const userTeam = room.teams ? room.teams[teamDocId] : null;
  if (userTeam && userTeam.budgetRemaining !== undefined && userTeam.budgetRemaining < nextBid) {
    throw new Error('Insufficient purse budget');
  }

  const timerSec = room.settings?.bidTimer || 10;
  room.live.currentBid = nextBid;
  room.live.highBidderId = userId;
  room.live.highBidderName = userName || 'Manager';
  room.live.highBidderTeamId = teamId || '';
  room.live.timerEndsAt = now + timerSec * 1000;

  if (!room.messages) room.messages = [];
  room.messages.push({
    id: `msg_bid_${Date.now()}`,
    userId,
    userName: userName || 'Manager',
    text: `Bid \u20b9${nextBid} Cr by ${teamName || userName}`,
    type: 'bid',
    timestamp: Date.now(),
  });

  writeLocalRoom(roomId, room);
  return room;
}

/**
 * Place a bot bid in the local room.
 */
export function placeLocalBotBid(
  roomId,
  botUserId,
  botTeamId,
  botName,
  timerSeconds = 10,
  maxValuation = Infinity,
  botBudget = Infinity,
) {
  const room = readLocalRoom(roomId);
  if (!room || !room.live || room.live.status !== 'bidding') return;
  if (room.live.highBidderId === botUserId) return;

  const now = Date.now();
  if (room.live.timerEndsAt && now >= room.live.timerEndsAt) return;

  const player = IPL_PLAYERS.find((p) => p.id === room.live.playerId);
  if (!player) return;

  const cBid = room.live.currentBid || 0;
  const inc = cBid < 5 ? 0.20 : 0.25;
  const nAmount =
    cBid === 0
      ? toFiniteNumber(player.basePrice, 0)
      : parseFloat((cBid + inc).toFixed(2));

  if (nAmount > maxValuation || nAmount > botBudget) return;

  room.live.currentBid = nAmount;
  room.live.highBidderId = botUserId;
  room.live.highBidderName = botName;
  room.live.highBidderTeamId = botTeamId;
  room.live.timerEndsAt = now + timerSeconds * 1000;

  writeLocalRoom(roomId, room);
}

/**
 * Conclude current player auction (sold / unsold) and advance to next.
 */
export function endLocalPlayerAuction(roomId) {
  const room = readLocalRoom(roomId);
  if (!room || !room.live || room.live.status !== 'bidding') return;

  const now = Date.now();
  if (room.live.timerEndsAt && now < room.live.timerEndsAt) return;

  const isSold = Boolean(room.live.highBidderId);
  room.live.status = isSold ? 'sold' : 'unsold';

  const player = IPL_PLAYERS.find((p) => p.id === room.live.playerId);
  const teamDetails = TEAMS.find((t) => t.id === room.live.highBidderTeamId);
  const playerNameStr = player?.name || 'Player';
  const logText = `${playerNameStr} ${
    isSold
      ? `SOLD to ${teamDetails?.name || room.live.highBidderName} for \u20b9${room.live.currentBid} Cr`
      : 'UNSOLD'
  }`;

  if (isSold) {
    const winnerId = room.live.highBidderId;
    const teamDocId = `${roomId}_${winnerId}`;

    // Update player record spent and squadCount
    room.players = (room.players || []).map((p) => {
      if (p.id === winnerId) {
        return {
          ...p,
          spent: (p.spent || 0) + room.live.currentBid,
          squadCount: (p.squadCount || 0) + 1,
        };
      }
      return p;
    });

    // Update team squad and purse
    if (!room.teams) room.teams = {};
    const tData = room.teams[teamDocId] || {
      budgetRemaining: toFiniteNumber(room.settings?.budget, 120.0),
      spent: 0,
      squad: [],
    };
    room.teams[teamDocId] = {
      ...tData,
      id: teamDocId,
      auctionId: roomId,
      userId: winnerId,
      teamId: room.live.highBidderTeamId,
      teamName: teamDetails?.name || room.live.highBidderName || 'Unknown',
      budgetRemaining: Math.max(0, (tData.budgetRemaining ?? 120.0) - room.live.currentBid),
      spent: (tData.spent || 0) + room.live.currentBid,
      squad: [...(tData.squad || []), { id: room.live.playerId, bid: room.live.currentBid }],
    };
  }

  if (!room.messages) room.messages = [];
  room.messages.push({
    id: `msg_end_${Date.now()}`,
    userId: 'system',
    userName: 'System',
    text: logText,
    type: isSold ? 'sold_card' : 'log',
    metadata: isSold
      ? {
          playerId: room.live.playerId,
          teamId: room.live.highBidderTeamId,
          bid: room.live.currentBid,
          buyerId: room.live.highBidderId,
          buyerName: room.live.highBidderName,
        }
      : null,
    timestamp: Date.now(),
  });

  writeLocalRoom(roomId, room);

  // Advance to next player after display delay
  const waitMs = isSold ? 4000 : 2000;
  setTimeout(() => {
    const current = readLocalRoom(roomId);
    if (!current || current.status !== 'active') return;

    const currentPlayerId = current.live.playerId;
    const order = current.playerOrder || Array.from({ length: IPL_PLAYERS.length }, (_, i) => i);
    const currentIndex = order.findIndex((idx) => IPL_PLAYERS[idx] && IPL_PLAYERS[idx].id === currentPlayerId);
    const nextIndex = currentIndex !== -1 ? order[currentIndex + 1] : order[0];

    if (nextIndex !== undefined && IPL_PLAYERS[nextIndex]) {
      const nextPlayer = IPL_PLAYERS[nextIndex];
      const timerSec = current.settings?.bidTimer || 10;
      current.live = {
        playerId: nextPlayer.id,
        currentBid: 0,
        highBidderId: '',
        highBidderName: 'No Bids',
        highBidderTeamId: '',
        timerEndsAt: Date.now() + timerSec * 1000,
        status: 'bidding',
      };
    } else {
      current.status = 'completed';
      current.live = {
        ...current.live,
        status: 'completed',
      };
      current.messages.push({
        id: `msg_sys_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: 'Auction COMPLETED!',
        type: 'log',
        timestamp: Date.now(),
      });
      flushLocalAuctionToSupabase(roomId).catch(() => {});
    }

    writeLocalRoom(roomId, current);
  }, waitMs);
}

/**
 * Pause local auction.
 */
export function pauseLocalAuction(roomId) {
  const room = readLocalRoom(roomId);
  if (!room || !room.live) return;

  room.live.status = 'paused';
  if (!room.messages) room.messages = [];
  room.messages.push({
    id: `msg_sys_${Date.now()}`,
    userId: 'system',
    userName: 'System',
    text: 'Auction PAUSED by Admin',
    type: 'log',
    timestamp: Date.now(),
  });

  writeLocalRoom(roomId, room);
}

/**
 * Resume local auction.
 */
export function resumeLocalAuction(roomId) {
  const room = readLocalRoom(roomId);
  if (!room || !room.live) return;

  const timerSec = room.settings?.bidTimer || 10;
  room.live.status = 'bidding';
  room.live.timerEndsAt = Date.now() + timerSec * 1000;

  if (!room.messages) room.messages = [];
  room.messages.push({
    id: `msg_sys_${Date.now()}`,
    userId: 'system',
    userName: 'System',
    text: 'Auction RESUMED by Admin',
    type: 'log',
    timestamp: Date.now(),
  });

  writeLocalRoom(roomId, room);
}

/**
 * Optional best-effort flush to Supabase when auction finishes.
 * If internet is available, saves a persistent cloud backup of completed squads
 * into Supabase without consuming any Firebase RTDB quota.
 * If offline, quietly skips without interrupting the local summary flow.
 */
export async function flushLocalAuctionToSupabase(roomId) {
  if (!activeSupabase) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  try {
    const room = readLocalRoom(roomId);
    if (!room) return;

    await activeSupabase.from('auctions').upsert({
      id: roomId,
      host_id: room.hostId || '',
      host_name: room.hostName || 'Manager',
      status: 'completed',
      auction_type: room.auctionType || 'mega',
      players: room.players || [],
      settings: room.settings || {},
      banned_players: room.bannedPlayers || [],
      is_public: false,
      server: 'local',
    });

    const supabaseTeams = Object.values(room.teams || {}).map((t) => ({
      id: `${roomId}_${t.userId}`,
      auction_id: roomId,
      user_id: t.userId,
      team_id: t.teamId || '',
      team_name: t.teamName || 'Unknown',
      budget_remaining: t.budgetRemaining ?? 120.0,
      spent: t.spent ?? 0,
      squad: t.squad || [],
    }));

    if (supabaseTeams.length > 0) {
      await activeSupabase.from('teams').upsert(supabaseTeams);
    }
  } catch (err) {
    // Safe non-blocking fallback: offline rooms never depend on cloud sync
    console.warn('[hotspot] Optional Supabase sync skipped', err);
  }
}

/**
 * End local auction immediately.
 */
export function endLocalAuction(roomId) {
  const room = readLocalRoom(roomId);
  if (!room) return;

  room.status = 'completed';
  if (room.live) room.live.status = 'completed';

  if (!room.messages) room.messages = [];
  room.messages.push({
    id: `msg_sys_${Date.now()}`,
    userId: 'system',
    userName: 'System',
    text: 'Auction COMPLETED by Admin',
    type: 'log',
    timestamp: Date.now(),
  });

  writeLocalRoom(roomId, room);
  flushLocalAuctionToSupabase(roomId).catch(() => {});
}

/**
 * Send chat message in local auction.
 */
export function sendLocalMessage(roomId, userId, userName, text, type = 'text') {
  const room = readLocalRoom(roomId);
  if (!room) return;

  if (!room.messages) room.messages = [];
  room.messages.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    userName: userName || 'Manager',
    text,
    type,
    timestamp: Date.now(),
  });

  writeLocalRoom(roomId, room);
}

/**
 * Kick a player from local room.
 */
export function kickLocalPlayer(roomId, targetUserId) {
  const room = readLocalRoom(roomId);
  if (!room) return;

  if (!room.bannedPlayers) room.bannedPlayers = [];
  if (!room.bannedPlayers.includes(targetUserId)) {
    room.bannedPlayers.push(targetUserId);
  }

  room.players = (room.players || []).filter((p) => p.id !== targetUserId);
  const teamDocId = `${roomId}_${targetUserId}`;
  if (room.teams && room.teams[teamDocId]) {
    delete room.teams[teamDocId];
  }

  writeLocalRoom(roomId, room);
}

/**
 * Update room settings in local room.
 */
export function updateLocalRoomSettings(roomId, settings) {
  const room = readLocalRoom(roomId);
  if (!room) return;

  room.settings = { ...(room.settings || {}), ...settings };
  writeLocalRoom(roomId, room);
}

/**
 * Subscribe to local room state updates with full real-time synchronization.
 */
export function subscribeLocalRoom(
  roomId,
  userId,
  { setCurrentAuction, setRoomTeams, setTeam, setMessages, setLoading },
) {
  let isSubscribed = true;

  const pushStateToContext = (room) => {
    if (!room || !isSubscribed) return;

    const presences = room.presences || {};
    const playersWithPresence = (room.players || []).map((p) => ({
      ...p,
      isOnline: presences[p.id]?.online !== false,
      lastSeen: presences[p.id]?.lastSeen || Date.now(),
    }));

    const teamsArr = Object.values(room.teams || {}).map((t) => ({
      id: `${roomId}_${t.userId}`,
      ...t,
    }));

    setRoomTeams(teamsArr);

    if (userId) {
      const myTeam = teamsArr.find(
        (t) => t.id === `${roomId}_${userId}` || t.userId === userId,
      );
      setTeam(myTeam || null);
    }

    const messagesArr = (room.messages || []).slice(-20);
    setMessages(messagesArr);

    setCurrentAuction({
      id: roomId,
      ...room,
      players: playersWithPresence,
      currentAuction: room.live,
    });

    setLoading(false);
  };

  // Initial load
  const initial = readLocalRoom(roomId);
  if (initial) {
    pushStateToContext(initial);
  }

  // Probe local bridge server (bridges Incognito, separate browsers, LAN devices)
  fetchRoomFromServer(roomId).then((serverData) => {
    if (!isSubscribed) return;
    if (serverData) {
      pushStateToContext(serverData);
    } else if (!readLocalRoom(roomId)) {
      // If room truly does not exist on server either, initialize template
      joinLocalRoomDb(roomId, userId, { name: 'Manager' }).then(() => {
        if (!isSubscribed) return;
        const fresh = readLocalRoom(roomId);
        if (fresh) pushStateToContext(fresh);
      });
    }
  });

  // Cross-tab broadcast channel listener
  let broadcastChannel = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(`hotspot_room_${roomId}`);
      broadcastChannel.onmessage = (event) => {
        if (event.data?.roomId === roomId && event.data?.state) {
          pushStateToContext(event.data.state);
        }
      };
    } catch {
      // BroadcastChannel disabled
    }
  }

  // Background bridge polling: keeps normal tabs, incognito windows & LAN peers in lockstep
  const serverPollInterval = setInterval(async () => {
    if (!isSubscribed) return;
    const serverState = await fetchRoomFromServer(roomId);
    if (!isSubscribed || !serverState) return;

    const localState = readLocalRoom(roomId);
    if (!localState || JSON.stringify(serverState) !== JSON.stringify(localState)) {
      memoryStore.set(roomId, serverState);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(getLocalRoomKey(roomId), JSON.stringify(serverState));
        } catch {
          // Ignore
        }
      }
      pushStateToContext(serverState);
    }
  }, 1200);

  // Local storage storage-event listener
  const onStorage = (event) => {
    if (event.key === getLocalRoomKey(roomId) && event.newValue) {
      try {
        const state = JSON.parse(event.newValue);
        pushStateToContext(state);
      } catch {
        // parse error
      }
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  // Same-window custom event listener
  const onLocalSync = (event) => {
    if (event.detail?.roomId === roomId && event.detail?.state) {
      pushStateToContext(event.detail.state);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('hotspot-room-update', onLocalSync);
  }

  // Presence heartbeat
  const presenceInterval = setInterval(() => {
    if (!isSubscribed) return;
    const room = readLocalRoom(roomId);
    if (room) {
      if (!room.presences) room.presences = {};
      room.presences[userId] = { online: true, lastSeen: Date.now() };
      writeLocalRoom(roomId, room);
    }
  }, 4000);

  // Host Countdown & Bot Automation Loop
  let lastBotCycle = null;
  const hostEngineInterval = setInterval(() => {
    if (!isSubscribed) return;
    const room = readLocalRoom(roomId);
    if (!room || room.hostId !== userId) return;

    const live = room.live;
    if (!live || live.status !== 'bidding') return;

    const now = Date.now();

    // 1. Timer Expiry Check
    if (live.timerEndsAt && now >= live.timerEndsAt) {
      endLocalPlayerAuction(roomId);
      return;
    }

    // 2. Bot Bidding Automation
    const botPlayers = (room.players || []).filter(
      (p) => p.isBot || p.id.startsWith('bot_'),
    );
    if (botPlayers.length === 0) return;

    const player = IPL_PLAYERS.find((p) => p.id === live.playerId);
    if (!player) return;

    const cycleKey = `${live.playerId}_${live.timerEndsAt}`;
    if (lastBotCycle === cycleKey) return;
    lastBotCycle = cycleKey;

    const timerSec = room.settings?.bidTimer || 10;
    const timerMs = timerSec * 1000;
    const remainingMs = Math.max(0, live.timerEndsAt - now);
    const cBid = live.currentBid || 0;

    let delayMs = 500;
    if (cBid < 3.0) {
      delayMs = Math.min(1000, timerMs * (0.08 + Math.random() * 0.15));
    } else {
      delayMs = timerMs * (0.25 + Math.random() * 0.3);
    }
    delayMs = Math.max(300, Math.min(delayMs, Math.max(300, remainingMs - 300)));

    const initialBudget = toFiniteNumber(room.settings?.budget, 120.0);
    const teamsArr = Object.values(room.teams || {});

    setTimeout(() => {
      if (!isSubscribed) return;
      const latestRoom = readLocalRoom(roomId);
      if (!latestRoom || latestRoom.live?.status !== 'bidding') return;
      if (latestRoom.live.playerId !== live.playerId) return;

      const eligibleBots = shuffleArray(
        botPlayers.filter((p) => p.id !== latestRoom.live.highBidderId),
      );
      for (const botP of eligibleBots) {
        const botTeam = teamsArr.find((t) => t.userId === botP.id);
        if (!botTeam) continue;

        const bidDecision = evaluateBotBid({
          player,
          currentBid: latestRoom.live.currentBid || 0,
          highBidderId: latestRoom.live.highBidderId,
          botTeam,
          squadLimit: toFiniteNumber(latestRoom.squadLimit, 25),
          overseasLimit: toFiniteNumber(latestRoom.overseasLimit, 8),
          initialBudget,
        });

        if (bidDecision && bidDecision.shouldBid) {
          try {
            placeLocalBotBid(
              roomId,
              botP.id,
              botP.team,
              botP.name,
              timerSec,
              bidDecision.maxValuation,
              botTeam.budgetRemaining ?? initialBudget,
            );
          } catch {
            // Non-fatal
          }
          break;
        }
      }
    }, delayMs);
  }, 400);

  return () => {
    isSubscribed = false;
    clearInterval(presenceInterval);
    clearInterval(hostEngineInterval);
    clearInterval(serverPollInterval);

    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {
        // Ignore
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hotspot-room-update', onLocalSync);
    }

    // Mark user offline in local room
    const room = readLocalRoom(roomId);
    if (room && room.presences && room.presences[userId]) {
      room.presences[userId].online = false;
      room.presences[userId].lastSeen = Date.now();
      writeLocalRoom(roomId, room);
    }
  };
}
