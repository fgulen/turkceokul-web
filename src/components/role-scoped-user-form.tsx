'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Share2, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { ConfirmActionModal } from '@/components/confirm-action-modal';

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

interface KurumSecenegi {
  id: number;
  name: string;
  kitapVarMi: boolean;
}

interface SinifFormData {
  rol: string;
  ulke?: { id: number; name: string } | null;
  ulkeler?: { id: number; name: string }[];
  kurum?: KurumSecenegi | null;
  kurumlar?: KurumSecenegi[];
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
  const [kurumlarByUlke, setKurumlarByUlke] = useState<KurumSecenegi[]>([]);
  const [hedefEmail, setHedefEmail] = useState('');
  const [davetUrl, setDavetUrl] = useState<string | null>(null);
  const [davetSonuc, setDavetSonuc] = useState<{ email: string; mailGonderildi: boolean } | null>(null);
  const [kurumsuzOnayAcik, setKurumsuzOnayAcik] = useState(false);

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
  // Öğretmen daveti gönderilmeden önce erken uyarı — sınıf oluşturma anına kadar
  // beklemeden temsilciyi/yöneticiyi bilgilendirir (bkz. sinif-form-slideover.tsx'teki
  // aynı sorunun geç ortaya çıkması).
  const seciliKurum = kurumSabit ?? kurumSecenekleri.find(k => String(k.id) === seciliKurumId);
  const kitapUyarisiGoster = hedefRol === 'Ogretmen' && !!seciliKurum && !seciliKurum.kitapVarMi;
  // Ülke temsilcisi ülke-scope'lu çalışır: ülkesiz temsilci kendi paneline bile giremez (403).
  // Diğer roller (Koordinator scope'suz, Ogretmen/KurumYoneticisi sonradan tamamlanabilir) için ülke opsiyonel kalır.
  const ulkeZorunlu = hedefRol === 'UlkeTemsilcisi' && !sabitUlke;
  // Sadece UlkeTemsilcisi'nin ogretmen daveti icin kurum zorunlu — SuperAdmin/Koordinator
  // icin kurum opsiyonel kalmasi 2026-07-19'da bilinclli karardi (bkz. proje hafizasi),
  // burada degistirilmiyor; bu yalnizca yeni ulke-capinda ogretmen-ekleme akisina ozel.
  const kurumZorunlu = scope?.rol === 'UlkeTemsilcisi' && hedefRol === 'Ogretmen';

  const davetMutation = useMutation({
    mutationFn: () => api.post('/api/davet/olustur', {
      hedefRol,
      kurumId: kurumSabit?.id ?? (seciliKurumId ? Number(seciliKurumId) : undefined),
      ulkeId: hedefRol === 'UlkeTemsilcisi' ? (sabitUlke?.id ?? (seciliUlkeId ? Number(seciliUlkeId) : undefined)) : undefined,
      hedefEmail: hedefEmail.trim() || undefined,
    }),
    onSuccess: (res) => {
      setDavetUrl(res.data.url);
      if (hedefEmail.trim()) setDavetSonuc({ email: hedefEmail.trim(), mailGonderildi: res.data.mailGonderildi });
      onOlusturuldu?.();
    },
  });

  const rolEtiketi = DAVET_MESAJI[hedefRol] ?? hedefRol.toLowerCase();

