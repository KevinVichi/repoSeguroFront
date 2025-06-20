import api from './api';
import { Documento } from '../../types';

// ✅ FUNCIÓN HELPER PARA MANEJAR ERRORES
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  return 'Error desconocido';
}

export const fileService = {
  async getFiles(): Promise<Documento[]> {
    try {
      const response = await api.get('/pdfs');
      return response.data.data;
    } catch (error) {
      console.error('❌ Error obteniendo archivos:', getErrorMessage(error));
      throw error;
    }
  },

  async uploadFile(file: File, nombre?: string): Promise<Documento> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (nombre) formData.append('nombre', nombre);

      const response = await api.post('/pdfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ ELIMINAR DOCUMENTO (SOFT DELETE)
  async deleteFile(documentoId: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando documento ${documentoId}`);
      
      const response = await api.delete(`/pdfs/${documentoId}`); // ✅ DELETE estándar
      
      if (response.status === 200) {
        console.log(`✅ Documento ${documentoId} eliminado exitosamente`);
      }
      
    } catch (error) {
      console.error('❌ Error eliminando archivo:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ MÉTODO PARA VISUALIZAR PDF CORREGIDO
  async viewFile(documentoId: number): Promise<string> {
    try {
      const response = await api.get(`/pdfs/download/${documentoId}`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      return url;
      
    } catch (error) {
      console.error('❌ Error obteniendo PDF para visualización:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ AGREGAR: Método para limpiar URL temporal
  revokeFileUrl(url: string): void {
    URL.revokeObjectURL(url);
  },

  // ✅ MÉTODO PARA DESCARGAR ARCHIVO CORREGIDO
  async downloadFile(documentoId: number): Promise<Blob> {
    try {
      const response = await api.get(`/pdfs/download/${documentoId}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error descargando archivo:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ NUEVO MÉTODO: Obtener documentos eliminados (solo para admins)
  async getDeletedFiles(): Promise<Documento[]> {
    try {
      const response = await api.get('/pdfs/deleted');
      return response.data.data;
    } catch (error) {
      console.error('❌ Error obteniendo archivos eliminados:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ MÉTODO EXISTENTE: Restaurar documento
  async restoreFile(documentoId: number): Promise<void> {
    try {
      console.log(`🔄 Restaurando documento ${documentoId}`);
      
      // ✅ USAR POST /api/pdfs/{id}/restore EN LUGAR DE PUT con action
      const response = await api.post(`/pdfs/${documentoId}/restore`);
      
      if (response.status === 200) {
        console.log(`✅ Documento ${documentoId} restaurado exitosamente`);
      }
      
    } catch (error) {
      console.error('❌ Error restaurando archivo:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ ACTUALIZAR MÉTODO viewDocumentWithKey
  async viewDocumentWithKey(documentoId: number, userKey: string): Promise<Blob> {
    try {
      const response = await api.post(`/pdfs/${documentoId}/viewblock`, // ✅ USAR viewblock
        { userKey },
        { 
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error visualizando documento:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ ACTUALIZAR MÉTODO downloadDocumentWithKey  
  async downloadDocumentWithKey(documentoId: number, userKey: string): Promise<Blob> {
    try {
      const response = await api.post(`/pdfs/${documentoId}/downloadBlock`, // ✅ USAR downloadBlock
        { userKey },
        { 
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error descargando documento:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ ACTUALIZAR EL MÉTODO validateDecryptionKey PARA USAR EL ENDPOINT CORRECTO
  async validateDecryptionKey(documentoId: number, userKey: string): Promise<Blob> {
    try {
      // Usar el nuevo endpoint de viewblock
      return await this.viewDocumentWithKey(documentoId, userKey);
    } catch (error) {
      console.error('❌ Error validando clave:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ MÉTODO ADICIONAL: Ver documento sin clave (para archivos no cifrados)
  async viewDocument(documentoId: number): Promise<Blob> {
    try {
      const response = await api.get(`/pdfs/${documentoId}/view`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error visualizando documento:', getErrorMessage(error));
      throw error;
    }
  },
};