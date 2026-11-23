'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, fetchCsrfToken, ApiError } from '../lib/api-client';
import { UserSummary, AuthResponse } from '@buildmind/shared-types';
import { LoginInput, RegisterInput } from '@buildmind/validation';

interface AuthContextType {
  user: UserSummary | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // Pre-seed CSRF token cookie on initial page load
      await fetchCsrfToken();

      const profile = await apiClient<UserSummary>('/auth/me');
      setUser(profile);
      setError(null);
    } catch {
      // 401 or network error indicates unauthenticated state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setUser(response.user);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterInput): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setUser(response.user);
      return response;
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please check your inputs.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('[AuthProvider] Logout network notice:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  const logoutAll = async () => {
    try {
      setIsLoading(true);
      await apiClient('/auth/logout-all', { method: 'POST' });
    } catch (err) {
      console.warn('[AuthProvider] Logout-all network notice:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        error,
        login,
        register,
        logout,
        logoutAll,
        checkAuth,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
