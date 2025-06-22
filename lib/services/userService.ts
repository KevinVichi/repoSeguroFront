import api from './api';
import { User } from '../../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      console.log('📡 Obteniendo usuarios...');
      
      const response = await api.get('/users');
      
      console.log('🔍 Respuesta completa:', response.data);

      // ✅ ESTRUCTURA SIMPLIFICADA
      if (response.data.success && Array.isArray(response.data.data)) {
        console.log('✅ Usuarios obtenidos:', response.data.data.length);
        return response.data.data;
      }
      
      console.warn('⚠️ Estructura inesperada o sin usuarios:', response.data);
      return [];
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return [];
    }
  },

  async getUser(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    await api.put(`/users/${id}`, data);
  }
};