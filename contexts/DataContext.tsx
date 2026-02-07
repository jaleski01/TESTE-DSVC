
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '../types';

interface DataContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  updateLocalProfile: (newData: Partial<UserProfile>) => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

const CACHE_KEY = 'user_profile_cache_v1';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (uid: string) => {
    // 1. Zero-Latency Start: Load from LocalStorage
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setUserProfile(parsed);
        // Only set loading to false if we actually have valid cached data
        setLoading(false);
      }
    } catch (e) {
      console.warn("[DataContext] Failed to parse cache", e);
    }

    // 2. Network Fetch (Background Revalidation)
    try {
      const profileRef = doc(db, 'users', uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const freshData = profileSnap.data() as UserProfile;
        
        // Update state and cache
        setUserProfile(freshData);
        localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
      }
    } catch (error) {
      console.error("[DataContext] Error syncing with Firebase:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadData(user.uid);
      } else {
        setUserProfile(null);
        localStorage.removeItem(CACHE_KEY);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loadData]);

  const updateLocalProfile = useCallback((newData: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...newData };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (auth.currentUser) {
      await loadData(auth.currentUser.uid);
    }
  }, [loadData]);

  return (
    <DataContext.Provider value={{ userProfile, loading, refreshData, updateLocalProfile }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
