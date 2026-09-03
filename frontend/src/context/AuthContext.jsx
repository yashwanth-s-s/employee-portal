import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('portal_token'));
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);

  const inactivityTimerRef = useRef(null);

  // Logout action
  const logout = useCallback(async (reason = null) => {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      setToken(null);
      setUser(null);
      if (reason) {
        setSessionExpiredMessage(reason);
      }
    }
  }, [token]);

  // Inactivity timeout handler
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (token) {
      inactivityTimerRef.current = setTimeout(() => {
        logout('Your session has expired due to inactivity (30 minutes). Please log in again.');
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [token, logout]);

  // Track user activity
  useEffect(() => {
    if (!token) return;

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [token, resetInactivityTimer]);

  // Listen for 401 session-expired event dispatched by api.js
  useEffect(() => {
    const handleSessionExpired = (event) => {
      logout(event.detail || 'Your session has expired. Please log in again.');
    };

    window.addEventListener('portal:session-expired', handleSessionExpired);
    return () => window.removeEventListener('portal:session-expired', handleSessionExpired);
  }, [logout]);

  // Fetch current user on mount or token change
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('portal_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    setSessionExpiredMessage(null);
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('portal_token', newToken);
      localStorage.setItem('portal_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(response.data.error || 'Authentication failed');
  };

  // Helper check methods
  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('Admin')) return true;
    return user.roles.includes(roleName);
  };

  const hasPermission = (permissionName) => {
    if (!user || !user.permissions) return false;
    if (user.roles?.includes('Admin')) return true;
    return user.permissions.includes(permissionName);
  };

  const clearSessionMessage = () => setSessionExpiredMessage(null);

  const value = {
    user,
    token,
    loading,
    sessionExpiredMessage,
    clearSessionMessage,
    login,
    logout,
    hasRole,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
