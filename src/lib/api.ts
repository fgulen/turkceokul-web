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

// Paylaşılan refresh promise — hem interceptor hem SignalR/getToken kullanır.
// Aynı anda birden fazla refresh çağrısı olmaz → rotate edilmiş token çakışması engellenir.
let refreshPromise: Promise<string> | null = null;

function doRefresh(): Promise<string> {
  if (!refreshPromise) {
    const { refreshToken } = useAuthStore.getState();
    refreshPromise = axios
      .post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken })
      .then(({ data }) => {
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// SignalR ve diğer non-interceptor kullanımlar için dışa aktarılır
export async function ensureToken(): Promise<string | null> {
  const { accessToken, refreshToken } = useAuthStore.getState();
  if (accessToken) return accessToken;
  if (!refreshToken) return null;
  try {
    return await doRefresh();
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.startsWith('/api/auth/')) {
      original._retry = true;
      const { refreshToken, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const newToken = await doRefresh();
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch (refreshError) {
          // Sadece gerçek auth hatası (4xx) → logout. Network hatası → logout yapma.
          if (axios.isAxiosError(refreshError) && refreshError.response?.status) {
            logout();
            if (typeof window !== 'undefined') window.location.href = '/';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