  // Kurum secilmeden KurumYoneticisi daveti gonderilirse davet edilen kisi kayit
  // olurken kendi kurumunu kendisi olusturur (bkz. DavetService.KabulEtAsync) —
  // artik "mevcut kurumlardan sec" alternatifi de oldugu icin bu sessiz varsayilanin
  // farkinda olunmadan secilmesini onlemek adina onay istenir.
  function davetGonder() {
    if (hedefRol === 'KurumYoneticisi' && kurumAlaniGorunsun && !kurumSabit && !seciliKurumId) {
      setKurumsuzOnayAcik(true);
      return;
    }
    davetMutation.mutate();
  }

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
              <label className="block text-xs font-medium mb-1">
                Ülke{ulkeZorunlu && <span className="text-red-500"> *</span>}
              </label>
              <select
                value={seciliUlkeId}
                onChange={(e) => { setSeciliUlkeId(e.target.value); setSeciliKurumId(''); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="">{ulkeZorunlu ? 'Seçiniz' : 'Tüm ülkeler / belirtilmeyecek'}</option>
                {(scope?.ulkeler ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              {ulkeZorunlu && !seciliUlkeId && (
                <p className="text-xs text-red-500 mt-1">Ülke temsilcisi için ülke seçimi zorunlu.</p>
              )}
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
              <label className="block text-xs font-medium mb-1">
                Kurum{kurumZorunlu && <span className="text-red-500"> *</span>}
              </label>
              <select
                value={seciliKurumId}
                onChange={(e) => setSeciliKurumId(e.target.value)}
                disabled={scope?.rol === 'UlkeTemsilcisi' ? false : !seciliUlkeId}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-50"
              >
                <option value="">{hedefRol === 'KurumYoneticisi' ? 'Yeni kurum oluşturulacak' : 'Seçiniz'}</option>
                {kurumSecenekleri.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
              {kurumZorunlu && !seciliKurumId && (
                <p className="text-xs text-red-500 mt-1">Öğretmen daveti için kurum seçimi zorunlu.</p>
              )}
            </div>
          )}

          {kurumSabit && (
            <p className="text-xs text-slate-500">Kurum: <strong>{kurumSabit.name}</strong> (sabit)</p>
          )}

          {kitapUyarisiGoster && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Bu kuruma henüz kitap/lisans atanmadı — davet kabul edilse bile öğretmen sınıf oluşturamayacak. Daveti göndermeden önce kitap ataması yapmanız önerilir.
            </p>
          )}

          <div>
            <label className="block text-xs font-medium mb-1">E-posta (opsiyonel)</label>
            <input
              type="email"
              value={hedefEmail}
              onChange={(e) => setHedefEmail(e.target.value)}
              placeholder="davet@ornek.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {hedefEmail.trim() ? 'Davet bu adrese sistem tarafından gönderilecek.' : 'Boş bırakırsanız linki kendiniz paylaşırsınız.'}
            </p>
          </div>

          <button
            onClick={davetGonder}
            disabled={davetMutation.isPending || !scope || (ulkeZorunlu && !seciliUlkeId) || (kurumZorunlu && !seciliKurumId)}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {davetMutation.isPending ? 'Oluşturuluyor...' : hedefEmail.trim() ? 'Davet Et' : 'Davet Linki Oluştur'}
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
          {davetSonuc && (
            davetSonuc.mailGonderildi ? (
              <p className="text-xs text-emerald-600 font-medium">✓ {davetSonuc.email} adresine gönderildi.</p>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                {davetSonuc.email} adresine gönderilemedi — linki aşağıdan manuel paylaşın.
              </p>
            )
          )}
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
            {(!davetSonuc || !davetSonuc.mailGonderildi) && (
              <a
                href={`mailto:?subject=Davet&body=${encodeURIComponent(`Merhaba!\n\n${rolEtiketi} olarak davet edildiniz.\n\nKayıt linkiniz: ${davetUrl}`)}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                <Mail className="size-3.5" />
                E-posta
              </a>
            )}
            <button
              onClick={() => { setDavetUrl(null); setDavetSonuc(null); setHedefEmail(''); }}
              className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Yeni
            </button>
          </div>
        </div>
      )}
    </>
  );

  const onayModal = (
    <ConfirmActionModal
      open={kurumsuzOnayAcik}
      tone="primary"
      title="Kurum seçilmedi"
      message="Kurum seçmediniz — davet edilen kişi kayıt olurken kendi kurumunu kendisi oluşturacak. Devam edilsin mi?"
      confirmLabel="Evet, devam et"
      onConfirm={() => { setKurumsuzOnayAcik(false); davetMutation.mutate(); }}
      onCancel={() => setKurumsuzOnayAcik(false)}
    />
  );

  if (bare) return <>{icerik}{onayModal}</>;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <Share2 className="size-4 text-primary" />
        {baslik}
      </h2>
      <p className="text-xs text-slate-400 mb-4">{aciklama}</p>
      {icerik}
      {onayModal}
    </div>
  );
}
