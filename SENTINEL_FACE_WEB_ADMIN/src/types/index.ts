export type ServiceStatus = 'ACTIVE' | 'SUSPENDED' | 'DENIED' | 'TRIAL' | 'ACTIVO' | 'SUSPENDIDO' | 'DENEGADO' | 'PRUEBA';
export type EstadoServicio = ServiceStatus;

export interface Home {
  home_id: number;
  home_code: string;
  owner_name: string;
  address?: string;
  phone?: string;
  contact_email: string;
  service_status: ServiceStatus;
  suspension_reason?: string;
  max_residents: number;
  max_cameras: number;
  notes?: string;
  total_residents?: number;
  active_alerts?: number;
  created_at: string;
  updated_at?: string;

  // Compatibility aliases
  hogar_id?: number;
  codigo_hogar?: string;
  nombre_titular?: string;
  direccion?: string;
  telefono?: string;
  email_contacto?: string;
  estado_servicio?: ServiceStatus;
  motivo_suspension?: string;
  limite_personas?: number;
  limite_camaras?: number;
  total_personas?: number;
  alertas_activas?: number;
  total_accesos?: number;
}

export type Hogar = Home;

export interface HomeStatusHistoryItem {
  history_id: number;
  home_id: number;
  previous_status?: string;
  new_status: ServiceStatus;
  reason?: string;
  changed_by_name?: string;
  created_at: string;

  // Compatibility aliases
  historial_id?: number;
  hogar_id?: number;
  estado_anterior?: string;
  estado_nuevo?: ServiceStatus;
  motivo?: string;
  cambiado_por_nombre?: string;
}

export type HogarHistorialItem = HomeStatusHistoryItem;

export interface Resident {
  resident_id: number;
  home_id: number;
  full_name: string;
  document_id?: string;
  is_active: boolean;
  registered_by?: string;
  created_at: string;
  updated_at?: string;

  // Compatibility aliases
  employee_id?: number;
}

export type Employee = Resident;

export interface AuthUser {
  user_id: number;
  usuario_id?: number;
  name: string;
  email: string;
  roles: string[];
  access_token: string;
  home?: Home;
}

export interface DashboardStats {
  homes: {
    total_homes: number;
    active_homes: number;
    suspended_homes: number;
    denied_homes: number;
    trial_homes: number;
  };
  residents: {
    total_residents: number;
    active_residents: number;
  };
  accesses: {
    total_history_accesses: number;
    accesses_today: number;
    accesses_granted_today: number;
    accesses_denied_today: number;
    spoofing_attempts_today: number;
  };
  alerts: {
    total_alerts: number;
    pending_alerts: number;
    critical_pending_alerts: number;
    spoofing_alerts: number;
    unknown_face_alerts: number;
  };
  chart_7_days: Array<{
    date: string;
    granted: number;
    denied: number;
    spoofing: number;
  }>;
  recent_alerts: Array<{
    alert_id: number;
    home_id?: number;
    home_code?: string;
    owner_name?: string;
    alert_type: string;
    severity: string;
    description?: string;
    resolved: number;
    created_at: string;
    codigo_hogar?: string;
    nombre_titular?: string;
  }>;

  // Compatibility aliases
  hogares?: any;
  personas?: any;
  accesos?: any;
  alertas?: any;
  grafica_7_dias?: any;
  ultimas_alertas?: any;
}

export interface SecurityAlert {
  alert_id: number;
  home_id?: number;
  log_id?: number;
  alert_type: 'SPOOFING_ATTEMPT' | 'UNKNOWN_FACE' | 'MULTIPLE_FAILURES' | 'FORCED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  resolved: boolean | number;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  home_code?: string;
  owner_name?: string;
  codigo_hogar?: string;
  nombre_titular?: string;
}

export interface AccessLog {
  log_id: number;
  home_id?: number;
  resident_id?: number;
  employee_id?: number;
  access_result: 'GRANTED' | 'DENIED';
  confidence: number;
  liveness: 'REAL' | 'SPOOFING' | 'UNKNOWN';
  full_name?: string;
  event_time: string;
}

export interface AuditLog {
  audit_id: number;
  home_id?: number;
  user_id?: number;
  action: string;
  target_table?: string;
  target_id?: number;
  detail?: any;
  ip_address?: string;
  created_at: string;
  user_name?: string;
  home_code?: string;
  owner_name?: string;
  admin_name?: string;
}
