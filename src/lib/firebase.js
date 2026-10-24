import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getDatabase, ref, onValue, goOffline, goOnline } from "firebase/database";
import {
  AUCTION_SERVERS,
  DEFAULT_AUCTION_SERVER,
  getPreferredServer,
  normalizeServer,
} from "./auctionServers";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // Primary project: Auth, Firestore and the first Realtime Database.
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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

// ─── Two RTDB backends ───
// When a RTDB override URL is supplied for a server, we spin up a dedicated
// Firebase app for it so the API key always matches the database project and
// avoids the "invalid credentials" warning that occurs when a key from one
// project is used against another project's database URL.

const primaryDatabaseURL = (
  import.meta.env.VITE_RTDB_A_URL || ''
).trim();

const secondaryDatabaseURL = (
  import.meta.env.VITE_RTDB_B_URL ||
  import.meta.env.VITE_FIREBASE_B_DATABASE_URL ||
  ''
).trim();

const PRIMARY_APP_NAME   = 'ipl-auction-rtdb-primary';
const SECONDARY_APP_NAME = 'ipl-auction-rtdb-secondary';

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
          apiKey:            import.meta.env[`${envPrefix}_API_KEY`],
          authDomain:        import.meta.env[`${envPrefix}_AUTH_DOMAIN`],
          databaseURL,
          projectId:
            import.meta.env[`${envPrefix}_PROJECT_ID`] ||
            deriveProjectId(databaseURL),
          storageBucket:     import.meta.env[`${envPrefix}_STORAGE_BUCKET`],
          messagingSenderId: import.meta.env[`${envPrefix}_MESSAGING_SENDER_ID`],
          appId:             import.meta.env[`${envPrefix}_APP_ID`],
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

const primaryRtdb   = createOverrideDatabase(primaryDatabaseURL,   PRIMARY_APP_NAME,   'VITE_RTDB_A') || getDatabase(app);
const secondaryRtdb = createOverrideDatabase(secondaryDatabaseURL, SECONDARY_APP_NAME, 'VITE_RTDB_B');

export const SECONDARY_SERVER_ENABLED = Boolean(secondaryRtdb);

const SERVER_DATABASES = {
  [DEFAULT_AUCTION_SERVER]: primaryRtdb,
  ...(secondaryRtdb ? { secondary: secondaryRtdb } : {}),
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

export function getRtdb(server = DEFAULT_AUCTION_SERVER) {
  const id = normalizeServer(server);
  return SERVER_DATABASES[id] || primaryRtdb;
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
  goOffline(primaryRtdb);
  if (secondaryRtdb) goOffline(secondaryRtdb);
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
  const next = normalizeServer(server);
  if (!isServerAvailable(next)) {
    throw new Error(`${next} auction server is not configured.`);
  }
  setActiveServer(next);
  try {
    goOnline(rtdb);
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
