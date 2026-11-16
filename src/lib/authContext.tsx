'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, UserProfile, BusinessItem } from '@/lib/api';

interface AuthContextValue {
  user: UserProfile | null;
  businesses: BusinessItem[];
  activeBusiness: BusinessItem | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  isLoaded: boolean;
  login: (token: string, user: UserProfile, businesses?: BusinessItem[]) => void;
  logout: () => Promise<void>;
  setActiveBusiness: (business: BusinessItem | null) => void;
  refreshUser: () => Promise<void>;
  refreshBusinesses: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessItem | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('mk_user_token');
      const savedUser = localStorage.getItem('mk_user');
      const savedBiz = localStorage.getItem('mk_active_biz');

      if (savedToken) {
        setToken(savedToken);
      }
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedBiz) {
        setActiveBusiness(JSON.parse(savedBiz));
      }
    } catch {} finally {
      setIsLoaded(true);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('mk_user_token');
      if (!savedToken) return;

      const res = await api.user.me(savedToken);
      if (res?.user) {
        setUser(res.user);
        localStorage.setItem('mk_user', JSON.stringify(res.user));
        if (res.businesses) {
          setBusinesses(res.businesses);
        }
      }
    } catch {
      // Token might be expired
    }
  }, []);

  const refreshBusinesses = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('mk_user_token');
      if (!savedToken) return;

      const list = await api.business.list(savedToken);
      if (Array.isArray(list)) {
        setBusinesses(list);
        if (list.length > 0 && !activeBusiness) {
          setActiveBusiness(list[0]);
          localStorage.setItem('mk_active_biz', JSON.stringify(list[0]));
        }
      }
    } catch {}
  }, [activeBusiness]);

  useEffect(() => {
    if (token) {
      refreshUser();
      refreshBusinesses();
    }
  }, [token, refreshUser, refreshBusinesses]);

  const login = (authToken: string, authUser: UserProfile, authBusinesses: BusinessItem[] = []) => {
    setToken(authToken);
    setUser(authUser);
    setBusinesses(authBusinesses);
    localStorage.setItem('mk_user_token', authToken);
    localStorage.setItem('mk_user', JSON.stringify(authUser));

    if (authBusinesses.length > 0) {
      setActiveBusiness(authBusinesses[0]);
      localStorage.setItem('mk_active_biz', JSON.stringify(authBusinesses[0]));
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.auth.logout(token).catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      setBusinesses([]);
      setActiveBusiness(null);
      localStorage.removeItem('mk_user_token');
      localStorage.removeItem('mk_user');
      localStorage.removeItem('mk_active_biz');
    }
  };

  const handleSetActiveBusiness = (business: BusinessItem | null) => {
    setActiveBusiness(business);
    if (business) {
      localStorage.setItem('mk_active_biz', JSON.stringify(business));
    } else {
      localStorage.removeItem('mk_active_biz');
    }
  };

  const value: AuthContextValue = {
    user,
    businesses,
    activeBusiness,
    token,
    isLoggedIn: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isVerified: !!user?.is_verified,
    isLoaded,
    login,
    logout,
    setActiveBusiness: handleSetActiveBusiness,
    refreshUser,
    refreshBusinesses,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
