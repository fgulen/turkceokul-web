'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Users, Globe, BarChart3, Shield,
  Pencil, Trash2, Check, X, Search, Plus, Eye, EyeOff,
  RefreshCw, ExternalLink, LogIn, Package, AlertCircle,
  Megaphone, TrendingDown, ScrollText, ChevronRight, UserPlus, Sparkles
} from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { SlideOver } from '@/components/slide-over';
import { useAuthStore, impersonation } from '@/stores/auth';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { ROL_RENKLERI, TUM_ROLLER, apiHataMesaji } from './shared';

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
      {(bekleyenSiparisler as any[]).length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2">
            <Package className="size-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-700 flex-1">Bekleyen Siparişler ({(bekleyenSiparisler as any[]).length})</h3>
            <Link href="/super-admin/kurumsal" className="text-xs font-medium text-amber-700 hover:text-amber-900">
              Tüm siparişler →
            </Link>
          </div>
          <div className="p-3 space-y-3">
            {(bekleyenSiparisler as any[]).map((s: any) => (
              <BekleyenSiparisRow key={s.id} siparis={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BekleyenSiparisRow({ siparis: s }: { siparis: any }) {
  const qc = useQueryClient();
  const [hata, setHata] = useState<string | null>(null);
  const [duzenle, setDuzenle] = useState(false);
  const [kapasite, setKapasite] = useState('');
  const [tutar, setTutar] = useState('');

  const lead = s.kurumId == null; // lead: henüz kuruma dönüştürülmemiş talep

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['sa-siparisler-bekleyen'] });
    qc.invalidateQueries({ queryKey: ['sa-istatistikler'] });
  }

  const onaylaMutation = useMutation({
    mutationFn: () => api.put(`/api/super-admin/siparis/${s.id}/onayla`),
    onMutate: () => setHata(null),
    onSuccess: invalidate,
    onError: (err: any) => setHata(apiHataMesaji(err)),
  });
  const iptalMutation = useMutation({
    mutationFn: () => api.put(`/api/super-admin/siparis/${s.id}/iptal`),
    onMutate: () => setHata(null),
    onSuccess: invalidate,
    onError: (err: any) => setHata(apiHataMesaji(err)),
  });
  const kaydetMutation = useMutation({
    mutationFn: () => api.put(`/api/super-admin/siparis/${s.id}`, {
      ogrenciKapasite: Number(kapasite),
      toplamTutar: Number(tutar),
    }),
    onMutate: () => setHata(null),
    onSuccess: () => { setDuzenle(false); invalidate(); },
    onError: (err: any) => setHata(apiHataMesaji(err)),
  });

  function toggleDuzenle() {
    if (!duzenle) {
      // Her açılışta satırın güncel değerleriyle doldur
      setKapasite(String(s.ogrenciKapasite ?? ''));
      setTutar(String(s.toplamTutar ?? ''));
    }
    setDuzenle(v => !v);
  }

  const alan = (etiket: string, deger: React.ReactNode, aciklama?: string) => (
    <div className="min-w-0">
      <dt
        className={`text-[10px] uppercase tracking-wide text-slate-400 ${aciklama ? 'cursor-help w-fit border-b border-dotted border-slate-300' : ''}`}
        title={aciklama}>
        {etiket}
      </dt>
      <dd className="text-xs text-slate-700 truncate">{deger ?? '—'}</dd>
    </div>
  );

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      {/* Başlık: kurum + ürün/tutar özeti + tarih */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-slate-50 border-b border-slate-100">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{s.kurumAdi}</p>
          <p className="text-xs text-slate-500 truncate">
            {s.urunAdi ?? s.dersKitabiId ?? '—'} ·{' '}
            <span
              className="cursor-help border-b border-dotted border-slate-300"
              title="Satın alınan / onaylanan lisans üst limiti — sisteme şu an eklenmiş öğrenci sayısı değil">
              {s.ogrenciKapasite} lisans
            </span>{' '}
            · {euro(s.toplamTutar)}
          </p>
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{new Date(s.tarih).toLocaleDateString('tr-TR')}</span>
      </div>

      {/* Bağlam bilgileri — temsilcinin onay öncesi ihtiyaç duyduğu alanlar (spec adım 7) */}
      <dl className="px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
        {alan('Yetkili', <>{s.yetkiliAdi ?? '—'}{s.yetkiliEmail ? <span className="text-slate-400"> · {s.yetkiliEmail}</span> : ''}</>)}
        {alan('Ülke', s.ulkeAdi)}
        {alan('Telefon', s.telefon
          ? <a href={`tel:${s.telefon}`} className="text-purple-700 hover:underline">{s.telefon}</a>
          : '—')}
        {alan('Eğitim yılı', s.egitimYili)}
        {alan('Sınıf', s.sinifSayisi, 'Bu kurumda bu kitaba atanmış sınıf adedi')}
        {alan('Aktif öğrenci', s.aktifOgrenci, 'O sınıflardaki, sisteme şu an aktif olarak eklenmiş öğrenci sayısı')}
        {alan('Mevcut lisans', s.mevcutLisansTipi, 'Onay öncesi kurumun bu kitap için halihazırda sahip olduğu lisans tipi (Deneme / Ücretli)')}
      </dl>

      {duzenle && (
        <div className="mx-4 mb-2.5 flex flex-wrap items-end gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Öğrenci Kapasitesi</label>
            <input type="number" min={1} value={kapasite} onChange={e => setKapasite(e.target.value)}
              className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tutar (EUR cent)</label>
            <input type="number" min={0} value={tutar} onChange={e => setTutar(e.target.value)}
              className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <button
            onClick={() => kaydetMutation.mutate()}
            disabled={kaydetMutation.isPending || kapasite === '' || tutar === ''}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
            {kaydetMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      )}

      {hata && (
        <p role="alert" className="px-4 pb-2 text-xs text-red-600">{hata}</p>
      )}

      {/* Aksiyonlar — verinin altında, ayrı bir şerit */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white">
        {lead && (
          <span className="text-xs text-slate-400 italic mr-auto" title="Lead siparişler onaylanamaz">
            Önce kuruma dönüştürülmeli (ülke temsilcisi paneli)
          </span>
        )}
        <button onClick={toggleDuzenle}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${duzenle ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {duzenle ? 'Kapat' : 'Düzenle'}
        </button>
        <button onClick={() => iptalMutation.mutate()} disabled={iptalMutation.isPending}
          className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50">
          İptal
        </button>
        {!lead && (
          <button onClick={() => onaylaMutation.mutate()} disabled={onaylaMutation.isPending}
            className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            {onaylaMutation.isPending ? 'Onaylanıyor…' : 'Onayla'}
          </button>
        )}
      </div>
    </div>
  );
}

function euro(cent: number | null | undefined) {
  if (cent == null) return '—';
  return `€${(cent / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Loglar ─────────────────────────────────────────────────────────────────


export default function Page() {
  return <GenelBakis />;
}
