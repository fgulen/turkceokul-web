'use client';

// Ülke-temsilcisi panelinde doğan, ülke-scope'suz (admin/koordinator) panelde de
// kullanılan paylaşılan tab bileşenleri: Öğrenciler/Öğretmenler listesi, Sınıflar,
// Ders Kitapları (lisans) ve Raporlar. Kurum satırlarının detay linki `kurumHref`
// prop'uyla parametrize edilir — çağıran sayfa kendi kurum-detay route'unu geçer
// (örn. ülke temsilcisi: `/ulke-temsilcisi/kurum/${id}`, admin: `/admin/kurum/${id}`).

import { useMemo, useState } from 'react';
import { UserPlus, ChevronRight, CheckCircle, XCircle, Building2, BookOpen, Pencil } from 'lucide-react';
import { Link } from '@/navigation';
import { cn } from '@/lib/utils';
import { LISANS_TIPI_METIN, LISANS_TIPI_ROZET, type LisansKarti } from '@/components/lisans-kart';
import { AramaInput, Sayfalama, SortTh, useSiralama, trSirala } from '@/components/staff/table-kit';

// Öğretmen onay durumu — Öğretmenler/Bekleyen Onay sekmelerinde PersonelListesi'nin
// sonKolonRender'ına geçilir (referans: kurum-yoneticisi'nin daha önce tablo içi
// inline onay pattern'i, tüm rollere standartlaştırıldı).
export function OnayDurumuAksiyon({ onaylandi, onOnayla, onReddet }: {
  onaylandi: boolean;
  onOnayla: () => void;
  onReddet: () => void;
}) {
  if (onaylandi) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
        Onaylı
      </span>
    );
  }
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onReddet}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
      >
        <XCircle className="size-3.5" />
        Reddet
      </button>
      <button
        onClick={onOnayla}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
      >
        <CheckCircle className="size-3.5" />
        Onayla
      </button>
    </div>
  );
}

export interface OgretmenSatiri {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  lastLoginDate: string | null;
  insertDate: string;
  kurumId: number;
  kurumAdi: string;
  isApproved?: boolean;
  ulkeAdi: string | null;
  /** Koordinator panelinde ulke-bazli filtreleme icin (ulke-temsilcisi listesinde her zaman kendi ulkesi). */
  ulkeId?: number | null;
  /** Kurum yoneticisi atama akisinda "bosta degilse uyar" kontrolu icin. */
  sinifSayisi?: number;
}

export interface OgrenciSatiri {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  lastLoginDate: string | null;
  insertDate: string;
  kurumAdi: string;
  sinifAdi: string;
  ulkeAdi: string | null;
}

export interface SinifSatiri {
  id: number;
  name: string;
  kurumId: number;
  kurumAdi: string;
  ulkeAdi: string | null;
  ogretmenAdi: string | null;
  ogrenciSayisi: number;
  dersKitabiId: string | null;
}

export interface KurumRaporOzeti {
  kurumId: number;
  kurumAdi: string;
  sehir: string | null;
  ogrenciSayisi: number;
  aktifOgrenciSayisi: number;
  ortalamaIlerleme: number;
  ortalamaPuan: number;
  sonAktivite: string | null;
}

export interface KurumLisansGrubu {
  kurumId: number;
  kurumAdi: string;
  kitaplar: LisansKarti[];
}

interface LisansSatiri {
  kurumId: number;
  kurumAdi: string;
  kitap: LisansKarti;
}

const SAYFA_BOYUTU = 20;

