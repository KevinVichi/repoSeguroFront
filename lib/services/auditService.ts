import api from './api';
import { AuditLog } from '../../types';

export const auditService = {
  async getAuditLogs(params?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    user?: string;
  }): Promise<AuditLog[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.action) searchParams.append('action', params.action);
    if (params?.user) searchParams.append('user', params.user);

    const response = await api.get(`/admin/audit?${searchParams.toString()}`);
    return response.data.data;
  },

  async getStats(): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    uniqueUsers: number;
  }> {
    const response = await api.get('/admin/stats');
    return response.data.data;
  }
};
