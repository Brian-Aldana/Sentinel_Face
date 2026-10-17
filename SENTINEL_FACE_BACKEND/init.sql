-- ============================================================
--  SENTINEL FACE  —  init.sql (Modelo Multi-Hogar / SaaS)
--  Ejecutado automáticamente por MariaDB al crear el contenedor
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. HOGARES (Tenants / Clientes del Servicio) ─────────────
CREATE TABLE IF NOT EXISTS hogares (
    hogar_id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    codigo_hogar      VARCHAR(50)     NOT NULL,
    nombre_titular    VARCHAR(150)    NOT NULL,
    direccion         VARCHAR(255)        NULL,
    telefono          VARCHAR(30)         NULL,
    email_contacto    VARCHAR(150)    NOT NULL,
    estado_servicio   ENUM('ACTIVO','SUSPENDIDO','DENEGADO','PRUEBA') NOT NULL DEFAULT 'ACTIVO',
    motivo_suspension VARCHAR(255)        NULL,
    limite_personas   INT             NOT NULL DEFAULT 10,
    limite_camaras    INT             NOT NULL DEFAULT 2,
    notas             TEXT                NULL,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (hogar_id),
    UNIQUE KEY uq_codigo_hogar (codigo_hogar),
    UNIQUE KEY uq_email_contacto (email_contacto),
    KEY idx_estado_servicio (estado_servicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. ROLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    role_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name        VARCHAR(80)     NOT NULL,
    description VARCHAR(255)        NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. USUARIOS (Superadministradores y Residentes) ───────────
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    hogar_id      INT UNSIGNED        NULL,
    full_name     VARCHAR(150)    NOT NULL,
    email         VARCHAR(150)    NOT NULL,
    password_hash VARCHAR(256)    NOT NULL,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME            NULL,
    PRIMARY KEY (usuario_id),
    UNIQUE KEY uq_usuario_email (email),
    KEY idx_usuario_hogar (hogar_id),
    CONSTRAINT fk_usuario_hogar FOREIGN KEY (hogar_id)
        REFERENCES hogares (hogar_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. USUARIOS_ROLES (tabla intermedia) ─────────────────────
CREATE TABLE IF NOT EXISTS usuarios_roles (
    usuario_id    INT UNSIGNED    NOT NULL,
    role_id       INT UNSIGNED    NOT NULL,
    asignado_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    asignado_por  INT UNSIGNED        NULL,
    PRIMARY KEY (usuario_id, role_id),
    CONSTRAINT fk_ur_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id)
        REFERENCES roles (role_id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_asignado_por FOREIGN KEY (asignado_por)
        REFERENCES usuarios (usuario_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. EMPLEADOS / PERSONAS AUTORIZADAS ───────────────────────
CREATE TABLE IF NOT EXISTS employees (
    employee_id   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    hogar_id      INT UNSIGNED        NULL,
    full_name     VARCHAR(150)    NOT NULL,
    document_id   VARCHAR(50)         NULL,
    embedding     BLOB                NULL,
    photo_img     MEDIUMBLOB          NULL,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    registered_by INT UNSIGNED        NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id),
    UNIQUE KEY uq_document (document_id),
    KEY idx_emp_hogar (hogar_id),
    CONSTRAINT fk_emp_hogar FOREIGN KEY (hogar_id)
        REFERENCES hogares (hogar_id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_usuario FOREIGN KEY (registered_by)
        REFERENCES usuarios (usuario_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. REGISTRO DE ACCESOS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_logs (
    log_id        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    hogar_id      INT UNSIGNED        NULL,
    employee_id   INT UNSIGNED        NULL,
    access_result ENUM('GRANTED','DENIED') NOT NULL,
    confidence    FLOAT               NULL,
    liveness      ENUM('REAL','SPOOFING','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    snapshot_img  MEDIUMBLOB          NULL,
    event_time    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_log_hogar    (hogar_id),
    KEY idx_log_employee (employee_id),
    KEY idx_log_time     (event_time),
    CONSTRAINT fk_log_hogar FOREIGN KEY (hogar_id)
        REFERENCES hogares (hogar_id) ON DELETE CASCADE,
    CONSTRAINT fk_log_employee FOREIGN KEY (employee_id)
        REFERENCES employees (employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. ALERTAS DE SEGURIDAD ───────────────────────────────────
CREATE TABLE IF NOT EXISTS security_alerts (
    alert_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    hogar_id      INT UNSIGNED        NULL,
    log_id        INT UNSIGNED        NULL,
    alert_type    ENUM(
                    'SPOOFING_ATTEMPT',
                    'UNKNOWN_FACE',
                    'MULTIPLE_FAILURES',
                    'FORCED_ACCESS'
                  ) NOT NULL,
    severity      ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    description   TEXT                NULL,
    resolved      TINYINT(1)      NOT NULL DEFAULT 0,
    resolved_by   INT UNSIGNED        NULL,
    resolved_at   DATETIME            NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (alert_id),
    KEY idx_alert_hogar    (hogar_id),
    KEY idx_alert_type     (alert_type),
    KEY idx_alert_resolved (resolved),
    CONSTRAINT fk_alert_hogar FOREIGN KEY (hogar_id)
        REFERENCES hogares (hogar_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_log FOREIGN KEY (log_id)
        REFERENCES access_logs (log_id) ON DELETE SET NULL,
    CONSTRAINT fk_alert_resolver FOREIGN KEY (resolved_by)
        REFERENCES usuarios (usuario_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 8. AUDITORÍA DE CAMBIOS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    hogar_id      INT UNSIGNED        NULL,
    usuario_id    INT UNSIGNED        NULL,
    action        VARCHAR(80)     NOT NULL,
    target_table  VARCHAR(80)         NULL,
    target_id     INT UNSIGNED        NULL,
    detail        JSON                NULL,
    ip_address    VARCHAR(45)         NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_id),
    KEY idx_audit_hogar   (hogar_id),
    KEY idx_audit_usuario (usuario_id),
    KEY idx_audit_action  (action),
    KEY idx_audit_time    (created_at),
    CONSTRAINT fk_audit_hogar FOREIGN KEY (hogar_id)
        REFERENCES hogares (hogar_id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (usuario_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── SEEDS INICIALES ──────────────────────────────────────────

-- Hogar demostración por defecto
INSERT IGNORE INTO hogares (hogar_id, codigo_hogar, nombre_titular, direccion, telefono, email_contacto, estado_servicio)
VALUES (
    1,
    'HOG-001',
    'Hogar Principal (Girardot)',
    'Calle 14 # 8-32, Barrio Granada, Girardot',
    '3101234567',
    'admin@admin.com',
    'ACTIVO'
);

-- Roles del sistema
INSERT IGNORE INTO roles (name, description) VALUES
('superadmin', 'Superadministrador con acceso total a la plataforma web de gestión'),
('admin', 'Administrador residencial del hogar'),
('hogar_admin', 'Titular/Administrador de hogar residencial'),
('hogar_user', 'Usuario residente del hogar');

-- Usuario Administrador principal (clave: AdminSentinel2026!)
-- Hash scrypt generado por werkzeug para AdminSentinel2026!
INSERT IGNORE INTO usuarios (usuario_id, hogar_id, full_name, email, password_hash)
VALUES (
    1,
    1,
    'Super Administrador',
    'admin@admin.com',
    'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586'
);

-- Asignación de roles al usuario inicial
INSERT IGNORE INTO usuarios_roles (usuario_id, role_id)
SELECT u.usuario_id, r.role_id
FROM usuarios u, roles r
WHERE u.email = 'admin@admin.com' AND r.name IN ('superadmin', 'admin', 'hogar_admin');

SET FOREIGN_KEY_CHECKS = 1;
