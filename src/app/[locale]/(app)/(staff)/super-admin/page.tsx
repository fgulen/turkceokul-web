'use client';

import { useQuery } from '@tanstack/react-query';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { ROL_RENKLERI } from './shared';

function sonGirisZamanMetni(tarih: string) {
  return new Date(tarih).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function GenelBakis() {
  const { data: stats } = useQuery({
    queryKey: ['sa-istatistikler'],
    queryFn: () => api.get('/api/super-admin/istatistikler').then(r => r.data),
  });
  const { data: sonGirisler } = useQuery({
    queryKey: ['sa-son-girisler'],
    queryFn: () => api.get('/api/super-admin/son-girisler?limit=10').then(r => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Sayaçlar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Toplam Kullanıcı', val: stats?.toplamKullanici, href: '/super-admin/kullanicilar' },
          { label: 'Yayında Kitap', val: `${stats?.yayindaKitap ?? '—'} / ${stats?.toplamKitap ?? '—'}` },
          { label: 'Toplam Okul', val: stats?.toplamKurum },
          { label: 'Askıda Kullanıcı', val: stats?.askidaKullanici, danger: true, href: '/super-admin/kullanicilar?durum=askida' },
          { label: 'Bekleyen Sipariş', val: stats?.bekleyenSiparis, danger: true },
          { label: 'Bugün Giriş Yapan', val: sonGirisler?.bugunGirisSayisi },
        ].map(({ label, val, danger, href }) => {
          const kart = (
            <>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${danger && (val as number) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {val ?? '—'}
              </p>
            </>
          );
          const className = `bg-white border rounded-xl p-4 ${danger && (val as number) > 0 ? 'border-red-200' : 'border-slate-200'} ${href ? 'hover:border-purple-300 transition-colors' : ''}`;
          return href ? (
            <Link key={label} href={href} className={className}>{kart}</Link>
          ) : (
            <div key={label} className={className}>{kart}</div>
          );
        })}
      </div>

      {/* Rol dağılımı */}
      {stats?.rolDagilimi && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Rol Dağılımı</h3>
          <div className="flex flex-wrap gap-2">
            {(stats.rolDagilimi as { rol: string; sayi: number }[]).map(({ rol, sayi }) => (
              <span key={rol} className={`px-3 py-1 rounded-full text-xs font-medium ${ROL_RENKLERI[rol] ?? 'bg-slate-100 text-slate-600'}`}>
                {rol}: {sayi}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Son giriş yapanlar */}
      {sonGirisler?.sonGirisler?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Son Giriş Yapanlar</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(sonGirisler.sonGirisler as { id: number; name: string; surname: string | null; role: string; lastLoginDate: string }[]).map(u => (
              <div key={u.id} className="px-5 py-2.5 flex items-center gap-3">
                <span className="text-sm text-slate-800 flex-1 truncate">{u.name} {u.surname ?? ''}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROL_RENKLERI[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                  {u.role}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">{sonGirisZamanMetni(u.lastLoginDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loglar ─────────────────────────────────────────────────────────────────


export default function Page() {
  return <GenelBakis />;
}
