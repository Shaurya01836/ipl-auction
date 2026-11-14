import {
  fetchAuctionRecord as fetchFromDirectory,
  insertAuctionRecord,
  upsertAuctionRecord,
} from './directoryApi';
import {
  getAuctionServer,
  getPreferredServer,
  normalizeServer,
} from './auctionServers';

/** Read one auction directory row. Returns null when directory is unavailable. */
export async function fetchAuctionRecord(roomId) {
  return fetchFromDirectory(roomId);
}

const LOOKUP_TIMEOUT_MS = 1500;

function withLookupTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(undefined), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Resolve which RTDB a room belongs to.
 *
 * The directory is authoritative, so a `?server=` hint is verified
 * when the lookup responds quickly. If directory is slow/down, the hint wins
 * after a short timeout so room entry never hangs on the directory; a missing
 * directory row also falls back to the hint.
 */
export async function resolveRoomServer(roomId, hint = null) {
  const hinted = normalizeServer(hint, null);
  const record = await withLookupTimeout(
    fetchAuctionRecord(roomId).catch(() => null),
    LOOKUP_TIMEOUT_MS,
  );
  if (record) return getAuctionServer(record);
  if (hinted) return hinted;
  return getPreferredServer();
}

/** Update (or create) an existing directory row. Used for room-state flushes. */
export async function upsertAuctionWithServer(payload, server) {
  const resolvedServer = normalizeServer(server);
  return upsertAuctionRecord(payload, resolvedServer);
}

/**
 * Insert a brand-new directory row. The primary key on `auctions.id` makes this
 * the cross-server uniqueness guard for room codes: a collision returns
 * ROOM_CODE_TAKEN instead of silently overwriting the other room.
 */
export async function insertAuctionWithServer(payload, server) {
  const resolvedServer = normalizeServer(server);
  return insertAuctionRecord(payload, resolvedServer);
}
