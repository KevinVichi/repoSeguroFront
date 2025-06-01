import api from './api';
import { User } from '../../types';

export const authService = {
  async login(correo: string, password: string, twoFactorCode?: string): Promise<{ user: User; token: string; requires2FA?: boolean }> {
    const response = await api.post('/auth/login', { correo, password, twoFactorCode });
    return response.data.data ?? response.data;
  },

  async register(nombre: string, correo: string, password: string): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/register', { nombre, correo, password });
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};