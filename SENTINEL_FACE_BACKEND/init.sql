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

-- ── 9. HISTORIAL DE ESTADOS DE HOGARES ─────────────────────────
CREATE TABLE IF NOT EXISTS hogar_estado_historial (
    historial_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    hogar_id         INT UNSIGNED    NOT NULL,
    estado_anterior  VARCHAR(20)         NULL,
    estado_nuevo     VARCHAR(20)     NOT NULL,
    motivo           VARCHAR(255)        NULL,
    cambiado_por     INT UNSIGNED        NULL,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (historial_id),
    KEY idx_heh_hogar (hogar_id),
    CONSTRAINT fk_heh_hogar FOREIGN KEY (hogar_id)
        REFERENCES hogares (hogar_id) ON DELETE CASCADE,
    CONSTRAINT fk_heh_usuario FOREIGN KEY (cambiado_por)
        REFERENCES usuarios (usuario_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── SEEDS INICIALES ──────────────────────────────────────────

-- Roles del sistema
INSERT IGNORE INTO roles (role_id, name, description) VALUES
(1, 'superadmin', 'Superadministrador con acceso total a la plataforma web de gestión'),
(2, 'admin', 'Administrador residencial del hogar'),
(3, 'hogar_admin', 'Titular/Administrador de hogar residencial'),
(4, 'hogar_user', 'Usuario residente del hogar');

-- Hogares
INSERT IGNORE INTO hogares (hogar_id, codigo_hogar, nombre_titular, direccion, telefono, email_contacto, estado_servicio, motivo_suspension, limite_personas, limite_camaras, notas, created_at) VALUES
(1, 'HOG-001', 'Familia Aldana Sánchez', 'Calle 14 # 8-32, Barrio Granada, Girardot', '3101234567', 'aldana.familia@gmail.com', 'ACTIVO', NULL, 10, 2, 'Hogar principal modelo piloto', '2026-03-01 08:00:00'),
(2, 'HOG-002', 'Familia Díaz Rodríguez', 'Carrera 10 # 18-45, Barrio Pozo Azul, Girardot', '3119876543', 'diaz.rodriguez@gmail.com', 'ACTIVO', NULL, 8, 2, 'Cámaras en entrada principal y patio', '2026-03-05 09:30:00'),
(3, 'HOG-003', 'Residencia Gómez Pineda', 'Manzana D Casa 14, Barrio Kennedy, Girardot', '3124567890', 'gomez.pineda@hotmail.com', 'SUSPENDIDO', 'Mora de 2 meses en el pago de servicio', 6, 1, 'Servicio temporalmente deshabilitado por cobranza', '2026-03-10 11:15:00'),
(4, 'HOG-004', 'Familia Martínez Castro', 'Calle 22 # 5-18, Barrio Alto de la Cruz, Girardot', '3157891234', 'martinez.castro@gmail.com', 'ACTIVO', NULL, 12, 3, 'Inmueble con acceso vehicular y peatonal', '2026-03-15 14:00:00'),
(5, 'HOG-005', 'Familia Romero Vargas', 'Diagonal 12 # 3-21, Barrio Rosa Blanca, Girardot', '3183216549', 'romero.vargas@yahoo.com', 'DENEGADO', 'Cancelación voluntaria por traslado de ciudad', 5, 1, 'Servicio revocado definitivamente', '2026-03-20 16:45:00'),
(6, 'HOG-006', 'Residencia Torres Beltrán', 'Carrera 14 # 25-10, Ciudadela Comgirardot', '3206549871', 'torres.beltran@gmail.com', 'PRUEBA', 'Periodo de cortesía de 30 días', 8, 2, 'Instalación nueva en fase de evaluación técnica', '2026-04-01 10:00:00');

-- Usuarios
INSERT IGNORE INTO usuarios (usuario_id, hogar_id, full_name, email, password_hash, is_active, created_at) VALUES
(1, 1, 'Super Administrador Sentinel', 'admin@admin.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-01-01 00:00:00'),
(2, 1, 'Brian Mauricio Aldana', 'brian.aldana@ucundinamarca.edu.co', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-01 08:30:00'),
(3, 2, 'Saraí Sofía Díaz', 'sarai.diaz@ucundinamarca.edu.co', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-05 09:45:00'),
(4, 3, 'Carlos Gómez Pineda', 'carlos.gomez@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-10 11:30:00'),
(5, 4, 'Andrés Martínez', 'andres.martinez@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-15 14:15:00'),
(6, 6, 'Lorena Torres Beltrán', 'lorena.torres@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-04-01 10:15:00');

-- Roles de usuarios
INSERT IGNORE INTO usuarios_roles (usuario_id, role_id) VALUES
(1, 1), (1, 2), (2, 3), (3, 3), (4, 3), (5, 3), (6, 3);

-- Personas autorizadas
INSERT IGNORE INTO employees (employee_id, hogar_id, full_name, document_id, is_active, registered_by, created_at) VALUES
(1, 1, 'Brian Aldana Sánchez', '1070987123', 1, 1, '2026-03-01 09:00:00'),
(2, 1, 'María Consuelo Sánchez', '52876543', 1, 1, '2026-03-01 09:10:00'),
(3, 2, 'Saraí Sofía Díaz', '1069876543', 1, 1, '2026-03-05 10:00:00'),
(4, 2, 'Héctor Díaz Benavides', '79876543', 1, 1, '2026-03-05 10:15:00'),
(5, 3, 'Carlos Gómez Pineda', '80123456', 1, 1, '2026-03-10 11:45:00'),
(6, 3, 'Camila Gómez Ruiz', '1071234567', 1, 1, '2026-03-10 12:00:00'),
(7, 4, 'Andrés Martínez Castro', '1072345678', 1, 1, '2026-03-15 14:30:00'),
(8, 4, 'Claudia Patricia Castro', '52345678', 1, 1, '2026-03-15 14:40:00'),
(9, 4, 'Valentina Martínez Castro', '1073456789', 1, 1, '2026-03-15 14:50:00'),
(10, 5, 'Germán Romero Vargas', '79654321', 1, 1, '2026-03-20 17:00:00'),
(11, 6, 'Lorena Torres Beltrán', '1074567890', 1, 1, '2026-04-01 10:30:00'),
(12, 6, 'Mateo Beltrán Ospina', '1075678901', 1, 1, '2026-04-01 10:45:00');

-- Historial de estados
INSERT IGNORE INTO hogar_estado_historial (historial_id, hogar_id, estado_anterior, estado_nuevo, motivo, cambiado_por, created_at) VALUES
(1, 1, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-01 08:00:00'),
(2, 2, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-05 09:30:00'),
(3, 3, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-10 11:15:00'),
(4, 3, 'ACTIVO', 'SUSPENDIDO', 'Mora de 2 meses en el pago de servicio', 1, '2026-04-05 09:00:00'),
(5, 4, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-15 14:00:00'),
(6, 5, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-20 16:45:00'),
(7, 5, 'ACTIVO', 'DENEGADO', 'Cancelación voluntaria por traslado de ciudad', 1, '2026-04-08 14:30:00'),
(8, 6, NULL, 'PRUEBA', 'Periodo de cortesía de 30 días para evaluación', 1, '2026-04-01 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;
