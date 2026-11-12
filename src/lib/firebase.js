import { getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getDatabase, ref, onValue, goOffline, goOnline } from "firebase/database";
import {
  AUCTION_SERVERS,
  DEFAULT_AUCTION_SERVER,
  getPreferredServer,
  normalizeServer,
  SERVER_1,
  SERVER_2,
  SERVER_3,
  SERVER_4,
} from "./auctionServers.js";

const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});

const firebaseConfig = {
  apiKey: rawEnv.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForNodeTestEnvironment00',
  authDomain: rawEnv.VITE_FIREBASE_AUTH_DOMAIN || 'ipl-auction.firebaseapp.com',
  // Primary project: Auth, Firestore and the first Realtime Database.
  databaseURL: rawEnv.VITE_FIREBASE_DATABASE_URL || 'https://ipl-auction-default-rtdb.firebaseio.com',
  projectId: rawEnv.VITE_FIREBASE_PROJECT_ID || 'ipl-auction-mock',
  storageBucket: rawEnv.VITE_FIREBASE_STORAGE_BUCKET || 'ipl-auction.appspot.com',
  messagingSenderId: rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: rawEnv.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
  measurementId: rawEnv.VITE_FIREBASE_MEASUREMENT_ID || 'G-DUMMY'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
// Defer Analytics until after first paint — removes it from the critical path
let analytics = null;
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    import('firebase/analytics').then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    });
  }, { once: true });
}
export { analytics };

// ─── Four RTDB backends ───
// Server 1 (Main): ipl-auction-1cdbc (Auth, Firestore, and primary RTDB with security rules)
// Server 2: ipl-auction-2-947e7
// Server 3: ipl-auction-3
// Server 4: paypact-b5b52
// Dedicated override apps isolate connections and credentials so API keys match
// their respective project IDs.

const server2DatabaseURL = (
  rawEnv.VITE_RTDB_2_URL ||
  rawEnv.VITE_RTDB_FIREBASE_DATABASE_URL ||
  'https://ipl-auction-2-947e7-default-rtdb.asia-southeast1.firebasedatabase.app'
).trim();

const server3DatabaseURL = (
  rawEnv.VITE_RTDB_3_URL ||
  rawEnv.VITE_RTDB_B_URL ||
  'https://ipl-auction-3-default-rtdb.asia-southeast1.firebasedatabase.app'
).trim();

const server4DatabaseURL = (
  rawEnv.VITE_RTDB_4_URL ||
  rawEnv.VITE_RTDB_A_URL ||
  'https://paypact-b5b52-default-rtdb.asia-southeast1.firebasedatabase.app'
).trim();

const SERVER_2_APP_NAME = 'ipl-auction-rtdb-2';
const SERVER_3_APP_NAME = 'ipl-auction-rtdb-3';
const SERVER_4_APP_NAME = 'ipl-auction-rtdb-4';

function deriveProjectId(databaseURL) {
  try {
    const host = new URL(databaseURL).hostname;
    return host.match(/^(.+?)-default-rtdb/)?.[1];
  } catch {
    return undefined;
  }
}

function createOverrideDatabase(databaseURL, appName, envPrefix) {
  if (!databaseURL) return null;
  try {
    const existing = getApps().find((candidate) => candidate.name === appName);
    const overrideApp = existing || initializeApp(
      Object.fromEntries(
        Object.entries({
          apiKey:            rawEnv[`${envPrefix}_API_KEY`],
          authDomain:        rawEnv[`${envPrefix}_AUTH_DOMAIN`],
          databaseURL,
          projectId:
            rawEnv[`${envPrefix}_PROJECT_ID`] ||
            deriveProjectId(databaseURL),
          storageBucket:     rawEnv[`${envPrefix}_STORAGE_BUCKET`],
          messagingSenderId: rawEnv[`${envPrefix}_MESSAGING_SENDER_ID`],
          appId:             rawEnv[`${envPrefix}_APP_ID`],
        }).filter(([, value]) => Boolean(value)),
      ),
      appName,
    );
    return getDatabase(overrideApp, databaseURL);
  } catch (error) {
    console.error(`[firebase] Could not initialise override RTDB app "${appName}"`, error);
    return null;
  }
}

