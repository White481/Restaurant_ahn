import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../services/api.js';

const AuthContext = createContext(null);
const USER_KEY = 'oms_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
