import api from './api';
import { User } from '../../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    await api.put(`/users/${id}`, data);
  }
};