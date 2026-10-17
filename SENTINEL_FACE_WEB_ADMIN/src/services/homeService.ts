import api from './api';
import { Home, ServiceStatus, DashboardStats, SecurityAlert, HomeStatusHistoryItem } from '../types';

export const homeService = {
  async getHomes(status?: string): Promise<Home[]> {
    const params = status ? { status } : {};
    const response = await api.get('/homes', { params });
    const list = Array.isArray(response.data) ? response.data : [];
    return list;
  },

  async getHomeById(id: number): Promise<Home> {
    const response = await api.get(`/homes/${id}`);
    return response.data;
  },

  async createHome(data: Partial<Home>): Promise<{ success: boolean; home_id: number; message: string }> {
    const response = await api.post('/homes', data);
    return response.data;
  },

  async updateHome(id: number, data: Partial<Home>): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/homes/${id}`, data);
    return response.data;
  },

  async setHomeStatus(id: number, service_status: ServiceStatus, suspension_reason?: string): Promise<{
    success: boolean;
    home_id: number;
    service_status: ServiceStatus;
    suspension_reason?: string;
    message: string;
  }> {
    const response = await api.put(`/homes/${id}/status`, {
      service_status,
      suspension_reason,
    });
    return response.data;
  },

  async getHomeHistory(id: number): Promise<HomeStatusHistoryItem[]> {
    const response = await api.get(`/homes/${id}/history`);
    return Array.isArray(response.data) ? response.data : [];
  },
};

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/homes/dashboard/stats');
    return response.data;
  },
};

export const alertService = {
  async getAlerts(resolved?: boolean): Promise<SecurityAlert[]> {
    const params: Record<string, any> = {};
    if (resolved !== undefined) params.resolved = resolved ? 1 : 0;
    const response = await api.get('/alerts', { params });
    const list = response.data.alerts || response.data || [];
    return Array.isArray(list) ? list : [];
  },

  async resolveAlert(alertId: number, userId: number = 1): Promise<void> {
    await api.patch(`/alerts/${alertId}/resolve`, { user_id: userId });
  },
};
