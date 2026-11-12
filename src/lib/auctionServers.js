/**
 * Auction server registry and small, dependency-free helpers.
 *
 * The live room data lives in two separate Firebase Realtime Databases. The
 * Supabase `auctions` row is the shared directory that tells every client which
 * database a room belongs to. Keep this module free of Firebase/Supabase imports
 * so it can be unit-tested with plain `node --test`.
 */

export const SERVER_1 = 'server-1'; // Main: ipl-auction-1cdbc
export const SERVER_2 = 'server-2'; // Node 2: ipl-auction-2-947e7
export const SERVER_3 = 'server-3'; // Node 3: ipl-auction-3
export const SERVER_4 = 'server-4'; // Node 4: paypact-b5b52
export const SERVER_LOCAL = 'local'; // Device-local solo engine (zero RTDB connections)

export const PRIMARY_SERVER = SERVER_1;
export const SECONDARY_SERVER = SERVER_2;
export const DEFAULT_AUCTION_SERVER = SERVER_1;

export const LOCAL_SERVER_META = Object.freeze({
  id: SERVER_LOCAL,
  label: 'Local (Solo)',
  shortLabel: 'Solo',
  description: 'Device Local (Zero Connections)',
  isLocal: true,
});

export const AUCTION_SERVERS = Object.freeze([
  {
    id: SERVER_1,
    label: 'Server 1',
    shortLabel: 'S1',
    description: 'Main (1cdbc)',
    databaseUrl: 'https://ipl-auction-1cdbc-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'ipl-auction-1cdbc',
  },
  {
    id: SERVER_2,
    label: 'Server 2',
    shortLabel: 'S2',
    description: 'Node 2 (947e7)',
    databaseUrl: 'https://ipl-auction-2-947e7-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'ipl-auction-2-947e7',
  },
  {
    id: SERVER_3,
    label: 'Server 3',
    shortLabel: 'S3',
    description: 'Node 3',
    databaseUrl: 'https://ipl-auction-3-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'ipl-auction-3',
  },
  {
    id: SERVER_4,
    label: 'Server 4',
    shortLabel: 'S4',
    description: 'Node 4 (Paypact)',
    databaseUrl: 'https://paypact-b5b52-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'paypact-b5b52',
  },
]);

const SERVER_IDS = new Set(AUCTION_SERVERS.map((server) => server.id));
const LEGACY_SERVER_MAP = {
  primary: SERVER_1,
  secondary: SERVER_2,
};
const PREFERRED_SERVER_KEY = 'ipl-auction:preferred-server';

/** True when the value is one of the known server ids, local solo, or legacy aliases. */
export function isValidServer(value) {
  return (
    typeof value === 'string' &&
    (SERVER_IDS.has(value) || value === SERVER_LOCAL || Boolean(LEGACY_SERVER_MAP[value]))
  );
}

/**
 * Normalise a server value. Unknown/empty values fall back to `fallback`.
 * Pass `null` as the fallback when the caller needs to detect an invalid value.
 */
export function normalizeServer(value, fallback = DEFAULT_AUCTION_SERVER) {
  if (typeof value === 'string') {
    if (SERVER_IDS.has(value)) return value;
    if (value === SERVER_LOCAL) return SERVER_LOCAL;
    if (LEGACY_SERVER_MAP[value]) return LEGACY_SERVER_MAP[value];
  }
  return fallback;
}

/** Metadata for a server id. Unknown ids return the primary server metadata. */
export function getServerMeta(value) {
  const id = normalizeServer(value);
  if (id === SERVER_LOCAL) return LOCAL_SERVER_META;
  return (
    AUCTION_SERVERS.find((server) => server.id === id) || AUCTION_SERVERS[0]
  );
}

/**
 * Read the server from a Supabase auction row.
 *
 * In existing deployments prior to 4-server clustering, `primary` was assigned
 * to paypact-b5b52 (Server 4) and `secondary` was assigned to ipl-auction-3
 * (Server 3). We resolve these legacy tags directly to their physical servers
 * to preserve all existing rooms without requiring data migration.
 */
export function getAuctionServer(record) {
  if (!record) return DEFAULT_AUCTION_SERVER;
  const raw = record.settings?.server || record.server;
  if (raw === 'primary') return SERVER_4;
  if (raw === 'secondary') return SERVER_3;
  if (isValidServer(raw)) return normalizeServer(raw);
  return DEFAULT_AUCTION_SERVER;
}

/** Read the server hint from a query string. Invalid/missing hints return null. */
export function getServerFromSearch(search = '') {
  try {
    const value = new URLSearchParams(search).get('server');
    return isValidServer(value) ? normalizeServer(value) : null;
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
  // Never persist local solo server as preferred default for new cloud rooms
  if (server === SERVER_LOCAL) return;
  try {
    window.localStorage.setItem(
      PREFERRED_SERVER_KEY,
      normalizeServer(server),
    );
  } catch {
    // Private-mode/storage-disabled browsers can still use the in-memory state.
  }
}
