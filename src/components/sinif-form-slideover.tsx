'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Building2, UserCheck, BookOpen, AlertCircle } from 'lucide-react';
import { useLocale } from '@/navigation';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { SlideOver } from '@/components/slide-over';
import { KatilimKoduDavet } from '@/components/katilim-kodu-davet';

interface IdName { id: number; name: string }
interface OgretmenItem { id: number; ad: string }
interface KitapItem { id: string; name: string; seviye: string }

interface FormData {
  rol: string;
  ulkeler?: IdName[];
  ulke?: IdName | null;
  kurumlar?: IdName[];
  kurum?: IdName | null;
  ogretmenler?: OgretmenItem[];
}

interface SinifDetayData {
  id: number;
  name: string;
  katilimKodu: string;
  dersKitabiId: string | null;
  kurumId: number | null;
}

// SuperAdmin icin Kurum dropdown'undaki sentinel — "hic secilmedi" (null) ile
// "bilincli olarak kurumsuz secildi" (bu deger) birbirinden ayrilir; ikincisinde
// kitap listesi kurumId hic gonderilmeden (tum katalog) yuklenir.
const KURUMSUZ = 'KURUMSUZ' as const;
type KurumSecimi = number | typeof KURUMSUZ | null;

interface Props {
  open: boolean;
  onClose: () => void;
  mod: 'olustur' | 'duzenle';
  sinifId?: number; // mod === 'duzenle' iken zorunlu
  ulkeId?: number; // ulke detay sayfasindan acilinca dropdown'u onceden secili baslatir (SuperAdmin)
  onBasarili: () => void; // liste query'sini invalidate etmek icin ebeveyne haber verir
}

