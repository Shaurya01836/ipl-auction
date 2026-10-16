import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getDatabase, ref, onValue, goOffline } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // Single-project setup: Auth, Firestore and the Realtime Database all live in
  // the same Firebase project, so RTDB requests carry the signed-in user's token
  // and the database rules can rely on `auth != null` / `auth.uid`.
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


// ─── Server Time Sync via Firebase RTDB ───
let _serverTimeOffset = 0;

export const rtdb = getDatabase(app);


try {
  // Start offline by default until entering an active room session
  goOffline(rtdb);
  const offsetRef = ref(rtdb, '.info/serverTimeOffset');
  onValue(offsetRef, (snap) => {
    _serverTimeOffset = snap.val() || 0;
  });
} catch {
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