import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { clearSession } from '../api/axios';

const AuthContext = createContext(null);

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // keep in sync with JWT_EXPIRES_IN

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app load: validate the stored JWT against the backend
  useEffect(() => {
    const token = localStorage.getItem('shopkart_token');
    const cached = localStorage.getItem('shopkart_user');
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { /* ignore */ }
    }
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('shopkart_user', JSON.stringify(res.data));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((data) => {
    const { token, ...rest } = data;
    localStorage.setItem('shopkart_token', token);
    localStorage.setItem('shopkart_user', JSON.stringify(rest));
    // First-party cookie mirror — survives proxies that drop Authorization headers
    document.cookie = `shopkart_token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    setUser(rest);
    return rest;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      return persist(data);
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      return persist(data);
    },
    [persist]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isSales: user?.role === 'sales',
    canSell: user?.role === 'admin' || user?.role === 'sales',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
