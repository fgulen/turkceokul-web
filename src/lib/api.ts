import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const BASE_URL = typeof window === 'undefined'
  ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221')
  : '';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && !config.url?.startsWith('/api/auth/')) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Paylaşılan refresh in-flight promise — eşzamanlı 401'lerin hepsi aynı isteği bekler,
// rotating token'da ikinci refresh çağrısının geçersiz token göndermesi önlenir.
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.startsWith('/api/auth/')) {
      original._retry = true;
      const { refreshToken, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken })
              .then(({ data }) => {
                useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
                return data.accessToken;
              })
              .finally(() => { refreshPromise = null; });
          }
          const newToken = await refreshPromise;
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          logout();
          if (typeof window !== 'undefined') window.location.href = '/giris';
        }
      }
    }
    return Promise.reject(error);
  }
);
