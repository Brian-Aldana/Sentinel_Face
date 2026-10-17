-- ============================================================
--  SENTINEL FACE — Poblado de Datos Realistas (Girardot, 2026)
--  Al menos 5-6 registros completos por tabla
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Crear tabla de historial de estados si no existe ──────
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

-- ── 2. Limpieza de datos previos para insertar conjunto completo ──
TRUNCATE TABLE hogar_estado_historial;
TRUNCATE TABLE security_alerts;
TRUNCATE TABLE access_logs;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE employees;
TRUNCATE TABLE usuarios_roles;
DELETE FROM usuarios WHERE usuario_id > 0;
ALTER TABLE usuarios AUTO_INCREMENT = 1;
DELETE FROM hogares WHERE hogar_id > 0;
ALTER TABLE hogares AUTO_INCREMENT = 1;

-- ── 3. HOGARES (6 hogares con diferentes barrios y estados) ──
INSERT INTO hogares (hogar_id, codigo_hogar, nombre_titular, direccion, telefono, email_contacto, estado_servicio, motivo_suspension, limite_personas, limite_camaras, notas, created_at) VALUES
(1, 'HOG-001', 'Familia Aldana Sánchez', 'Calle 14 # 8-32, Barrio Granada, Girardot', '3101234567', 'aldana.familia@gmail.com', 'ACTIVO', NULL, 10, 2, 'Hogar principal modelo piloto', '2026-03-01 08:00:00'),
(2, 'HOG-002', 'Familia Díaz Rodríguez', 'Carrera 10 # 18-45, Barrio Pozo Azul, Girardot', '3119876543', 'diaz.rodriguez@gmail.com', 'ACTIVO', NULL, 8, 2, 'Cámaras en entrada principal y patio', '2026-03-05 09:30:00'),
(3, 'HOG-003', 'Residencia Gómez Pineda', 'Manzana D Casa 14, Barrio Kennedy, Girardot', '3124567890', 'gomez.pineda@hotmail.com', 'SUSPENDIDO', 'Mora de 2 meses en el pago de servicio', 6, 1, 'Servicio temporalmente deshabilitado por cobranza', '2026-03-10 11:15:00'),
(4, 'HOG-004', 'Familia Martínez Castro', 'Calle 22 # 5-18, Barrio Alto de la Cruz, Girardot', '3157891234', 'martinez.castro@gmail.com', 'ACTIVO', NULL, 12, 3, 'Inmueble con acceso vehicular y peatonal', '2026-03-15 14:00:00'),
(5, 'HOG-005', 'Familia Romero Vargas', 'Diagonal 12 # 3-21, Barrio Rosa Blanca, Girardot', '3183216549', 'romero.vargas@yahoo.com', 'DENEGADO', 'Cancelación voluntaria por traslado de ciudad', 5, 1, 'Servicio revocado definitivamente', '2026-03-20 16:45:00'),
(6, 'HOG-006', 'Residencia Torres Beltrán', 'Carrera 14 # 25-10, Ciudadela Comgirardot', '3206549871', 'torres.beltran@gmail.com', 'PRUEBA', 'Periodo de cortesía de 30 días', 8, 2, 'Instalación nueva en fase de evaluación técnica', '2026-04-01 10:00:00');

