import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'Ogrenci' | 'Ogretmen' | 'Admin' | 'KurumYoneticisi' | 'UlkeTemsilcisi' | 'SuperAdmin' | 'Editor';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  surname: string;
  puan: number;
  kalp: number;
  streakCount: number;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'auth',
      // sessionStorage: XSS diğer tablardan token okuyamaz; sayfa yenileme hayatta kalır
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      partialize: (s) => ({
        user: s.user,
        // accessToken persist edilmiyor — 15 dk TTL, memory-only yeterli
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Impersonation helpers — use sessionStorage so they survive page refreshes but not new tabs
export const impersonation = {
  save(user: AuthUser, accessToken: string, refreshToken: string) {
    sessionStorage.setItem('sa_backup', JSON.stringify({ user, accessToken, refreshToken }));
  },
  restore() {
    const raw = sessionStorage.getItem('sa_backup');
    if (!raw) return null;
    return JSON.parse(raw) as { user: AuthUser; accessToken: string; refreshToken: string };
  },
  isActive() {
    return !!sessionStorage.getItem('sa_backup');
  },
  clear() {
    sessionStorage.removeItem('sa_backup');
  },
};
