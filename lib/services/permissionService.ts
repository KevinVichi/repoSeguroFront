import api from './api';
import { Permiso } from '../../types';

export const permissionService = {
  async getPermissions(): Promise<Permiso[]> {
    const response = await api.get('/admin/permisos');
    return response.data.data;
  },

  async updatePermission(documentoId: number, usuarioId: number, puedeVer: boolean, puedeDescargar: boolean): Promise<void> {
    await api.post('/admin/permisos', {
      documentoId,
      usuarioId,
      puedeVer,
      puedeDescargar
    });
  }
};