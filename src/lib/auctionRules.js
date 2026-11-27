import { IPL_PLAYERS } from '../data/players.js';
import { HUNDRED_PLAYERS } from '../data/hundredPlayers.js';
import { getMiniAuctionPoolIndices } from '../data/retentions.js';
import { countOverseas, isOverseasPlayer, r2, r4, toFiniteNumber } from './auctionDisplay.js';

export const ALL_PLAYERS = [...IPL_PLAYERS, ...HUNDRED_PLAYERS];

export const getPlayerPoolForMode = (auctionType) =>
  auctionType === 'hundred' ? HUNDRED_PLAYERS : IPL_PLAYERS;

export const getPlayerByOrderIndex = (idx, auctionType) =>
  getPlayerPoolForMode(auctionType)[idx];

export const findPlayerById = (id) =>
  ALL_PLAYERS.find((p) => p.id === id);

/**
 * Pure auction rules used by the cloud (RTDB) engine. Keeping these in one
 * place lets the regression tests exercise the real logic.
 */

export const shuffleArray = (array) => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Build the shuffled lot order for an auction type (mini is fully randomized; mega/standard modes group by set). */
export function generatePlayerOrder(auctionType = 'mega', options = {}) {
  if (auctionType === 'legends') {
    const byRole = {};
    IPL_PLAYERS.forEach((p, i) => {
      if (p.set === 'Legends') {
        (byRole[p.role] ||= []).push(i);
      }
    });
    const order = [];
    ['Batsman', 'All-Rounder', 'Wicket-Keeper', 'Bowler'].forEach((role) => {
      if (byRole[role]) order.push(...shuffleArray(byRole[role]));
    });
    return order;
  }

  if (auctionType === 'hundred') {
    const marquee = [];
    const rest = [];
    HUNDRED_PLAYERS.forEach((p, i) => {
      if (p.basePrice >= 0.075) marquee.push(i);
      else rest.push(i);
    });
    return [...shuffleArray(marquee), ...shuffleArray(rest)];
  }

  if (auctionType === 'mini') {
    const userReleased = options?.userReleasedPlayerIds || [];
    const poolIndices = getMiniAuctionPoolIndices(userReleased);
    return shuffleArray(poolIndices);
  }

  // All other modes (mega, sprint11, sprint5) use all modern players grouped by set (Marquee first)
  const modernPool = [];
  IPL_PLAYERS.forEach((p, i) => {
    if (p.set !== 'Legends') modernPool.push(i);
  });

  const modernSets = [...new Set(modernPool.map((i) => IPL_PLAYERS[i].set))];
  const order = [];
  modernSets.forEach((setName) => {
    const idxs = modernPool.filter((i) => IPL_PLAYERS[i].set === setName);
    order.push(...shuffleArray(idxs));
  });
  return order;
}

/**
 * Safely resolves the next unowned, unsold player index from playerOrder.
 * Guarantees that no player already present in any team squad can EVER be chosen again.
 *
 * @param {Array|Object} playerOrder - Shuffled array of player indices or RTDB object
 * @param {string} currentPlayerId - The player ID of the currently finished lot
 * @param {Iterable<string>|Array<object>|Set<string>} teamsOrSoldIds - Teams array or Set of sold player IDs
 * @returns {number|undefined} The index in IPL_PLAYERS of the next unsold player, or undefined if auction is complete
 */
export function getNextUnsoldPlayerIndex(playerOrder, currentPlayerId, teamsOrSoldIds, auctionType = 'mega') {
  const pool = getPlayerPoolForMode(auctionType);
  const order = Array.isArray(playerOrder)
    ? playerOrder
    : playerOrder && typeof playerOrder === 'object'
      ? Object.values(playerOrder)
      : [];

  if (order.length === 0) return undefined;

  // Build the set of already owned/sold player IDs
  const soldIds = teamsOrSoldIds instanceof Set
    ? teamsOrSoldIds
    : new Set();

  if (!(teamsOrSoldIds instanceof Set)) {
    const list = Array.isArray(teamsOrSoldIds)
      ? teamsOrSoldIds
      : teamsOrSoldIds && typeof teamsOrSoldIds === 'object'
        ? Object.values(teamsOrSoldIds)
        : [];
    list.forEach((t) => {
      (t.squad || []).forEach((p) => {
        const pid = typeof p === 'string' ? p : p?.id;
        if (pid) soldIds.add(pid);
      });
    });
  }

  // Find where the current player was in order
  const curPos = order.findIndex((idx) => pool[idx] && pool[idx].id === currentPlayerId);
  const startPos = curPos !== -1 ? curPos + 1 : 0;

  // Search forward from current position for the first player not yet sold
  for (let i = startPos; i < order.length; i++) {
    const candidateIdx = order[i];
    const candidate = pool[candidateIdx];
    if (candidate && !soldIds.has(candidate.id)) {
      return candidateIdx;
    }
  }

  return undefined;
}

export const normalizeSquad = (squad) => mapRoomPlayers(squad, (entry) => entry);

