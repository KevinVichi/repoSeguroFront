import api from './api';
import { User } from '../../types';

class AuthService {
  private API_URL = 'http://localhost:3001/api'; // ✅ USAR TU PUERTO CORRECTO

  // ✅ LOGIN ORIGINAL (MANTENER PARA COMPATIBILIDAD)
  async login(correo: string, password: string, twoFactorCode?: string): Promise<{
    user: User;
    token: string;
    requires2FA?: boolean;
  }> {
    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo, password, twoFactorCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    const data = await response.json();
    return data.data;
  }

  // 🛡️ LOGIN PROTEGIDO (NUEVO)
  async loginProtected(protectedData: {
    usr: string;
    pwd: string;
    mfa?: string;
    ts: string;
    fp: string;
    _protected: boolean;
  }): Promise<{
    user: User;
    token: string;
    requires2FA?: boolean;
  }> {
    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(protectedData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en login protegido');
    }

    const data = await response.json();
    return data.data || data;
  }

  // ✅ REGISTRO ORIGINAL (MANTENER PARA COMPATIBILIDAD)
  async register(nombre: string, correo: string, password: string): Promise<{
    message: string;
    token?: string;
    requiresTwoFactorSetup?: boolean;
  }> {
    const response = await fetch(`${this.API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, correo, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar usuario');
    }

    const data = await response.json();
    return data.data;
  }

  // 🛡️ REGISTRO PROTEGIDO (NUEVO)
  async registerProtected(protectedData: {
    nm: string;
    usr: string;
    pwd: string;
    ts: string;
    fp: string;
    _protected: boolean;
  }): Promise<{
    message: string;
    token?: string;
    requiresTwoFactorSetup?: boolean;
  }> {
    const response = await fetch(`${this.API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(protectedData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en registro protegido');
    }

    const data = await response.json();
    return data.data || data;
  }

  // ✅ RESTO DE MÉTODOS EXISTENTES
  async getProfile(): Promise<User> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }

    const data = await response.json();
    return data.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();