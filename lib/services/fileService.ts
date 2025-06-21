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

  // ❌ ELIMINAR: Estos métodos no funcionan sin clave
  // async viewFile(documentoId: number): Promise<string>
  // async downloadFile(documentoId: number): Promise<Blob>

  // ✅ MÉTODOS CORREGIDOS QUE REQUIEREN CLAVE:

  // ✅ MÉTODO PRINCIPAL: VISUALIZAR PDF CON CLAVE
  async viewDocumentWithKey(documentoId: number, userKey: string): Promise<Blob> {
    console.log(`🔍 fileService.viewDocumentWithKey - ID: ${documentoId}`);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log(`📡 Haciendo request a: /api/pdfs/${documentoId}/viewblock`);
      
      const response = await fetch(`/api/pdfs/${documentoId}/viewblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userKey: userKey
        })
      });

      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error response: ${errorText}`);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      console.log(`✅ Blob recibido: ${blob.size} bytes, tipo: ${blob.type}`);
      
      return blob;
      
    } catch (error) {
      console.error('❌ Error en viewDocumentWithKey:', error);
      throw error;
    }
  },

  // ✅ MÉTODO PRINCIPAL: DESCARGAR PDF CON CLAVE
  async downloadDocumentWithKey(documentoId: number, userKey: string): Promise<Blob> {
    try {
      const response = await api.post(`/pdfs/${documentoId}/downloadBlock`, // ✅ POST con downloadBlock
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

  // ✅ CREAR URL TEMPORAL PARA VISUALIZACIÓN
  async createViewUrl(documentoId: number, userKey: string): Promise<string> {
    try {
      const blob = await this.viewDocumentWithKey(documentoId, userKey);
      const url = URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error('❌ Error creando URL de visualización:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ DESCARGAR ARCHIVO DIRECTAMENTE
  async downloadFileDirectly(documentoId: number, userKey: string, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadDocumentWithKey(documentoId, userKey);
      
      // Crear enlace temporal para descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `documento_${documentoId}.pdf`;
      
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL temporal
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('❌ Error en descarga directa:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ VALIDAR CLAVE DE DESCIFRADO
  async validateDecryptionKey(documentoId: number, userKey: string): Promise<boolean> {
    try {
      await this.viewDocumentWithKey(documentoId, userKey);
      return true; // Si no hay error, la clave es válida
    } catch (error) {
      console.error('❌ Error validando clave:', getErrorMessage(error));
      return false; // Si hay error, la clave es inválida
    }
  },

  // ✅ LIMPIAR URL TEMPORAL
  revokeFileUrl(url: string): void {
    URL.revokeObjectURL(url);
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

  // ✅ NUEVO: Eliminar todos los documentos
  async deleteAllDocuments(options: {
    deleteFiles?: boolean;
    permanent?: boolean;
  } = {}): Promise<void> {
    try {
      console.log(`🗑️ Eliminando todos los documentos:`, options);
      
      const response = await api.post('/pdfs/delete-all', options);
      
      if (response.status === 200) {
        console.log(`✅ Todos los documentos eliminados exitosamente`);
      }
      
    } catch (error) {
      console.error('❌ Error eliminando todos los documentos:', getErrorMessage(error));
      throw error;
    }
  },

  // ✅ NUEVO: Eliminar permanentemente un documento específico
  async permanentDeleteDocument(documentoId: number): Promise<void> {
    try {
      console.log(`💀 Eliminando permanentemente documento ${documentoId}`);
      
      const response = await api.delete(`/pdfs/${documentoId}/permanent-delete`);
      
      if (response.status === 200) {
        console.log(`✅ Documento ${documentoId} eliminado permanentemente`);
      }
      
    } catch (error) {
      console.error('❌ Error eliminando permanentemente documento:', getErrorMessage(error));
      throw error;
    }
  },
};