const server1Rtdb = getDatabase(app);
const server2Rtdb =
  createOverrideDatabase(server2DatabaseURL, SERVER_2_APP_NAME, 'VITE_RTDB_2') ||
  createOverrideDatabase(server2DatabaseURL, SERVER_2_APP_NAME, 'VITE_RTDB_FIREBASE');
const server3Rtdb =
  createOverrideDatabase(server3DatabaseURL, SERVER_3_APP_NAME, 'VITE_RTDB_3') ||
  createOverrideDatabase(server3DatabaseURL, SERVER_3_APP_NAME, 'VITE_RTDB_B');
const server4Rtdb =
  createOverrideDatabase(server4DatabaseURL, SERVER_4_APP_NAME, 'VITE_RTDB_4') ||
  createOverrideDatabase(server4DatabaseURL, SERVER_4_APP_NAME, 'VITE_RTDB_A');

export const SECONDARY_SERVER_ENABLED = Boolean(server2Rtdb || server3Rtdb || server4Rtdb);

const SERVER_DATABASES = {
  [SERVER_1]: server1Rtdb,
  ...(server2Rtdb ? { [SERVER_2]: server2Rtdb } : {}),
  ...(server3Rtdb ? { [SERVER_3]: server3Rtdb } : {}),
  ...(server4Rtdb ? { [SERVER_4]: server4Rtdb } : {}),
};

/** True when the server has a configured database. */
export function isServerAvailable(server) {
  const id = normalizeServer(server, null);
  return Boolean(id && SERVER_DATABASES[id]);
}

/** Server metadata for the servers that are actually configured. */
export function getAvailableServers() {
  return AUCTION_SERVERS.filter((server) => isServerAvailable(server.id));
}

let localModeActive = false;

/** Enable strict device-local solo mode (disconnects sockets and throws on accidental RTDB access). */
export function enterLocalMode() {
  localModeActive = true;
  goOfflineAllServers();
}

/** Exit local solo mode and re-allow cloud connections. */
export function exitLocalMode() {
  localModeActive = false;
}

/** Check if device-local solo mode is currently engaged. */
export function isLocalMode() {
  return localModeActive;
}

export function getRtdb(server = DEFAULT_AUCTION_SERVER) {
  if (localModeActive || server === 'local') {
    throw new Error('RTDB access is strictly prohibited in device-local solo mode.');
  }
  const id = normalizeServer(server);
  return SERVER_DATABASES[id] || server1Rtdb;
}

let activeServer = (() => {
  const preferred = getPreferredServer();
  return isServerAvailable(preferred) ? preferred : DEFAULT_AUCTION_SERVER;
})();

/**
 * Live binding consumed by the rest of the app. Importing `rtdb` as a named
 * export means existing `ref(rtdb, ...)` calls automatically follow the active
 * server without a mass refactor.
 */
export let rtdb = getRtdb(activeServer);

export function getActiveServer() {
  return activeServer;
}

// No database is connected while the user is browsing the landing page,
// public lobby or history. Only room entry calls goOnlineServer().
try {
  Object.values(SERVER_DATABASES).forEach((dbInstance) => {
    if (dbInstance) goOffline(dbInstance);
  });
} catch {
  // Offline mode is a courtesy; the SDK reconnects automatically when asked.
}

// ─── Per-server time sync ───
const serverTimeOffsets = new Map();
const serverTimeUnsubscribers = new Map();

function startServerTimeSync(server) {
  if (!isServerAvailable(server) || serverTimeUnsubscribers.has(server)) return;
  try {
    const offsetRef = ref(getRtdb(server), '.info/serverTimeOffset');
    const unsubscribe = onValue(
      offsetRef,
      (snap) => {
        serverTimeOffsets.set(server, snap.val() || 0);
      },
      () => {
        // Keep the last known offset; a reconnect will refresh it.
      },
    );
    serverTimeUnsubscribers.set(server, unsubscribe);
  } catch {
    // Local clock remains the fallback.
  }
}

function stopServerTimeSync(server) {
  const unsubscribe = serverTimeUnsubscribers.get(server);
  if (!unsubscribe) return;
  try {
    unsubscribe();
  } catch {
    // Listener already gone.
  }
  serverTimeUnsubscribers.delete(server);
}

