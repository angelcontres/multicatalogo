// src/context/auth.ts
import { createContext, useContext } from 'react';

export type Rol = 'admin' | 'cliente';

export interface Usuario {
  email: string;
  rol: Rol;
  token?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: Usuario | null;
  login: (usuario: Usuario) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
