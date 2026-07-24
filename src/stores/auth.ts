import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { queryClient } from '@/components/providers';

export type UserRole = 'Ogrenci' | 'Ogretmen' | 'Koordinator' | 'KurumYoneticisi' | 'UlkeTemsilcisi' | 'SuperAdmin' | 'Editor';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  surname: string;
  puan: number;
  kalp: number;
  streakCount: number;
  role: UserRole;
  nativeLanguage?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setTokens: (accessToken: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken) => {
        // Kimlik değişiyorsa (login, PIN/QR giriş, impersonation start/return)
        // önceki kullanıcının React Query cache'i (okuma-atamalar, siniflarim, vb.
        // global key'ler) yeni kullanıcının ekranına sızmasın diye temizle.
        // Aynı kullanıcının token yenilemesinde (id aynı) gereksiz temizlik yapma.
        if (get().user?.id !== user.id) queryClient.clear();
        set({ user, accessToken });
      },
      setTokens: (accessToken) => set({ accessToken }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
      logout: () => {
        // refreshToken artık httpOnly cookie'de — aynı-origin istek onu otomatik taşır,
        // JS'in okuyup göndermesine gerek yok. keepalive: hemen ardından yönlendirme
        // olsa bile istek tamamlanır. Plain fetch (api.ts değil) → circular import yok.
        if (typeof window !== 'undefined') {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
            keepalive: true,
          }).catch(() => {});
        }
        // Farklı kullanıcıların verisi aynı sekmede React Query cache'inde
        // (global key'ler: okuma-atamalar, siniflarim, vb.) kalıp bir sonraki
        // hesaba (ör. impersonation) sızmasın diye çıkışta tamamen temizle.
        queryClient.clear();
        set({ user: null, accessToken: null });
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'auth',
      // localStorage: yeni tab ve browser yeniden başlatmada session korunur.
      // Sadece user profili persist edilir — refreshToken artık httpOnly cookie'de,
      // accessToken zaten memory-only (15 dk TTL, persist edilmesine gerek yok).
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Impersonation — asıl oturum değişimi (SuperAdmin <-> hedef kullanıcı) sunucu
// tarafında httpOnly cookie ile yönetiliyor (bkz. AuthController.ImpersonateReturn).
// Burada sadece "impersonation aktif" bandını göstermek için sessionStorage bayrağı tutulur.
export const impersonation = {
  start() {
    sessionStorage.setItem('sa_impersonating', '1');
  },
  isActive() {
    return !!sessionStorage.getItem('sa_impersonating');
  },
  clear() {
    sessionStorage.removeItem('sa_impersonating');
  },
};