export function SinifFormSlideOver({ open, onClose, mod, sinifId, ulkeId, onBasarili }: Props) {
  const locale = useLocale();
  const qc = useQueryClient();

  // adim ayri bir state degil — davetSinif'in null olup olmamasindan turetilir
  // (ikisi her zaman ayni anda set ediliyordu, code review bulgu #7).
  const [davetSinif, setDavetSinif] = useState<{ name: string; katilimKodu: string } | null>(null);
  const adim: 'form' | 'davet-basarili' = davetSinif ? 'davet-basarili' : 'form';

  const [sinifAdi, setSinifAdi] = useState('');
  const [seciliUlkeId, setSeciliUlkeId] = useState<number | null>(null);
  const [seciliKurumId, setSeciliKurumId] = useState<KurumSecimi>(null);
  const [seciliOgretmenId, setSeciliOgretmenId] = useState<number | null>(null);
  const [seciliKitapId, setSeciliKitapId] = useState('');

  // Panel her acilista temiz baslasin — onceki kapanistan kalan state sizmasin.
  useEffect(() => {
    if (open) {
      setDavetSinif(null);
      setSinifAdi('');
      setSeciliUlkeId(mod === 'olustur' ? (ulkeId ?? null) : null);
      setSeciliKurumId(null);
      setSeciliOgretmenId(null);
      setSeciliKitapId('');
    }
  }, [open, mod, sinifId, ulkeId]);

  const { data: formData } = useQuery<FormData>({
    queryKey: ['sinif-form-data'],
    queryFn: () => api.get('/api/ogretmen/sinif-form-data').then(r => r.data),
    enabled: open,
  });
  const rol = formData?.rol ?? '';

  // Duzenleme modu: panel.siniflar (KurumYoneticisi sekmesi) yalniz id/name tasir —
  // formu hydrate etmek icin tam veriyi burada cekiyoruz (spec: Degisiklik 6).
  const { data: sinifDetay, isLoading: sinifDetayYukleniyor } = useQuery<SinifDetayData>({
    queryKey: ['sinif-detay', sinifId],
    queryFn: () => api.get(`/api/ogretmen/sinif/${sinifId}`).then(r => r.data),
    enabled: open && mod === 'duzenle' && !!sinifId,
  });

  // `open` deps'te SART: ayni sinif ikinci kez duzenlemek icin acilinca
  // ['sinif-detay', sinifId] TanStack Query onbelleginden ayni referansi
  // dondurur (yeniden fetch olsa bile structural sharing referansi korur),
  // bu yuzden sinifDetay tek basina degismez ve effect tekrar tetiklenmez.
  // `open` de dep olunca reset effect'in her acilista bosalttigi formu bu
  // effect (React'ta ayni commit'te reset'ten SONRA calisir, cunku asagida
  // tanimli) tekrar dolduruyor — bos form bug'i (code review bulgu #3).
  useEffect(() => {
    if (open && mod === 'duzenle' && sinifDetay) {
      setSinifAdi(sinifDetay.name);
      setSeciliKitapId(sinifDetay.dersKitabiId ?? '');
      // Kitap listesini dogru kuruma gore yuklemek icin — bu roller icin dropdown
      // gosterilmez ama sorgu kurumId'ye ihtiyac duyar (bulgu #3/#4 fix).
      setSeciliKurumId(sinifDetay.kurumId ?? (rol === 'SuperAdmin' ? KURUMSUZ : null));
    }
  }, [open, mod, sinifDetay, rol]);

  // Tek yerde turetilir — "=== KURUMSUZ" karsilastirmasi bundan once 5 ayri
  // yerde tekrarlaniyordu (code review bulgu #10: unutulan bir kontrol sessizce
  // number-sekilli mantiga dusuyordu). Artik tek nokta, kacirilma riski dusuk.
  const kurumsuzSecili = seciliKurumId === KURUMSUZ;
  const kitapKurumId: number | null = kurumsuzSecili ? null : seciliKurumId;
  const kitapListesiHazir = !!formData && (
    rol === 'Ogretmen' || rol === 'KurumYoneticisi' || seciliKurumId !== null
  );

  const { data: kitaplar } = useQuery<KitapItem[]>({
    queryKey: ['sinif-kitaplar', kitapKurumId, kurumsuzSecili],
    queryFn: () => api
      .get('/api/ogretmen/sinif-kitaplar', kitapKurumId ? { params: { kurumId: kitapKurumId } } : undefined)
      .then(r => r.data),
    enabled: open && kitapListesiHazir,
  });

  // Cascade: SuperAdmin ülke seçince kurumları çek
  const { data: cascadeKurumlar } = useQuery<IdName[]>({
    queryKey: ['kurumlar-by-ulke', seciliUlkeId],
    queryFn: () => api.get(`/api/ogretmen/kurumlar?ulkeId=${seciliUlkeId}`).then(r => r.data),
    enabled: open && !!seciliUlkeId && (rol === 'SuperAdmin' || rol === 'UlkeTemsilcisi'),
  });

  // Cascade: kurum seçince öğretmenleri çek (SuperAdmin + UlkeTemsilcisi) —
  // KURUMSUZ seçiliyse bagimsiz=true ile serbest öğretmenler çekilir.
  const { data: cascadeOgretmenler } = useQuery<OgretmenItem[]>({
    queryKey: ['ogretmenler-by-kurum', seciliKurumId],
    queryFn: () => kurumsuzSecili
      ? api.get('/api/ogretmen/ogretmenler', { params: { bagimsiz: true } }).then(r => r.data)
      : api.get(`/api/ogretmen/ogretmenler?kurumId=${seciliKurumId}`).then(r => r.data),
    enabled: open && seciliKurumId !== null && (rol === 'SuperAdmin' || rol === 'UlkeTemsilcisi'),
  });

  const olusturMutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { name: sinifAdi, dersKitabiId: seciliKitapId };
      if (rol === 'SuperAdmin' || rol === 'UlkeTemsilcisi') {
        if (typeof seciliKurumId === 'number') body.kurumId = seciliKurumId;
        if (seciliOgretmenId) body.ogretmenUserId = seciliOgretmenId;
      } else if (rol === 'KurumYoneticisi') {
        if (seciliOgretmenId) body.ogretmenUserId = seciliOgretmenId;
      }
      return api.post('/api/ogretmen/sinif', body).then(r => r.data);
    },
    onSuccess: (data: { id: number; name: string; katilimKodu: string }) => {
      onBasarili();
      setDavetSinif({ name: data.name, katilimKodu: data.katilimKodu });
    },
  });

  const guncelleMutation = useMutation({
    mutationFn: () => api.put(`/api/ogretmen/sinif/${sinifId}`, {
      name: sinifAdi,
      dersKitabiId: seciliKitapId,
    }),
    onSuccess: () => {
      onBasarili();
      qc.invalidateQueries({ queryKey: ['sinif-detay', sinifId] });
      onClose();
    },
  });

  function handleUlkeChange(ulkeId: number) {
    setSeciliUlkeId(ulkeId);
    setSeciliKurumId(null);
    setSeciliOgretmenId(null);
  }

  function handleKurumChange(v: string) {
    const yeni: KurumSecimi = v === KURUMSUZ ? KURUMSUZ : (v ? parseInt(v) : null);
    setSeciliKurumId(yeni);
    setSeciliOgretmenId(null);
    setSeciliKitapId('');
  }

  const olusturAktif = sinifAdi.trim().length > 0 && !!seciliKitapId && !olusturMutation.isPending;
  const guncelleAktif = sinifAdi.trim().length > 0 && !!seciliKitapId && !guncelleMutation.isPending;

  const baslik = mod === 'olustur' ? 'Yeni Sınıf Oluştur' : 'Sınıfı Düzenle';

  return (
    <SlideOver open={open} onClose={onClose} title={adim === 'davet-basarili' ? 'Sınıf Oluşturuldu 🎉' : baslik} width="md">
      {adim === 'davet-basarili' && davetSinif ? (
        <div className="space-y-5">
          <p className="text-sm text-slate-600 text-center">
            <strong>{davetSinif.name}</strong> hazır. Öğrencilerinizi davet edin:
          </p>
          <KatilimKoduDavet katilimKodu={davetSinif.katilimKodu} locale={locale} />
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      ) : mod === 'duzenle' && sinifDetayYukleniyor ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="size-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
          Yükleniyor...
        </div>
      ) : !formData ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="size-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
          Yükleniyor...
        </div>
      ) : (
        <div className="space-y-3">
          {/* Öğretmen: salt-okunur ülke + kurum — yalnız oluştururken gösterilir */}
          {mod === 'olustur' && rol === 'Ogretmen' && (
            <div className="flex flex-wrap gap-2">
              {formData.ulke && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  <Globe className="size-3.5" />
                  {formData.ulke.name}
                </span>
              )}
              {formData.kurum && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
                  <Building2 className="size-3.5" />
                  {formData.kurum.name}
                </span>
              )}
            </div>
          )}

          {/* KurumYoneticisi: salt-okunur kurum + öğretmen dropdown — yalnız oluştururken */}
          {mod === 'olustur' && rol === 'KurumYoneticisi' && (
            <>
              {formData.kurum && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
                  <Building2 className="size-3.5" />
                  {formData.kurum.name}
                </span>
              )}
              <OgretmenSelect
                ogretmenler={formData.ogretmenler ?? []}
                value={seciliOgretmenId}
                onChange={setSeciliOgretmenId}
              />
              {(formData.ogretmenler ?? []).length === 0 && (
                <UyariMesaji text="Bu kurumda kayıtlı ve onaylı öğretmen bulunamadı." />
              )}
            </>
          )}

          {/* SuperAdmin + UlkeTemsilcisi: cascade dropdown'lar — yalnız oluştururken */}
          {mod === 'olustur' && (rol === 'SuperAdmin' || rol === 'UlkeTemsilcisi') && (
            <>
              {rol === 'SuperAdmin' ? (
                <SelectField
                  label="Ülke"
                  icon={<Globe className="size-3.5" />}
                  placeholder="Ülke seçin"
                  options={(formData.ulkeler ?? []).map(u => ({ value: String(u.id), label: u.name }))}
                  value={seciliUlkeId ? String(seciliUlkeId) : ''}
                  onChange={v => handleUlkeChange(parseInt(v))}
                />
              ) : (
                formData.ulke && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    <Globe className="size-3.5" />
                    {formData.ulke.name}
                  </span>
                )
              )}

              <SelectField
                label="Kurum"
                icon={<Building2 className="size-3.5" />}
                placeholder={seciliUlkeId || rol === 'UlkeTemsilcisi' ? 'Kurum seçin' : 'Önce ülke seçin'}
                options={[
                  ...(rol === 'SuperAdmin' ? [{ value: KURUMSUZ, label: '— Bağımsız / Kurumsuz Sınıf —' }] : []),
                  ...(cascadeKurumlar ?? formData.kurumlar ?? []).map(k => ({ value: String(k.id), label: k.name })),
                ]}
                value={kurumsuzSecili ? KURUMSUZ : seciliKurumId ? String(seciliKurumId) : ''}
                onChange={handleKurumChange}
                disabled={!seciliUlkeId && rol === 'SuperAdmin'}
              />

              {seciliKurumId !== null ? (
                <OgretmenSelect
                  ogretmenler={cascadeOgretmenler ?? []}
                  value={seciliOgretmenId}
                  onChange={setSeciliOgretmenId}
                />
              ) : (
                <SelectField
                  label="Öğretmen"
                  icon={<UserCheck className="size-3.5" />}
                  placeholder="Önce kurum seçin"
                  options={[]}
                  value=""
                  onChange={() => {}}
                  disabled
                  optional
                />
              )}

              {seciliKurumId !== null && cascadeOgretmenler?.length === 0 && (
                <UyariMesaji text={
                  kurumsuzSecili
                    ? 'Sistemde kayıtlı ve onaylı bağımsız öğretmen yok — sınıf kendinize atanacak.'
                    : 'Bu kurumda kayıtlı ve onaylı başka öğretmen yok — sınıf kendinize atanacak.'
                } />
              )}
            </>
          )}

          {/* Sınıf adı — her rolde/modda */}
          <input
            type="text"
            value={sinifAdi}
            onChange={e => setSinifAdi(e.target.value)}
            placeholder="Sınıf adı (örn: A1 Grubu)"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={e => {
              if (e.key !== 'Enter') return;
              if (mod === 'olustur' && olusturAktif) olusturMutation.mutate();
              if (mod === 'duzenle' && guncelleAktif) guncelleMutation.mutate();
            }}
          />

          {/* Kitap — sınıfın atandığı ders kitabı, zorunlu */}
          {kitapListesiHazir && (
            kitaplar === undefined ? (
              <p className="text-xs text-slate-400">Kitaplar yükleniyor...</p>
            ) : kitaplar.length === 0 ? (
              <UyariMesaji text="Bu kurum için henüz bir kitap tanımlanmamış. Kurum yöneticinizden veya ülke temsilcinizden lisans/varsayılan kitap talep edin." />
            ) : (
              <KitapSelectField value={seciliKitapId} onChange={setSeciliKitapId} kitaplar={kitaplar} />
            )
          )}

          {(olusturMutation.isError || guncelleMutation.isError) && (
            <p className="text-red-500 text-sm">
              {apiHataMesaji((olusturMutation.error ?? guncelleMutation.error))}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {mod === 'olustur' ? (
              <button
                onClick={() => olusturMutation.mutate()}
                disabled={!olusturAktif}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
              >
                {olusturMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            ) : (
              <button
                onClick={() => guncelleMutation.mutate()}
                disabled={!guncelleAktif}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
              >
                {guncelleMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm hover:bg-slate-200 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

// ── Yardımcı bileşenler ────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  optional?: boolean;
}

function SelectField({ label, icon, placeholder, options, value, onChange, disabled, optional }: SelectFieldProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
        {icon}
        <span className="text-xs font-medium">{label}{optional ? '' : '*'}</span>
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || options.length === 0}
        className={cn(
          'w-full pl-24 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none',
          (disabled || options.length === 0) && 'bg-slate-50 text-slate-400 cursor-not-allowed',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function OgretmenSelect({
  ogretmenler, value, onChange,
}: {
  ogretmenler: OgretmenItem[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
        <UserCheck className="size-3.5" />
        <span className="text-xs font-medium">Öğretmen</span>
      </div>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        disabled={ogretmenler.length === 0}
        className={cn(
          'w-full pl-28 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none',
          ogretmenler.length === 0 && 'bg-slate-50 text-slate-400 cursor-not-allowed',
        )}
      >
        <option value="">Kendiniz için (siz)</option>
        {ogretmenler.map(o => (
          <option key={o.id} value={o.id}>{o.ad}</option>
        ))}
      </select>
    </div>
  );
}

function KitapSelectField({
  value, onChange, kitaplar,
}: {
  value: string;
  onChange: (v: string) => void;
  kitaplar: KitapItem[];
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
        <BookOpen className="size-3.5" />
        <span className="text-xs font-medium">Kitap*</span>
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-20 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
      >
        <option value="">Kitap seçin</option>
        {kitaplar.map(k => (
          <option key={k.id} value={k.id}>{k.name} ({k.seviye})</option>
        ))}
      </select>
    </div>
  );
}

function UyariMesaji({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
      <AlertCircle className="size-4 shrink-0" />
      {text}
    </div>
  );
}
