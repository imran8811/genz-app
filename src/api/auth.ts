import { api } from './client';
import { User } from '@/types';

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => api.post<AuthResponse>('/auth/register', input),

  me: () => api.get<{ user: User }>('/auth/me', true),

  logout: () => api.post<{ message: string }>('/auth/logout', {}, true),

  /** Irreversible. The backend anonymises the account and wipes personal data. */
  deleteAccount: (password: string) =>
    api.del<{ message: string }>('/auth/account', { password }, true),

  forgotPassword: (email: string) =>
    api.post<{ message: string; reset_token?: string }>('/auth/forgot-password', { email }),

  resetPassword: (input: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => api.post<{ message: string }>('/auth/reset-password', input),
};
