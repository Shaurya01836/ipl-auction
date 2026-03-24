import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut, 
  updateProfile 
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAnonymously = async (displayName) => {
    const { user } = await signInAnonymously(auth);
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    return user;
  };

  const logout = () => signOut(auth);

  const value = {
    user,
    loading,
    loginAnonymously,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
