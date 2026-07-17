import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const BASE_URL = typeof window === 'undefined'
  ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221')
  : '';

// Paylaşılan refresh promise — hem interceptor hem SignalR/getToken kullanır.
// Aynı anda birden fazla refresh çağrısı olmaz → rotate edilmiş token çakışması engellenir.
// Modül seviyesinde tutulur: api ve aiApi arasında paylaşılır, instance başına
// kopyalanmaz — aksi halde iki instance eş zamanlı refresh tetikleyip rotate
// edilmiş token çakışmasına yol açabilir.
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

function createApiClient(baseURL: string, timeout?: number) {
  const client = axios.create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    if (config.url?.startsWith('/api/auth/')) return config;

    let { accessToken } = useAuthStore.getState();
    // Soğuk sayfa yüklemesinde accessToken sadece bellekte (persist edilmiyor) —
    // refresh tamamlanmadan atılan istek anonim gider. Anonime açık endpoint'ler
    // (örn. GET /api/etkinlik/{id}) 401 dönmediği için response interceptor'ın
    // retry'ı da devreye girmez ve role-gated alanlar (Cevap) sessizce null gelir.
    if (!accessToken && useAuthStore.getState().refreshToken) {
      try { accessToken = await doRefresh(); } catch { /* anonim devam */ }
    }
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  client.interceptors.response.use(
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
            return client(original);
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

  return client;
}

export const api = createApiClient(BASE_URL);
// AI üretim istekleri: Vercel rewrite proxy'sinin ~60s duvarını aşmak için
// browser'dan DOĞRUDAN API origin'ine gider (spec §10).
export const aiApi = createApiClient(
  typeof window === 'undefined'
    ? BASE_URL
    : (process.env.NEXT_PUBLIC_API_URL ?? ''),
  300_000,
);
