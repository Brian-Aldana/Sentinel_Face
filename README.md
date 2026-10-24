# 🛡️ SENTINEL FACE — Sistema de Seguridad Biométrico Residencial (SaaS)

> **Proyecto de Grado / Final de Curso — Ingeniería de Software**  
> **Universidad de Cundinamarca — Sede Girardot (2026)**  
> **Autores:** Brian Mauricio Aldana Sánchez & Saraí Sofía Díaz Rodríguez  
> **Repositorio Oficial:** [github.com/Brian-Aldana/Sentinel_Face](https://github.com/Brian-Aldana/Sentinel_Face)

---

## 🌐 Enlaces de Producción en Vivo (Cloud Deployment)

| Componente | Acceso en Producción | Descripción |
| :--- | :--- | :--- |
| **Plataforma Web Admin** | 🔒 **[`https://sentinel-face.duckdns.org`](https://sentinel-face.duckdns.org)** | Panel de control central del proveedor para monitoreo de hogares en Girardot, KPIs, auditoría y alertas. |
| **API REST & Swagger UI** | 🔒 **[`https://sentinel-face.duckdns.org/api/swagger`](https://sentinel-face.duckdns.org/api/swagger)** | Documentación interactiva OpenAPI con endpoints en inglés estandarizado. |
| **App Móvil Android (APK)** | 📲 **[Descargar APK Oficial (EAS Build)](https://expo.dev/accounts/brianaldana/projects/APP_MOVIL_SENTINEL_FACE/builds/e3fe334a-4598-4f0d-b48e-32129ef726d8)** | Paquete `.apk` nativo autónomo listo para instalar en cualquier teléfono Android (no requiere Expo Go). |

---

## 📌 Visión General del Proyecto

**Sentinel Face** es una plataforma integral de seguridad y control de acceso residencial basada en **visión artificial, reconocimiento facial y detección de vida (anti-spoofing activo y pasivo)**.

El sistema opera bajo un modelo **Software as a Service (SaaS) Multi-Hogar**:
1. **Hogares Clientes (`homes`)**: Cada hogar suscrito cuenta con acceso a la app móvil para enrolar familiares y personas autorizadas (`residents`), consultar el historial de ingresos en tiempo real y recibir alertas ante intentos de intrusión o suplantación.
2. **Administradores del Proveedor (`superadmin` / `admin`)**: Supervisan todos los hogares desde la plataforma web central, gestionan cupos de residentes/cámaras y pueden **activar, suspender o denegar el servicio** en tiempo real.
3. **Módulo de Reconocimiento en el Borde (`SENTINEL_FACE_RECOGNITION`)**: Cliente de captura con cámara web o cámara IP que procesa lotes de frames, evalúa parpadeo facial y envía la verificación al backend en la nube.

---

## 🏗️ Estructura del Monorepositorio

```text
SENTINEL_FACE/
│
├── APP_MOVIL_SENTINEL_FACE/       # App móvil híbrida (React Native · Expo SDK 57 · TypeScript)
│   ├── app/                       # Pantallas y rutas protegidas (Expo Router)
│   ├── components/                # Componentes UI reutilizables
│   ├── services/api.ts            # Cliente Axios con token JWT y URL dinámica
│   ├── eas.json                   # Configuración de compilación para Android APK (EAS Build)
│   └── store/                     # Manejadores de estado persistentes con Zustand (auth, settings)
│
├── SENTINEL_FACE_BACKEND/         # API REST Central + Motor Biométrico de IA
│   ├── api/                       # Controladores, modelos relacionales y namespaces en inglés
│   ├── blink_detector.py          # Detección de parpadeo activo con MediaPipe Face Mesh
│   ├── face_logic.py              # Extracción de embeddings faciales de 512D con InsightFace (buffalo_l)
│   ├── init.sql                   # Esquema de base de datos MariaDB (8 tablas + seeds de prueba)
│   ├── Dockerfile                 # Contenedor optimizado con pre-descarga de modelos ONNX
│   └── gunicorn.conf.py           # Configuración del servidor de producción WSGI Gunicorn
│
├── SENTINEL_FACE_WEB_ADMIN/       # Plataforma Web Central de Administración del Proveedor
│   ├── src/pages/                 # Dashboard, Gestión de Hogares, Estadísticas, Alertas, Auditoría
│   ├── src/components/            # Componentes modulares, gráficos Recharts y tablas dinámicas
│   ├── nginx.conf                 # Servidor Nginx con proxy inverso hacia /api/ y soporte SSL
│   └── Dockerfile                 # Build multi-stage (Node 20 Alpine -> Nginx Alpine)
│
├── SENTINEL_FACE_RECOGNITION/     # Cliente de captura de video en vivo (Python, OpenCV)
│   ├── core/                      # Captura de frames, detector facial y cliente HTTP
│   └── main.py                    # Bucle principal de detección con interfaz visual
│
├── docker-compose.yml             # Orquestación de producción (MariaDB + Backend + Web Admin Nginx)
├── .env.example                   # Plantilla de variables de entorno del sistema
└── README.md                      # Documentación maestra del proyecto
```

---

## 🔑 Credenciales de Prueba del Sistema

| Rol | Correo Electrónico | Contraseña | Nivel de Acceso |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@admin.com` | `AdminSentinel2026!` | Acceso total al Web Admin y a la API. |
| **Administrador de Hogar (HOG-001)** | `brian.aldana@ucundinamarca.edu.co` | `AdminSentinel2026!` | Administrador residencial de la Familia Aldana. |
| **Administradora de Hogar (HOG-002)** | `sarai.diaz@ucundinamarca.edu.co` | `AdminSentinel2026!` | Administradora residencial de la Familia Díaz. |
| **Hogar en Mora / Suspendido (HOG-003)** | `carlos.gomez@gmail.com` | `AdminSentinel2026!` | Caso de prueba: intentos de registro y acceso bloqueados por suspensión. |

---

## 🚀 Despliegue con Docker Compose (Producción en VPS)

El proyecto está diseñado para levantarse con **un solo comando** en cualquier servidor Linux (DigitalOcean, Hetzner, AWS, etc.):

```bash
# 1. Clonar el repositorio
git clone https://github.com/Brian-Aldana/Sentinel_Face.git
cd Sentinel_Face

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Compilar y levantar la Base de Datos, Backend y Web Admin
docker compose up -d --build
```

### Puertos y Servicios Orquestados:
* **Web Admin (Nginx + React SPA)**: Puerto `80` (HTTP) y `443` (HTTPS / SSL).
* **Backend API (Flask + Gunicorn)**: Puerto `5000` (disponible internamente y en `/api/`).
* **Base de Datos (MariaDB 10.11)**: Puerto `3307` expuesto al host (`3306` en red interna).

---

## 🔒 Certificados SSL y Dominio Seguro (Let's Encrypt)

El servidor utiliza **Certbot** para emitir certificados TLS/SSL válidos para el dominio de producción:

```bash
# En el servidor host:
apt install -y certbot
certbot certonly --standalone -d sentinel-face.duckdns.org --non-interactive --agree-tos -m tu-correo@ejemplo.com
```

Los certificados se montan automáticamente en el contenedor `sentinel_face_web_admin` en `/etc/letsencrypt`, garantizando cifrado de extremo a extremo para la web y la app móvil.

---

## 📱 Compilación de la App Móvil (Generación de APK)

La app móvil utiliza **Expo SDK 57** y se compila de forma nativa a través de **EAS Build**:

```bash
cd APP_MOVIL_SENTINEL_FACE

# 1. Iniciar sesión en Expo
npx eas-cli login

# 2. Lanzar la compilación del APK independiente
npx eas-cli build -p android --profile preview
```

El build genera un archivo `.apk` autónomo con la URL segura de producción `https://sentinel-face.duckdns.org/api` inyectada de fábrica.

---

## 🛡️ Reglas de Negocio SaaS Residencial

1. **Suspensión de Servicio**: Si un hogar entra en estado `SUSPENDED` o `DENIED`, el motor biométrico rechaza automáticamente cualquier verificación facial en esa residencia con motivo de auditoría y la app móvil bloquea nuevos enrolamientos.
2. **Límite de Residentes**: La app móvil valida que el hogar no supere el cupo máximo contratado (`max_residents`).
3. **Auditoría Inmutable**: Cualquier cambio de estado, alta o baja de servicio queda registrado en la tabla `audit_log` con dirección IP, timestamp y usuario ejecutor.
4. **Anti-Spoofing en Dos Niveles**:
   * **Nivel 1 (Pasivo)**: Análisis de textura, profundidad y bordes en pantalla/foto impresa.
   * **Nivel 2 (Activo)**: Detección temporal de parpadeo voluntario con MediaPipe Face Mesh antes de conceder acceso.

---

## ⚖️ Rúbrica y Estándares de Código

* **Estandarización Total en Inglés**: Todos los nombres de variables, funciones, endpoints de la API (`/api/homes`, `/api/residents`, `/api/users`, etc.) y tablas de la base de datos están en **inglés técnico puro**.
* **Español para el Usuario Final**: Los textos de la interfaz visual (Web Admin y App Móvil) permanecen en **español neutro** para los residentes y administradores locales en Colombia.
