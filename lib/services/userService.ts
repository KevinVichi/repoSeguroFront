import api from './api';
import { User } from '../../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await api.get('/users');
      
      console.log('🔍 Respuesta completa:', response.data); // ✅ DEBUG

      if (response.data.success && response.data.data?.data) {
        return response.data.data.data; // ✅ ACCEDER AL ARRAY CORRECTO
      }
      
      // ✅ FALLBACK: Si la estructura es diferente
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.warn('⚠️ Estructura inesperada:', response.data);
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