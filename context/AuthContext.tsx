'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserStats {
  runnerGames: number;
  runnerStars: number;
  runnerBestTime?: number;
  spaceGames: number;
  spaceHighScore: number;
  coinsTotal: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  stats: UserStats;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'register' | 'forgot';
  openAuthModal: (view?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  loginWithGoogle: (googleData: { email: string; name?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'forgot'>('login');

  const fetchCurrentUser = useCallback(async () => {
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('xian_active_user_id') : null;
      const res = await fetch(`/api/auth/me${savedUserId ? `?userId=${encodeURIComponent(savedUserId)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('xian_active_user_id', data.user.id);
            localStorage.setItem('runner_player_name', data.user.name);
          }
        } else {
          setUser(null);
        }
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser().then(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchCurrentUser]);

  const openAuthModal = useCallback((view: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      setUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('xian_active_user_id', data.user.id);
        localStorage.setItem('runner_player_name', data.user.name);
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' };
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create account' };
      }
      setUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('xian_active_user_id', data.user.id);
        localStorage.setItem('runner_player_name', data.user.name);
      }
      setIsAuthModalOpen(false);
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' };
    }
  };

  const loginWithGoogle = async (googleData: { email: string; name?: string; avatar?: string }) => {
    try {
      if (!googleData?.email) {
        return { success: false, error: 'Google authentication did not provide a valid email.' };
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google login failed' };
      }
      setUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('xian_active_user_id', data.user.id);
        localStorage.setItem('runner_player_name', data.user.name);
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('xian_active_user_id');
      }
    }
  };

  const updateProfile = async (data: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => {
    if (!user) return { success: false, error: 'Not logged in' };
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...data }),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error || 'Update failed' };
      setUser(resData.user);
      if (typeof window !== 'undefined' && resData.user?.name) {
        localStorage.setItem('runner_player_name', resData.user.name);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  };

  const deleteAccount = async () => {
    if (!user) return { success: false, error: 'Not logged in' };
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const resData = await res.json();
      if (!res.ok) return { success: false, error: resData.error || 'Account deletion failed' };
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('xian_active_user_id');
        localStorage.removeItem('runner_player_name');
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  };

  const isAdmin = !!(user && (user.role === 'admin' || user.email.toLowerCase() === 'xiansaiful@gmail.com'));

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isAuthModalOpen,
        authModalView,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser: fetchCurrentUser,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
