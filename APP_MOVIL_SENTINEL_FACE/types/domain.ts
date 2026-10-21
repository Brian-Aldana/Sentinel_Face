// types/domain.ts — Shared domain interfaces (English-standardized)

export type ServiceStatus = "ACTIVE" | "SUSPENDED" | "DENIED" | "TRIAL";

export interface Home {
  home_id: number;
  home_code: string;
  owner_name: string;
  address?: string;
  phone?: string;
  contact_email: string;
  service_status: ServiceStatus;
  suspension_reason?: string | null;
  max_residents: number;
  max_cameras: number;
  notes?: string;
  total_residents?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Resident {
  resident_id: number;
  home_id: number;
  full_name: string;
  document_id: string;
  is_active: boolean;
  registered_by?: string | null;
  created_at: string;
  updated_at?: string;
  photo_url?: string | null;
  embedding?: string | null;

  // Compatibility aliases
  employee_id?: number;
}

export interface AccessLog {
  log_id: number;
  home_id?: number;
  resident_id?: number | null;
  employee_id?: number | null;
  full_name: string | null;
  access_result: "GRANTED" | "DENIED";
  confidence: number;
  liveness: "REAL" | "SPOOFING" | "UNKNOWN";
  event_time: string;
  snapshot_img?: string | null;
  image_path?: string | null;
}

export interface AlertRecord {
  alert_id: number;
  home_id?: number;
  log_id: number | null;
  alert_type: "SPOOFING_ATTEMPT" | "UNKNOWN_FACE" | "MULTIPLE_FAILURES" | "FORCED_ACCESS" | string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description?: string;
  resolved: boolean | number;
  is_resolved?: boolean;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  home_code?: string;
  owner_name?: string;
}

export interface User {
  user_id: number;
  home_id?: number | null;
  full_name: string;
  email: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
  last_login?: string | null;

  // Compatibility aliases
  usuario_id?: number;
}

export interface Role {
  role_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuditEntry {
  audit_id: number;
  home_id?: number | null;
  user_id?: number | null;
  action: string;
  target_table: string | null;
  target_id: number | null;
  detail: Record<string, any> | string | null;
  ip_address: string | null;
  created_at: string;
  user_name?: string | null;
  usuario_name?: string | null;
}

// Backward compatibility aliases
export type Employee = Resident;
export type Usuario = User;
export type Hogar = Home;
export type EstadoServicio = ServiceStatus;
export type PersonaAutorizada = Resident;
