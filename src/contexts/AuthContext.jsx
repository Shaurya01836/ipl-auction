import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { auth } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  updateProfile,
} from "firebase/auth";
import {
  ref,
  push,
  serverTimestamp as serverTimestampRtdb,
} from "firebase/database";

const AuthContext = createContext({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginAsGuest: async () => {},
  logout: async () => {},
});

const googleProvider = new GoogleAuthProvider();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  const loginAsGuest = async (displayName) => {
    const result = await signInAnonymously(auth);
    await updateProfile(result.user, { displayName });
    setUser({ ...result.user, displayName });
    return result.user;
  };

  const logout = () => signOut(auth);

  const sendMessage = useCallback(
    async (roomId, text, type = "text") => {
      const cleanText = typeof text === "string" ? text.trim() : "";

      if (!user) {
        throw new Error("Please log in to send a message.");
      }

      if (!roomId || !cleanText) return;

      const msgRef = ref(rtdb, `auctions/${roomId}/messages`);
      await push(msgRef, {
        userId: user.uid,
        userName: user.displayName || "Manager",
        text: cleanText,
        type,
        timestamp: serverTimestampRtdb(),
      });
    },
    [user],
  );

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginAsGuest,
    logout,
    sendMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
