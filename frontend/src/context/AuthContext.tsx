import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth';
import { AuthResponse, User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistToken = (value: string | null) => {
    setToken(value);
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
    }
  };

  const bootstrap = async () => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      setIsLoading(false);
      return;
    }
    persistToken(stored);
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load profile', error);
      persistToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    persistToken(response.token);
    if (response.user) {
      setUser(response.user);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    handleAuthSuccess(response);
    if (!response.user) {
      const profile = await fetchCurrentUser();
      setUser(profile);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    await registerUser({ name, email, password });
    persistToken(null);
    setUser(null);
  };

  const logout = () => {
    persistToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await fetchCurrentUser();
    setUser(profile);
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, refreshUser }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
