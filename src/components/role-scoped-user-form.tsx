'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Share2, Mail } from 'lucide-react';
import { api } from '@/lib/api';

interface HedefRolSecenegi {
  value: string;
  label: string;
}

interface RoleScopedUserFormProps {
  baslik: string;
  aciklama: string;
  hedefRolSecenekleri: HedefRolSecenegi[];
  onOlusturuldu?: () => void;
  /** Ülke bağlamı sabitse (örn. ülke detay sayfası) dropdown yerine salt-okunur metin gösterilir. */
  sabitUlke?: { id: number; name: string };
  /** true ise dış kart/başlık/açıklama render edilmez — SlideOver gibi kendi chrome'u olan yerlerde kullanılır. */
  bare?: boolean;
}

interface SinifFormData {
  rol: string;
  ulke?: { id: number; name: string } | null;
  ulkeler?: { id: number; name: string }[];
  kurum?: { id: number; name: string } | null;
  kurumlar?: { id: number; name: string }[];
}

const DAVET_MESAJI: Record<string, string> = {
  Ogretmen: 'öğretmen',
  KurumYoneticisi: 'kurum yöneticisi',
  UlkeTemsilcisi: 'ülke temsilcisi',
  Koordinator: 'koordinatör',
};

export function RoleScopedUserForm({ baslik, aciklama, hedefRolSecenekleri, onOlusturuldu, sabitUlke, bare }: RoleScopedUserFormProps) {
  const [hedefRol, setHedefRol] = useState(hedefRolSecenekleri[0]?.value ?? '');
  const [seciliUlkeId, setSeciliUlkeId] = useState<string>('');
  const [seciliKurumId, setSeciliKurumId] = useState<string>('');
  const [kurumlarByUlke, setKurumlarByUlke] = useState<{ id: number; name: string }[]>([]);
  const [davetUrl, setDavetUrl] = useState<string | null>(null);

  const { data: scope, isLoading: scopeYukleniyor, isError: scopeHatali } = useQuery<SinifFormData>({
    queryKey: ['sinif-form-data'],
    queryFn: () => api.get('/api/ogretmen/sinif-form-data').then(r => r.data),
  });

  const scopeSuz = scope?.rol === 'SuperAdmin' || scope?.rol === 'Koordinator';

  useEffect(() => {
    if (!scopeSuz) { setKurumlarByUlke([]); return; }
    if (!seciliUlkeId) { setKurumlarByUlke([]); return; }
    api.get(`/api/ogretmen/kurumlar?ulkeId=${seciliUlkeId}`)
      .then(r => setKurumlarByUlke(r.data))
      .catch(() => setKurumlarByUlke([]));
  }, [seciliUlkeId, scopeSuz]);

  const kurumSecenekleri = scope?.rol === 'UlkeTemsilcisi' ? (scope.kurumlar ?? []) : kurumlarByUlke;
  // UlkeTemsilcisi'nin kurumu olmaz — hedef rol bu ise Kurum alanı hiç gösterilmez.
  const kurumAlaniGorunsun = (scopeSuz || scope?.rol === 'UlkeTemsilcisi') && hedefRol !== 'UlkeTemsilcisi';
  const kurumSabit = scope?.rol === 'KurumYoneticisi' ? scope.kurum : null;

  const davetMutation = useMutation({
    mutationFn: () => api.post('/api/davet/olustur', {
      hedefRol,
      kurumId: kurumSabit?.id ?? (seciliKurumId ? Number(seciliKurumId) : undefined),
      ulkeId: hedefRol === 'UlkeTemsilcisi' ? (sabitUlke?.id ?? (seciliUlkeId ? Number(seciliUlkeId) : undefined)) : undefined,
    }),
    onSuccess: (res) => {
      setDavetUrl(res.data.url);
      onOlusturuldu?.();
    },
  });

  const rolEtiketi = DAVET_MESAJI[hedefRol] ?? hedefRol.toLowerCase();

  const icerik = (
    <>
      {scopeYukleniyor ? (
        <p className="text-xs text-slate-400">Yetki bilgisi yükleniyor...</p>
      ) : scopeHatali ? (
        <p className="text-xs text-red-500">Yetki bilgisi yüklenemedi, sayfayı yenileyin.</p>
      ) : !davetUrl ? (
        <div className="space-y-3">
          {hedefRolSecenekleri.length > 1 && (
            <div>
              <label className="block text-xs font-medium mb-1">Rol</label>
              <select
                value={hedefRol}
                onChange={(e) => setHedefRol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                {hedefRolSecenekleri.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          )}

          {scopeSuz && !sabitUlke && (
            <div>
              <label className="block text-xs font-medium mb-1">Ülke</label>
              <select
                value={seciliUlkeId}
                onChange={(e) => { setSeciliUlkeId(e.target.value); setSeciliKurumId(''); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="">Tüm ülkeler / belirtilmeyecek</option>
                {(scope?.ulkeler ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          {sabitUlke && (
            <p className="text-xs text-slate-500">Ülke: <strong>{sabitUlke.name}</strong> (sabit)</p>
          )}

          {scope?.rol === 'UlkeTemsilcisi' && scope.ulke && (
            <p className="text-xs text-slate-500">Ülke: <strong>{scope.ulke.name}</strong> (sabit)</p>
          )}

          {kurumAlaniGorunsun && (
            <div>
              <label className="block text-xs font-medium mb-1">Kurum</label>
              <select
                value={seciliKurumId}
                onChange={(e) => setSeciliKurumId(e.target.value)}
                disabled={scope?.rol === 'UlkeTemsilcisi' ? false : !seciliUlkeId}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-50"
              >
                <option value="">{hedefRol === 'KurumYoneticisi' ? 'Yeni kurum oluşturulacak' : 'Seçiniz'}</option>
                {kurumSecenekleri.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
          )}

          {kurumSabit && (
            <p className="text-xs text-slate-500">Kurum: <strong>{kurumSabit.name}</strong> (sabit)</p>
          )}

          <button
            onClick={() => davetMutation.mutate()}
            disabled={davetMutation.isPending || !scope}
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {davetMutation.isPending ? 'Oluşturuluyor...' : 'Davet Linki Oluştur'}
          </button>
          {davetMutation.isError && (
            <p className="text-xs text-red-500">
              {(davetMutation.error as { response?: { data?: { hata?: string } } })?.response?.data?.hata
                ?? 'Davet oluşturulamadı.'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600 break-all font-mono border border-slate-200">
            {davetUrl}
          </div>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Merhaba! ${rolEtiketi} olarak davet edildiniz. Kayıt için: ${davetUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors"
            >
              <Share2 className="size-3.5" />
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=Davet&body=${encodeURIComponent(`Merhaba!\n\n${rolEtiketi} olarak davet edildiniz.\n\nKayıt linkiniz: ${davetUrl}`)}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              <Mail className="size-3.5" />
              E-posta
            </a>
            <button
              onClick={() => setDavetUrl(null)}
              className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Yeni
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (bare) return icerik;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <Share2 className="size-4 text-primary" />
        {baslik}
      </h2>
      <p className="text-xs text-slate-400 mb-4">{aciklama}</p>
      {icerik}
    </div>
  );
}
