# 📱 Sentinel Face — Aplicación Móvil Residencial (Android)

> **Tecnologías:** React Native 0.86 · Expo SDK 57 (57.0.30) · Expo Router · TypeScript · Zustand  
> **Backend de Producción:** `https://sentinel-face.duckdns.org/api`  
> **Descarga Directa del APK:** [Descargar APK Oficial en Expo](https://expo.dev/accounts/brianaldana/projects/APP_MOVIL_SENTINEL_FACE/builds/e3fe334a-4598-4f0d-b48e-32129ef726d8)

---

## 📌 Descripción

Aplicación móvil residencial para los propietarios y miembros de hogares suscritos a **Sentinel Face**. Permite gestionar la suscripción del hogar, enrolar rostros autorizados mediante fotografía, revisar el historial biométrico de accesos y recibir alertas de seguridad en tiempo real.

---

## 📲 Instalación para Usuarios Finales (Sin Programación)

Cualquier usuario con un celular Android puede instalar la app directamente:
1. Abrir el enlace de descarga oficial:  
   👉 **[Descargar APK Oficial (EAS Build)](https://expo.dev/accounts/brianaldana/projects/APP_MOVIL_SENTINEL_FACE/builds/e3fe334a-4598-4f0d-b48e-32129ef726d8)**
2. Presionar el botón **"Download"** e instalar el archivo `.apk` en el dispositivo.
3. Iniciar sesión con sus credenciales de hogar asignadas.

---

## 💻 Desarrollo Local (Para Desarrolladores)

### Requisitos previos:
* **Node.js**: `18.x` o superior
* **npm**: `9.x` o superior

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npx expo start
```

---

## 🏗️ Compilación de Nuevos APKs con EAS Build

Para compilar un nuevo archivo `.apk` de producción utilizando los servidores de Expo en la nube:

```bash
# 1. Iniciar sesión en Expo
npx eas-cli login

# 2. Compilar APK instalable de Android
npx eas-cli build -p android --profile preview
```

Al terminar, la terminal generará un nuevo enlace de descarga y código QR.

---

## 🔑 Credenciales de Prueba

| Rol | Correo | Contraseña | Hogar Vinculado |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@admin.com` | `AdminSentinel2026!` | Sistema General |
| **Admin Hogar (Brian)** | `brian.aldana@ucundinamarca.edu.co` | `AdminSentinel2026!` | HOG-001 (Aldana Sánchez) |
| **Admin Hogar (Saraí)** | `sarai.diaz@ucundinamarca.edu.co` | `AdminSentinel2026!` | HOG-002 (Díaz Rodríguez) |
| **Admin Hogar Suspendido** | `carlos.gomez@gmail.com` | `AdminSentinel2026!` | HOG-003 (Gómez Pineda) |
