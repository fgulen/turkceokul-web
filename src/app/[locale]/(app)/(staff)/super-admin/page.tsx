'use client';

import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { ROL_RENKLERI } from './shared';
import { BekleyenSiparisRow, type Siparis } from '@/components/staff/bekleyen-siparis-row';

function GenelBakis() {
  const { data: stats } = useQuery({
    queryKey: ['sa-istatistikler'],
    queryFn: () => api.get('/api/super-admin/istatistikler').then(r => r.data),
  });
  const { data: bekleyenSiparisler = [] } = useQuery({
    queryKey: ['sa-siparisler-bekleyen'],
    queryFn: () => api.get('/api/super-admin/siparisler?durum=Beklemede').then(r => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Sayaçlar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Toplam Kullanıcı', val: stats?.toplamKullanici, href: '/super-admin/kullanicilar' },
          { label: 'Yayında Kitap', val: `${stats?.yayindaKitap ?? '—'} / ${stats?.toplamKitap ?? '—'}` },
          { label: 'Toplam Okul', val: stats?.toplamKurum },
          { label: 'Askıda Kullanıcı', val: stats?.askidaKullanici, danger: true, href: '/super-admin/kullanicilar?durum=askida' },
          { label: 'Bekleyen Sipariş', val: stats?.bekleyenSiparis, danger: true },
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

      {/* Bekleyen siparişler */}
      {(bekleyenSiparisler as Siparis[]).length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2">
            <Package className="size-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-700 flex-1">Bekleyen Siparişler ({(bekleyenSiparisler as Siparis[]).length})</h3>
            <Link href="/super-admin/kurumsal" className="text-xs font-medium text-amber-700 hover:text-amber-900">
              Tüm siparişler →
            </Link>
          </div>
          <div className="p-3 space-y-3">
            {(bekleyenSiparisler as Siparis[]).map((s: Siparis) => (
              <BekleyenSiparisRow key={s.id} siparis={s}
                siparisEndpoint="/api/super-admin"
                bekleyenQueryKey={['sa-siparisler-bekleyen']}
                extraInvalidateKeys={[['sa-istatistikler']]} />
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
