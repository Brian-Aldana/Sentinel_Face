import api from './api';
import { Home, ServiceStatus, DashboardStats, SecurityAlert } from '../types';

function mapHome(h: any): Home {
  return {
    ...h,
    home_id: h.home_id ?? h.hogar_id,
    hogar_id: h.hogar_id ?? h.home_id,
    home_code: h.home_code ?? h.codigo_hogar ?? '',
    codigo_hogar: h.codigo_hogar ?? h.home_code ?? '',
    owner_name: h.owner_name ?? h.nombre_titular ?? '',
    nombre_titular: h.nombre_titular ?? h.owner_name ?? '',
    address: h.address ?? h.direccion,
    direccion: h.direccion ?? h.address,
    phone: h.phone ?? h.telefono,
    telefono: h.telefono ?? h.phone,
    contact_email: h.contact_email ?? h.email_contacto ?? '',
    email_contacto: h.email_contacto ?? h.contact_email ?? '',
    service_status: h.service_status ?? h.estado_servicio ?? 'ACTIVE',
    estado_servicio: h.estado_servicio ?? h.service_status ?? 'ACTIVE',
    suspension_reason: h.suspension_reason ?? h.motivo_suspension,
    motivo_suspension: h.motivo_suspension ?? h.suspension_reason,
    max_residents: h.max_residents ?? h.limite_personas ?? 10,
    limite_personas: h.limite_personas ?? h.max_residents ?? 10,
    max_cameras: h.max_cameras ?? h.limite_camaras ?? 2,
    limite_camaras: h.limite_camaras ?? h.max_cameras ?? 2,
    total_residents: h.total_residents ?? h.total_personas ?? 0,
    total_personas: h.total_personas ?? h.total_residents ?? 0,
    active_alerts: h.active_alerts ?? h.alertas_activas ?? 0,
    alertas_activas: h.alertas_activas ?? h.active_alerts ?? 0,
    total_accesos: h.total_accesos ?? h.total_accesses ?? 0,
  };
}

export const homeService = {
  async getHomes(status?: string): Promise<Home[]> {
    const params = status ? { status } : {};
    const response = await api.get('/homes', { params });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(mapHome);
  },

  async getHomeById(id: number): Promise<Home> {
    const response = await api.get(`/homes/${id}`);
    return mapHome(response.data);
  },

  async createHome(data: Partial<Home>): Promise<{ success: boolean; home_id: number; hogar_id: number; message: string }> {
    const payload = {
      ...data,
      home_code: data.home_code || data.codigo_hogar,
      owner_name: data.owner_name || data.nombre_titular,
      address: data.address || data.direccion,
      phone: data.phone || data.telefono,
      contact_email: data.contact_email || data.email_contacto,
      service_status: data.service_status || data.estado_servicio,
      max_residents: data.max_residents || data.limite_personas,
      max_cameras: data.max_cameras || data.limite_camaras,
    };
    const response = await api.post('/homes', payload);
    const result = response.data;
    return {
      success: result.success,
      home_id: result.home_id || result.hogar_id,
      hogar_id: result.hogar_id || result.home_id,
      message: result.message,
    };
  },

  async updateHome(id: number, data: Partial<Home>): Promise<{ success: boolean; message: string }> {
    const payload = {
      ...data,
      owner_name: data.owner_name || data.nombre_titular,
      address: data.address || data.direccion,
      phone: data.phone || data.telefono,
      contact_email: data.contact_email || data.email_contacto,
      max_residents: data.max_residents || data.limite_personas,
      max_cameras: data.max_cameras || data.limite_camaras,
    };
    const response = await api.put(`/homes/${id}`, payload);
    return response.data;
  },

  async setHomeStatus(id: number, service_status: ServiceStatus, suspension_reason?: string): Promise<{
    success: boolean;
    home_id: number;
    hogar_id: number;
    service_status: ServiceStatus;
    estado_servicio: ServiceStatus;
    suspension_reason?: string;
    motivo_suspension?: string;
    message: string;
  }> {
    const response = await api.put(`/homes/${id}/status`, {
      service_status,
      suspension_reason,
      estado_servicio: service_status,
      motivo_suspension: suspension_reason,
    });
    return response.data;
  },

  async getHomeHistory(id: number): Promise<any[]> {
    const response = await api.get(`/homes/${id}/history`);
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: any) => ({
      ...item,
      history_id: item.history_id ?? item.historial_id,
      historial_id: item.historial_id ?? item.history_id,
      previous_status: item.previous_status ?? item.estado_anterior,
      estado_anterior: item.estado_anterior ?? item.previous_status,
      new_status: item.new_status ?? item.estado_nuevo,
      estado_nuevo: item.estado_nuevo ?? item.new_status,
      reason: item.reason ?? item.motivo,
      motivo: item.motivo ?? item.reason,
      changed_by_name: item.changed_by_name ?? item.cambiado_por_nombre,
      cambiado_por_nombre: item.cambiado_por_nombre ?? item.changed_by_name,
    }));
  },

  // Aliases for compatibility
  getHogares(status?: string) { return this.getHomes(status); },
  getHogarById(id: number) { return this.getHomeById(id); },
  createHogar(data: any) { return this.createHome(data); },
  updateHogar(id: number, data: any) { return this.updateHome(id, data); },
  setHogarStatus(id: number, status: any, reason?: string) { return this.setHomeStatus(id, status, reason); },
  getHogarHistorial(id: number) { return this.getHomeHistory(id); },
};

export const hogarService = homeService;

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
    await api.patch(`/alerts/${alertId}/resolve`, { user_id: userId, usuario_id: userId });
  },
};
