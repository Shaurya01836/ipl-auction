import { IPL_PLAYERS } from '../data/players.js';
import { getMiniAuctionPoolIndices } from '../data/retentions.js';
import { countOverseas, isOverseasPlayer, r2, toFiniteNumber } from './auctionDisplay.js';

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

/** Build the shuffled lot order for an auction type, grouped by player set. */
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

  if (auctionType === 'mini') {
    const userReleased = options?.userReleasedPlayerIds || [];
    const poolIndices = getMiniAuctionPoolIndices(userReleased);
    const sets = [...new Set(poolIndices.map((i) => IPL_PLAYERS[i].set))];
    const marqueeSets = sets.filter((s) => s && s.toLowerCase().includes('marquee'));
    const regularSets = sets.filter((s) => s && !s.toLowerCase().includes('marquee'));
    const sortedSets = [...marqueeSets, ...regularSets];

    const order = [];
    sortedSets.forEach((setName) => {
      const idxs = poolIndices.filter((i) => IPL_PLAYERS[i].set === setName);
      order.push(...shuffleArray(idxs));
    });
    return order;
  }

  // All other modes (mega, sprint11, sprint5) use all modern players with no truncation
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

  if (isOverseasPlayer(player)) {
    const overseas = countOverseas(squad, playerIndex);
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

