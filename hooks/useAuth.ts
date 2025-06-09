'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../lib/services/authService';

// ✅ INTERFAZ DEL CONTEXTO
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (correo: string, password: string, twoFactorCode?: string) => Promise<{ user: User; token: string; requires2FA?: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ✅ CREAR CONTEXTO
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ PROVIDER COMPONENT
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ CARGAR USUARIO AL INICIAR
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const userData = await authService.getProfile();
        setUser(userData);
        
        console.log('✅ Usuario cargado:', userData);
        
      } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setUser(null);
        
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // ✅ FUNCIÓN LOGIN
  const login = async (correo: string, password: string, twoFactorCode?: string) => {
    try {
      const result = await authService.login(correo, password, twoFactorCode);
      
      if (result.requires2FA) {
        return result;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      setUser(result.user);
      
      console.log('✅ Login exitoso:', result.user);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  };

  // ✅ FUNCIÓN LOGOUT
  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    
    authService.logout();
    setUser(null);
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // ✅ FUNCIÓN REFRESH USER
  const refreshUser = async () => {
    try {
      const userData = await authService.getProfile();
      setUser(userData);
      console.log('🔄 Usuario actualizado:', userData);
    } catch (error) {
      console.error('❌ Error refrescando usuario:', error);
      logout();
    }
  };

  // ✅ VALOR DEL CONTEXTO
  const value = {
    user,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

// ✅ HOOK useAuth
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
}