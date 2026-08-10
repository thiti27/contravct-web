import { createContext, useContext, useState } from 'react';
import { login as loginRequest, AUTH_STORAGE_KEY } from '../lib/api';

const STORAGE_KEY = AUTH_STORAGE_KEY;
const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const login = async (username, password) => {
    const data = await loginRequest(username, password);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setAuth(data);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  };

  return <AuthContext.Provider value={{ user: auth?.user || null, isAuthenticated: !!auth, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
