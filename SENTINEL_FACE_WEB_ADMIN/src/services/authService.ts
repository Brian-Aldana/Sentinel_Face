import api from './api';
import { AuthUser } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const response = await api.post('/auth/login', { email, password });
    const user: AuthUser = {
      usuario_id: response.data.usuario_id,
      name: response.data.name,
      email: response.data.email,
      roles: response.data.roles || [],
      access_token: response.data.access_token,
    };
    localStorage.setItem('sentinel_token', user.access_token);
    localStorage.setItem('sentinel_user', JSON.stringify(user));
    return user;
  },

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem('sentinel_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('sentinel_token');
  }
};
