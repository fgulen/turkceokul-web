'use client';

// Kurum oluştur/düzenle SlideOver'ları — ülke-temsilcisi panelinde doğdu, admin
// (Koordinator) panelinde de aynen kullanılır. "Yeni Ekle standardı: buton →
// SlideOver" (bkz. table-kit.tsx) — inline form YASAK.

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { X, Share2, Mail } from 'lucide-react';
import { SlideOver } from '@/components/slide-over';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import type { OgretmenSatiri } from '@/components/staff/kurum-raporlama-tablari';

interface KurumMinimal {
  id: number;
  name: string;
  sehir: string | null;
}

export function KurumDuzenleSlideOver({ kurum, onClose, onKaydet, kaydediliyor }: {
  kurum: KurumMinimal | null;
  onClose: () => void;
  onKaydet: (form: { name: string; sehir: string }) => void;
  kaydediliyor: boolean;
}) {
  const [form, setForm] = useState({ name: '', sehir: '' });

  useEffect(() => {
    if (kurum) setForm({ name: kurum.name, sehir: kurum.sehir ?? '' });
  }, [kurum]);

  return (
    <SlideOver
      open={!!kurum}
      onClose={onClose}
      title="Kurumu Düzenle"
      width="sm"
      footer={
        <button
          form="kurum-duzenle-form"
          type="submit"
          disabled={kaydediliyor || !form.name.trim()}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      }
    >
      {kurum && (
        <form
          id="kurum-duzenle-form"
          onSubmit={e => { e.preventDefault(); onKaydet(form); }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Kurum Adı</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Şehir</label>
            <input
              value={form.sehir}
              onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </form>
      )}
    </SlideOver>
  );
}

export function KurumOlusturSlideOver({
  open, onClose, onOlustur, olusturuluyor, onTamamlandi, ulkeAdi, ulkeSecenekleri, ogretmenler, yoneticiApiBase,
}: {
  open: boolean;
  onClose: () => void;
  /** Kurumu oluşturan API çağrısı — oluşan { id, name } ile resolve olmalı (yönetici/davet
   *  adımı kurumId'ye ihtiyaç duyar, bkz. UlkeOlusturSlideOver'daki aynı desen). */
  onOlustur: (form: { name: string; sehir: string; ulkeId?: string }) => Promise<{ id: number; name: string }>;
  olusturuluyor: boolean;
  /** Kurum oluştuktan hemen sonra çağrılır (yönetici/davet adımı ayrıca başarısız olsa
   *  bile kurum zaten var olduğu için parent cache'i tazelemeli). */
  onTamamlandi?: () => void;
  /** Sabit ülke bağlamı — verilirse metin olarak gösterilir (ör. ülke-temsilcisi: kendi ülkesi). */
  ulkeAdi?: string;
  /** Verilirse ülke seçilebilir dropdown render edilir (ör. admin: Koordinator tüm ülkeleri yönetir). */
  ulkeSecenekleri?: { id: number; name: string }[];
  /** Verilirse "Kurum Yöneticisi" bölümü render edilir — "mevcut öğretmenden seç" araması
   *  bu listeden client-side filtrelenir (ülke-temsilcisi: kendi ülkesi, admin: tüm öğretmenler
   *  + formda seçilen ülkeye göre filtrelenir). */
  ogretmenler?: OgretmenSatiri[];
  /** yönetici atama endpoint'inin kök yolu — `${yoneticiApiBase}/kurum/{id}/yonetici` çağrılır. */
  yoneticiApiBase?: '/api/ulke-temsilcisi' | '/api/admin';
}) {
  const [form, setForm] = useState({ name: '', sehir: '', ulkeId: '' });
  const [yoneticiMod, setYoneticiMod] = useState<'yok' | 'mevcut' | 'davet'>('yok');
  const [ogretmenQuery, setOgretmenQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [seciliOgretmen, setSeciliOgretmen] = useState<{ id: number; ad: string; sinifSayisi: number } | null>(null);
  const [asama, setAsama] = useState<'form' | 'davet-hazir'>('form');
  const [davetEmail, setDavetEmail] = useState('');
  const [davetUrl, setDavetUrl] = useState<string | null>(null);
  const [davetMailGonderildi, setDavetMailGonderildi] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const yoneticiSecimiAktif = !!ogretmenler && !!yoneticiApiBase;

  useEffect(() => {
    if (!open) return;
    setForm({ name: '', sehir: '', ulkeId: '' });
    setYoneticiMod('yok');
    setOgretmenQuery('');
    setShowDropdown(false);
    setSeciliOgretmen(null);
    setAsama('form');
    setDavetEmail('');
    setDavetUrl(null);
    setDavetMailGonderildi(false);
    setGonderiliyor(false);
    setHata(null);
  }, [open]);

  const adaylar = useMemo(() => {
    if (!ogretmenler || !ogretmenQuery.trim()) return [];
    const q = ogretmenQuery.toLocaleLowerCase('tr');
    return ogretmenler
      .filter(o => o.isApproved)
      .filter(o => !ulkeSecenekleri || !form.ulkeId || String(o.ulkeId ?? '') === form.ulkeId)
      .filter(o => `${o.name} ${o.surname ?? ''}`.toLocaleLowerCase('tr').includes(q) || o.email.toLocaleLowerCase('tr').includes(q))
      .slice(0, 8);
  }, [ogretmenler, ogretmenQuery, form.ulkeId, ulkeSecenekleri]);

  const ulkeGerekliAmaSecilmedi = !!ulkeSecenekleri && !form.ulkeId;
  const gonderilebilir = !!form.name.trim() && !ulkeGerekliAmaSecilmedi && !(yoneticiMod === 'mevcut' && !seciliOgretmen);

  async function gonder() {
    setHata(null);
    setGonderiliyor(true);

    let kurumId: number;
    let kurumAdi: string;
    try {
      const sonuc = await onOlustur(form);
      kurumId = sonuc.id;
      kurumAdi = sonuc.name;
    } catch (err) {
      setGonderiliyor(false);
      setHata(apiHataMesaji(err));
      return;
    }

    onTamamlandi?.();

    if (yoneticiMod === 'yok' || !yoneticiSecimiAktif) {
      setGonderiliyor(false);
      onClose();
      return;
    }

    try {
      if (yoneticiMod === 'mevcut' && seciliOgretmen) {
        await api.put(`${yoneticiApiBase}/kurum/${kurumId}/yonetici`, { userId: seciliOgretmen.id });
        toast.success(`${seciliOgretmen.ad} artık "${kurumAdi}" yöneticisi`);
        // Kurum listesi onTamamlandi'nin ilk cagrisinda (kurum olusunca) zaten tazelendi
        // — o anda yonetici henuz atanmamisti, bu yuzden "Kurum Yoneticisi" kolonu "—"
        // gosterirdi tekrar cagrilmazsa (2026-08-30'da manuel testte yakalandi).
        onTamamlandi?.();
        setGonderiliyor(false);
        onClose();
        return;
      }

      const davetRes = await api.post('/api/davet/olustur', {
        hedefRol: 'KurumYoneticisi',
        kurumId,
        hedefEmail: davetEmail.trim() || undefined,
      });
      setGonderiliyor(false);
      setDavetUrl(davetRes.data.url);
      setDavetMailGonderildi(!!davetEmail.trim() && davetRes.data.mailGonderildi);
      setAsama('davet-hazir');
    } catch (err) {
      setGonderiliyor(false);
      toast.error(`"${kurumAdi}" oluşturuldu ama yönetici ataması başarısız oldu: ${apiHataMesaji(err)}. Kurumlar listesinden tekrar deneyebilirsiniz.`);
      onClose();
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={asama === 'davet-hazir' ? 'Davet Linki Hazır' : 'Yeni Kurum'}
      width="sm"
      footer={
        asama === 'davet-hazir' ? (
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Kapat
          </button>
        ) : (
          <button
            form="kurum-olustur-form"
            type="submit"
            disabled={olusturuluyor || gonderiliyor || !gonderilebilir}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {olusturuluyor || gonderiliyor ? 'Oluşturuluyor…' : 'Oluştur'}
          </button>
        )
      }
    >
      {asama === 'davet-hazir' && davetUrl ? (
        <div className="space-y-3">
          {davetEmail.trim() && (
            davetMailGonderildi ? (
              <p className="text-xs text-emerald-600 font-medium">✓ {davetEmail.trim()} adresine gönderildi.</p>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                {davetEmail.trim()} adresine gönderilemedi — linki aşağıdan manuel paylaşın.
              </p>
            )
          )}
          <div className="px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600 break-all font-mono border border-slate-200">
            {davetUrl}
          </div>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Merhaba! Kurum yöneticisi olarak davet edildiniz. Kayıt için: ${davetUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors"
            >
              <Share2 className="size-3.5" />
              WhatsApp
            </a>
            {!davetMailGonderildi && (
              <a
                href={`mailto:?subject=Davet&body=${encodeURIComponent(`Merhaba!\n\nKurum yöneticisi olarak davet edildiniz.\n\nKayıt linkiniz: ${davetUrl}`)}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                <Mail className="size-3.5" />
                E-posta
              </a>
            )}
          </div>
        </div>
      ) : (
        <form
          id="kurum-olustur-form"
          onSubmit={e => { e.preventDefault(); gonder(); }}
          className="space-y-4"
        >
          <p className="text-xs text-slate-400">
            {yoneticiSecimiAktif
              ? 'Lisans/deneme ataması bu adımda yapılmaz, sonra ayrıca eklenebilir.'
              : 'Boş bir kurum kaydı oluşturur — lisans/deneme veya kurum yöneticisi ataması bu adımda yapılmaz, sonra ayrıca eklenebilir.'}
          </p>
          {ulkeAdi && <p className="text-xs text-slate-500">Ülke: <strong>{ulkeAdi}</strong> (sabit)</p>}
          {ulkeSecenekleri && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Ülke *</label>
              <select
                value={form.ulkeId}
                onChange={e => { setForm(f => ({ ...f, ulkeId: e.target.value })); setSeciliOgretmen(null); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">Seçiniz</option>
                {ulkeSecenekleri.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Kurum Adı *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Şehir</label>
            <input
              value={form.sehir}
              onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {yoneticiSecimiAktif && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Kurum Yöneticisi</label>
              <div className="flex gap-1.5 mb-2">
                {([
                  { key: 'yok', label: 'Şimdi atama' },
                  { key: 'mevcut', label: 'Mevcut öğretmen' },
                  { key: 'davet', label: 'Davet oluştur' },
                ] as const).map(o => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setYoneticiMod(o.key)}
                    className={cn(
                      'flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      yoneticiMod === o.key
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {yoneticiMod === 'mevcut' && (
                <div>
                  {seciliOgretmen ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                        <span className="text-xs font-medium text-purple-800 flex-1">{seciliOgretmen.ad}</span>
                        <button type="button" onClick={() => { setSeciliOgretmen(null); setOgretmenQuery(''); }}
                          className="text-purple-400 hover:text-purple-600">
                          <X className="size-3.5" />
                        </button>
                      </div>
                      {seciliOgretmen.sinifSayisi > 0 && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                          Bu öğretmenin zaten {seciliOgretmen.sinifSayisi} sınıfı var — kurum değiştirilince bu sınıflar da yeni kuruma taşınır.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        value={ogretmenQuery}
                        onChange={e => { setOgretmenQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                        placeholder="Öğretmen ara (isim veya e-posta)…"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      {showDropdown && adaylar.length > 0 && (
                        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {adaylar.map(o => (
                            <button
                              key={o.id}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setSeciliOgretmen({ id: o.id, ad: `${o.name} ${o.surname ?? ''}`.trim(), sinifSayisi: o.sinifSayisi ?? 0 });
                                setOgretmenQuery('');
                                setShowDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-purple-50 flex flex-col gap-0.5 transition-colors"
                            >
                              <span className="flex items-baseline gap-1">
                                <span className="text-xs font-medium text-slate-800">{o.name} {o.surname}</span>
                                <span className="text-[11px] text-slate-400">({o.email})</span>
                              </span>
                              <span className="text-[11px] text-slate-400">{o.kurumAdi}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!seciliOgretmen && (
                    <p className="text-xs text-slate-400 mt-1">
                      Yalnızca onaylı öğretmenler arasından seçilebilir — seçilen öğretmen mevcut kurumundan bu kuruma taşınır.
                    </p>
                  )}
                </div>
              )}

              {yoneticiMod === 'davet' && (
                <div>
                  <input
                    type="email"
                    value={davetEmail}
                    onChange={e => setDavetEmail(e.target.value)}
                    placeholder="yonetici@ornek.com (opsiyonel)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {davetEmail.trim()
                      ? 'Oluştur\'a bastığınızda davet sistem tarafından bu adrese gönderilir.'
                      : 'Boş bırakırsanız Oluştur\'a bastığınızda WhatsApp/e-posta ile kendiniz paylaşabileceğiniz bir link üretilir.'}
                  </p>
                </div>
              )}

              {yoneticiMod === 'yok' && (
                <p className="text-xs text-slate-400">Yönetici ataması sonra kurum sayfasından da yapılabilir.</p>
              )}
            </div>
          )}

          {hata && <p role="alert" className="text-xs text-red-600">{hata}</p>}
        </form>
      )}
    </SlideOver>
  );
}