-- ── 4. USUARIOS (1 SuperAdmin + 5 Titulares de Hogar) ─────────
-- Hash para 'AdminSentinel2026!'
INSERT INTO usuarios (usuario_id, hogar_id, full_name, email, password_hash, is_active, created_at) VALUES
(1, 1, 'Super Administrador Sentinel', 'admin@admin.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-01-01 00:00:00'),
(2, 1, 'Brian Mauricio Aldana', 'brian.aldana@ucundinamarca.edu.co', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-01 08:30:00'),
(3, 2, 'Saraí Sofía Díaz', 'sarai.diaz@ucundinamarca.edu.co', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-05 09:45:00'),
(4, 3, 'Carlos Gómez Pineda', 'carlos.gomez@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-10 11:30:00'),
(5, 4, 'Andrés Martínez', 'andres.martinez@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-03-15 14:15:00'),
(6, 6, 'Lorena Torres Beltrán', 'lorena.torres@gmail.com', 'scrypt:32768:8:1$gmN20ilIhYuX42xl$04807a5b1ac1a46b8951ce07631af877b94dedb7bc105ec598a2441d412e6c29ccdea66feb606469d7279fe4d538eaacbba1fdaf9c374dba1527d32594edc586', 1, '2026-04-01 10:15:00');

-- ── 5. ASIGNACIÓN DE ROLES ────────────────────────────────────
INSERT INTO usuarios_roles (usuario_id, role_id) VALUES
(1, 1), -- SuperAdmin -> superadmin
(1, 2), -- SuperAdmin -> admin
(2, 3), -- Brian -> hogar_admin
(3, 3), -- Saraí -> hogar_admin
(4, 3), -- Carlos -> hogar_admin
(5, 3), -- Andrés -> hogar_admin
(6, 3); -- Lorena -> hogar_admin

-- ── 6. PERSONAS AUTORIZADAS (Employees / Familiares) ──────────
INSERT INTO employees (employee_id, hogar_id, full_name, document_id, is_active, registered_by, created_at) VALUES
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

-- ── 7. REGISTRO DE ACCESOS (Historial de los últimos días) ─────
INSERT INTO access_logs (log_id, hogar_id, employee_id, access_result, confidence, liveness, event_time) VALUES
-- Accesos de hoy
(1, 1, 1, 'GRANTED', 0.94, 'REAL', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(2, 1, 2, 'GRANTED', 0.91, 'REAL', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 2, 3, 'GRANTED', 0.96, 'REAL', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 2, NULL, 'DENIED', 0.12, 'SPOOFING', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(5, 4, 7, 'GRANTED', 0.89, 'REAL', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(6, 6, 11, 'GRANTED', 0.93, 'REAL', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(7, 4, NULL, 'DENIED', 0.35, 'REAL', DATE_SUB(NOW(), INTERVAL 6 HOUR)),

-- Ayer
(8, 1, 1, 'GRANTED', 0.95, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(9, 1, 2, 'GRANTED', 0.88, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 2, 4, 'GRANTED', 0.92, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(11, 3, 5, 'DENIED', 0.87, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)), -- Hogar suspendido
(12, 4, 8, 'GRANTED', 0.91, 'REAL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(13, 1, NULL, 'DENIED', 0.05, 'SPOOFING', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Hace 2 días
(14, 2, 3, 'GRANTED', 0.97, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(15, 4, 9, 'GRANTED', 0.90, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(16, 6, 12, 'GRANTED', 0.86, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(17, 2, NULL, 'DENIED', 0.22, 'REAL', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Hace 3 días
(18, 1, 1, 'GRANTED', 0.93, 'REAL', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(19, 4, 7, 'GRANTED', 0.95, 'REAL', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(20, 4, NULL, 'DENIED', 0.18, 'SPOOFING', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Hace 4 a 6 días
(21, 2, 4, 'GRANTED', 0.94, 'REAL', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(22, 1, 2, 'GRANTED', 0.89, 'REAL', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(23, 6, 11, 'GRANTED', 0.92, 'REAL', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(24, 1, 1, 'GRANTED', 0.96, 'REAL', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(25, 4, 8, 'GRANTED', 0.90, 'REAL', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- ── 8. ALERTAS DE SEGURIDAD (Spoofing y Desconocidos) ──────────
INSERT INTO security_alerts (alert_id, hogar_id, log_id, alert_type, severity, description, resolved, resolved_by, resolved_at, created_at) VALUES
(1, 2, 4, 'SPOOFING_ATTEMPT', 'HIGH', 'Intento de suplantación con fotografía en pantalla de celular detectado en cámara principal', 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, 4, 7, 'UNKNOWN_FACE', 'LOW', 'Rostro no identificado intentó ingresar en horario nocturno', 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(3, 1, 13, 'SPOOFING_ATTEMPT', 'HIGH', 'Fotografía impresa detectada frente al lente de la cámara del acceso', 1, 1, DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 3, 11, 'FORCED_ACCESS', 'MEDIUM', 'Intento de ingreso en hogar con servicio suspendido por mora', 1, 1, DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 4, 20, 'SPOOFING_ATTEMPT', 'HIGH', 'Fallo en prueba de parpadeo y textura facial en cámara de patio', 1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, 6, 17, 'UNKNOWN_FACE', 'LOW', 'Visitante desconocido en periodo de prueba', 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ── 9. BITÁCORA DE AUDITORÍA DEL SISTEMA ──────────────────────
INSERT INTO audit_log (audit_id, hogar_id, usuario_id, action, target_table, target_id, detail, ip_address, created_at) VALUES
(1, 1, 1, 'CREATE_HOGAR', 'hogares', 1, '{"codigo": "HOG-001", "titular": "Familia Aldana Sánchez"}', '192.168.1.10', '2026-03-01 08:00:00'),
(2, 2, 1, 'CREATE_HOGAR', 'hogares', 2, '{"codigo": "HOG-002", "titular": "Familia Díaz Rodríguez"}', '192.168.1.10', '2026-03-05 09:30:00'),
(3, 3, 1, 'CREATE_HOGAR', 'hogares', 3, '{"codigo": "HOG-003", "titular": "Residencia Gómez Pineda"}', '192.168.1.10', '2026-03-10 11:15:00'),
(4, 4, 1, 'CREATE_HOGAR', 'hogares', 4, '{"codigo": "HOG-004", "titular": "Familia Martínez Castro"}', '192.168.1.10', '2026-03-15 14:00:00'),
(5, 5, 1, 'CREATE_HOGAR', 'hogares', 5, '{"codigo": "HOG-005", "titular": "Familia Romero Vargas"}', '192.168.1.10', '2026-03-20 16:45:00'),
(6, 6, 1, 'CREATE_HOGAR', 'hogares', 6, '{"codigo": "HOG-006", "titular": "Residencia Torres Beltrán"}', '192.168.1.10', '2026-04-01 10:00:00'),
(7, 3, 1, 'SET_HOGAR_STATUS_SUSPENDIDO', 'hogares', 3, '{"nuevo_estado": "SUSPENDIDO", "motivo": "Mora de 2 meses en el pago de servicio"}', '192.168.1.10', '2026-04-05 09:00:00'),
(8, 5, 1, 'SET_HOGAR_STATUS_DENEGADO', 'hogares', 5, '{"nuevo_estado": "DENEGADO", "motivo": "Cancelación voluntaria por traslado de ciudad"}', '192.168.1.10', '2026-04-08 14:30:00'),
(9, 2, 1, 'RESOLVE_ALERT', 'security_alerts', 3, '{"resultado": "Falsa alarma descartada con el propietario"}', '192.168.1.10', '2026-04-10 16:00:00'),
(10, 1, 1, 'CHANGE_PASSWORD', 'usuarios', 1, '{"admin": "Super Administrador"}', '192.168.1.10', '2026-04-12 11:20:00');

-- ── 10. HISTORIAL DE ESTADOS DE HOGARES (Para la pestaña de Hogares) ──
INSERT INTO hogar_estado_historial (historial_id, hogar_id, estado_anterior, estado_nuevo, motivo, cambiado_por, created_at) VALUES
(1, 1, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-01 08:00:00'),
(2, 2, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-05 09:30:00'),
(3, 3, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-10 11:15:00'),
(4, 3, 'ACTIVO', 'SUSPENDIDO', 'Mora de 2 meses en el pago de servicio', 1, '2026-04-05 09:00:00'),
(5, 4, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-15 14:00:00'),
(6, 5, NULL, 'ACTIVO', 'Alta inicial del servicio residencial', 1, '2026-03-20 16:45:00'),
(7, 5, 'ACTIVO', 'DENEGADO', 'Cancelación voluntaria por traslado de ciudad', 1, '2026-04-08 14:30:00'),
(8, 6, NULL, 'PRUEBA', 'Periodo de cortesía de 30 días para evaluación', 1, '2026-04-01 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;
