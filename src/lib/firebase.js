import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase Configuration Error: VITE_FIREBASE_API_KEY is missing from .env file!');
} else {
  console.log('✅ Firebase Config: API Key loaded successfully.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// ─── Server Time Sync via Firebase RTDB ───
// Firebase RTDB provides `.info/serverTimeOffset` which is the ms difference
// between the client's clock and Firebase's server clock.
// This is the official Firebase mechanism for clock synchronization.
// All clients will agree on the same absolute time (±50ms).
let _serverTimeOffset = 0;

try {
  const rtdb = getDatabase(app);
  const offsetRef = ref(rtdb, '.info/serverTimeOffset');
  onValue(offsetRef, (snap) => {
    _serverTimeOffset = snap.val() || 0;
    console.log('[TimeSync] Firebase server offset:', _serverTimeOffset, 'ms');
  }, (err) => {
    console.warn('[TimeSync] RTDB offset listener error:', err.message);
    console.warn('[TimeSync] ⚠️ Enable Realtime Database in Firebase Console for accurate timer sync.');
  });
} catch (e) {
  console.warn('[TimeSync] Could not init RTDB:', e.message);
  console.warn('[TimeSync] ⚠️ Enable Realtime Database in Firebase Console for accurate timer sync.');
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