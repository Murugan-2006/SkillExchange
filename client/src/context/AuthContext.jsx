import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // If there is a token but no user, fetch profile on init
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (token && !user) {
        setLoading(true);
        try {
          const res = await authService.getProfile();
          if (mounted) setUser(res.data.user);
        } catch (err) {
          // Token invalid or expired - clear it
          console.warn('Failed to fetch profile, clearing token:', err?.response?.data || err.message);
          if (mounted) setToken(null);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    };

    loadProfile();
    return () => (mounted = false);
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    setLoading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
