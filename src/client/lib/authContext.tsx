import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Child } from '@shared/types';
import { api, getStoredToken, setStoredToken } from './api';
import { sound } from './audio';
import { getGuestChild, startGuestSession, clearGuestData } from './guestSession';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  authStatus: AuthStatus;
  user: User | null;
  activeChild: Child | null;
  sessionRole: 'parent' | 'admin' | 'child' | null;
  isLoading: boolean;
  isMuted: boolean;
  isGuest: boolean;
  loginParent: (token: string, user: User) => void;
  login: (token: string, user: User) => void;
  loginChild: (token: string, child: Child) => void;
  startGuestPlay: (level: number, name?: string) => Child;
  exitGuestMode: () => void;
  setActiveChild: (child: Child | null) => void;
  logout: () => Promise<void>;
  toggleSound: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [sessionRole, setSessionRole] = useState<'parent' | 'admin' | 'child' | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  const checkAuth = async () => {
    setAuthStatus('loading');
    try {
      const res = await api.auth.me();
      if (res.success && res.authenticated) {
        setIsGuest(false);
        if (res.role === 'child' && res.child) {
          setActiveChild(res.child);
          setUser(null);
          setSessionRole('child');
          setAuthStatus('authenticated');
        } else if ((res.role === 'parent' || res.role === 'admin') && res.user) {
          setUser(res.user);
          setActiveChild(null);
          setSessionRole(res.role || res.user.role);
          setAuthStatus('authenticated');
        } else {
          setUser(null);
          setActiveChild(null);
          setSessionRole(null);
          setAuthStatus('unauthenticated');
        }
        return;
      }
    } catch {
      // Server check failed or network offline
    }

    // Check if active guest child exists locally
    const guestChild = getGuestChild();
    if (guestChild) {
      setActiveChild(guestChild);
      setUser(null);
      setSessionRole('child');
      setIsGuest(true);
      setAuthStatus('authenticated');
      return;
    }

    setUser(null);
    setActiveChild(null);
    setSessionRole(null);
    setIsGuest(false);
    setStoredToken(null);
    setAuthStatus('unauthenticated');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginParent = (token: string, loggedUser: User) => {
    clearGuestData();
    setIsGuest(false);
    setStoredToken(token);
    setUser(loggedUser);
    setActiveChild(null);
    setSessionRole(loggedUser.role as any);
    setAuthStatus('authenticated');
  };

  const loginChild = (token: string, childData: Child) => {
    clearGuestData();
    setIsGuest(false);
    setStoredToken(token);
    setActiveChild(childData);
    setUser(null);
    setSessionRole('child');
    setAuthStatus('authenticated');
  };

  const startGuestPlay = (level: number, name?: string): Child => {
    const guest = startGuestSession(level, name);
    setActiveChild(guest);
    setUser(null);
    setSessionRole('child');
    setIsGuest(true);
    setAuthStatus('authenticated');
    return guest;
  };

  const exitGuestMode = () => {
    clearGuestData();
    setIsGuest(false);
    setActiveChild(null);
    setSessionRole(null);
    setAuthStatus('unauthenticated');
  };

  const logout = async () => {
    if (isGuest) {
      exitGuestMode();
      return;
    }
    try {
      await api.auth.logout();
    } catch {}
    setStoredToken(null);
    setUser(null);
    setActiveChild(null);
    setSessionRole(null);
    setIsGuest(false);
    setAuthStatus('unauthenticated');
    localStorage.removeItem('naqra_active_child');
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const refreshSession = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        user,
        activeChild,
        sessionRole,
        isLoading: authStatus === 'loading',
        isMuted,
        isGuest,
        loginParent,
        login: loginParent,
        loginChild,
        startGuestPlay,
        exitGuestMode,
        setActiveChild,
        logout,
        toggleSound,
        refreshSession,
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
