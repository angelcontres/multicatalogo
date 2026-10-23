// src/context/AuthContext.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext, type Usuario } from './auth';

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_STORAGE_KEY = 'multicatalogo_sesion';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Usuario) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      if (user.token) {
        localStorage.setItem('multicatalogo_jwt', user.token);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('multicatalogo_jwt');
    }
  }, [user]);

  const login = (usuario: Usuario) => {
    setUser(usuario);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

