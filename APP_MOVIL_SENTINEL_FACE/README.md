# Sentinel Face — App Móvil

Sistema de control de acceso biométrico para hogares seguros, desarrollado como proyecto académico de ingeniería de software

> **Tecnologías:** React Native · Expo SDK 54 · Expo Router · TypeScript


## Requisitos previos

Antes de instalar el proyecto asegúrate de tener lo siguiente:

| Herramienta       | Versión mínima    | Descarga               |
|                   |                   |                        |
| Node.js           | 18.x o superior   | https://nodejs.org     |
| npm               | 9.x o superior    | Incluido con Node.js   |
| Expo Go (celular) | Última disponible | App Store / Play Store |
| Git               | Cualquier versión | https://git-scm.com    |


##  Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Sarai1209/APP_MOVIL_SENTINEL_FACE.git
cd APP_MOVIL_SENTINEL_FACE
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el desarrollo

```bash
npm start
```

O también puedes correrlo directamente en una plataforma:

```bash
npm run android   # Android
npm run web       # Navegador web
```

### 4. Abrir en el dispositivo

Escanea el código QR que aparece en la terminal con la app **Expo Go** desde tu celular. Asegúrate de que el celular y el computador estén en la **misma red WiFi**.


##  Credenciales

Las credenciales por defecto configuradas en la base de datos del sistema son:

| Rol            | Correo               | Contraseña | Acceso                                 |
|                |                      |            |                                        |
| Administrador  | admin@admin.com      | admin123   | Panel admin completo                   |



##  Estructura del proyecto

APP_MOVIL_SENTINEL_FACE/
│
├── app/
│   ├── _layout.tsx             ← Stack raíz con AuthProvider
│   ├── index.tsx               ← Pantalla de login
│   ├── +not-found.tsx          ← Modal 404
│   │
│   ├── (admin)/                ← Rutas protegidas — solo admin
│   │   ├── _layout.tsx         ← Verificación de rol
│   │   ├── dashboard.tsx       ← Panel de control
│   │   ├── users.tsx           ← Gestión de usuarios
│   │   ├── reports.tsx         ← Reportes de acceso
│   │   └── settings.tsx        ← Configuración del sistema
│   │
│   └── (tabs)/                 ← Rutas protegidas — usuario normal
│       ├── _layout.tsx         ← Verificación de autenticación
│       ├── home.tsx            ← Inicio / dashboard
│       ├── scan.tsx            ← Reconocimiento facial
│       ├── alerts.tsx          ← Centro de alertas
│       └── profile.tsx         ← Perfil y configuración
│
├── components/
│   └── ui/
│       ├── GradientButton.tsx  ← Botón con degradado
│       ├── InputField.tsx      ← Campo de entrada con ícono
│       ├── SentinelHeader.tsx  ← Encabezado de pantallas
│       └── StatusBadge.tsx     ← Indicador de estado
│
├── constants/
│   ├── theme.ts                ← Colores, gradientes, fuentes
│   └── layout.ts               ← Spacing, radius, font sizes
│
├── context/
│   └── AuthContext.tsx         ← Store de sesión y roles
│
└── assets/
    └── images/
        └── facial_scan_bg.png  ← Fondo de la pantalla de login
```
# Flujo de navegación

index (Login)
    │
    ├── rol: admin ──→ (admin)/dashboard
    │                       ├── users
    │                       ├── reports
    │                       └── settings
    │
    └── rol: user ───→ (tabs)/home
                            ├── scan
                            ├── alerts
                            └── profile
```

## Dependencias principales
  
| Paquete                | Versión  | Uso                           |
|                        |          |                               |
| expo                   | ~54.0.33 | Framework principal           |
| expo-router            | ~6.0.23  | Navegación basada en archivos |
| react-native           | 0.81.5   | Base de la app                |
| typescript             | ~5.9.2   | Tipado estático               |
| expo-linear-gradient   | ~15.0.8  | Gradientes en UI              |
| lucide-react-native    | ^0.577.0 | Íconos                        |
| axios                  | ^1.14.0  | Peticiones HTTP al backend    |
| react-native-reanimated| ~4.1.1   | Animaciones avanzadas         |
| expo-image-picker      | ~17.0.10 | Captura de imagen facial      |


## Patrón de diseño

La interfaz sigue los principios de **Material Design 3** adaptados a React Native, con un tema oscuro personalizado basado en colores neón (magenta `#FF00FF` y púrpura `#9D00FF`) sobre fondos casi negros (`#050505`).

## Autores

**Brian y sarai** — Ingenieros de Software, 5.º semestre  
Proyecto académico — Desarrollo de aplicaciones móviles