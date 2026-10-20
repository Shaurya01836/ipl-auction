/**
 * Auction server registry and small, dependency-free helpers.
 *
 * The live room data lives in two separate Firebase Realtime Databases. The
 * Supabase `auctions` row is the shared directory that tells every client which
 * database a room belongs to. Keep this module free of Firebase/Supabase imports
 * so it can be unit-tested with plain `node --test`.
 */

export const PRIMARY_SERVER = 'primary';
export const SECONDARY_SERVER = 'secondary';
export const DEFAULT_AUCTION_SERVER = PRIMARY_SERVER;

export const AUCTION_SERVERS = Object.freeze([
  {
    id: PRIMARY_SERVER,
    label: 'Server 1',
    shortLabel: 'S1',
    description: 'Main',
  },
  {
    id: SECONDARY_SERVER,
    label: 'Server 2',
    shortLabel: 'S2',
    description: 'Overflow',
  },
]);

const SERVER_IDS = new Set(AUCTION_SERVERS.map((server) => server.id));
const PREFERRED_SERVER_KEY = 'ipl-auction:preferred-server';

/** True when the value is one of the known server ids. */
export function isValidServer(value) {
  return typeof value === 'string' && SERVER_IDS.has(value);
}

/**
 * Normalise a server value. Unknown/empty values fall back to `fallback`.
 * Pass `null` as the fallback when the caller needs to detect an invalid value.
 */
export function normalizeServer(value, fallback = DEFAULT_AUCTION_SERVER) {
  if (isValidServer(value)) return value;
  return fallback;
}

/** Metadata for a server id. Unknown ids return the primary server metadata. */
export function getServerMeta(value) {
  const id = normalizeServer(value);
  return (
    AUCTION_SERVERS.find((server) => server.id === id) || AUCTION_SERVERS[0]
  );
}

/**
 * Read the server from a Supabase auction row.
 *
 * `settings.server` is the deployable fallback used until the optional
 * top-level `server` column is added. Existing rows have neither and therefore
 * correctly default to Server 1.
 */
export function getAuctionServer(record) {
  if (!record) return DEFAULT_AUCTION_SERVER;
  // settings.server is written by every code path, including before the
  // optional top-level column exists. Prefer it so a migration whose default
  // backfills `server = 'primary'` cannot silently move existing Server 2 rooms.
  if (isValidServer(record.settings?.server)) return record.settings.server;
  return normalizeServer(record.server);
}

/** Read the server hint from a query string. Invalid/missing hints return null. */
export function getServerFromSearch(search = '') {
  try {
    const value = new URLSearchParams(search).get('server');
    return isValidServer(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Append `?server=` to a room path without destroying an existing query string
 * or hash. Used for invite links, lobby cards, and in-app navigation.
 */
export function withServerParam(path, server) {
  const value = normalizeServer(server);
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const base = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}server=${encodeURIComponent(value)}${hash}`;
}

/** Persisted server selection for the landing page. */
export function getPreferredServer() {
  if (typeof window === 'undefined') return DEFAULT_AUCTION_SERVER;
  try {
    return normalizeServer(window.localStorage.getItem(PREFERRED_SERVER_KEY));
  } catch {
    return DEFAULT_AUCTION_SERVER;
  }
}

export function setPreferredServer(server) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PREFERRED_SERVER_KEY,
      normalizeServer(server),
    );
  } catch {
    // Private-mode/storage-disabled browsers can still use the in-memory state.
  }
}
