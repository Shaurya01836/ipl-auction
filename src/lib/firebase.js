import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "SCRUBBED_KEY",
  authDomain: "ipl-auction-1cdbc.firebaseapp.com",
  projectId: "ipl-auction-1cdbc",
  storageBucket: "ipl-auction-1cdbc.firebasestorage.app",
  messagingSenderId: "100121242357",
  appId: "1:100121242357:web:11e24448aaa888cc1df3bc",
  measurementId: "G-GQH1KPKFV9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;