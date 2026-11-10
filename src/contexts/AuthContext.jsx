import React, { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext({
  user: null,
  loading: true,
  loginWithGoogle: async () => { },
  loginAsGuest: async () => { },
  logout: async () => { }
});

const googleProvider = new GoogleAuthProvider();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // AuthProvider check failed
  }
  return context || {};
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

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginAsGuest,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