/**
 * Switch the live binding and close the previous server's socket. This does not
 * open the new socket; call goOnlineServer() when actually entering a room.
 */
export function setActiveServer(server) {
  const next = normalizeServer(server, null);
  if (!next || !isServerAvailable(next) || next === activeServer) return rtdb;

  try {
    goOffline(rtdb);
  } catch {
    // The old socket may already be closed.
  }
  stopServerTimeSync(activeServer);

  activeServer = next;
  rtdb = getRtdb(next);
  return rtdb;
}

/** Switch to a server, connect, and start its time-offset listener. */
export function goOnlineServer(server = activeServer) {
  if (localModeActive) {
    throw new Error('Cannot connect RTDB server while in local solo mode.');
  }
  const next = normalizeServer(server);
  if (!isServerAvailable(next)) {
    throw new Error(`${next} auction server is not configured.`);
  }
  setActiveServer(next);
  const target = rtdb;
  try {
    if (target.app && target.app.name !== '[DEFAULT]' && target.app.options?.apiKey) {
      const targetAuth = getAuth(target.app);
      if (!targetAuth.currentUser) {
        signInAnonymously(targetAuth).catch(() => {});
      }
    }
    goOnline(target);
  } catch {
    // The connection watchdog reports a genuinely unusable socket.
  }
  startServerTimeSync(activeServer);
  return rtdb;
}

/** Stop one server's socket and time listener without changing the binding. */
export function goOfflineServer(server = activeServer) {
  const id = normalizeServer(server);
  if (!isServerAvailable(id)) return;
  try {
    goOffline(getRtdb(id));
  } catch {
    // Already offline.
  }
  stopServerTimeSync(id);
}

/**
 * Shut down all configured RTDB sockets and cancel active time sync listeners.
 * Used when entering device-local solo mode to guarantee zero open sockets.
 */
export function goOfflineAllServers() {
  Object.values(SERVER_DATABASES).forEach((dbInstance) => {
    if (dbInstance) {
      try {
        goOffline(dbInstance);
      } catch {
        // Already offline.
      }
    }
  });
  for (const serverId of Array.from(serverTimeUnsubscribers.keys())) {
    stopServerTimeSync(serverId);
  }
}

/** Reconnect all configured RTDB sockets (or active server). */
export function goOnlineAllServers() {
  return goOnlineServer(activeServer);
}

/**
 * Resolve true once the database's socket is usable. A full database never
 * reaches this point, which lets room creation fall back to the other server.
 */
export function waitForServerConnection(dbOrServer, timeoutMs = 6000) {
  const database =
    typeof dbOrServer === 'string' ? getRtdb(dbOrServer) : dbOrServer;

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = null;
    let timer = null;

    const finish = (connected) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {
          // Listener already gone.
        }
      }
      resolve(connected);
    };

    timer = setTimeout(() => finish(false), timeoutMs);

    try {
      const stop = onValue(
        ref(database, '.info/connected'),
        (snap) => {
          if (snap.val() === true) finish(true);
        },
        () => finish(false),
      );
      unsubscribe = stop;
      // A cached snapshot can arrive synchronously before `stop` is assigned.
      if (settled) {
        try {
          stop();
        } catch {
          // Listener already gone.
        }
      }
    } catch {
      finish(false);
    }
  });
}

/** Wait briefly for the active server's first clock-offset snapshot. */
export function waitForServerTime(server = activeServer, timeoutMs = 1500) {
  const id = normalizeServer(server);
  if (serverTimeOffsets.has(id)) return Promise.resolve(serverTimeOffsets.get(id));
  startServerTimeSync(id);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (serverTimeOffsets.has(id)) {
        clearInterval(timer);
        resolve(serverTimeOffsets.get(id));
      } else if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(timer);
        resolve(0);
      }
    }, 50);
  });
}

/**
 * Returns the current server-authoritative time in milliseconds.
 * Uses the active server's `.info/serverTimeOffset` for ms-accurate sync.
 */
export const getServerTime = (server = activeServer) =>
  Date.now() + (serverTimeOffsets.get(normalizeServer(server)) || 0);

/** Current offset in ms (for debugging). */
export const getServerTimeOffset = (server = activeServer) =>
  serverTimeOffsets.get(normalizeServer(server)) || 0;

export default app;
