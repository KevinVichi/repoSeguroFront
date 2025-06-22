import api from './api';
import { TwoFactorSetup } from '../../types';

export const twoFactorService = {
  async setup2FA(): Promise<TwoFactorSetup> {
    try {
      // ✅ USAR TOKEN TEMPORAL
      const tempToken = localStorage.getItem('temp_token');
      if (!tempToken) {
        throw new Error('Token temporal no encontrado');
      }

      // ✅ CONFIGURAR HEADER TEMPORALMENTE
      const originalAuth = api.defaults.headers.common['Authorization'];
      api.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`;
      
      const response = await api.post('/auth/2fa/setup');
      
      // ✅ RESTAURAR HEADER ORIGINAL
      if (originalAuth) {
        api.defaults.headers.common['Authorization'] = originalAuth;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
      
      return response.data.data;
      
    } catch (error) {
      console.error('❌ Error en setup2FA:', error);
      throw error;
    }
  },

  async verify2FA(code: string): Promise<any> {
    try {
      // ✅ USAR TOKEN TEMPORAL
      const tempToken = localStorage.getItem('temp_token');
      if (!tempToken) {
        throw new Error('Token temporal no encontrado');
      }

      // ✅ OBTENER EL SECRETO ALMACENADO TEMPORALMENTE
      const setupData = JSON.parse(localStorage.getItem('temp_2fa_setup') || '{}');
      const secret = setupData.secret;
      const backupCodes = setupData.backupCodes || [];
      
      if (!secret) {
        throw new Error('Secreto 2FA no encontrado. Reinicie el proceso.');
      }

      // ✅ CONFIGURAR HEADER TEMPORALMENTE
      const originalAuth = api.defaults.headers.common['Authorization'];
      api.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`;
      
      // ✅ ENVIAR CÓDIGO, SECRETO Y CÓDIGOS DE RESPALDO
      const response = await api.post('/auth/2fa/verify', { 
        code, 
        secret, 
        backupCodes 
      });
      
      // ✅ VERIFICAR RESPUESTA
      console.log('📡 Respuesta verify2FA:', response.data);
      
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        // ✅ LIMPIAR TOKENS TEMPORALES
        localStorage.removeItem('temp_token');
        localStorage.removeItem('temp_2fa_setup');
        
        // ✅ GUARDAR DATOS REALES
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // ✅ CONFIGURAR API PARA FUTURAS LLAMADAS
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return response.data;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error en verify2FA:', error);
      throw error;
    }
  }
};