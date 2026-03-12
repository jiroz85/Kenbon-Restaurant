import { api } from './api';

export type LoginCredentials = {
  usernameOrEmail: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  roles?: string[];
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  roles: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
  return data;
}
