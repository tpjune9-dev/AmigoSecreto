import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Administrador, obtenerPerfilAdmin } from '../services/api';

interface AuthContextValue {
  admin: Administrador | null;
  token: string | null;
  loading: boolean;
  iniciarSesion: (token: string, adminData: Administrador) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_TOKEN_KEY = 'amigo_secreto_admin_jwt';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(SESSION_TOKEN_KEY));
  const [admin, setAdmin] = useState<Administrador | null>(null);
  const [loading, setLoading] = useState<boolean>(!!sessionStorage.getItem(SESSION_TOKEN_KEY));

  const iniciarSesion = useCallback((nuevoToken: string, adminData: Administrador) => {
    sessionStorage.setItem(SESSION_TOKEN_KEY, nuevoToken);
    setToken(nuevoToken);
    setAdmin(adminData);
  }, []);

  const cerrarSesion = useCallback(() => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelado = false;
    obtenerPerfilAdmin(token)
      .then((res) => {
        if (!cancelado) {
          setAdmin(res.administrador);
        }
      })
      .catch(() => {
        if (!cancelado) {
          cerrarSesion();
        }
      })
      .finally(() => {
        if (!cancelado) {
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [token, cerrarSesion]);

  return (
    <AuthContext.Provider value={{ admin, token, loading, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
}

