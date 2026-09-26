/**
 * =============================================================================
 * Module: Authentication & Language Context Provider
 * Authorship: Full-Stack Web Team (agrimind-main)
 * Component: /app/frontend/src/context/AuthContext.jsx
 * Description: JWT session persistence, user login/logout, profile updates,
 *              employee farmer accounts support, and multilingual toggling via native fetch.
 * =============================================================================
 */

import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en');

  // Load user profile on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  const login = async (mobile, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed.' };
    } catch (err) {
      return {
        success: false,
        message: 'Login failed. Please check your network and credentials.'
      };
    }
  };

  const register = async (name, mobile, password, role = 'farmer') => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, password, role })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed.' };
    } catch (err) {
      return {
        success: false,
        message: 'Registration failed. Please check your details.'
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const storedToken = localStorage.getItem('token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(prev => ({ ...prev, ...data.user }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Update failed.' };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to update profile.'
      };
    }
  };

  const searchFarmer = async (mobile) => {
    try {
      const storedToken = localStorage.getItem('token');
      const res = await fetch(`/api/user/farmer/${mobile}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Farmer search error.' };
    }
  };

  const loginGuest = async () => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
    } catch (_) {}
    const fallbackUser = { id: '65fc20a1b900000000000001', name: 'Demo Farmer (Guest)', mobile: '01700000000', role: 'farmer' };
    setUser(fallbackUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        language,
        toggleLanguage,
        login,
        loginGuest,
        register,
        logout,
        updateProfile,
        searchFarmer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
