/**
 * Auction server registry and environment-driven helpers.
 *
 * Realtime Database backends are fully dynamic and configurable via environment
 * variables without code changes:
 * - VITE_ENABLED_SERVERS: Comma-separated list to enable/order servers (e.g. "server-1,server-2,server-3,server-4,server-5")
 * - VITE_RTDB_<N>_URL: URL for server-N (e.g. VITE_RTDB_4_URL=https://ipl-auction-4-default-rtdb...)
 *
 * Keep this module free of Firebase/Supabase imports so it can be unit-tested
 * with plain `node --test`.
 */

const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

export const SERVER_1 = 'server-1';
export const SERVER_2 = 'server-2';
export const SERVER_3 = 'server-3';
export const SERVER_4 = 'server-4';
export const SERVER_5 = 'server-5';
export const SERVER_LOCAL = 'local';

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

export function deriveProjectId(databaseUrl) {
  if (!databaseUrl) return '';
  try {
    const host = new URL(databaseUrl).hostname;
    return host.match(/^(.+?)-default-rtdb/)?.[1] || host.split('.')[0];
  } catch {
    return '';
  }
}

function buildAuctionServers() {
  const BASE_DEFINITIONS = [
    {
      id: SERVER_1,
      num: 1,
      label: 'Server 1',
      shortLabel: 'S1',
      url: rawEnv.VITE_RTDB_1_URL || rawEnv.VITE_FIREBASE_DATABASE_URL || 'https://ipl-auction-1cdbc-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: rawEnv.VITE_RTDB_1_PROJECT_ID || rawEnv.VITE_FIREBASE_PROJECT_ID || 'ipl-auction-1cdbc',
    },
    {
      id: SERVER_2,
      num: 2,
      label: 'Server 2',
      shortLabel: 'S2',
      url: rawEnv.VITE_RTDB_2_URL || rawEnv.VITE_RTDB_FIREBASE_DATABASE_URL || 'https://ipl-auction-2-947e7-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: rawEnv.VITE_RTDB_2_PROJECT_ID || rawEnv.VITE_RTDB_FIREBASE_PROJECT_ID || 'ipl-auction-2-947e7',
    },
    {
      id: SERVER_3,
      num: 3,
      label: 'Server 3',
      shortLabel: 'S3',
      url: rawEnv.VITE_RTDB_3_URL || rawEnv.VITE_RTDB_B_URL || 'https://ipl-auction-3-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: rawEnv.VITE_RTDB_3_PROJECT_ID || rawEnv.VITE_RTDB_B_PROJECT_ID || 'ipl-auction-3',
    },
    {
      id: SERVER_4,
      num: 4,
      label: 'Server 4',
      shortLabel: 'S4',
      url: rawEnv.VITE_RTDB_4_URL || rawEnv.VITE_RTDB_A_URL || 'https://ipl-auction-4-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: rawEnv.VITE_RTDB_4_PROJECT_ID || rawEnv.VITE_RTDB_A_PROJECT_ID || 'ipl-auction-4',
    },
    {
      id: SERVER_5,
      num: 5,
      label: 'Server 5',
      shortLabel: 'S5',
      url: rawEnv.VITE_RTDB_5_URL || 'https://ipl-auction-5-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: rawEnv.VITE_RTDB_5_PROJECT_ID || 'ipl-auction-5',
    },
  ];

  // Dynamically register any additional servers from environment (e.g. VITE_RTDB_6_URL up to 12)
  for (let i = 6; i <= 12; i++) {
    const url = rawEnv[`VITE_RTDB_${i}_URL`];
    if (url) {
      BASE_DEFINITIONS.push({
        id: `server-${i}`,
        num: i,
        label: `Server ${i}`,
        shortLabel: `S${i}`,
        url,
        projectId: rawEnv[`VITE_RTDB_${i}_PROJECT_ID`] || deriveProjectId(url) || `server-${i}`,
      });
    }
  }

  const serverMap = new Map();
  BASE_DEFINITIONS.forEach((s) => {
    const cleanUrl = (s.url || '').trim();
    if (!cleanUrl) return;
    const projectId = s.projectId || deriveProjectId(cleanUrl) || s.id;
    serverMap.set(s.id, {
      id: s.id,
      label: s.label,
      shortLabel: s.shortLabel,
      description: `Node ${s.num} (${projectId})`,
      databaseUrl: cleanUrl,
      projectId,
    });
  });

  // If VITE_ENABLED_SERVERS is specified in environment, filter & order accordingly
  if (rawEnv.VITE_ENABLED_SERVERS) {
    const enabled = rawEnv.VITE_ENABLED_SERVERS
      .split(',')
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean);

    const filtered = [];
    for (const id of enabled) {
      if (serverMap.has(id)) {
        filtered.push(serverMap.get(id));
      }
    }
    if (filtered.length > 0) {
      return filtered;
    }
  }

  return Array.from(serverMap.values());
}

export const AUCTION_SERVERS = Object.freeze(buildAuctionServers());

const SERVER_IDS = new Set(AUCTION_SERVERS.map((server) => server.id));
const LEGACY_SERVER_MAP = {
  primary: SERVER_1,
  secondary: SERVER_2,
};
const PREFERRED_SERVER_KEY = 'ipl-auction:preferred-server';

/** True when the value is one of the known server ids, local solo, or legacy aliases. */
export function isValidServer(value) {
  if (value && typeof value === 'object' && value.id) {
    value = value.id;
  }
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
  if (value && typeof value === 'object' && value.id) {
    value = value.id;
  }
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