export const getSquadEntryId = (entry) =>
  typeof entry === 'string' ? entry : entry?.id;

/** RTDB may return a dense JSON array or an object keyed by index. */
export function mapRoomPlayers(players, mapper) {
  const list = Array.isArray(players)
    ? players
    : players && typeof players === 'object'
      ? Object.values(players)
      : [];
  return list.filter(Boolean).map(mapper);
}

export const MIN_TEAMS_TO_START = 2;

/** Distinct franchises in the room. Human and bot managers both carry `team`. */
export function countAuctionTeams(players) {
  return new Set(mapRoomPlayers(players, (player) => player.team).filter(Boolean)).size;
}

/** Base price for the opening bid, otherwise the next increment (rounded). */
export function getNextBidAmount(player, currentBid) {
  const current = toFiniteNumber(currentBid, 0);
  if (current === 0) return toFiniteNumber(player?.basePrice, 0);
  if (player?.set === 'Hundred') {
    const step = current < 0.0325 ? 0.0015
      : current < 0.05 ? 0.0025
      : current < 0.10 ? 0.005
      : 0.01;
    return r4(current + step);
  }
  return r2(current + (current < 5 ? 0.2 : 0.25));
}

/**
 * Squad/overseas rules that every winning bid must satisfy. Returns a reason
 * string, or null when the team may bid.
 */
export function getSquadConstraintError({
  team,
  player,
  squadLimit = 25,
  overseasLimit = 8,
  playerIndex,
}) {
  if (!team) return 'Pick a team before bidding';

  const squad = normalizeSquad(team.squad);
  const playerId = player?.id;

  if (squad.some((entry) => getSquadEntryId(entry) === playerId)) {
    return 'This player is already in your squad';
  }

  if (squad.length >= toFiniteNumber(squadLimit, 25)) {
    return 'Squad is full';
  }

  const modeHint = player?.set === 'Hundred' ? 'hundred' : null;
  if (isOverseasPlayer(player, modeHint)) {
    const overseas = countOverseas(squad, playerIndex || ALL_PLAYERS, modeHint);
    if (overseas >= toFiniteNumber(overseasLimit, 8)) {
      return 'Overseas player limit reached';
    }
  }

  return null;
}

/**
 * Merge a manager into a room roster without dropping stats that were already
 * recorded (spent / squadCount / bot flags). Used inside RTDB transactions so
 * two managers joining at the same moment cannot overwrite each other.
 */
export function mergeRoomPlayer(players, player) {
  const list = mapRoomPlayers(players, (entry) => entry);

  const existing = list.find(
    (entry) => entry.id === player.id || entry.userId === player.id,
  );

  return [
    ...list.filter(
      (entry) => entry.id !== player.id && entry.userId !== player.id,
    ),
    { ...(existing || {}), ...player },
  ];
}

/**
 * Decide what `startAuction` should do from the current room/live snapshot.
 * - completed: auction finished, do nothing
 * - running: a lot is already live, never restart it
 * - resume: room is active but the live lot is missing (a start was interrupted)
 * - start: waiting room, create the order and first lot
 */
export function getStartDisposition(room, live) {
  if (!room) return 'missing';
  if (room.status === 'completed') return 'completed';
  // The last lot was finalized; only the room-status write may be missing.
  if (live?.status === 'completed') return 'completed';
  if (live?.status && live.status !== 'waiting') return 'running';
  if (room.status === 'active') return 'resume';
  return 'start';
}

/** Recovery delay before a finalized lot is advanced again by any client. */
export function finalizedLotRecoveryDelay(status) {
  if (status === 'sold') return 6000;
  if (status === 'unsold') return 3000;
  return null;
}

/**
 * Decision predicate for server-side host-disconnect auto-pause.
 * The server-side onDisconnect fallback must only be armed when:
 * 1. The client socket is actively connected.
 * 2. The client is the host.
 * 3. This tab is the designated primary tab for this host session.
 * 4. The room is actively running (not waiting/completed).
 * 5. The live lot is actively bidding (not paused/sold/unsold/completed).
 * 6. A valid lot/player is active.
 */
export function shouldArmDisconnectPause({
  socketConnected,
  isHost,
  isPrimaryTab = true,
  roomStatus,
  liveStatus,
  playerId,
}) {
  return Boolean(
    socketConnected &&
    isHost &&
    isPrimaryTab &&
    roomStatus === 'active' &&
    liveStatus === 'bidding' &&
    playerId,
  );
}

/**
 * Action resolver for the onDisconnect lifecycle.
 * Prevents stale operations from lingering or overwriting newer lots/completed rooms.
 */
export function resolveDisconnectAction({
  shouldArm,
  currentlyArmed,
  armedLotId,
  currentLotId,
}) {
  if (shouldArm) {
    if (currentlyArmed && armedLotId !== currentLotId) {
      return 'rearm';
    }
    if (!currentlyArmed) {
      return 'arm';
    }
    return 'none';
  }
  if (currentlyArmed) {
    return 'cancel';
  }
  return 'none';
}

