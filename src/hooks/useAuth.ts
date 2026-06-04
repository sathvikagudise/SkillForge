import { useState, useCallback, useEffect } from 'react';
import { authAPI } from '@/services/api';

interface User {
  user_id: number;
  email: string;
  name: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      loadUser(savedToken);
    }
  }, []);

  const loadUser = async (accessToken: string) => {
    try {
      const userData = await authAPI.getMe(accessToken);
      setUser(userData);
      // Notify app that authenticated data may have changed (notes/flashcards/etc.)
      try { window.dispatchEvent(new Event('dataChanged')); } catch {};
    } catch (err) {
      console.error('Failed to load user:', err);
      // If getMe fails, the token may be invalid
      localStorage.removeItem('access_token');
      setToken(null);
    }
  };

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authAPI.signup(email, password, name);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const authData: AuthResponse = await authAPI.login(email, password);
      setToken(authData.access_token);
      localStorage.setItem('access_token', authData.access_token);

      // Load user data
      await loadUser(authData.access_token);
      // Notify other parts of the app to reload protected data (Dashboard, Notes...)
      try { window.dispatchEvent(new Event('dataChanged')); } catch {};

      return authData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  }, []);

  return {
    user,
    token,
    loading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!token,
  };
};
