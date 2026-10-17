# 🛡️ SENTINEL_FACE — Sistema de Seguridad Biométrico Residencial (SaaS)

> **Proyecto Final de Curso — Ingeniería de Software, Universidad de Cundinamarca (Sede Girardot, 2026)**  
> **Autores:** Brian Mauricio Aldana Sánchez & Saraí Sofía Díaz Rodríguez

---

## 📌 Visión General del Proyecto

**Sentinel Face** es una plataforma integral de control de acceso y seguridad residencial basada en **reconocimiento facial con detección de vida (liveness activa y pasiva / anti-spoofing)**. 

El sistema opera bajo un modelo **Proveedor de Servicio de Seguridad Residencial (SaaS)**:
1. **Hogares Clientes**: Cada hogar suscrito cuenta con acceso a la aplicación móvil híbrida para dar de alta a sus familiares y visitantes autorizados, revisar el historial en vivo y recibir alertas ante intentos de intrusión o suplantación.
2. **Administradores del Proveedor**: Cuentan con una **Plataforma Web Central** para supervisar estadísticas globales de los hogares en Girardot, monitorear alertas de spoofing y **activar, suspender o denegar el servicio** en tiempo real.

---

## 🏗️ Estructura del Monorepositorio

```
SENTINEL_FACE/
│
├── APP_MOVIL_SENTINEL_FACE/       # Aplicación móvil híbrida para los residentes (React Native + Expo)
├── SENTINEL_FACE_BACKEND/         # API REST central + Motor biométrico (Flask-RESTX, InsightFace, MediaPipe)
├── SENTINEL_FACE_RECOGNITION/     # Cliente de captura de cámaras IP / Webcams (Python, OpenCV)
├── SENTINEL_FACE_WEB_ADMIN/       # Plataforma Web de Administración del Proveedor (React + Vite + TailwindCSS)
│
├── docker-compose.yml             # Orquestación de MariaDB y Backend
├── .env.example                   # Plantilla de variables de entorno
├── .gitignore                     # Configuración de exclusión para Git
└── README.md                      # Documentación del proyecto
```

---

## 🚀 Despliegue Rápido con Docker

Desde la raíz del proyecto (`sentinel_face`), ejecuta:

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Levantar la base de datos MariaDB y el Backend
docker compose up -d
```

### Puertos y Servicios Activos:
* **Backend API REST**: `http://localhost:5000`
* **Documentación Swagger / OpenAPI**: `http://localhost:5000/api/swagger`
* **Base de Datos MariaDB**: `localhost:3307` (mapeado a 3306 interno)
* **Credenciales por defecto**:
  * **Email**: `admin@admin.com`
  * **Contraseña**: `AdminSentinel2026!`

---

## 💻 Plataforma Web de Administración (`SENTINEL_FACE_WEB_ADMIN`)

La plataforma web permite al equipo de Sentinel Face monitorear los hogares de Girardot y controlar el servicio:

```bash
cd SENTINEL_FACE_WEB_ADMIN
npm install
npm run dev
```

La plataforma estará disponible en: **`http://localhost:3000`**

### Funcionalidades:
* **Dashboard Global**: KPIs de hogares activos, accesos del día, alertas críticas de suplantación y gráfico de 7 días.
* **Directorio de Hogares**: Alta de nuevas residencias, edición de límites y **botón para Suspender o Denegar Servicio** con registro de motivo.
* **Centro de Alertas**: Monitoreo de intentos de ataque con fotos/pantallas (anti-spoofing).
* **Auditoría**: Bitácora inmutable de qué administrador aplicó suspensiones o modificaciones.

---

## 📱 Aplicación Móvil (`APP_MOVIL_SENTINEL_FACE`)

La app para los propietarios y miembros del hogar:

```bash
cd APP_MOVIL_SENTINEL_FACE
npm install
npx expo start
```

---

## 📹 Cliente de Reconocimiento y Cámaras (`SENTINEL_FACE_RECOGNITION`)

Cliente que captura los rostros en la puerta de acceso y los envía al backend:

```bash
cd SENTINEL_FACE_RECOGNITION
# Usando uv:
uv sync
uv run python main.py

# O con entorno virtual tradicional:
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

## 🔒 Control de Estado de Hogares (Regla de Negocio SaaS)

Cuando un administrador del proveedor establece el estado de un hogar en **`SUSPENDIDO`** o **`DENEGADO`**:
* El endpoint de reconocimiento facial (`/api/recognize`) rechaza automáticamente cualquier intento de acceso en esa residencia (`"Servicio suspendido o denegado por el proveedor"`).
* La app móvil y los residentes reciben la notificación del motivo de suspensión.
* Al reactivarlo (**`ACTIVO`**), el servicio vuelve a funcionar inmediatamente sin reiniciar contenedores ni reconfigurar cámaras.
