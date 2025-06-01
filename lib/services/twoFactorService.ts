import api from './api';
import { TwoFactorSetup } from '../../types';

export const twoFactorService = {
  async setup2FA(): Promise<TwoFactorSetup> {
    const response = await api.post('/auth/2fa/setup');
    return response.data.data;
  },

  async verify2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/verify', { code });
  },

  async disable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/disable', { code });
  }
};