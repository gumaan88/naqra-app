import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Child } from '@shared/types';
import { api, getStoredToken, setStoredToken } from './api';
import { sound } from './audio';

interface AuthContextType {
  user: User | null;
  activeChild: Child | null;
  sessionRole: 'parent' | 'admin' | 'child' | null;
  isLoading: boolean;
  isMuted: boolean;
  loginParent: (token: string, user: User) => void;
  login: (token: string, user: User) => void;
  loginChild: (token: string, child: Child) => void;
  logout: () => Promise<void>;
  toggleSound: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [sessionRole, setSessionRole] = useState<'parent' | 'admin' | 'child' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  const checkAuth = async () => {
    try {
      const res = await api.auth.me();
      if (res.success && res.authenticated) {
        if (res.role === 'child' && res.child) {
          setActiveChild(res.child);
          setUser(null);
          setSessionRole('child');
        } else if ((res.role === 'parent' || res.role === 'admin') && res.user) {
          setUser(res.user);
          setActiveChild(null);
          setSessionRole(res.role);
        }
      } else {
        setUser(null);
        setActiveChild(null);
        setSessionRole(null);
        setStoredToken(null);
      }
    } catch {
      setUser(null);
      setActiveChild(null);
      setSessionRole(null);
      setStoredToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginParent = (token: string, loggedUser: User) => {
    setStoredToken(token);
    setUser(loggedUser);
    setActiveChild(null);
    setSessionRole(loggedUser.role as any);
  };

  const loginChild = (token: string, childData: Child) => {
    setStoredToken(token);
    setActiveChild(childData);
    setUser(null);
    setSessionRole('child');
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    setStoredToken(null);
    setUser(null);
    setActiveChild(null);
    setSessionRole(null);
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
        user,
        activeChild,
        sessionRole,
        isLoading,
        isMuted,
        loginParent,
        login: loginParent,
        loginChild,
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
