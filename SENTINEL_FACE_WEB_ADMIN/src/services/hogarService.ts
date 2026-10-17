import api from './api';
import { Hogar, EstadoServicio, DashboardStats, SecurityAlert } from '../types';

export const hogarService = {
  async getHogares(estado?: string): Promise<Hogar[]> {
    const params = estado ? { estado } : {};
    const response = await api.get('/hogares', { params });
    return response.data;
  },

  async getHogarById(id: number): Promise<Hogar> {
    const response = await api.get(`/hogares/${id}`);
    return response.data;
  },

  async createHogar(data: Partial<Hogar>): Promise<{ success: boolean; hogar_id: number; message: string }> {
    const response = await api.post('/hogares', data);
    return response.data;
  },

  async updateHogar(id: number, data: Partial<Hogar>): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/hogares/${id}`, data);
    return response.data;
  },

  async setHogarStatus(id: number, estado_servicio: EstadoServicio, motivo_suspension?: string): Promise<{
    success: boolean;
    hogar_id: number;
    estado_servicio: EstadoServicio;
    motivo_suspension?: string;
    message: string;
  }> {
    const response = await api.put(`/hogares/${id}/status`, {
      estado_servicio,
      motivo_suspension,
    });
    return response.data;
  },

  async getHogarHistorial(id: number): Promise<any[]> {
    const response = await api.get(`/hogares/${id}/historial`);
    return response.data;
  },
};

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/hogares/dashboard/stats');
    return response.data;
  },
};

export const alertService = {
  async getAlerts(resolved?: boolean): Promise<SecurityAlert[]> {
    const params: Record<string, any> = {};
    if (resolved !== undefined) params.resolved = resolved ? 1 : 0;
    const response = await api.get('/alerts', { params });
    return response.data.alerts || response.data || [];
  },

  async resolveAlert(alertId: number, usuarioId: number = 1): Promise<void> {
    await api.patch(`/alerts/${alertId}/resolve`, { usuario_id: usuarioId });
  },
};
