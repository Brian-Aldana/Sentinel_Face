import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sentinel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token expira o no es válido, limpiar y redirigir
      const isLoginRequest = error.config.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