function sonGirisMetni(tarih: string | null) {
  if (!tarih) return 'Hiç giriş yapmadı';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function kayitTarihiMetni(tarih: string) {
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Türkçe case-fold ile ad/e-posta/kurum üzerinde basit arama (client-side; bu ölçekte
// sunucu tarafı sayfalama gerekmiyor).
function metinEslesiyorMu(alanlar: (string | null)[], arama: string) {
  if (!arama) return true;
  const q = arama.toLocaleLowerCase('tr');
  return alanlar.some(a => (a ?? '').toLocaleLowerCase('tr').includes(q));
}

type PersonelSatir = OgretmenSatiri | OgrenciSatiri;
type PersonelSortKey = 'name' | 'kurumAdi' | 'ulkeAdi' | 'insertDate' | 'lastLoginDate';

export function PersonelListesi({
  baslik, aciklama, veri, yukleniyor, bosMesaj, ikincilKolonBaslik, ikincilKolonRender, ekleButonu,
  sonKolonBaslik, sonKolonRender,
  ucuncuKolonBaslik, ucuncuKolonRender,
}: {
  baslik: string;
  /** Opsiyonel alt açıklama — sekmenin ne olduğu tabloya bakmadan anlaşılmıyorsa (örn. "Bekleyen Onay"). */
  aciklama?: string;
  veri: PersonelSatir[] | undefined;
  yukleniyor: boolean;
  bosMesaj: string;
  ikincilKolonBaslik: string;
  ikincilKolonRender: (satir: PersonelSatir) => string;
  ekleButonu?: { etiket: string; onClick: () => void };
  /** Opsiyonel 5. kolon (örn. "Durum": onayla/reddet aksiyonu) — yalnız ikisi birlikte verilirse render edilir. */
  sonKolonBaslik?: string;
  sonKolonRender?: (satir: PersonelSatir) => React.ReactNode;
  /** Opsiyonel 3. kolon (örn. "Ülke") — Ad Soyad'dan hemen sonra, ikincil kolondan (örn. "Kurum") ÖNCE render edilir. */
  ucuncuKolonBaslik?: string;
  ucuncuKolonRender?: (satir: PersonelSatir) => string;
}) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<PersonelSortKey>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(o => metinEslesiyorMu(
      [o.name, o.surname, o.email, ikincilKolonRender(o)],
      arama,
    ));
  }, [veri, arama, ikincilKolonRender]);

  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);
  const toplam = sirali.length;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const sayfalik = sirali.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);
  const kolonSayisi = 4 + (ucuncuKolonBaslik && ucuncuKolonRender ? 1 : 0) + (sonKolonBaslik && sonKolonRender ? 1 : 0);
  // Ülke kolonu (ucuncuKolon) yoksa Kurum onun "sm" yerini alır — aksi halde sadece
  // Ülke'nin de gösterildiği çağıranlarda (admin) doğru olan "lg" kuralı, Ülke'nin hiç
  // geçilmediği çağıranlarda (ülke-temsilcisi) Kurum'u tablet'te tamamen kaybettirirdi.
  const ikincilKolonSinifi = ucuncuKolonBaslik && ucuncuKolonRender ? 'hidden lg:table-cell' : 'hidden sm:table-cell';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">{baslik}</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          {aciklama && <p className="text-xs font-medium text-amber-700">{aciklama}</p>}
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Ad, e-posta ara..." />
          {ekleButonu && (
            <button onClick={ekleButonu.onClick}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
              <UserPlus className="size-3.5" /> {ekleButonu.etiket}
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Ad Soyad</SortTh>
              {ucuncuKolonBaslik && ucuncuKolonRender && (
                <SortTh colKey="ulkeAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell">{ucuncuKolonBaslik}</SortTh>
              )}
              <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className={ikincilKolonSinifi}>{ikincilKolonBaslik}</SortTh>
              <SortTh colKey="insertDate" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell">Kayıt Tarihi</SortTh>
              <SortTh colKey="lastLoginDate" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Son Giriş</SortTh>
              {sonKolonBaslik && sonKolonRender && <th className="px-4 py-2.5 text-right font-medium text-slate-600">{sonKolonBaslik}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => (
                <tr key={i}><td colSpan={kolonSayisi} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>
              ))
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={kolonSayisi} className="px-4 py-8 text-center text-slate-400 text-sm">{bosMesaj}</td></tr>
            ) : (
              sayfalik.map(o => (
                <tr key={o.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900 truncate">{o.name} {o.surname ?? ''}</div>
                    <div className="text-xs text-slate-400 truncate">{o.email}</div>
                  </td>
                  {ucuncuKolonBaslik && ucuncuKolonRender && (
                    <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{ucuncuKolonRender(o)}</td>
                  )}
                  <td className={cn('px-4 py-2 text-xs text-slate-500', ikincilKolonSinifi)}>
                    {ikincilKolonRender(o)}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden md:table-cell">{kayitTarihiMetni(o.insertDate)}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 text-right">{sonGirisMetni(o.lastLoginDate)}</td>
                  {sonKolonBaslik && sonKolonRender && <td className="px-4 py-2 text-right">{sonKolonRender(o)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sayfalama sayfa={sayfa} totalPages={totalPages} toplam={toplam} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />
    </div>
  );
}

export interface KurumSatiri {
  id: number;
  name: string;
  sehir: string | null;
  ulkeAdi: string | null;
  ogretmenSayisi: number;
  ogrenciSayisi: number;
  kurumYoneticisiAdi: string | null;
  kitapVarMi: boolean;
}

// Kurumlar tablosu — admin (tüm ülkeler) ve ülke-temsilcisi (kendi ülkesi) panelinde
// aynı görsel/etkileşim: standart tablo çerçevesi (AramaInput/SortTh/Sayfalama),
// satır tıklaması kurum detayına gider, hover'da Lisans/Düzenle ikonları belirir.
export function KurumlarTab({ veri, yukleniyor, kurumHref, onYeniKurum, onDuzenle, onLisans, ekstraAksiyon }: {
  veri: KurumSatiri[] | undefined;
  yukleniyor: boolean;
  kurumHref: (kurumId: number) => string;
  onYeniKurum: () => void;
  onDuzenle: (kurum: KurumSatiri) => void;
  /** Verilmezse Lisans ikonu gösterilmez (ör. admin'de henüz kurum-lisans SlideOver'ı yok). */
  onLisans?: (kurum: KurumSatiri) => void;
  /** "Yeni Kurum" butonundan önce, toolbar'a ek bir aksiyon (ör. ülke-temsilcisi: "Yeni Kurum Yöneticisi"). */
  ekstraAksiyon?: React.ReactNode;
}) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'ogretmenSayisi' | 'ogrenciSayisi'>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(k => metinEslesiyorMu([k.name, k.sehir, k.kurumYoneticisiAdi], arama));
  }, [veri, arama]);
  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);
  const toplam = sirali.length;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const sayfalik = sirali.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Kurumlar</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Kurum, şehir ara..." />
          <div className="ml-auto flex items-center gap-2">
            {ekstraAksiyon}
            <button onClick={onYeniKurum}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
              <Building2 className="size-3.5" /> Yeni Kurum
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kurum</SortTh>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden sm:table-cell">Ülke</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden sm:table-cell">Kurum Yöneticisi</th>
              <SortTh colKey="ogretmenSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Öğretmen</SortTh>
              <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Öğrenci</SortTh>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Henüz kurum yok.</td></tr>
            ) : (
              sayfalik.map(k => (
                <tr key={k.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Link href={kurumHref(k.id)} className="font-medium text-slate-900 hover:text-primary transition-colors">
                        {k.name}
                      </Link>
                      {!k.kitapVarMi && (
                        onLisans ? (
                          <button
                            onClick={() => onLisans(k)}
                            className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium whitespace-nowrap hover:bg-amber-100 transition-colors"
                            title="Kitap atamak için tıklayın — aksi halde öğretmenler sınıf oluşturamaz."
                          >
                            Kitap Atanmamış
                          </button>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium whitespace-nowrap"
                            title="Bu kuruma henüz kitap/lisans atanmadı — öğretmenler sınıf oluşturamaz."
                          >
                            Kitap Atanmamış
                          </span>
                        )
                      )}
                    </div>
                    {k.sehir && <div className="text-xs text-slate-400">{k.sehir}</div>}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{k.ulkeAdi ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{k.kurumYoneticisiAdi ?? '—'}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{k.ogretmenSayisi}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{k.ogrenciSayisi}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      {onLisans && (
                        <button onClick={() => onLisans(k)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Kitaplar">
                          <BookOpen className="size-3.5" /> Kitaplar
                        </button>
                      )}
                      <button onClick={() => onDuzenle(k)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Düzenle">
                        <Pencil className="size-3.5" /> Düzenle
                      </button>
                      <Link href={kurumHref(k.id)} className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sayfalama sayfa={sayfa} totalPages={totalPages} toplam={toplam} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />
    </div>
  );
}

export function SiniflarTab({ veri, yukleniyor, ulkeGoster = true }: {
  veri: SinifSatiri[] | undefined;
  yukleniyor: boolean;
  /** Ülke-scope'lu panellerde (ör. ülke temsilcisi) her satırda aynı değeri tekrarlayacağı için kapatılır. */
  ulkeGoster?: boolean;
}) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'kurumAdi' | 'ulkeAdi' | 'ogretmenAdi' | 'ogrenciSayisi'>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(s => metinEslesiyorMu([s.name, s.kurumAdi, s.ogretmenAdi], arama));
  }, [veri, arama]);
  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);
  const toplam = sirali.length;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const sayfalik = sirali.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);
  // Ülke kolonu kapalıysa (ulke-temsilcisi) Kurum onun "sm" yerini alır — bkz. PersonelListesi'ndeki aynı desen.
  const kurumSinifi = ulkeGoster ? 'hidden lg:table-cell' : 'hidden sm:table-cell';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Sınıflar</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Sınıf, kurum, öğretmen ara..." />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Sınıf</SortTh>
              {ulkeGoster && (
                <SortTh colKey="ulkeAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell">Ülke</SortTh>
              )}
              <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className={kurumSinifi}>Kurum</SortTh>
              <SortTh colKey="ogretmenAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Öğretmen</SortTh>
              <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Öğrenci</SortTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => <tr key={i}><td colSpan={ulkeGoster ? 5 : 4} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={ulkeGoster ? 5 : 4} className="px-4 py-8 text-center text-slate-400 text-sm">Sınıf yok.</td></tr>
            ) : (
              sayfalik.map(s => (
                <tr key={s.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                  {ulkeGoster && (
                    <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{s.ulkeAdi ?? '—'}</td>
                  )}
                  <td className={cn('px-4 py-2 text-xs text-slate-500', kurumSinifi)}>{s.kurumAdi}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{s.ogretmenAdi ?? '—'}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{s.ogrenciSayisi}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sayfalama sayfa={sayfa} totalPages={totalPages} toplam={toplam} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />
    </div>
  );
}

export function DersKitaplariTab({ gruplar, yukleniyor, kurumHref }: {
  gruplar: KurumLisansGrubu[] | undefined;
  yukleniyor: boolean;
  kurumHref: (kurumId: number) => string;
}) {
  const [arama, setArama] = useState('');
  const { sortKey, sortDir, toggleSort } = useSiralama<'kurumAdi' | 'kitapAdi'>('kurumAdi');

  const satirlar: (LisansSatiri & { kitapAdi: string })[] = useMemo(() =>
    (gruplar ?? []).flatMap(g => g.kitaplar.map(k => ({ kurumId: g.kurumId, kurumAdi: g.kurumAdi, kitap: k, kitapAdi: k.name }))),
  [gruplar]);

  const filtreli = useMemo(() => {
    if (!arama) return satirlar;
    return satirlar.filter(s => metinEslesiyorMu([s.kurumAdi, s.kitapAdi], arama));
  }, [satirlar, arama]);
  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800">Ders Kitapları</h2>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{sirali.length}</span>
        <AramaInput value={arama} onChange={setArama} placeholder="Kurum, kitap ara..." />
        <span className="ml-auto text-xs text-slate-400">Aksiyon için kurum sayfasına gidin</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kurum</SortTh>
            <SortTh colKey="kitapAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kitap</SortTh>
            <th className="px-4 py-2.5 text-right font-medium text-slate-600">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {yukleniyor ? (
            [1, 2, 3].map(i => <tr key={i}><td colSpan={3} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
          ) : sirali.length === 0 ? (
            <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Kayıt bulunamadı.</td></tr>
          ) : (
            sirali.map(s => (
              <tr key={`${s.kurumId}-${s.kitap.id}`} className="odd:bg-white even:bg-slate-50/40">
                <td className="px-4 py-2">
                  <Link href={kurumHref(s.kurumId)} className="text-slate-900 hover:text-primary transition-colors">
                    {s.kurumAdi}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-700">{s.kitapAdi} <span className="text-xs text-slate-400">{s.kitap.seviye}</span></td>
                <td className="px-4 py-2 text-right">
                  {s.kitap.lisansTipi ? (
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', LISANS_TIPI_ROZET[s.kitap.lisansTipi])}>
                      {LISANS_TIPI_METIN[s.kitap.lisansTipi]}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Lisans Yok</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ilerlemeRengi(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-400';
  if (pct >= 20) return 'bg-orange-300';
  return 'bg-slate-200';
}

function sonAktiviteMetni(tarih: string | null) {
  if (!tarih) return 'Hiç aktivite yok';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const SEHIR_BELIRTILMEMIS = 'Şehir belirtilmemiş';

export function KurumRaporlarTab({ veri, yukleniyor, kurumHref }: {
  veri: KurumRaporOzeti[] | undefined;
  yukleniyor: boolean;
  kurumHref: (kurumId: number) => string;
}) {
  const [arama, setArama] = useState('');

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(k => metinEslesiyorMu([k.kurumAdi, k.sehir], arama));
  }, [veri, arama]);

  // Sehir'e gore gruplama — sehri olanlar alfabetik, "Sehir belirtilmemiş" en altta.
  const gruplar = useMemo(() => {
    const map = new Map<string, KurumRaporOzeti[]>();
    for (const k of filtreli) {
      const anahtar = k.sehir?.trim() || SEHIR_BELIRTILMEMIS;
      if (!map.has(anahtar)) map.set(anahtar, []);
      map.get(anahtar)!.push(k);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === SEHIR_BELIRTILMEMIS) return 1;
        if (b === SEHIR_BELIRTILMEMIS) return -1;
        return a.localeCompare(b, 'tr');
      })
      .map(([sehir, kurumlar]) => ({
        sehir,
        kurumlar: trSirala(kurumlar, 'kurumAdi', 'asc'),
        ortalamaIlerleme: kurumlar.reduce((t, k) => t + k.ortalamaIlerleme, 0) / kurumlar.length,
      }));
  }, [filtreli]);

  if (yukleniyor) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <AramaInput value={arama} onChange={setArama} placeholder="Kurum, şehir ara..." />
      {gruplar.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12">Henüz veri yok.</p>
      ) : (
        gruplar.map(g => (
          <div key={g.sehir} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-800">{g.sehir}</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{g.kurumlar.length} kurum</span>
              {g.sehir !== SEHIR_BELIRTILMEMIS && (
                <span className="ml-auto text-xs text-slate-400">Şehir ort.: %{Math.round(g.ortalamaIlerleme)}</span>
              )}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">Kurum</th>
                  <th className="px-4 py-2.5 text-center font-medium text-slate-600 hidden sm:table-cell">Öğrenci</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">İlerleme</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-600 hidden sm:table-cell">Son Aktivite</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {g.kurumlar.map(k => (
                  <tr key={k.kurumId} className="odd:bg-white even:bg-slate-50/40">
                    <td className="px-4 py-2 font-medium text-slate-900">{k.kurumAdi}</td>
                    <td className="px-4 py-2 text-center text-xs text-slate-600 hidden sm:table-cell">
                      {k.aktifOgrenciSayisi}/{k.ogrenciSayisi} aktif
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', ilerlemeRengi(k.ortalamaIlerleme))} style={{ width: `${Math.round(k.ortalamaIlerleme)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-9 text-right">%{Math.round(k.ortalamaIlerleme)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-slate-400 hidden sm:table-cell">{sonAktiviteMetni(k.sonAktivite)}</td>
                    <td className="px-4 py-2">
                      <Link href={kurumHref(k.kurumId)}>
                        <ChevronRight className="size-4 text-slate-300" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
      <p className="text-xs text-slate-400 px-1">
        Bu sıralama farklı sayıda etkinlik atanmış kurumları birebir kıyaslamaz, genel eğilimi gösterir.
      </p>
    </div>
  );
}
