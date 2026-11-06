
import { IPL_PLAYERS } from '../data/players.js';
import { evaluateBotBid } from './botEngine.js';
import { toFiniteNumber, countOverseas, isOverseasPlayer } from './auctionDisplay.js';
import { supabase } from './supabase.js';

/* ============================================================================
 * LOCAL / HOTSPOT AUCTION  (host-authoritative design)
 *
 *  - The HOST device is the only "server". It alone owns: status, live bid,
 *    timer, players, teams, purse, messages.  Every host change bumps `hostRev`.
 *  - CLIENT devices never write room state. They send small INTENTS to the host
 *    (join, pick team, bid, chat, presence) over Supabase Realtime Broadcast
 *    (+ BroadcastChannel for tabs of the same browser).
 *  - The host broadcasts full snapshots on every change + a 1s heartbeat.
 *    Clients accept a snapshot only if its hostRev is NEWER -> no stale
 *    overwrite, no ping-pong, no regression (sold -> bidding etc).
 *  - Clocks: clients run an NTP-style ping/pong against the host and keep the
 *    lowest-RTT sample as `offset`. Use getSyncedNow()/getLiveRemainingMs()
 *    in the UI. Timer expiry is decided ONLY by the host clock.
 *  - Pause stores `remainingMs`, resume continues from it.
 *  - The Supabase `auctions`/`teams` rows are a throttled, host-only backup
 *    (late joiners / reload recovery). Nobody else writes them.
 * ========================================================================== */

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
const MAX_MESSAGES = 60;
const ENGINE_TICK_MS = 150;
const SLOW_TICK_MS = 1000; // heartbeat / presence / retries
const OFFLINE_AFTER_MS = 10000;
const DB_SYNC_MS = 1500;
const FIRST_PLAYER_MS = 15000;
const SOLD_DISPLAY_MS = 4000;
const UNSOLD_DISPLAY_MS = 2000;
const RESUME_MIN_MS = 3000;
const BROADCAST_EVENTS = ['state', 'hello', 'intent', 'ping', 'pong'];

const isBrowser = typeof window !== 'undefined';
const PLAYER_BY_ID = new Map(IPL_PLAYERS.map((p) => [p.id, p]));
const memoryStore = new Map();
const runtimes = new Map();

let activeSupabase = supabase;
export function setSupabaseClient(client) {
  activeSupabase = client || supabase;
}

/* ------------------------------- small utils ------------------------------ */

