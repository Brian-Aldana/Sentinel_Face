export type EstadoServicio = 'ACTIVO' | 'SUSPENDIDO' | 'DENEGADO' | 'PRUEBA';

export interface Hogar {
  hogar_id: number;
  codigo_hogar: string;
  nombre_titular: string;
  direccion?: string;
  telefono?: string;
  email_contacto: string;
  estado_servicio: EstadoServicio;
  motivo_suspension?: string;
  limite_personas: number;
  limite_camaras: number;
  notas?: string;
  total_personas?: number;
  total_accesos?: number;
  alertas_activas?: number;
  created_at: string;
  updated_at?: string;
}

export interface HogarHistorialItem {
  historial_id: number;
  hogar_id: number;
  estado_anterior?: string;
  estado_nuevo: EstadoServicio;
  motivo?: string;
  cambiado_por_nombre?: string;
  created_at: string;
}

export interface AuthUser {
  usuario_id: number;
  name: string;
  email: string;
  roles: string[];
  access_token: string;
}

export interface DashboardStats {
  hogares: {
    total_hogares: number;
    hogares_activos: number;
    hogares_suspendidos: number;
    hogares_denegados: number;
    hogares_prueba: number;
  };
  personas: {
    total_personas_registradas: number;
    personas_con_biometria: number;
  };
  accesos: {
    total_accesos_historico: number;
    accesos_hoy: number;
    accesos_concedidos_hoy: number;
    accesos_denegados_hoy: number;
    intentos_spoofing_hoy: number;
  };
  alertas: {
    total_alertas: number;
    alertas_pendientes: number;
    alertas_criticas_pendientes: number;
    alertas_spoofing: number;
    alertas_rostro_desconocido: number;
  };
  grafica_7_dias: Array<{
    fecha: string;
    concedidos: number;
    denegados: number;
    spoofing: number;
  }>;
  ultimas_alertas: Array<{
    alert_id: number;
    hogar_id?: number;
    codigo_hogar?: string;
    nombre_titular?: string;
    alert_type: string;
    severity: string;
    description?: string;
    resolved: number;
    created_at: string;
  }>;
}

export interface SecurityAlert {
  alert_id: number;
  hogar_id?: number;
  log_id?: number;
  alert_type: 'SPOOFING_ATTEMPT' | 'UNKNOWN_FACE' | 'MULTIPLE_FAILURES' | 'FORCED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  resolved: boolean | number;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AccessLog {
  log_id: number;
  hogar_id?: number;
  employee_id?: number;
  person_name?: string;
  access_result: 'GRANTED' | 'DENIED';
  confidence?: number;
  liveness: 'REAL' | 'SPOOFING' | 'UNKNOWN';
  event_time: string;
}
