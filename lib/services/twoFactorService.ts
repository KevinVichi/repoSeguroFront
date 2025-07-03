import api from './api';
import { TwoFactorSetup } from '../../types';
import { FieldProtection } from '../security/fieldProtection'; // ✅ AÑADIR ESTA IMPORTACIÓN

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

  // ✅ MÉTODO ORIGINAL (MANTENER PARA COMPATIBILIDAD)
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
  },

  // 🛡️ NUEVO: VERIFICACIÓN 2FA PROTEGIDA
  async verify2FAProtected(code: string): Promise<any> {
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

      // 🛡️ OFUSCAR DATOS SENSIBLES ANTES DE ENVIAR
      const protectedData = {
        // Código 2FA ofuscado
        mfa: FieldProtection.obfuscateField(code, 'twofa'),
        
        // Secret ofuscado (también sensible)
        sec: FieldProtection.obfuscateField(secret, 'secret'),
        
        // Códigos de respaldo ofuscados
        bck: backupCodes.map((backupCode: string) => 
          FieldProtection.obfuscateField(backupCode, 'backup')
        ),
        
        // Metadata de seguridad
        ts: FieldProtection.addTimestamp(),
        fp: navigator.userAgent.slice(0, 20),
        
        // Flag para el backend
        _protected: true
      };

      console.log('🔒 Enviando verificación 2FA protegida:', {
        hasMfa: !!protectedData.mfa,
        hasSecret: !!protectedData.sec,
        backupCount: protectedData.bck.length,
        timestamp: protectedData.ts
      });

      // ✅ CONFIGURAR HEADER TEMPORALMENTE
      const originalAuth = api.defaults.headers.common['Authorization'];
      api.defaults.headers.common['Authorization'] = `Bearer ${tempToken}`;
      
      // 🛡️ ENVIAR DATOS PROTEGIDOS
      const response = await api.post('/auth/2fa/verify', protectedData);
      
      // ✅ RESTAURAR HEADER ORIGINAL
      if (originalAuth) {
        api.defaults.headers.common['Authorization'] = originalAuth;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
      
      // ✅ VERIFICAR RESPUESTA
      console.log('📡 Respuesta verify2FA protegida:', response.data);
      
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
      console.error('❌ Error en verify2FA protegido:', error);
      throw error;
    }
  }
};