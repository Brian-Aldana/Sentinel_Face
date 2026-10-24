-- ============================================================
--  SENTINEL FACE — Database Schema (English / Multi-Tenant SaaS)
--  Executed automatically by MariaDB upon container initialization
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. HOMES (Residential Tenants / Service Clients) ─────────
CREATE TABLE IF NOT EXISTS homes (
    home_id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    home_code          VARCHAR(50)     NOT NULL,
    owner_name         VARCHAR(150)    NOT NULL,
    address            VARCHAR(255)        NULL,
    phone              VARCHAR(30)         NULL,
    contact_email      VARCHAR(150)    NOT NULL,
    service_status     ENUM('ACTIVE','SUSPENDED','DENIED','TRIAL') NOT NULL DEFAULT 'ACTIVE',
    suspension_reason  VARCHAR(255)        NULL,
    max_residents      INT             NOT NULL DEFAULT 10,
    max_cameras        INT             NOT NULL DEFAULT 2,
    notes              TEXT                NULL,
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (home_id),
    UNIQUE KEY uq_home_code (home_code),
    UNIQUE KEY uq_contact_email (contact_email),
    KEY idx_service_status (service_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. ROLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    role_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name        VARCHAR(80)     NOT NULL,
    description VARCHAR(255)        NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. USERS (Superadmins and Resident Accounts) ──────────────
CREATE TABLE IF NOT EXISTS users (
    user_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    home_id       INT UNSIGNED        NULL,
    full_name     VARCHAR(150)    NOT NULL,
    email         VARCHAR(150)    NOT NULL,
    password_hash VARCHAR(256)    NOT NULL,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME            NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email),
    KEY idx_user_home (home_id),
    CONSTRAINT fk_user_home FOREIGN KEY (home_id)
        REFERENCES homes (home_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. USER_ROLES (Junction table) ───────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
    user_id      INT UNSIGNED    NOT NULL,
    role_id      INT UNSIGNED    NOT NULL,
    assigned_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by  INT UNSIGNED        NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id)
        REFERENCES roles (role_id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. RESIDENTS (Authorized Household Persons) ──────────────
CREATE TABLE IF NOT EXISTS residents (
    resident_id   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    home_id       INT UNSIGNED        NULL,
    full_name     VARCHAR(150)    NOT NULL,
    document_id   VARCHAR(50)         NULL,
    embedding     BLOB                NULL,
    photo_img     MEDIUMBLOB          NULL,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    registered_by INT UNSIGNED        NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (resident_id),
    UNIQUE KEY uq_resident_document (document_id),
    KEY idx_resident_home (home_id),
    CONSTRAINT fk_resident_home FOREIGN KEY (home_id)
        REFERENCES homes (home_id) ON DELETE CASCADE,
    CONSTRAINT fk_resident_user FOREIGN KEY (registered_by)
        REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. ACCESS LOGS (Biometric Verification Entries) ──────────
CREATE TABLE IF NOT EXISTS access_logs (
    log_id        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    home_id       INT UNSIGNED        NULL,
    resident_id   INT UNSIGNED        NULL,
    access_result ENUM('GRANTED','DENIED') NOT NULL,
    confidence    FLOAT               NULL,
    liveness      ENUM('REAL','SPOOFING','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    snapshot_img  MEDIUMBLOB          NULL,
    event_time    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_log_home     (home_id),
    KEY idx_log_resident (resident_id),
    KEY idx_log_time     (event_time),
    CONSTRAINT fk_log_home FOREIGN KEY (home_id)
        REFERENCES homes (home_id) ON DELETE CASCADE,
    CONSTRAINT fk_log_resident FOREIGN KEY (resident_id)
        REFERENCES residents (resident_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. SECURITY ALERTS (Anti-spoofing and Intrusions) ─────────
CREATE TABLE IF NOT EXISTS security_alerts (
    alert_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    home_id       INT UNSIGNED        NULL,
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
    KEY idx_alert_home     (home_id),
    KEY idx_alert_type     (alert_type),
    KEY idx_alert_resolved (resolved),
    CONSTRAINT fk_alert_home FOREIGN KEY (home_id)
        REFERENCES homes (home_id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_log FOREIGN KEY (log_id)
        REFERENCES access_logs (log_id) ON DELETE SET NULL,
    CONSTRAINT fk_alert_resolver FOREIGN KEY (resolved_by)
        REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. AUDIT LOG (Administrative Action Records) ─────────────
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    home_id       INT UNSIGNED        NULL,
    user_id       INT UNSIGNED        NULL,
    action        VARCHAR(80)     NOT NULL,
    target_table  VARCHAR(80)         NULL,
    target_id     INT UNSIGNED        NULL,
    detail        JSON                NULL,
    ip_address    VARCHAR(45)         NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_id),
    KEY idx_audit_home    (home_id),
    KEY idx_audit_user    (user_id),
    KEY idx_audit_action  (action),
    KEY idx_audit_time    (created_at),
    CONSTRAINT fk_audit_home FOREIGN KEY (home_id)
        REFERENCES homes (home_id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. HOME STATUS HISTORY (Service Status Transitions) ───────
CREATE TABLE IF NOT EXISTS home_status_history (
    history_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    home_id          INT UNSIGNED    NOT NULL,
    previous_status  VARCHAR(20)         NULL,
    new_status       VARCHAR(20)     NOT NULL,
    reason           VARCHAR(255)        NULL,
    changed_by       INT UNSIGNED        NULL,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (history_id),
    KEY idx_hsh_home (home_id),
    CONSTRAINT fk_hsh_home FOREIGN KEY (home_id)
        REFERENCES homes (home_id) ON DELETE CASCADE,
    CONSTRAINT fk_hsh_user FOREIGN KEY (changed_by)
        REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── INITIAL SEED DATA ────────────────────────────────────────

-- Roles
INSERT IGNORE INTO roles (role_id, name, description) VALUES
(1, 'superadmin', 'Superadministrator with full system access'),
(2, 'admin', 'Residential security administrator'),
(3, 'home_admin', 'Household resident owner/manager'),
(4, 'home_user', 'Household regular resident');

-- Homes
INSERT IGNORE INTO homes (home_id, home_code, owner_name, address, phone, contact_email, service_status, suspension_reason, max_residents, max_cameras, notes, created_at) VALUES
(1, 'HOG-001', 'Familia Aldana Sánchez', 'Calle 14 # 8-32, Barrio Granada, Girardot', '3101234567', 'aldana.familia@gmail.com', 'ACTIVE', NULL, 10, 2, 'Pilot residential home model', '2026-03-01 08:00:00'),
(2, 'HOG-002', 'Familia Díaz Rodríguez', 'Carrera 10 # 18-45, Barrio Pozo Azul, Girardot', '3119876543', 'diaz.rodriguez@gmail.com', 'ACTIVE', NULL, 8, 2, 'Front entrance and backyard cameras', '2026-03-05 09:30:00'),
(3, 'HOG-003', 'Residencia Gómez Pineda', 'Manzana D Casa 14, Barrio Kennedy, Girardot', '3124567890', 'gomez.pineda@hotmail.com', 'SUSPENDED', 'Mora de 2 meses en el pago de servicio', 6, 1, 'Service suspended due to overdue invoice', '2026-03-10 11:15:00'),
(4, 'HOG-004', 'Familia Martínez Castro', 'Calle 22 # 5-18, Barrio Alto de la Cruz, Girardot', '3157891234', 'martinez.castro@gmail.com', 'ACTIVE', NULL, 12, 3, 'Property with pedestrian and vehicular access', '2026-03-15 14:00:00'),
(5, 'HOG-005', 'Familia Romero Vargas', 'Diagonal 12 # 3-21, Barrio Rosa Blanca, Girardot', '3183216549', 'romero.vargas@yahoo.com', 'DENIED', 'Cancelación voluntaria por traslado de ciudad', 5, 1, 'Service permanently cancelled', '2026-03-20 16:45:00'),
(6, 'HOG-006', 'Residencia Torres Beltrán', 'Carrera 14 # 25-10, Ciudadela Comgirardot', '3206549871', 'torres.beltran@gmail.com', 'TRIAL', 'Periodo de cortesía de 30 días', 8, 2, 'New deployment under trial evaluation', '2026-04-01 10:00:00');

-- Users
INSERT IGNORE INTO users (user_id, home_id, full_name, email, password_hash, is_active, created_at) VALUES
(1, 1, 'Super Administrador Sentinel', 'admin@admin.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-01-01 00:00:00'),
(2, 1, 'Brian Mauricio Aldana', 'brian.aldana@ucundinamarca.edu.co', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-01 08:30:00'),
(3, 2, 'Saraí Sofía Díaz', 'sarai.diaz@ucundinamarca.edu.co', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-05 09:45:00'),
(4, 3, 'Carlos Gómez Pineda', 'carlos.gomez@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-10 11:30:00'),
(5, 4, 'Andrés Martínez', 'andres.martinez@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-15 14:15:00'),
(6, 6, 'Lorena Torres Beltrán', 'lorena.torres@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-04-01 10:15:00');

-- User Roles
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
(1, 1), (1, 2), (2, 3), (3, 3), (4, 3), (5, 3), (6, 3);

-- Residents
INSERT IGNORE INTO residents (resident_id, home_id, full_name, document_id, is_active, registered_by, created_at) VALUES
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

-- Home Status History
INSERT IGNORE INTO home_status_history (history_id, home_id, previous_status, new_status, reason, changed_by, created_at) VALUES
(1, 1, NULL, 'ACTIVE', 'Initial residential service onboarding', 1, '2026-03-01 08:00:00'),
(2, 2, NULL, 'ACTIVE', 'Initial residential service onboarding', 1, '2026-03-05 09:30:00'),
(3, 3, NULL, 'ACTIVE', 'Initial residential service onboarding', 1, '2026-03-10 11:15:00'),
(4, 3, 'ACTIVE', 'SUSPENDED', 'Mora de 2 meses en el pago de servicio', 1, '2026-04-05 09:00:00'),
(5, 4, NULL, 'ACTIVE', 'Initial residential service onboarding', 1, '2026-03-15 14:00:00'),
(6, 5, NULL, 'ACTIVE', 'Initial residential service onboarding', 1, '2026-03-20 16:45:00'),
(7, 5, 'ACTIVE', 'DENIED', 'Cancelación voluntaria por traslado de ciudad', 1, '2026-04-08 14:30:00'),
(8, 6, NULL, 'TRIAL', 'Periodo de cortesía de 30 días para evaluación', 1, '2026-04-01 10:00:00');

-- ── 7. ACCESS LOGS ───────────────────────────────────────────
INSERT INTO access_logs (log_id, home_id, resident_id, access_result, confidence, liveness, event_time) VALUES
-- Today's accesses
(1, 1, 1, 'GRANTED', 0.94, 'REAL', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(2, 1, 2, 'GRANTED', 0.91, 'REAL', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 2, 3, 'GRANTED', 0.96, 'REAL', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 2, NULL, 'DENIED', 0.12, 'SPOOFING', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(5, 4, 7, 'GRANTED', 0.89, 'REAL', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(6, 6, 11, 'GRANTED', 0.93, 'REAL', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(7, 4, NULL, 'DENIED', 0.35, 'REAL', DATE_SUB(NOW(), INTERVAL 6 HOUR)),

-- Yesterday
(8, 1, 1, 'GRANTED', 0.95, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(9, 1, 2, 'GRANTED', 0.88, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 2, 4, 'GRANTED', 0.92, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(11, 3, 5, 'DENIED', 0.87, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)), -- Suspended home
(12, 4, 8, 'GRANTED', 0.91, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(13, 1, NULL, 'DENIED', 0.05, 'SPOOFING', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- 2 days ago
(14, 2, 3, 'GRANTED', 0.97, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(15, 4, 9, 'GRANTED', 0.90, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(16, 6, 12, 'GRANTED', 0.86, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(17, 2, NULL, 'DENIED', 0.22, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- 3 days ago
(18, 1, 1, 'GRANTED', 0.93, 'REAL', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(19, 4, 7, 'GRANTED', 0.95, 'REAL', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(20, 4, NULL, 'DENIED', 0.18, 'SPOOFING', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- 4 to 6 days ago
(21, 2, 4, 'GRANTED', 0.94, 'REAL', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(22, 1, 2, 'GRANTED', 0.89, 'REAL', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(23, 6, 11, 'GRANTED', 0.92, 'REAL', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(24, 1, 1, 'GRANTED', 0.96, 'REAL', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(25, 4, 8, 'GRANTED', 0.90, 'REAL', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- ── 8. SECURITY ALERTS ───────────────────────────────────────
INSERT INTO security_alerts (alert_id, home_id, log_id, alert_type, severity, description, resolved, resolved_by, resolved_at, created_at) VALUES
(1, 2, 4, 'SPOOFING_ATTEMPT', 'HIGH', 'Intento de suplantación con fotografía en pantalla de celular detectado en cámara principal', 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 4, 7, 'UNKNOWN_FACE', 'LOW', 'Rostro no identificado intentó ingresar en horario nocturno', 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(3, 1, 13, 'SPOOFING_ATTEMPT', 'HIGH', 'Fotografía impresa detectada frente al lente de la cámara del acceso', 1, 1, DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 3, 11, 'FORCED_ACCESS', 'MEDIUM', 'Intento de ingreso en hogar con servicio suspendido por mora', 1, 1, DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 4, 20, 'SPOOFING_ATTEMPT', 'HIGH', 'Fallo en prueba de parpadeo y textura facial en cámara de patio', 1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, 6, 17, 'UNKNOWN_FACE', 'LOW', 'Visitante desconocido en periodo de prueba', 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ── 9. AUDIT LOG ─────────────────────────────────────────────
INSERT INTO audit_log (audit_id, home_id, user_id, action, target_table, target_id, detail, ip_address, created_at) VALUES
(1, 1, 1, 'CREATE_HOME', 'homes', 1, '{"home_code": "HOG-001", "owner_name": "Familia Aldana Sánchez"}', '192.168.1.10', '2026-03-01 08:00:00'),
(2, 2, 1, 'CREATE_HOME', 'homes', 2, '{"home_code": "HOG-002", "owner_name": "Familia Díaz Rodríguez"}', '192.168.1.10', '2026-03-05 09:30:00'),
(3, 3, 1, 'CREATE_HOME', 'homes', 3, '{"home_code": "HOG-003", "owner_name": "Residencia Gómez Pineda"}', '192.168.1.10', '2026-03-10 11:15:00'),
(4, 4, 1, 'CREATE_HOME', 'homes', 4, '{"home_code": "HOG-004", "owner_name": "Familia Martínez Castro"}', '192.168.1.10', '2026-03-15 14:00:00'),
(5, 5, 1, 'CREATE_HOME', 'homes', 5, '{"home_code": "HOG-005", "owner_name": "Familia Romero Vargas"}', '192.168.1.10', '2026-03-20 16:45:00'),
(6, 6, 1, 'CREATE_HOME', 'homes', 6, '{"home_code": "HOG-006", "owner_name": "Residencia Torres Beltrán"}', '192.168.1.10', '2026-04-01 10:00:00'),
(7, 3, 1, 'SET_HOME_STATUS_SUSPENDED', 'homes', 3, '{"new_status": "SUSPENDED", "reason": "Mora de 2 meses en el pago de servicio"}', '192.168.1.10', '2026-04-05 09:00:00'),
(8, 5, 1, 'SET_HOME_STATUS_DENIED', 'homes', 5, '{"new_status": "DENIED", "reason": "Cancelación voluntaria por traslado de ciudad"}', '192.168.1.10', '2026-04-08 14:30:00'),
(9, 2, 1, 'RESOLVE_ALERT', 'security_alerts', 3, '{"result": "Falsa alarma descartada con el propietario"}', '192.168.1.10', '2026-04-10 16:00:00'),
(10, 1, 1, 'CHANGE_PASSWORD', 'users', 1, '{"admin": "Super Administrador"}', '192.168.1.10', '2026-04-12 11:20:00');


SET FOREIGN_KEY_CHECKS = 1;
