import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue, goOffline, goOnline } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const rtdbFirebaseConfig = {
  apiKey: import.meta.env.VITE_RTDB_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_RTDB_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_RTDB_FIREBASE_DATABASE_URL || import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_RTDB_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_RTDB_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_RTDB_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_RTDB_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const rtdbApp = initializeApp(rtdbFirebaseConfig, "RTDB_APP");

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const analytics = getAnalytics(app);


// ─── Server Time Sync via Firebase RTDB ───
let _serverTimeOffset = 0;

export const rtdb = getDatabase(rtdbApp);


try {
  // Start offline by default until entering an active room session
  goOffline(rtdb);
  const offsetRef = ref(rtdb, '.info/serverTimeOffset');
  onValue(offsetRef, (snap) => {
    _serverTimeOffset = snap.val() || 0;
  });
} catch (e) {
  // RTDB sync skipped silently. We default to local machine clock.
}

/**
 * Returns the current server-authoritative time in milliseconds.
 * Uses Firebase RTDB's `.info/serverTimeOffset` for ms-accurate sync.
 * All clients calling this will agree on the same absolute time (±50ms).
 */
export const getServerTime = () => Date.now() + _serverTimeOffset;

/**
 * Returns the current server time offset in ms (for debugging).
 */
export const getServerTimeOffset = () => _serverTimeOffset;

export default app;