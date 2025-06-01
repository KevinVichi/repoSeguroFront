import api from './api';
import { Documento } from '../../types';

export const fileService = {
  async getFiles(): Promise<Documento[]> {
    const response = await api.get('/pdfs');
    return response.data.data;
  },

  async uploadFile(file: File, nombre?: string): Promise<Documento> {
    const formData = new FormData();
    formData.append('file', file);
    if (nombre) formData.append('nombre', nombre);

    const response = await api.post('/pdfs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async downloadFile(documentoId: number): Promise<Blob> {
    const response = await api.get(`/pdfs/download/${documentoId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async deleteFile(documentoId: number): Promise<void> {
    await api.delete(`/pdfs/${documentoId}`);
  }
};