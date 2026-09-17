import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Child } from '@shared/types';
import { api, getStoredToken, setStoredToken } from './api';
import { sound } from './audio';

interface AuthContextType {
  user: User | null;
  activeChild: Child | null;
  isLoading: boolean;
  isMuted: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setActiveChild: (child: Child | null) => void;
  toggleSound: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  useEffect(() => {
    // Check stored active child
    const storedChild = localStorage.getItem('naqra_active_child');
    if (storedChild) {
      try {
        setActiveChildState(JSON.parse(storedChild));
      } catch {}
    }

    // Check stored token and verify
    const token = getStoredToken();
    if (token) {
      api.auth.me()
        .then(res => {
          if (res.success && res.user) {
            setUser(res.user);
          }
        })
        .catch(() => {
          setStoredToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, loggedUser: User) => {
    setStoredToken(token);
    setUser(loggedUser);
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    setUser(null);
    setActiveChildState(null);
    localStorage.removeItem('naqra_active_child');
  };

  const setActiveChild = (child: Child | null) => {
    setActiveChildState(child);
    if (child) {
      localStorage.setItem('naqra_active_child', JSON.stringify(child));
    } else {
      localStorage.removeItem('naqra_active_child');
    }
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const refreshUser = async () => {
    try {
      const res = await api.auth.me();
      if (res.success) setUser(res.user);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeChild,
        isLoading,
        isMuted,
        login,
        logout,
        setActiveChild,
        toggleSound,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
