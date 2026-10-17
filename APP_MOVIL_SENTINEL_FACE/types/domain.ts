// types/domain.ts — Interfaces de dominio compartidas (F-10)

export interface AccessLog {
  log_id: number;
  access_result: "GRANTED" | "DENIED";
  confidence: number;
  liveness: "REAL" | "SPOOFING" | "UNKNOWN";
  event_time: string;
  full_name: string | null;
  image_path?: string | null;
}

export interface Employee {
  employee_id: number;
  full_name: string;
  document_id: string;
  is_active: boolean;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRecord {
  alert_id: number;
  alert_type: "SPOOFING_ATTEMPT" | "UNKNOWN_FACE" | string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description?: string;
  is_resolved: boolean;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at?: string | null;
  created_at: string;
  log_id: number | null;
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
  action: string;
  target_table: string | null;
  target_id: number | null;
  detail: Record<string, any> | string | null;
  ip_address: string | null;
  created_at: string;
  usuario_name: string | null;
}

export interface Usuario {
  usuario_id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
  last_login: string | null;
}
