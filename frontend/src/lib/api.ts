import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export type OnUnauthorized = () => void;
export type TryRefresh = () => Promise<boolean>;

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export function setupApiAuth(onUnauthorized: OnUnauthorized, tryRefresh?: TryRefresh) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const isRefreshRequest = String(originalRequest?.url || '').includes('/auth/refresh');
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        tryRefresh &&
        !isRefreshRequest
      ) {
        originalRequest._retry = true;
        const refreshed = await tryRefresh();
        if (refreshed) {
          return api(originalRequest);
        }
      }
      if (error.response?.status === 401) {
        onUnauthorized();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );
}

export { API_BASE_URL };