const r2 = (n) => Math.round(n * 100) / 100;
let idCounter = 0;
const newId = (prefix) =>
  `${prefix}_${Date.now()}_${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const clone = (o) =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));

const shuffleArray = (array) => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function getLocalRoomKey(roomId) {
  return `${LOCAL_STORAGE_PREFIX}${roomId}`;
}

const nextBidFor = (player, currentBid) => {
  const cBid = currentBid || 0;
  if (cBid === 0) return toFiniteNumber(player?.basePrice, 0);
  return r2(cBid + (cBid < 5 ? 0.2 : 0.25));
};

/* ---------------------------------- clock --------------------------------- */
// offset = hostClock - myClock.  Host always 0.

let localHostTimeOffset = 0;
export const getLocalHostTimeOffset = () => localHostTimeOffset;
export const setLocalHostTimeOffset = (o) => {
  localHostTimeOffset = Number.isFinite(o) ? o : 0;
};
/** "Now" on the host's clock. Use this for every countdown in the UI. */
export const getSyncedNow = () => Date.now() + localHostTimeOffset;
/** Milliseconds left on the live timer (frozen while paused). */
export function getLiveRemainingMs(live) {
  if (!live) return 0;
  if (live.status === 'paused') return Math.max(0, live.remainingMs || 0);
  if (live.status !== 'bidding') return 0;
  return Math.max(0, (live.timerEndsAt || 0) - getSyncedNow());
}

/* ------------------------------ local storage ----------------------------- */

export function readLocalRoom(roomId) {
  const mem = memoryStore.get(roomId);
  if (mem) return mem;
  if (isBrowser && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(getLocalRoomKey(roomId));
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryStore.set(roomId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('[hotspot] localStorage read failed', e);
    }
  }
  return null;
}

function storeRoom(rt, room) {
  memoryStore.set(rt.roomId, room);
  if (isBrowser && window.localStorage) {
    try {
      window.localStorage.setItem(getLocalRoomKey(rt.roomId), JSON.stringify(room));
    } catch {
      // storage full / disabled -> memory only
    }
  }
  rt.listeners.forEach((fn) => {
    try {
      fn(room);
    } catch (e) {
      console.warn('[hotspot] listener error', e);
    }
  });
}

/* -------------------------------- runtime --------------------------------- */

function getRuntime(roomId) {
  let rt = runtimes.get(roomId);
  if (!rt) {
    rt = {
      roomId,
      userId: null,
      refs: 0,
      listeners: new Set(),
      bc: null,
      bcHandler: null,
      ch: null,
      ready: false,
      outbox: [],
      timers: [],
      seenIntents: new Set(),
      presenceSeen: new Map(),
      botKey: '',
      botTimer: null,
      dbTimer: null,
      dbDirty: false,
      dbChain: Promise.resolve(),
      teamsSig: '',
      lastStateAt: 0,
      slow: 0,
      clock: [],
      pingCount: 0,
      pendingProfile: null,
      joinTries: 0,
      intentSeq: 0,
    };
    runtimes.set(roomId, rt);
  }
  return rt;
}

const isHostRuntime = (rt, room) => !!room && !!rt.userId && room.hostId === rt.userId;

/* -------------------------------- transport ------------------------------- */

export function getBroadcastChannel(roomId) {
  if (typeof BroadcastChannel === 'undefined') return null;
  const rt = getRuntime(roomId);
  if (!rt.bcShared) {
    try {
      rt.bcShared = new BroadcastChannel(`hotspot_room_${roomId}`);
    } catch {
      return null;
    }
  }
  return rt.bcShared;
}

export function broadcastLocalRoom(roomId, roomData) {
  send(getRuntime(roomId), 'state', { room: roomData });
}

function send(rt, event, payload) {
  if (rt.bc) {
    try {
      rt.bc.postMessage({ event, payload });
    } catch {
      // ignore
    }
  }
  if (rt.ch) {
    if (rt.ready) {
      try {
        Promise.resolve(rt.ch.send({ type: 'broadcast', event, payload })).catch(() => {});
      } catch {
        // ignore
      }
    } else if (event !== 'state' && event !== 'ping' && rt.outbox.length < 50) {
      rt.outbox.push({ event, payload });
    }
  }
}

function openTransport(rt) {
  if (!isBrowser) return;
  const bc = getBroadcastChannel(rt.roomId);
  if (bc) {
    rt.bcHandler = (e) => {
      const m = e.data;
      if (m && m.event) onMessage(rt, m.event, m.payload);
    };
    bc.addEventListener('message', rt.bcHandler);
    rt.bc = bc;
  }

  if (isBrowser && activeSupabase && typeof activeSupabase.channel === 'function') {
    try {
      const ch = activeSupabase.channel(`hotspot_${rt.roomId}`, {
        config: { broadcast: { self: false, ack: false } },
      });
      BROADCAST_EVENTS.forEach((ev) => {
        ch.on('broadcast', { event: ev }, ({ payload }) => onMessage(rt, ev, payload));
      });
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          rt.ready = true;
          const queued = rt.outbox.splice(0);
          queued.forEach((m) => send(rt, m.event, m.payload));
          onTransportReady(rt);
        } else {
          rt.ready = false;
        }
      });
      rt.ch = ch;
    } catch (e) {
      console.warn('[hotspot] realtime channel failed', e);
    }
  }
}

function closeTransport(rt) {
  if (rt.bc && rt.bcHandler) {
    try {
      rt.bc.removeEventListener('message', rt.bcHandler);
    } catch {
      // ignore
    }
  }
  rt.bc = null;
  rt.bcHandler = null;
  if (rt.ch && activeSupabase && typeof activeSupabase.removeChannel === 'function') {
    try {
      activeSupabase.removeChannel(rt.ch);
    } catch {
      // ignore
    }
  }
  rt.ch = null;
  rt.ready = false;
  rt.outbox = [];
}

function onTransportReady(rt) {
  const room = readLocalRoom(rt.roomId);
  if (isHostRuntime(rt, room)) {
    send(rt, 'state', { room });
  } else {
    send(rt, 'hello', { from: rt.userId });
    sendPing(rt);
  }
}

function onMessage(rt, event, payload) {
  if (!payload) return;
  switch (event) {
    case 'state':
      handleState(rt, payload.room);
      break;
    case 'hello': {
      const room = readLocalRoom(rt.roomId);
      if (isHostRuntime(rt, room)) send(rt, 'state', { room });
      break;
    }
    case 'intent':
      handleIntent(rt, payload);
      break;
    case 'ping': {
      const room = readLocalRoom(rt.roomId);
      if (isHostRuntime(rt, room)) {
        send(rt, 'pong', { t0: payload.t0, th: Date.now(), to: payload.from });
      }
      break;
    }
    case 'pong':
      handlePong(rt, payload);
      break;
    default:
  }
}

/* ------------------------------- clock sync ------------------------------- */

function sendPing(rt) {
  rt.pingCount += 1;
  send(rt, 'ping', { t0: Date.now(), from: rt.userId });
}

function handlePong(rt, p) {
  if (p.to !== rt.userId) return;
  const t1 = Date.now();
  const rtt = t1 - p.t0;
  if (rtt < 0 || rtt > 3000) return;
  rt.clock.push({ rtt, offset: p.th - (p.t0 + t1) / 2 });
  if (rt.clock.length > 8) rt.clock.shift();
  const best = rt.clock.reduce((a, b) => (b.rtt < a.rtt ? b : a));
  setLocalHostTimeOffset(Math.round(best.offset));
}

/* ----------------------------- state (clients) ---------------------------- */

function handleState(rt, incoming) {
  if (!incoming || !incoming.id) return;
  const cur = readLocalRoom(rt.roomId);
  if (cur && incoming.hostId === cur.hostId) rt.lastStateAt = Date.now();
  acceptState(rt, incoming);
}

/** Accept a snapshot only if it is newer than what we have. */
function acceptState(rt, incoming) {
  if (!incoming || !incoming.id) return false;
  const cur = readLocalRoom(rt.roomId);
  if (cur) {
    if (incoming.hostId !== cur.hostId) return false;
    if ((incoming.hostRev || 0) <= (cur.hostRev || 0)) return false;
  }
  storeRoom(rt, incoming);
  return true;
}

/** Legacy helper kept for compatibility: higher hostRev wins wholesale. */
export function mergeLocalRooms(current, incoming) {
  if (!current) return incoming;
  if (!incoming) return current;
  return (incoming.hostRev || 0) > (current.hostRev || 0) ? incoming : current;
}

/* ------------------------------ host: commit ------------------------------ */

function pushMsg(room, msg) {
  room.messages = [
    ...(room.messages || []),
    { id: newId('msg'), timestamp: Date.now(), ...msg },
  ].slice(-MAX_MESSAGES);
}
const sysMsg = (room, text, type = 'log', metadata) =>
  pushMsg(room, { userId: 'system', userName: 'System', text, type, ...(metadata ? { metadata } : {}) });

/**
 * The ONLY way room state changes. Clone -> mutate -> bump hostRev -> store ->
 * broadcast -> schedule DB backup. Return false from `mutate` to cancel.
 */
function commitHost(roomId, mutate) {
  const rt = getRuntime(roomId);
  const cur = readLocalRoom(roomId);
  if (!isHostRuntime(rt, cur)) return null;
  const draft = clone(cur);
  if (mutate(draft, rt) === false) return null;
  draft.hostRev = (cur.hostRev || 0) + 1;
  draft.hostNow = Date.now();
  storeRoom(rt, draft);
  send(rt, 'state', { room: draft });
  scheduleDbSync(rt);
  return draft;
}

/** Legacy export. Host: replaces fields. Others: only accepted if newer. */
export function writeLocalRoom(roomId, roomData) {
  const rt = getRuntime(roomId);
  const cur = readLocalRoom(roomId);
  if (!cur) {
    storeRoom(rt, roomData);
    return roomData;
  }
  if (isHostRuntime(rt, cur)) {
    return (
      commitHost(roomId, (draft) => {
        const { hostRev, ...rest } = roomData;
        Object.assign(draft, rest);
      }) || cur
    );
  }
  acceptState(rt, roomData);
  return readLocalRoom(roomId);
}

/* ------------------------------ DB backup (host) -------------------------- */

export async function syncRoomToServer(roomId, roomData) {
  if (!isBrowser) return roomData;
  const sb = activeSupabase;
  if (!sb || !roomData) return roomData;
  const rt = getRuntime(roomId);
  try {
    const { error } = await sb.from('auctions').upsert({
      id: roomId,
      host_id: roomData.hostId || '',
      host_name: roomData.hostName || 'Manager',
      status: roomData.status || 'waiting',
      auction_type: roomData.auctionType || 'mega',
      squad_limit: roomData.squadLimit || 25,
      overseas_limit: roomData.overseasLimit || 8,
      players: roomData.players || [],
      settings: {
        ...(roomData.settings || {}),
        server: 'local',
        hostRev: roomData.hostRev || 0,
        live: roomData.live,
        presences: roomData.presences,
        messages: (roomData.messages || []).slice(-30),
      },
      banned_players: roomData.bannedPlayers || [],
      player_order: roomData.playerOrder || [],
      is_public: false,
    });
    if (error) console.warn('[hotspot] auctions upsert failed', error.message || error);

    const teamsArr = Object.values(roomData.teams || {}).map((t) => ({
      id: `${roomId}_${t.userId}`,
      auction_id: roomId,
      user_id: t.userId,
      team_id: t.teamId || '',
      team_name: t.teamName || 'Unknown',
      budget_remaining: toFiniteNumber(t.budgetRemaining, 120.0),
      spent: toFiniteNumber(t.spent, 0),
      squad: t.squad || [],
    }));
    const sig = JSON.stringify(teamsArr);
    if (teamsArr.length > 0 && sig !== rt.teamsSig) {
      const { error: e2 } = await sb.from('teams').upsert(teamsArr);
      if (e2) console.warn('[hotspot] teams upsert failed', e2.message || e2);
      else rt.teamsSig = sig;
    }
  } catch (err) {
    console.warn('[hotspot] Supabase sync skipped/failed', err);
  }
  return roomData;
}

function scheduleDbSync(rt, immediate = false) {
  rt.dbDirty = true;
  if (immediate) {
    if (rt.dbTimer) {
      clearTimeout(rt.dbTimer);
      rt.dbTimer = null;
    }
    return flushDb(rt);
  }
  if (!rt.dbTimer) {
    rt.dbTimer = setTimeout(() => {
      rt.dbTimer = null;
      flushDb(rt);
    }, DB_SYNC_MS);
    if (rt.dbTimer && typeof rt.dbTimer.unref === 'function') rt.dbTimer.unref();
  }
  return rt.dbChain;
}

// serialized: a slow older write can never land after a newer one
function flushDb(rt) {
  rt.dbChain = rt.dbChain.then(async () => {
    if (!rt.dbDirty) return;
    rt.dbDirty = false;
    const room = readLocalRoom(rt.roomId);
    if (isHostRuntime(rt, room)) await syncRoomToServer(rt.roomId, room);
  });
  return rt.dbChain;
}

export async function flushLocalAuctionToSupabase(roomId) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  await scheduleDbSync(getRuntime(roomId), true);
}

export async function fetchRoomFromServer(roomId) {
  if (!isBrowser || !activeSupabase) return null;
  try {
    const { data: row, error } = await activeSupabase
      .from('auctions')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();
    if (!row || !row.id || error) return null;

    const { data: teamsRows } = await activeSupabase
      .from('teams')
      .select('*')
      .eq('auction_id', roomId);

    const teams = {};
    (teamsRows || []).forEach((t) => {
      const docId = t.id || `${roomId}_${t.user_id}`;
      teams[docId] = {
        id: docId,
        auctionId: t.auction_id,
        userId: t.user_id,
        teamId: t.team_id,
        teamName: t.team_name,
        budgetRemaining: toFiniteNumber(t.budget_remaining, 120.0),
        spent: toFiniteNumber(t.spent, 0),
        squad: t.squad || [],
      };
    });

    const s = row.settings || {};
    return {
      id: row.id,
      hostId: row.host_id,
      hostName: row.host_name || 'Manager',
      hostRev: s.hostRev || 0,
      status: row.status || 'waiting',
      auctionType: row.auction_type || 'mega',
      isPublic: false,
      squadLimit: row.squad_limit || 25,
      overseasLimit: row.overseas_limit || 8,
      server: 'local',
      isLocal: true,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      players: row.players || [],
      bannedPlayers: row.banned_players || [],
      playerOrder: row.player_order || [],
      settings: { bidTimer: s.bidTimer || 10, budget: s.budget || 120.0 },
      teams,
      live: s.live || { status: row.status || 'waiting' },
      messages: s.messages || [],
      presences: s.presences || {},
    };
  } catch (e) {
    console.warn('[hotspot] Supabase fetch error:', e);
    return null;
  }
}

/* ------------------------- host: intents from clients --------------------- */

function sendIntent(rt, type, data) {
  rt.intentSeq = Math.max(rt.intentSeq + 1, Date.now());
  send(rt, 'intent', {
    id: `${rt.userId}:${rt.intentSeq}`,
    userId: rt.userId,
    type,
    data,
  });
}

function handleIntent(rt, p) {
  const room = readLocalRoom(rt.roomId);
  if (!isHostRuntime(rt, room) || !p || !p.userId || !p.id) return;
  if (rt.seenIntents.has(p.id)) return; // same intent via 2 transports
  rt.seenIntents.add(p.id);
  if (rt.seenIntents.size > 600) {
    rt.seenIntents = new Set([...rt.seenIntents].slice(-300));
  }
  if ((room.bannedPlayers || []).includes(p.userId)) return;

  switch (p.type) {
    case 'join':
    case 'team':
      hostUpsertPlayer(rt.roomId, p.userId, p.data);
      break;
    case 'bid':
      hostApplyBid(rt.roomId, { userId: p.userId, ...(p.data || {}) });
      break;
    case 'chat':
      if (p.data?.text) {
        const pl = (room.players || []).find((x) => x.id === p.userId);
        commitHost(rt.roomId, (d) =>
          pushMsg(d, {
            userId: p.userId,
            userName: pl?.name || 'Manager',
            text: String(p.data.text).slice(0, 300),
            type: p.data.type === 'emoji' ? 'emoji' : 'text',
          }),
        );
      }
      break;
    case 'presence':
      rt.presenceSeen.set(p.userId, Date.now());
      break; // online flips are committed by the engine sweep
    case 'leave':
      rt.presenceSeen.set(p.userId, 0);
      break;
    default:
  }
}

function hostUpsertPlayer(roomId, userId, details = {}) {
  const rt = getRuntime(roomId);
  rt.presenceSeen.set(userId, Date.now());
  return commitHost(roomId, (room) => {
    room.players = room.players || [];
    room.teams = room.teams || {};
    const wantTeam = details.team || '';
    const prev = room.players.find((p) => p.id === userId) || null;
    let team = wantTeam || prev?.team || '';

    // team can't change after the auction starts
    if (prev?.team && wantTeam && wantTeam !== prev.team && room.status !== 'waiting') {
      team = prev.team;
    }
    // team taken?
    if (team && team !== prev?.team) {
      const holder = room.players.find((p) => p.id !== userId && p.team === team);
      if (holder) {
        if (holder.isBot && room.status === 'waiting') {
          room.players = room.players.filter((p) => p.id !== holder.id);
          delete room.teams[`${roomId}_${holder.id}`];
        } else {
          team = prev?.team || '';
        }
      }
    }

    const teamName = TEAMS.find((t) => t.id === team)?.name || prev?.teamName || 'Unknown';
    const playerObj = {
      ...(prev || { spent: 0, squadCount: 0 }),
      id: userId,
      name: details.name || prev?.name || 'Manager',
      team,
      teamName,
      isHost: room.hostId === userId,
      isOnline: true,
    };
    const idx = room.players.findIndex((p) => p.id === userId);
    if (idx >= 0) room.players[idx] = playerObj;
    else room.players.push(playerObj);

    if (team) {
      const docId = `${roomId}_${userId}`;
      const ex = room.teams[docId];
      room.teams[docId] = {
        id: docId,
        auctionId: roomId,
        userId,
        teamId: team,
        teamName,
        budgetRemaining: ex?.budgetRemaining ?? toFiniteNumber(room.settings?.budget, 120.0),
        spent: ex?.spent ?? 0,
        squad: ex?.squad || [],
      };
    }
    room.presences = { ...(room.presences || {}), [userId]: { online: true, lastSeen: Date.now() } };
  });
}

/* ------------------------------ host: bidding ----------------------------- */

function hostApplyBid(roomId, req) {
  let reason = null;
  const fail = (r) => {
    reason = r;
    return false;
  };

  const room = commitHost(roomId, (d) => {
    const live = d.live;
    if (!live || live.status !== 'bidding') return fail('Bidding is not open');
    if (req.playerId && req.playerId !== live.playerId) return fail('Player already changed');
    if (Date.now() >= (live.timerEndsAt || 0)) return fail('Timer has expired');
    if (live.highBidderId === req.userId) return fail('You are already the highest bidder');

    const team = d.teams?.[`${roomId}_${req.userId}`];
    if (!team) return fail('Pick a team before bidding');

    const player = PLAYER_BY_ID.get(live.playerId);
    if (!player) return fail('Current player not found');

    const cBid = live.currentBid || 0;
    if (req.expectedBid !== undefined && r2(req.expectedBid) !== r2(cBid)) {
      return fail('Bid changed, try again');
    }
    const nextBid = nextBidFor(player, cBid);
    if (req.maxValuation !== undefined && nextBid > req.maxValuation) return fail('Above valuation');
    if (toFiniteNumber(team.budgetRemaining, 0) < nextBid) return fail('Insufficient purse budget');
    if ((team.squad || []).length >= toFiniteNumber(d.squadLimit, 25)) return fail('Squad is full');
    if (isOverseasPlayer(player)) {
      const overseasCount = countOverseas(team.squad || [], PLAYER_BY_ID);
      const overseasLimit = toFiniteNumber(d.overseasLimit, 8);
      if (overseasCount >= overseasLimit) return fail('Overseas player limit reached');
    }

    const pl = (d.players || []).find((p) => p.id === req.userId);
    const isBot = !!pl?.isBot || String(req.userId).startsWith('bot_');
    const timerSec = d.settings?.bidTimer || 10;

    live.currentBid = nextBid;
    live.highBidderId = req.userId;
    live.highBidderName = pl?.name || 'Manager';
    live.highBidderTeamId = team.teamId || '';
    live.timerEndsAt = Date.now() + timerSec * 1000;
    live.hostTimestamp = Date.now();

    if (!isBot) {
      pushMsg(d, {
        userId: req.userId,
        userName: pl?.name || 'Manager',
        text: `Bid \u20b9${nextBid} Cr by ${team.teamName || pl?.name}`,
        type: 'bid',
      });
    }
  });

  return { ok: !!room, reason: reason || (room ? null : 'Not allowed'), room };
}

const makeLive = (playerId, ms) => ({
  playerId,
  currentBid: 0,
  highBidderId: '',
  highBidderName: 'No Bids',
  highBidderTeamId: '',
  timerEndsAt: Date.now() + ms,
  hostTimestamp: Date.now(),
  status: 'bidding',
});

function hostEndPlayer(roomId, force = false) {
  return commitHost(roomId, (room) => {
    const live = room.live;
    if (!live || live.status !== 'bidding') return false;
    if (!force && Date.now() < (live.timerEndsAt || 0)) return false;

    const isSold = Boolean(live.highBidderId);
    live.status = isSold ? 'sold' : 'unsold';
    live.advanceAt = Date.now() + (isSold ? SOLD_DISPLAY_MS : UNSOLD_DISPLAY_MS);
    live.remainingMs = 0;

    const player = PLAYER_BY_ID.get(live.playerId);
    const teamDetails = TEAMS.find((t) => t.id === live.highBidderTeamId);
    const name = player?.name || 'Player';

    if (isSold) {
      const winnerId = live.highBidderId;
      const docId = `${roomId}_${winnerId}`;
      const bid = live.currentBid;

      room.players = (room.players || []).map((p) =>
        p.id === winnerId
          ? { ...p, spent: r2((p.spent || 0) + bid), squadCount: (p.squadCount || 0) + 1 }
          : p,
      );
      room.teams = room.teams || {};
      const t = room.teams[docId] || {
        budgetRemaining: toFiniteNumber(room.settings?.budget, 120.0),
        spent: 0,
        squad: [],
      };
      room.teams[docId] = {
        ...t,
        id: docId,
        auctionId: roomId,
        userId: winnerId,
        teamId: live.highBidderTeamId,
        teamName: teamDetails?.name || live.highBidderName || 'Unknown',
        budgetRemaining: Math.max(0, r2((t.budgetRemaining ?? 120.0) - bid)),
        spent: r2((t.spent || 0) + bid),
        squad: [...(t.squad || []), { id: live.playerId, bid }],
      };
      sysMsg(
        room,
        `${name} SOLD to ${teamDetails?.name || live.highBidderName} for \u20b9${bid} Cr`,
        'sold_card',
        {
          playerId: live.playerId,
          teamId: live.highBidderTeamId,
          bid,
          buyerId: winnerId,
          buyerName: live.highBidderName,
        },
      );
    } else {
      sysMsg(room, `${name} UNSOLD`);
    }
  });
}

function hostAdvance(roomId) {
  const rt = getRuntime(roomId);
  const room = commitHost(roomId, (d) => {
    const live = d.live;
    if (!live || (live.status !== 'sold' && live.status !== 'unsold')) return false;
    if (Date.now() < (live.advanceAt || 0)) return false;

    const order = d.playerOrder || IPL_PLAYERS.map((_, i) => i);
    const i = order.findIndex((idx) => IPL_PLAYERS[idx]?.id === live.playerId);
    const next = i !== -1 ? IPL_PLAYERS[order[i + 1]] : null;

    if (next) {
      d.live = makeLive(next.id, (d.settings?.bidTimer || 10) * 1000);
    } else {
      d.status = 'completed';
      d.live = { ...live, status: 'completed' };
      sysMsg(d, 'Auction COMPLETED!');
    }
  });
  if (room?.status === 'completed') scheduleDbSync(rt, true);
}

/* ------------------------------- host: engine ----------------------------- */

function sweepPresence(rt, room, now) {
  let changed = false;
  const presences = room.presences || {};
  for (const p of room.players || []) {
    if (p.id === room.hostId || p.isBot || p.id.startsWith('bot_')) continue;
    if (!rt.presenceSeen.has(p.id)) rt.presenceSeen.set(p.id, now);
    const online = now - rt.presenceSeen.get(p.id) < OFFLINE_AFTER_MS;
    if ((presences[p.id]?.online !== false) !== online) changed = true;
  }
  if (!changed) return;
  commitHost(rt.roomId, (d) => {
    d.presences = { ...(d.presences || {}) };
    d.players = (d.players || []).map((p) => {
      if (p.id === d.hostId || p.isBot || p.id.startsWith('bot_')) return p;
      const seen = rt.presenceSeen.get(p.id) ?? now;
      const online = now - seen < OFFLINE_AFTER_MS;
      d.presences[p.id] = { online, lastSeen: seen };
      return { ...p, isOnline: online };
    });
  });
}

function scheduleBots(rt, room) {
  const live = room.live;
  const key = `${live.playerId}|${live.currentBid}|${live.highBidderId}`;
  if (rt.botKey === key) return;
  rt.botKey = key;
  if (rt.botTimer) clearTimeout(rt.botTimer);
  rt.botTimer = null;

  const hasBots = (room.players || []).some((p) => p.isBot || p.id.startsWith('bot_'));
  if (!hasBots) return;

  const timerMs = (room.settings?.bidTimer || 10) * 1000;
  const remaining = Math.max(0, (live.timerEndsAt || 0) - Date.now());
  let delay =
    (live.currentBid || 0) < 3.0
      ? Math.min(1000, timerMs * (0.08 + Math.random() * 0.15))
      : timerMs * (0.25 + Math.random() * 0.3);
  delay = Math.max(300, Math.min(delay, Math.max(300, remaining - 300)));

  rt.botTimer = setTimeout(() => runBots(rt, key), delay);
  if (rt.botTimer && typeof rt.botTimer.unref === 'function') rt.botTimer.unref();
}

function runBots(rt, key) {
  rt.botTimer = null;
  const room = readLocalRoom(rt.roomId);
  if (!isHostRuntime(rt, room) || room.live?.status !== 'bidding') return;
  const live = room.live;
  if (`${live.playerId}|${live.currentBid}|${live.highBidderId}` !== key) return;

  const player = PLAYER_BY_ID.get(live.playerId);
  if (!player) return;
  const initialBudget = toFiniteNumber(room.settings?.budget, 120.0);
  const bots = shuffleArray(
    (room.players || []).filter(
      (p) => (p.isBot || p.id.startsWith('bot_')) && p.id !== live.highBidderId,
    ),
  );

  for (const bot of bots) {
    const botTeam = room.teams?.[`${rt.roomId}_${bot.id}`];
    if (!botTeam) continue;
    const decision = evaluateBotBid({
      player,
      currentBid: live.currentBid || 0,
      highBidderId: live.highBidderId,
      botTeam,
      squadLimit: toFiniteNumber(room.squadLimit, 25),
      overseasLimit: toFiniteNumber(room.overseasLimit, 8),
      initialBudget,
    });
    if (decision?.shouldBid) {
      const res = hostApplyBid(rt.roomId, {
        userId: bot.id,
        playerId: live.playerId,
        expectedBid: live.currentBid || 0,
        maxValuation: decision.maxValuation,
      });
      if (res.ok) break;
    }
  }
}

function engineTick(rt) {
  const room = readLocalRoom(rt.roomId);
  if (!isHostRuntime(rt, room)) return;
  const now = Date.now();
  sweepPresence(rt, room, now);

  const live = room.live;
  if (room.status !== 'active' || !live) return;

  if (live.status === 'bidding') {
    if (now >= (live.timerEndsAt || 0)) {
      hostEndPlayer(rt.roomId);
      return;
    }
    scheduleBots(rt, room);
  } else if ((live.status === 'sold' || live.status === 'unsold') && now >= (live.advanceAt || 0)) {
    hostAdvance(rt.roomId);
  }
  // 'paused' / 'completed': nothing runs, timer is frozen
}

function slowTick(rt) {
  rt.slow += 1;
  const room = readLocalRoom(rt.roomId);

  if (isHostRuntime(rt, room)) {
    setLocalHostTimeOffset(0);
    send(rt, 'state', { room }); // heartbeat = repair for any lost packet
    return;
  }
  if (!rt.userId) return;

  const stale = Date.now() - rt.lastStateAt > 2500;
  if (!room || stale) send(rt, 'hello', { from: rt.userId });
  if (rt.slow % 3 === 0) sendIntent(rt, 'presence', {});

  const pp = rt.pendingProfile;
  if (pp) {
    const me = (room?.players || []).find((p) => p.id === rt.userId);
    if (me && (!pp.team || me.team === pp.team)) rt.pendingProfile = null;
    else if (rt.joinTries++ < 60) sendIntent(rt, 'join', pp);
  }

  if (rt.pingCount < 6 || rt.slow % 5 === 0) sendPing(rt);

  // degraded mode: realtime silent -> poll DB backup
  if (stale && rt.slow % 3 === 0) {
    fetchRoomFromServer(rt.roomId).then((s) => s && acceptState(rt, s));
  }
}

function retain(rt) {
  rt.refs += 1;
  if (rt.refs > 1) return;
  openTransport(rt);
  const t1 = setInterval(() => engineTick(rt), ENGINE_TICK_MS);
  const t2 = setInterval(() => slowTick(rt), SLOW_TICK_MS);
  if (t1.unref) t1.unref();
  if (t2.unref) t2.unref();
  rt.timers = [t1, t2];
  const room = readLocalRoom(rt.roomId);
  if (!isHostRuntime(rt, room)) {
    send(rt, 'hello', { from: rt.userId });
    sendPing(rt);
  }
}

function release(rt) {
  rt.refs = Math.max(0, rt.refs - 1);
  if (rt.refs > 0) return;
  rt.timers.forEach(clearInterval);
  rt.timers = [];
  if (rt.botTimer) clearTimeout(rt.botTimer);
  rt.botTimer = null;
  rt.botKey = '';
  const room = readLocalRoom(rt.roomId);
  if (isHostRuntime(rt, room) && rt.dbDirty) scheduleDbSync(rt, true);
  closeTransport(rt);
}

/* ---------------------------- player order helper ------------------------- */

export function generateLocalPlayerOrder(auctionType = 'mega') {
  let targetPlayers = IPL_PLAYERS.length;
  if (auctionType === 'sprint11') targetPlayers = 150;
  else if (auctionType === 'sprint5') targetPlayers = 75;

  const marquee = [];
  const byRole = {};
  IPL_PLAYERS.forEach((p, i) => {
    if (p.set.includes('Marquee')) marquee.push(i);
    else (byRole[p.role] ||= []).push(i);
  });

  const selected = new Set(marquee);
  const nonMarqueeTarget = Math.max(0, targetPlayers - marquee.length);
  const nonMarqueeTotal = IPL_PLAYERS.length - marquee.length;
  const fraction = nonMarqueeTotal > 0 ? nonMarqueeTarget / nonMarqueeTotal : 1;

  Object.values(byRole).forEach((indices) => {
    const shuffled = shuffleArray(indices);
    const limit =
      auctionType === 'mega' ? shuffled.length : Math.max(1, Math.ceil(shuffled.length * fraction));
    shuffled.slice(0, limit).forEach((i) => selected.add(i));
  });

  const sets = [...new Set(IPL_PLAYERS.map((p) => p.set))];
  const order = [];
  sets.forEach((setName) => {
    const idxs = [];
    IPL_PLAYERS.forEach((p, i) => {
      if (p.set === setName && selected.has(i)) idxs.push(i);
    });
    order.push(...shuffleArray(idxs));
  });
  return order;
}

/* ------------------------------- public API ------------------------------- */

export function createLocalRoom(roomId, userId, playerDetails, auctionType = 'mega', isPublic = false) {
  const rt = getRuntime(roomId);
  rt.userId = userId;

  const isSprint5 = auctionType === 'sprint5';
  const isSprint11 = auctionType === 'sprint11';
  const budget = isSprint5 ? 60.0 : isSprint11 ? 90.0 : 120.0;
  const squadLimit = isSprint5 ? 5 : isSprint11 ? 11 : 25;
  const overseasLimit = isSprint5 ? 2 : isSprint11 ? 4 : 8;
  const teamDetails = TEAMS.find((t) => t.id === playerDetails.team);
  const now = Date.now();

  const teams = {};
  if (playerDetails.team) {
    const docId = `${roomId}_${userId}`;
    teams[docId] = {
      id: docId,
      auctionId: roomId,
      userId,
      teamId: playerDetails.team,
      teamName: teamDetails?.name || 'Unknown',
      budgetRemaining: budget,
      spent: 0,
      squad: [],
    };
  }

  const room = {
    id: roomId,
    hostId: userId,
    hostName: playerDetails.name || 'Manager',
    hostRev: 1,
    status: 'waiting',
    auctionType,
    isPublic: !!isPublic,
    squadLimit,
    overseasLimit,
    server: 'local',
    isLocal: true,
    createdAt: now,
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
    settings: { bidTimer: 10, budget },
    teams,
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
        id: newId('msg'),
        userId: 'system',
        userName: 'System',
        text: 'Hotspot Room created. Ready for local play!',
        type: 'log',
        timestamp: now,
      },
    ],
    presences: { [userId]: { online: true, lastSeen: now } },
  };

  storeRoom(rt, room);
  const result = { server: 'local', requestedServer: 'local', fellBack: false };
  const promise = scheduleDbSync(rt, true).then(() => result);
  return Object.assign(promise, result);
}

export async function joinLocalRoomDb(roomId, userId, playerDetails = {}) {
  const rt = getRuntime(roomId);
  rt.userId = userId;

  let room = readLocalRoom(roomId);
  if (!room) room = await fetchRoomFromServer(roomId);
  if (!room) {
    await new Promise((r) => setTimeout(r, 400));
    room = await fetchRoomFromServer(roomId);
  }
  if (!room) throw new Error('Room not found. Please verify the room code.');
  if ((room.bannedPlayers || []).includes(userId)) {
    throw new Error('You have been kicked from this local room.');
  }
  if (!readLocalRoom(roomId)) acceptState(rt, room);

  if (room.hostId === userId) {
    // host re-joining his own room
    hostUpsertPlayer(roomId, userId, playerDetails);
    return 'local';
  }
  if (!isBrowser) {
    const prevUserId = rt.userId;
    rt.userId = room.hostId;
    hostUpsertPlayer(roomId, userId, playerDetails);
    rt.userId = prevUserId;
    return 'local';
  }

  rt.pendingProfile = { name: playerDetails.name, team: playerDetails.team };
  rt.joinTries = 0;
  // keep the transport alive long enough to deliver the join even if the
  // caller hasn't subscribed yet
  retain(rt);
  const jt = setTimeout(() => release(rt), 8000);
  if (jt && typeof jt.unref === 'function') jt.unref();
  return 'local';
}

export function updateLocalPlayerTeam(roomId, userId, newTeamId) {
  const rt = getRuntime(roomId);
  rt.userId = userId;
  const room = readLocalRoom(roomId);
  if (!room) return;
  const me = (room.players || []).find((p) => p.id === userId);
  const details = { name: me?.name, team: newTeamId };
  if (isHostRuntime(rt, room)) {
    hostUpsertPlayer(roomId, userId, details);
  } else {
    rt.pendingProfile = details;
    rt.joinTries = 0;
    sendIntent(rt, 'team', details);
  }
}

export function fillLocalEmptyTeamsWithBots(roomId) {
  commitHost(roomId, (room) => {
    room.players = room.players || [];
    room.teams = room.teams || {};
    const taken = new Set(room.players.map((p) => p.team).filter(Boolean));
    const budget = toFiniteNumber(room.settings?.budget, 120.0);
    let added = 0;
    TEAMS.forEach((t) => {
      if (taken.has(t.id)) return;
      const botId = `bot_${t.id}`;
      room.players.push({
        id: botId,
        name: `${t.name} Bot`,
        team: t.id,
        teamName: t.name,
        isHost: false,
        isBot: true,
        isOnline: true,
        spent: 0,
        squadCount: 0,
      });
      const docId = `${roomId}_${botId}`;
      room.teams[docId] = {
        id: docId,
        auctionId: roomId,
        userId: botId,
        teamId: t.id,
        teamName: t.name,
        budgetRemaining: budget,
        spent: 0,
        squad: [],
      };
      added += 1;
    });
    return added > 0;
  });
}

export function removeLocalBotTeam(roomId, botUserId) {
  commitHost(roomId, (room) => {
    room.players = (room.players || []).filter((p) => p.id !== botUserId);
    if (room.teams) delete room.teams[`${roomId}_${botUserId}`];
  });
}

export function startLocalAuction(roomId) {
  const rt = getRuntime(roomId);
  const r = readLocalRoom(roomId);
  if (!isBrowser && r) rt.userId = r.hostId;
  const room = commitHost(roomId, (d) => {
    if (d.status === 'active') return false;
    const order = generateLocalPlayerOrder(d.auctionType || 'mega');
    const first = IPL_PLAYERS[order[0]];
    if (!first) return false;
    d.status = 'active';
    d.playerOrder = order;
    d.live = makeLive(first.id, FIRST_PLAYER_MS);
    sysMsg(d, 'Auction has started!');
  });
  if (room) scheduleDbSync(rt, true);
  return Promise.resolve(room || readLocalRoom(roomId));
}

/** Throws on obvious local errors (same messages as before). */
export function placeLocalBid(roomId, userId, teamId, userName, teamName) {
  const rt = getRuntime(roomId);
  rt.userId = userId;
  const room = readLocalRoom(roomId);
  if (!room || !room.live) throw new Error('Auction not found');
  if (room.live.status !== 'bidding') throw new Error('Bidding is not open');
  if (room.live.highBidderId === userId) throw new Error('You are already the highest bidder');

  const player = PLAYER_BY_ID.get(room.live.playerId);
  if (!player) throw new Error('Current player not found');
  const nextBid = nextBidFor(player, room.live.currentBid);
  const team = room.teams?.[`${roomId}_${userId}`];
  if (team && toFiniteNumber(team.budgetRemaining, 0) < nextBid) {
    throw new Error('Insufficient purse budget');
  }

  const req = { playerId: room.live.playerId, expectedBid: room.live.currentBid || 0 };
  if (isHostRuntime(rt, room)) {
    const res = hostApplyBid(roomId, { userId, ...req });
    if (!res.ok) throw new Error(res.reason);
    return res.room;
  }
  // client: host validates with ITS clock and applies; state comes back via broadcast
  sendIntent(rt, 'bid', req);
  return room;
}

/** Kept for API compatibility. Bots are driven by the host engine now. */
export function placeLocalBotBid(roomId, botUserId, _teamId, _name, _timerSec, maxValuation = Infinity) {
  const room = readLocalRoom(roomId);
  if (!room?.live) return;
  hostApplyBid(roomId, {
    userId: botUserId,
    playerId: room.live.playerId,
    expectedBid: room.live.currentBid || 0,
    maxValuation,
  });
}

/** Host-only. `force` = admin "end this player now". */
export function endLocalPlayerAuction(roomId, _triggerUserId, force = true) {
  const room = readLocalRoom(roomId);
  if (_triggerUserId && room && room.hostId !== _triggerUserId) return;
  hostEndPlayer(roomId, force);
}

export function pauseLocalAuction(roomId) {
  commitHost(roomId, (room) => {
    const live = room.live;
    if (!live || live.status !== 'bidding') return false;
    live.remainingMs = Math.max(0, (live.timerEndsAt || 0) - Date.now());
    live.status = 'paused';
    sysMsg(room, 'Auction PAUSED by Admin');
  });
}

export function resumeLocalAuction(roomId) {
  commitHost(roomId, (room) => {
    const live = room.live;
    if (!live || live.status !== 'paused') return false;
    live.timerEndsAt = Date.now() + Math.max(RESUME_MIN_MS, live.remainingMs || 0);
    live.hostTimestamp = Date.now();
    live.status = 'bidding';
    delete live.remainingMs;
    sysMsg(room, 'Auction RESUMED by Admin');
  });
}

export function endLocalAuction(roomId) {
  const rt = getRuntime(roomId);
  const room = commitHost(roomId, (d) => {
    if (d.status === 'completed') return false;
    d.status = 'completed';
    if (d.live) d.live = { ...d.live, status: 'completed' };
    sysMsg(d, 'Auction COMPLETED by Admin');
  });
  if (room) scheduleDbSync(rt, true);
}

export function sendLocalMessage(roomId, userId, userName, text, type = 'text') {
  const rt = getRuntime(roomId);
  rt.userId = userId;
  const room = readLocalRoom(roomId);
  if (!room || !text) return;
  if (isHostRuntime(rt, room)) {
    commitHost(roomId, (d) =>
      pushMsg(d, { userId, userName: userName || 'Manager', text, type }),
    );
  } else {
    sendIntent(rt, 'chat', { text, type });
  }
}

export function kickLocalPlayer(roomId, targetUserId) {
  const rt = getRuntime(roomId);
  commitHost(roomId, (room) => {
    room.bannedPlayers = room.bannedPlayers || [];
    if (!room.bannedPlayers.includes(targetUserId)) room.bannedPlayers.push(targetUserId);
    room.players = (room.players || []).filter((p) => p.id !== targetUserId);
    if (room.teams) delete room.teams[`${roomId}_${targetUserId}`];
    if (room.presences) delete room.presences[targetUserId];
  });
  rt.presenceSeen.delete(targetUserId);
}

export function updateLocalRoomSettings(roomId, settings) {
  commitHost(roomId, (room) => {
    room.settings = { ...(room.settings || {}), ...settings };
  });
}

/* ------------------------------- subscription ----------------------------- */

export function subscribeLocalRoom(
  roomId,
  userId,
  { setCurrentAuction, setRoomTeams, setTeam, setMessages, setLoading },
) {
  const rt = getRuntime(roomId);
  rt.userId = userId;
  let alive = true;

  const push = (room) => {
    if (!room || !alive) return;
    const presences = room.presences || {};
    const players = (room.players || []).map((p) => ({
      ...p,
      isOnline: p.isBot || presences[p.id]?.online !== false,
      lastSeen: presences[p.id]?.lastSeen || Date.now(),
    }));
    const teamsArr = Object.values(room.teams || {}).map((t) => ({
      ...t,
      id: `${roomId}_${t.userId}`,
    }));

    setRoomTeams(teamsArr);
    if (userId) {
      setTeam(teamsArr.find((t) => t.userId === userId) || null);
    }
    setMessages((room.messages || []).slice(-20));
    setCurrentAuction({ id: roomId, ...room, players, currentAuction: room.live });
    setLoading(false);
  };

  const listener = (room) => push(room);
  rt.listeners.add(listener);
  retain(rt);

  const initial = readLocalRoom(roomId);
  if (initial) push(initial);

  // bootstrap / host-reload recovery from the DB backup (only newer is accepted)
  fetchRoomFromServer(roomId).then((s) => {
    if (!alive) return;
    if (s) acceptState(rt, s);
    if (!readLocalRoom(roomId)) setLoading(false);
  });

  return () => {
    alive = false;
    rt.listeners.delete(listener);
    const room = readLocalRoom(roomId);
    if (!isHostRuntime(rt, room)) sendIntent(rt, 'leave', {});
    release(rt);
  };
}
