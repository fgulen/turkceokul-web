'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HelpChat } from '@/components/ogretmen/HelpChat';
import { MdImport } from '@/components/ogretmen/md-import';
import { KaynakSecici, type KaynakSecim } from '@/components/ogretmen/ai-studio/KaynakSecici';
import { YakindaKart } from '@/components/ogretmen/ai-studio/YakindaKart';
import { KahootBaslatModal } from '@/components/ogretmen/ai-studio/KahootBaslatModal';
import { KahootHavuz } from '@/components/ogretmen/ai-studio/KahootHavuz';
import {
  Sparkles, Copy, Check, Download,
  ListChecks, Shuffle, PenLine, Newspaper, Zap,
  Loader2, AlertTriangle, X, Save,
  Trash2, Plus, History, ShieldCheck, ChevronDown, ChevronUp, FileUp,
  Lock, FileText, MessageSquare,
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api, aiApi } from '@/lib/api';
import { cn, toMediaUrl } from '@/lib/utils';

const SORU_SAYILARI = [5, 8, 10, 15, 20];

type TabId = 'quiz' | 'kahoot' | 'eslestir' | 'bosluk_doldur' | 'bulten' | 'pdf_import';

type TabTanim = { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; aciklama: string };

const CORE_TABS: TabTanim[] = [
  { id: 'quiz',          label: 'Quiz',            icon: ListChecks, aciklama: 'Çoktan seçmeli quiz soruları' },
  { id: 'kahoot',        label: 'Kahoot Quizi',    icon: Zap,        aciklama: 'Canlı sınıf yarışması — kısa, projeksiyon dostu sorular' },
  { id: 'eslestir',      label: 'Eşleştirme',      icon: Shuffle,    aciklama: 'Kelime veya cümle eşleştirme aktivitesi' },
  { id: 'bosluk_doldur', label: 'Boşluk Doldurma', icon: PenLine,    aciklama: 'Boşluk doldurma alıştırmaları' },
  { id: 'bulten',        label: 'Sınıf Bülteni',   icon: Newspaper,  aciklama: 'Sınıf veya öğrenci bazlı veli bülteni' },
];

const PDF_IMPORT_TAB: TabTanim = {
  id: 'pdf_import', label: 'MD Aktar', icon: FileUp,
  aciklama: 'Kitap markdown dosyasını (books/*.md) AI ile çözümleyip üniteye toplu aktarın',
};

const ORNEK_YONERGELER: { kategori: string; ornekler: string[] }[] = [
  {
    kategori: '🌐 Dil',
    ornekler: [
      'Instructions in English, explanations in Arabic.',
      'Yönergeleri Almanca yaz, açıklamalar Türkçe olsun.',
      'İpuçlarını yalnızca eş anlamlı kelimelerle sınırla.',
    ],
  },
  {
    kategori: '🖼 Görsel',
    ornekler: [
      'Soruların yarısını ünitedeki resimlerle ilişkilendir.',
      'Her soru için öğrencinin hayal etmesini sağlayacak betimlemeler ekle.',
      'Eşleştirmede resimdeki nesneler ile Türkçe karşılıklarını hedefle.',
    ],
  },
  {
    kategori: '🎭 Senaryo',
    ornekler: [
      "Tüm soruları bir 'İstanbul Turu' senaryosu içinde kurgula.",
      'Soruları 10 yaşındaki bir çocuğun ilgi alanlarına (oyun, hayvanlar) göre özelleştir.',
      'Karagöz ve Hacivat karakterlerini kullanan diyalog temelli sorular hazırla.',
    ],
  },
  {
    kategori: '🧠 Pedagoji',
    ornekler: [
      'Her yanlış şık için neden yanlış olduğunu İngilizce açıkla.',
      "Soruları 'somuttan soyuta' doğru sırala, kolaydan zora değil.",
      'Okuma metninden çıkarım (inference) gerektiren mantık soruları üret.',
    ],
  },
];

interface Soru {
  // Yeni format
  question?: string;
  options?: string[];
  answer?: string;
  hint?: string;
  explanation?: string;
  image_id?: string | null;
  imageUrl?: string | null;
  // Eski format (backward compat)
  description?: string;
  kelime1?: string;
  kelime2?: string;
  kelime3?: string;
  kelime4?: string;
  cevap?: string;
}

interface IcerikSonuc {
  baslik?: string;
  sorular: Soru[];
}

type TabSonuc = { icerik: IcerikSonuc | null; metin: string; resimUrls: string[] };

interface Sinif       { id: number; name: string; }
interface GecmisItem  {
  id: string; name: string; tip: string; unite: string;
  soruSayisi: number; insertDate: string; zorluk: number;
  onaylandi: boolean;
  bolum?: string;
  kitapAdi?: string;
  kitapId?: string;
  uniteId?: string;
}

interface GecmisDetay {
  id: string; description: string | null;
  kelime1: string | null; kelime2: string | null;
  kelime3: string | null; kelime4: string | null;
  onaylandi: boolean;
}

export default function AIIcerikPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const [aktifTab, setAktifTab] = useState<TabId>('quiz');
  const [kahootSubTab, setKahootSubTab] = useState<'uret' | 'havuz'>('uret');
  const [modalAcik, setModalAcik] = useState(false);
  const [modalEtkinlikId, setModalEtkinlikId] = useState<string | null>(null);

  const mdAktarGorunur = user?.role === 'SuperAdmin' || user?.role === 'Editor';
  const TABS: TabTanim[] = mdAktarGorunur ? [...CORE_TABS, PDF_IMPORT_TAB] : CORE_TABS;

  // Form state
  const [girdi, setGirdi] = useState('');
  const [soruSayisi, setSoruSayisi] = useState(10);
  const [kaynak, setKaynak] = useState<KaynakSecim | null>(null);
  const [yonergeDili, setYonergeDili] = useState<'' | 'EN' | 'AR' | 'RU'>('');
  const [resimli, setResimli] = useState(false);
  const [bultenSinifId, setBultenSinifId] = useState<number | ''>('');
  const [bultenKapsam, setBultenKapsam] = useState<'sinif' | 'ogrenci'>('sinif');
  const [bultenOgrenciId, setBultenOgrenciId] = useState<number | ''>('');
  const [bultenPeriyot, setBultenPeriyot] = useState<'haftalik' | 'donemlik'>('haftalik');

  // Sonuçlar: sekme başına saklanır
  const [sonuclar, setSonuclar] = useState<Partial<Record<TabId, TabSonuc>>>({});
  const [kopyalandi, setKopyalandi] = useState(false);
  // Kaydedilen etkinlikId sekme başına saklanır — aksi halde bir sekmede kaydedip
  // 5sn içinde başka sekmeye geçilirse "Hemen Kahoot Başlat" o sekmenin değil,
  // önceki sekmenin etkinlikId'sini kullanırdı.
  const [kaydedildi, setKaydedildi] = useState<Partial<Record<TabId, string>>>({});
  const [kaydetHata, setKaydetHata] = useState('');
  const [hata, setHata] = useState('');
  const [duzenlemeModuAktif, setDuzenlemeModuAktif] = useState(false);

  const { data: siniflar = [] } = useQuery<Sinif[]>({
    queryKey: ['siniflarim'],
    queryFn: () => api.get('/api/ogretmen/siniflarim').then(r => r.data),
    enabled: !!user,
  });

  interface OgrenciOzet {
    userId: number;
    ad: string;
  }

  const { data: bultenOgrenciler = [] } = useQuery<OgrenciOzet[]>({
    queryKey: ['bulten-ogrenciler', bultenSinifId],
    queryFn: () => api.get(`/api/ogretmen/sinif/${bultenSinifId}/rapor`).then(r => r.data.ogrenciler),
    enabled: !!bultenSinifId && aktifTab === 'bulten',
  });

  const { data: gecmisData, refetch: gecmisYenile } = useQuery<{
    toplam: number; liste: GecmisItem[];
  }>({
    queryKey: ['ai-gecmis'],
    queryFn: () => api.get('/api/ai/gecmis?boyut=50').then(r => r.data),
    enabled: !!user,
  });

  const { data: krediData } = useQuery({
    queryKey: ['ai-kredi'],
    queryFn: () => api.get('/api/ai/kredi').then(r => r.data as {
      kalan: number | null; toplam: number | null; lisansli: boolean;
      sinirsiz: boolean; aylikHarcama: number | null;
    }),
    enabled: !!user,
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();

  const limitAsili = krediData && !krediData.lisansli
    ? krediData.kalan === 0
    : false;

  const freemium = !!krediData && krediData.lisansli === false && krediData.sinirsiz !== true;

  // Clamp soruSayisi to 5 for freemium users once kredi data arrives
  useEffect(() => {
    if (freemium && soruSayisi !== 5) setSoruSayisi(5);
  }, [freemium, soruSayisi]);

  const silMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/ai/gecmis/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['ai-gecmis'] });
      const onceki = queryClient.getQueryData<{ toplam: number; liste: GecmisItem[] }>(['ai-gecmis']);
      queryClient.setQueryData(['ai-gecmis'], (eski: typeof onceki) => eski && ({
        toplam: eski.toplam - 1,
        liste: eski.liste.filter(g => g.id !== id),
      }));
      return { onceki };
    },
    onError: (_e, _id, ctx) => ctx?.onceki && queryClient.setQueryData(['ai-gecmis'], ctx.onceki),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['ai-gecmis'] }),
  });

  const onaylaMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/ai/gecmis/${id}/onayla`),
    onSuccess: () => gecmisYenile(),
  });

  const uretMutation = useMutation({
    mutationFn: async () => {
      if (aktifTab === 'bulten')
        return aiApi.post('/api/ai/sinif-bulteni', {
          sinifId: bultenSinifId,
          ogrenciId: bultenKapsam === 'ogrenci' ? bultenOgrenciId : undefined,
          periyot: bultenPeriyot,
        }).then(r => r.data);
      return aiApi.post('/api/ai/icerik-uret', {
        tip: aktifTab,                       // 'kahoot' dahil
        soruSayisi,
        duzey: kaynak!.seviye,
        uniteId: kaynak!.uniteId,
        kitapTuru: kaynak!.kitapTuru,
        yonergeDili: yonergeDili || undefined,
        girdi: girdi || undefined,           // Yönetmen Talimatı (backend'de ogretmenTalimati)
        resimli,
        ciktiFormati: 'etkinlik',
      }).then(r => r.data);
    },
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['ai-kredi'] });
      setHata('');
      setDuzenlemeModuAktif(false);
      const tabId = aktifTab;

      if (typeof data === 'object' && data !== null && 'icerik' in data) {
        setSonuclar(prev => ({ ...prev, [tabId]: { icerik: null, metin: (data as { icerik: string }).icerik, resimUrls: [] } }));
      } else if (typeof data === 'object' && data !== null && 'sorular' in data) {
        setSonuclar(prev => ({ ...prev, [tabId]: { icerik: data as IcerikSonuc, metin: '', resimUrls: [] } }));
      } else {
        setSonuclar(prev => ({ ...prev, [tabId]: { icerik: null, metin: JSON.stringify(data, null, 2), resimUrls: [] } }));
      }
    },
    onError: (err: Error) => {
      // Backend hata kodları: limit_asili (aylık kredi bitti), premium_gerekli (>5 soru
      // ücretsiz planda), ai_hata (AI sağlayıcı/parse hatası, 2 denemede de başarısız),
      // ogrenci_sinifta_degil (bülten için seçilen öğrenci sınıfta değil)
      const resp = (err as { response?: { status?: number; data?: { kod?: string; mesaj?: string } } }).response;
      if (resp?.status === 403 && resp.data?.kod === 'limit_asili') {
        setHata('Aylık AI üretim limitine ulaştın (ücretsiz planda 10 üretim/ay, tüm AI araçları için ortak). Limit her ayın başında yenilenir — sınırsız üretim için Kurumsal Pro\'ya geçebilirsin.');
        return;
      }
      if (resp?.status === 403 && resp.data?.kod === 'premium_gerekli') {
        setHata('5\'ten fazla soru üretmek için Kurumsal Pro lisansı gerekir. Ücretsiz planda soru sayısı 5 ile sınırlıdır.');
        return;
      }
      if (resp?.status === 400 && resp.data?.kod === 'ogrenci_sinifta_degil') {
        setHata('Seçilen öğrenci bu sınıfta değil. Lütfen öğrenci listesini yenileyin veya başka bir öğrenci seçin.');
        return;
      }
      if (resp?.status === 502 && resp.data?.kod === 'ai_hata') {
        setHata(resp.data?.mesaj || 'AI yanıt vermedi, lütfen tekrar deneyin.');
        return;
      }
      setHata(err.message || 'Bilinmeyen hata');
    },
  });

  function soruGuncelle(idx: number, updates: Partial<Soru>) {
    const sonuc = sonuclar[aktifTab];
    if (!sonuc?.icerik) return;
    const sorular = sonuc.icerik.sorular.map((s, i) => i === idx ? { ...s, ...updates } : s);
    setSonuclar(prev => ({ ...prev, [aktifTab]: { ...sonuc, icerik: { ...sonuc.icerik!, sorular } } }));
  }

  function soruSil(idx: number) {
    const sonuc = sonuclar[aktifTab];
    if (!sonuc?.icerik) return;
    const sorular = sonuc.icerik.sorular.filter((_, i) => i !== idx);
    setSonuclar(prev => ({ ...prev, [aktifTab]: { ...sonuc, icerik: { ...sonuc.icerik!, sorular } } }));
  }

  function soruEkle() {
    const sonuc = sonuclar[aktifTab];
    if (!sonuc?.icerik) return;
    const yeni: Soru = { question: '', options: ['', '', '', ''], answer: '' };
    setSonuclar(prev => ({
      ...prev,
      [aktifTab]: { ...sonuc, icerik: { ...sonuc.icerik!, sorular: [...sonuc.icerik!.sorular, yeni] } },
    }));
  }

  function tabDegistir(id: TabId) {
    setAktifTab(id);
    setHata('');
    setResimli(false);
    setDuzenlemeModuAktif(false);
    if (freemium) setSoruSayisi(5);
  }

  function sonucuSil(tabId: TabId) {
    setSonuclar(prev => { const next = { ...prev }; delete next[tabId]; return next; });
    setDuzenlemeModuAktif(false);
  }

  function kopyala() {
    const sonuc = sonuclar[aktifTab];
    const metin = sonuc?.metin || JSON.stringify(sonuc?.icerik, null, 2);
    if (metin) {
      navigator.clipboard.writeText(metin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }
  }

  async function wordIndir() {
    if (!kaynak) {
      setHata('Önce kaynak seçin.');
      return;
    }
    try {
      const res = await aiApi.post('/api/ai/icerik-uret', {
        tip: aktifTab,
        soruSayisi,
        duzey: kaynak.seviye,
        uniteId: kaynak.uniteId,
        kitapTuru: kaynak.kitapTuru,
        yonergeDili: yonergeDili || undefined,
        girdi: girdi || undefined,
        resimli,
        ciktiFormati: 'word',
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calisma-kagidi-${kaynak?.seviye || 'AI'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setHata(e instanceof Error ? e.message : 'İndirme hatası');
    }
  }

  const kaydetMutation = useMutation({
    mutationFn: async (tabId: TabId) => {
      const sonuc = sonuclar[tabId];
      if (!sonuc?.icerik?.sorular?.length) throw new Error('Önce içerik üretin.');
      const sorular = sonuc.icerik.sorular.map(s => ({
        question: s.question ?? s.description ?? '',
        options: s.options ?? [s.kelime1, s.kelime2, s.kelime3, s.kelime4].filter(Boolean) as string[],
        answer: s.answer ?? s.kelime1 ?? '',
        imageId: s.image_id ?? undefined,
      }));
      return api.post('/api/ai/sinifa-kaydet', {
        tip: tabId,
        uniteId: kaynak?.uniteId,
        duzey: kaynak?.seviye,
        baslik: sonuc.icerik.baslik ?? undefined,
        sorular,
      }).then(r => r.data);
    },
    onSuccess: (data: { etkinlikId: string }, tabId: TabId) => {
      setKaydedildi(prev => ({ ...prev, [tabId]: data.etkinlikId }));
      setKaydetHata('');
      setTimeout(() => setKaydedildi(prev => {
        const next = { ...prev };
        delete next[tabId];
        return next;
      }), 5000);
    },
    onError: (e: Error) => setKaydetHata(e.message),
  });

  async function hemenKahootBaslat() {
    const tab = aktifTab;
    try {
      // Eğer bu sekme zaten kaydedildiyse, o etkinlikId'yi kullan
      const etkinlikId = kaydedildi[tab] ?? (await kaydetMutation.mutateAsync(tab)).etkinlikId;
      setModalEtkinlikId(etkinlikId);
      setModalAcik(true);
    } catch (e) {
      setKaydetHata(e instanceof Error ? e.message : 'Bir hata oluştu');
    }
  }

  const mevcutSonuc = sonuclar[aktifTab];
  const mevcutKaydedildi = kaydedildi[aktifTab] ?? null;
  const varSonuc = !!(mevcutSonuc?.icerik || mevcutSonuc?.metin);
  const uretimTabAktif = aktifTab !== 'bulten' && aktifTab !== 'pdf_import';
  const canKaydet = uretimTabAktif && !!kaynak?.uniteId && !!mevcutSonuc?.icerik?.sorular?.length && !mevcutKaydedildi;

  const canUret = aktifTab === 'bulten'
    ? !!bultenSinifId && (bultenKapsam === 'sinif' ? true : !!bultenOgrenciId)
    : aktifTab === 'pdf_import'
      ? false
      : !!kaynak?.uniteId;

  if (!ready) return (
    <div className="py-24 flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="bg-[#F3F4F6]">
      <main className="px-4 py-8">
        {/* Tab bar */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-1 mb-4">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  tabDegistir(id);
                  if (id === 'kahoot') setKahootSubTab('uret');
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-1.5 sm:px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  aktifTab === id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
                title={label}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{label}</span>
                {sonuclar[id] && aktifTab !== id && (
                  <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Kahoot sub-tabs */}
        {aktifTab === 'kahoot' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setKahootSubTab('uret')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                kahootSubTab === 'uret'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              <Sparkles className="size-4" />
              ✨ Yeni Üret
            </button>
            <button
              onClick={() => setKahootSubTab('havuz')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                kahootSubTab === 'havuz'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              📚 Soru Havuzu
            </button>
          </div>
        )}

        {/* Yakında kartları — tanıtım amaçlı, tıklanamaz */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <YakindaKart
            icon={FileText}
            baslik="Çalışma Kağıdı"
            aciklama="Karma sorular — Word (.docx) export destekli"
          />
          <YakindaKart
            icon={MessageSquare}
            baslik="Konuşma Egzersizi"
            aciklama="Diyalog, kelimeler ve anlama soruları"
          />
        </div>

        {/* Kredi göstergesi */}
        {krediData && (
          krediData.sinirsiz ? (
            <div className="flex items-center gap-2 mb-3 text-xs">
              <span className="text-emerald-600 font-medium">AI Kredisi: ∞ Sınırsız</span>
              {krediData.aylikHarcama != null && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  ~${krediData.aylikHarcama.toFixed(2)} bu ay
                </span>
              )}
            </div>
          ) : (krediData.kalan != null && krediData.toplam != null && (
            <div className={cn(
              'text-xs mb-3',
              krediData.kalan > 5
                ? 'text-slate-400'
                : krediData.kalan > 0
                  ? 'text-amber-500'
                  : 'text-red-500'
            )}>
              AI Kredisi (aylık): {krediData.kalan} / {krediData.toplam} — her ay yenilenir
            </div>
          ))
        )}

        {/* Lockout banner */}
        {limitAsili && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4 text-sm">
            <p className="font-medium text-red-700 mb-1">
              AI deneme krediniz doldu.
            </p>
            <p className="text-slate-500 mb-3">
              Etkinlik üretmeye devam etmek için lisans alın veya
              okulunuz / kurumunuzla iletişime geçin.
            </p>
            <a
              href="mailto:info@turkceokulu.com?subject=AI%20Lisans%20Talebi"
              className="inline-flex items-center gap-1 text-primary underline underline-offset-2 text-xs font-medium"
            >
              Lisans Hakkında Bilgi Al →
            </a>
          </div>
        )}

        {/* Kahoot havuz view — full width */}
        {aktifTab === 'kahoot' && kahootSubTab === 'havuz' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <KahootHavuz
              onBaslat={(etkinlikId) => {
                setModalEtkinlikId(etkinlikId);
                setModalAcik(true);
              }}
            />
          </div>
        )}

        {/* Normal grid layout — form + result (for uret tab or other tabs) */}
        {!(aktifTab === 'kahoot' && kahootSubTab === 'havuz') && (
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 items-start">
            {/* Form panel */}
            <div className={cn(
              'bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5',
              aktifTab === 'pdf_import' && 'md:col-span-2',
            )}>
            <p className="text-xs font-medium text-slate-400">
              {TABS.find(t => t.id === aktifTab)?.aciklama}
            </p>

            {/* Kaynak seçici — üretim gerektiren tüm sekmelerde zorunlu */}
            {uretimTabAktif && (
              <KaynakSecici secim={kaynak} onChange={setKaynak} />
            )}

            {aktifTab === 'bulten' ? (
              <BultenForm
                siniflar={siniflar}
                seciliSinifId={bultenSinifId}
                onChange={setBultenSinifId}
                kapsam={bultenKapsam}
                onKapsamChange={setBultenKapsam}
                ogrenciler={bultenOgrenciler}
                seciliOgrenciId={bultenOgrenciId}
                onOgrenciChange={setBultenOgrenciId}
                periyot={bultenPeriyot}
                onPeriyotChange={setBultenPeriyot}
              />
            ) : aktifTab === 'pdf_import' ? (
              <MdImport />
            ) : (
              <IcerikForm
                girdi={girdi}
                soruSayisi={soruSayisi}
                yonergeDili={yonergeDili}
                resimli={resimli}
                showResimliToggle={aktifTab === 'quiz' || aktifTab === 'eslestir'}
                freemium={freemium}
                onGirdi={setGirdi}
                onSoruSayisi={setSoruSayisi}
                onYonergeDili={setYonergeDili}
                onResimli={setResimli}
              />
            )}

            {aktifTab !== 'pdf_import' && (
              <button
                onClick={() => uretMutation.mutate()}
                disabled={!canUret || uretMutation.isPending || limitAsili}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors text-sm"
              >
                {uretMutation.isPending
                  ? <><Loader2 className="size-4 animate-spin" />Üretiliyor...</>
                  : <><Sparkles className="size-4" />Üret</>}
              </button>
            )}
          </div>

          {/* Sonuç panel */}
          {aktifTab !== 'pdf_import' && <div>
            {hata && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                {hata}
              </div>
            )}

            {uretMutation.isPending && <SkeletonLoader />}

            {!uretMutation.isPending && varSonuc && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">Üretilen İçerik</h2>
                    {kaynak?.uniteAdi && (
                      <p className="text-xs text-primary mt-0.5">
                        Kaynak: {kaynak.uniteAdi}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    {uretimTabAktif && mevcutSonuc?.icerik && (
                      <button
                        onClick={() => setDuzenlemeModuAktif(p => !p)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                          duzenlemeModuAktif
                            ? 'bg-primary text-white border-primary'
                            : 'border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40',
                        )}
                      >
                        {duzenlemeModuAktif
                          ? <><Check className="size-3.5" />Bitti</>
                          : <><PenLine className="size-3.5" />Düzenle</>}
                      </button>
                    )}
                    <button
                      onClick={kopyala}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      {kopyalandi
                        ? <><Check className="size-3.5 text-emerald-500" />Kopyalandı!</>
                        : <><Copy className="size-3.5" />Kopyala</>}
                    </button>
                    {uretimTabAktif && mevcutSonuc?.icerik && !!kaynak?.uniteId && (
                      <button
                        onClick={wordIndir}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        <Download className="size-3.5" />
                        Word İndir
                      </button>
                    )}
                    {uretimTabAktif && mevcutSonuc?.icerik?.sorular?.length && !mevcutKaydedildi && (
                      <button
                        onClick={() => kaydetMutation.mutate(aktifTab)}
                        disabled={kaydetMutation.isPending || !canKaydet}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
                        title={!kaynak?.uniteId ? 'Önce kaynak ünite seçin' : 'Kütüphaneye kaydet'}
                      >
                        {kaydetMutation.isPending
                          ? <><Loader2 className="size-3.5 animate-spin" />Kaydediliyor...</>
                          : <><Save className="size-3.5" />Kütüphaneye Kaydet</>}
                      </button>
                    )}
                    {aktifTab === 'kahoot' && (mevcutKaydedildi || mevcutSonuc?.icerik?.sorular?.length) && (
                      <button
                        onClick={hemenKahootBaslat}
                        disabled={kaydetMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-40"
                      >
                        {kaydetMutation.isPending
                          ? <><Loader2 className="size-4 animate-spin" />Kaydediliyor...</>
                          : <>▶ Hemen Kahoot Başlat</>}
                      </button>
                    )}
                    <button
                      onClick={() => sonucuSil(aktifTab)}
                      title="Sonucu temizle"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* AI uyarısı */}
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4">
                  <AlertTriangle className="size-3.5 mt-0.5 shrink-0 text-amber-500" />
                  <span>Bu içerik yapay zeka tarafından oluşturulmuştur. Sınıfa eklemeden önce doğruluğunu kontrol edin.</span>
                </div>

                {/* Kaydet başarı mesajı */}
                {mevcutKaydedildi && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-4">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>İçerik kütüphaneye kaydedildi. Sınıf sayfanızdan atayabilir veya Kahoot havuzundan başlatabilirsiniz.</span>
                  </div>
                )}
                {kaydetHata && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    {kaydetHata}
                  </div>
                )}

                {mevcutSonuc?.metin ? (
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                    {mevcutSonuc.metin}
                  </pre>
                ) : mevcutSonuc?.icerik ? (
                  duzenlemeModuAktif ? (
                    <SorularDuzenleyici
                      sonuc={mevcutSonuc.icerik}
                      tabId={aktifTab}
                      onGuncelle={soruGuncelle}
                      onSil={soruSil}
                      onEkle={soruEkle}
                    />
                  ) : (
                    <SonucKartlari sonuc={mevcutSonuc.icerik} resimUrls={mevcutSonuc.resimUrls} />
                  )
                ) : null}
              </div>
            )}

            {!uretMutation.isPending && !varSonuc && !hata && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <Sparkles className="size-12 mb-3" />
                <p className="text-sm">Üretilen içerik burada görünecek</p>
              </div>
            )}
          </div>}
        </div>
        )}

        {/* Modal ve Havuz */}
        {modalEtkinlikId && (
          <KahootBaslatModal
            etkinlikId={modalEtkinlikId}
            acik={modalAcik}
            onKapat={() => {
              setModalAcik(false);
              setModalEtkinlikId(null);
            }}
          />
        )}

        {/* Geçmiş kütüphanesi */}
        {(gecmisData?.liste?.length ?? 0) > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <History className="size-5 text-slate-400" />
              <h2 className="font-semibold text-slate-700">Üretim Geçmişi</h2>
              <span className="text-xs text-slate-400 ml-1">({gecmisData!.toplam} kayıt)</span>
            </div>
            <div className="space-y-6">
              {/* Kütüphanem (Onaylı) */}
              {(() => {
                const kutuphanem = gecmisData!.liste.filter(g => g.onaylandi).sort((a, b) =>
                  new Date(b.insertDate).getTime() - new Date(a.insertDate).getTime()
                );
                return kutuphanem.length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-600 text-sm mb-2 flex items-center gap-1.5">
                      <span>📁 Kütüphanem</span>
                      <span className="text-xs text-slate-400">({kutuphanem.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {kutuphanem.map(item => (
                        <GecmisKart
                          key={item.id}
                          item={item}
                          onSil={() => silMutation.mutate(item.id)}
                          onOnayla={() => onaylaMutation.mutate(item.id)}
                          silIsPending={silMutation.isPending}
                          onaylaIsPending={onaylaMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Son Üretimler (Onay Bekliyor) */}
              {(() => {
                const sonUretimler = gecmisData!.liste.filter(g => !g.onaylandi).sort((a, b) =>
                  new Date(b.insertDate).getTime() - new Date(a.insertDate).getTime()
                );
                return sonUretimler.length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-600 text-sm mb-2 flex items-center gap-1.5">
                      <span>🕐 Son Üretimler</span>
                      <span className="text-xs text-slate-400">({sonUretimler.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {sonUretimler.map(item => (
                        <GecmisKart
                          key={item.id}
                          item={item}
                          onSil={() => silMutation.mutate(item.id)}
                          onOnayla={() => onaylaMutation.mutate(item.id)}
                          silIsPending={silMutation.isPending}
                          onaylaIsPending={onaylaMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}
      </main>
      <HelpChat />
    </div>
  );
}

// ── Alt bileşenler ────────────────────────────────────────────────────────────

function IcerikForm({
  girdi, soruSayisi, yonergeDili, resimli, showResimliToggle, freemium,
  onGirdi, onSoruSayisi, onYonergeDili, onResimli,
}: {
  girdi: string; soruSayisi: number;
  yonergeDili: '' | 'EN' | 'AR' | 'RU'; resimli: boolean; showResimliToggle: boolean; freemium: boolean;
  onGirdi: (v: string) => void; onSoruSayisi: (v: number) => void;
  onYonergeDili: (v: '' | 'EN' | 'AR' | 'RU') => void; onResimli: (v: boolean) => void;
}) {
  const [ilhamAcik, setIlhamAcik] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Yönetmen Talimatı <span className="normal-case font-normal">(isteğe bağlı)</span>
        </label>
        <textarea
          value={girdi}
          onChange={e => onGirdi(e.target.value)}
          placeholder="Örn: Sadece fiil çekimlerine odaklan, yanlış şıklara neden yanlış olduklarını İngilizce ekle."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <button
          type="button"
          onClick={() => setIlhamAcik(v => !v)}
          className="text-[11px] text-slate-400 hover:text-primary transition-colors mt-1"
        >
          {ilhamAcik ? 'Kapat' : '+ İlham Al'}
        </button>
        {ilhamAcik && (
          <div className="mt-2 space-y-2.5 border border-slate-100 rounded-xl p-3 bg-slate-50">
            {ORNEK_YONERGELER.map(grup => (
              <div key={grup.kategori}>
                <p className="text-[10px] font-semibold text-slate-400 mb-1.5">{grup.kategori}</p>
                <div className="flex flex-wrap gap-1.5">
                  {grup.ornekler.map(ornek => (
                    <button
                      key={ornek}
                      type="button"
                      onClick={() => {
                        onGirdi(girdi.trim() ? girdi.trim() + '\n' + ornek : ornek);
                        setIlhamAcik(false);
                      }}
                      className="px-2 py-1 rounded-md text-[11px] bg-white border border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors text-left leading-tight"
                    >
                      {ornek}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Soru Sayısı
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {SORU_SAYILARI.map(n => {
            const kilitli = freemium && n !== 5;
            return (
              <button
                key={n}
                disabled={kilitli}
                onClick={() => !kilitli && onSoruSayisi(n)}
                title={kilitli ? 'Sadece Premium' : undefined}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors relative',
                  soruSayisi === n
                    ? 'bg-primary text-white border-primary'
                    : kilitli
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40',
                )}
              >
                {n}
                {kilitli && <Lock className="size-2.5 absolute -top-1 -right-1 text-amber-500" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Soru yönergeleri hangi dilde olsun?
        </label>
        <select
          value={yonergeDili}
          onChange={e => onYonergeDili(e.target.value as '' | 'EN' | 'AR' | 'RU')}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Sadece Türkçe</option>
          <option value="EN">Türkçe + İngilizce</option>
          <option value="AR">Türkçe + Arapça</option>
          <option value="RU">Türkçe + Rusça</option>
        </select>
      </div>

      {showResimliToggle && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={resimli}
              onChange={e => onResimli(e.target.checked)}
              className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30"
            />
            <span className="text-sm font-medium text-slate-700">Resimli Üret</span>
          </label>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Sorular ünitedeki gerçek görsellerle ilişkilendirilir.
          </p>
        </div>
      )}
    </div>
  );
}

interface BultenOgrenci {
  userId: number;
  ad: string;
}

function BultenForm({
  siniflar, seciliSinifId, onChange,
  kapsam, onKapsamChange,
  ogrenciler, seciliOgrenciId, onOgrenciChange,
  periyot, onPeriyotChange,
}: {
  siniflar: Sinif[]; seciliSinifId: number | '';
  onChange: (v: number | '') => void;
  kapsam: 'sinif' | 'ogrenci';
  onKapsamChange: (v: 'sinif' | 'ogrenci') => void;
  ogrenciler: BultenOgrenci[];
  seciliOgrenciId: number | '';
  onOgrenciChange: (v: number | '') => void;
  periyot: 'haftalik' | 'donemlik';
  onPeriyotChange: (v: 'haftalik' | 'donemlik') => void;
}) {
  return (
    <div className="space-y-4">
      {/* Sınıf Seçimi */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Sınıf
        </label>
        {siniflar.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Henüz sınıf oluşturmadınız.</p>
        ) : (
          <select
            value={seciliSinifId}
            onChange={e => {
              onChange(e.target.value ? Number(e.target.value) : '');
              onOgrenciChange('');
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            <option value="">Sınıf seçin...</option>
            {siniflar.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* Kapsam Segmenti */}
      {seciliSinifId && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Kapsam
          </label>
          <div className="flex gap-2">
            {(['sinif', 'ogrenci'] as const).map(k => (
              <button
                key={k}
                onClick={() => {
                  onKapsamChange(k);
                  if (k === 'sinif') onOgrenciChange('');
                }}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border',
                  kapsam === k
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40',
                )}
              >
                {k === 'sinif' ? 'Tüm Sınıf Özeti' : 'Tek Öğrenci'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Öğrenci Seçimi (sadece öğrenci modunda) */}
      {seciliSinifId && kapsam === 'ogrenci' && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Öğrenci
          </label>
          {ogrenciler.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Bu sınıfta öğrenci bulunmuyor.</p>
          ) : (
            <select
              value={seciliOgrenciId}
              onChange={e => onOgrenciChange(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">Öğrenci seçin...</option>
              {ogrenciler.map(o => <option key={o.userId} value={o.userId}>{o.ad}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Periyot Segmenti */}
      {seciliSinifId && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Periyot
          </label>
          <div className="flex gap-2">
            {(['haftalik', 'donemlik'] as const).map(p => (
              <button
                key={p}
                onClick={() => onPeriyotChange(p)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border',
                  periyot === p
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40',
                )}
              >
                {p === 'haftalik' ? 'Haftalık' : 'Dönemlik'}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 leading-relaxed">
        Seçili sınıfın aktivite verilerine göre velilere gönderilecek bülten oluşturulur.
      </p>
    </div>
  );
}

function SonucKartlari({ sonuc, resimUrls }: { sonuc: IcerikSonuc; resimUrls?: string[] }) {
  const harfler = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-4">
      {sonuc.baslik && (
        <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">
          {sonuc.baslik}
        </h3>
      )}
      {sonuc.sorular.map((soru, i) => {
        // Yeni format öncelikli, eski format fallback
        const soruMetni = soru.question ?? soru.description ?? '';
        const dogruCevap = soru.answer ?? soru.kelime1 ?? '';
        const seçenekler: string[] = soru.options?.length
          ? soru.options
          : [soru.kelime1, soru.kelime2, soru.kelime3, soru.kelime4].filter(Boolean) as string[];
        // imageUrl DB'den göreli ResimLink gelir (/Medya/...) — R2 CDN prefix'i şart
        const resimUrl = (soru.imageUrl ? toMediaUrl(soru.imageUrl) : null) ?? resimUrls?.[i];
        const hasImage = !!resimUrl;

        return (
          <div key={i} className={cn('bg-slate-50 rounded-xl p-4', hasImage && 'flex gap-3 items-start')}>
            {resimUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resimUrl} alt="" className="w-24 h-24 object-cover rounded-lg shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 mb-3">
                <span className="text-primary mr-1.5">{i + 1}.</span>
                {soruMetni}
              </p>

              {/* Seçenekler */}
              {!hasImage && seçenekler.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {seçenekler.map((opt, j) => (
                    <div
                      key={j}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs border',
                        opt === dogruCevap || j === 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                          : 'bg-white border-slate-200 text-slate-600',
                      )}
                    >
                      <span className="font-semibold mr-1">{harfler[j]})</span>
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {hasImage && (
                <span className="inline-block px-3 py-1 rounded-lg text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium mb-3">
                  {dogruCevap}
                </span>
              )}

              {/* İpucu */}
              {soru.hint && (
                <div className="flex items-start gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-2">
                  <span className="shrink-0">💡</span>
                  <span>{soru.hint}</span>
                </div>
              )}

              {/* Açıklama */}
              {soru.explanation && (
                <div className="flex items-start gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <span className="shrink-0">📖</span>
                  <span>{soru.explanation}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SorularDuzenleyici({
  sonuc, tabId, onGuncelle, onSil, onEkle,
}: {
  sonuc: IcerikSonuc;
  tabId: TabId;
  onGuncelle: (idx: number, updates: Partial<Soru>) => void;
  onSil: (idx: number) => void;
  onEkle: () => void;
}) {
  const distractorCount = tabId === 'quiz' || tabId === 'kahoot' ? 3 : tabId === 'eslestir' ? 2 : 0;

  return (
    <div className="space-y-3">
      {sonuc.sorular.map((soru, i) => {
        const soruMetni = soru.question ?? soru.description ?? '';
        const dogruCevap = soru.answer ?? soru.kelime1 ?? '';
        const allOpts = soru.options?.length
          ? soru.options
          : [soru.kelime2, soru.kelime3, soru.kelime4].filter(Boolean) as string[];
        const distractors = allOpts.filter(o => o !== dogruCevap).slice(0, distractorCount);
        while (distractors.length < distractorCount) distractors.push('');

        return (
          <SoruDuzenleyiciKart
            key={i}
            index={i}
            soruMetni={soruMetni}
            dogruCevap={dogruCevap}
            distractors={distractors}
            tabId={tabId}
            onGuncelle={(updates) => onGuncelle(i, updates)}
            onSil={() => onSil(i)}
          />
        );
      })}
      <button
        onClick={onEkle}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary transition-colors text-sm font-medium"
      >
        <Plus className="size-4" />
        Soru Ekle
      </button>
    </div>
  );
}

function SoruDuzenleyiciKart({
  index, soruMetni, dogruCevap, distractors, tabId, onGuncelle, onSil,
}: {
  index: number;
  soruMetni: string;
  dogruCevap: string;
  distractors: string[];
  tabId: TabId;
  onGuncelle: (updates: Partial<Soru>) => void;
  onSil: () => void;
}) {
  const questionLabel =
    tabId === 'eslestir' ? 'Sol taraf (Türkçe kelime/cümle)' :
    tabId === 'bosluk_doldur' ? 'Cümle (____ ile boşluğu gösterin)' :
    'Soru metni';
  const answerLabel =
    tabId === 'eslestir' ? 'Sağ taraf (doğru eşleşme)' :
    tabId === 'bosluk_doldur' ? 'Doğru cevap' :
    'Doğru cevap';

  function updateDistractor(dIdx: number, value: string) {
    const newDist = [...distractors];
    newDist[dIdx] = value;
    onGuncelle({
      question: soruMetni,
      answer: dogruCevap,
      options: [dogruCevap, ...newDist].filter(Boolean),
    });
  }

  function updateAnswer(value: string) {
    onGuncelle({
      answer: value,
      options: [value, ...distractors].filter(Boolean),
    });
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 group">
      <div className="flex items-start gap-2">
        <span className="text-primary font-semibold text-sm shrink-0 mt-2.5">{index + 1}.</span>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Soru metni */}
          <textarea
            value={soruMetni}
            onChange={e => onGuncelle({ question: e.target.value })}
            placeholder={questionLabel + '...'}
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none resize-none"
          />
          {/* Doğru cevap */}
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-full border-2 border-emerald-500 bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="size-3 text-emerald-600" />
            </span>
            <input
              value={dogruCevap}
              onChange={e => updateAnswer(e.target.value)}
              placeholder={answerLabel + '...'}
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 focus:ring-2 focus:ring-emerald-400/30 focus:outline-none text-emerald-900 font-medium"
            />
          </div>
          {/* Yanlış seçenekler */}
          {distractors.map((d, dIdx) => (
            <div key={dIdx} className="flex items-center gap-2">
              <span className="size-5 rounded-full border-2 border-slate-300 bg-white shrink-0" />
              <input
                value={d}
                onChange={e => updateDistractor(dIdx, e.target.value)}
                placeholder={`Yanlış seçenek ${dIdx + 1}...`}
                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <button
          onClick={onSil}
          title="Bu soruyu sil"
          className="p-1.5 rounded-lg text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0 mt-1 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function GecmisKart({
  item, onSil, onOnayla, silIsPending, onaylaIsPending,
}: {
  item: GecmisItem;
  onSil: () => void;
  onOnayla: () => void;
  silIsPending: boolean;
  onaylaIsPending: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const { data: detaylar, isLoading: detayYukleniyor } = useQuery<GecmisDetay[]>({
    queryKey: ['ai-detay', item.id],
    queryFn: () => api.get(`/api/ai/gecmis/${item.id}/detaylar`).then(r => r.data),
    enabled: acik,
  });

  const tarih = new Date(item.insertDate).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
      {/* Accordion başlığı — tek satır: Başlık · Ünite · Tarih */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAcik(v => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAcik(v => !v); } }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group text-left cursor-pointer"
      >
        {/* Chevron */}
        <div className="shrink-0">
          {acik ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
        </div>

        {/* İçerik: Başlık · Ünite · Tarih */}
        <div className="flex-1 min-w-0 text-sm text-slate-700">
          <span className="font-medium text-slate-900">{item.name}</span>
          <span className="text-slate-400 mx-2">·</span>
          <span className="text-slate-600">{item.unite}</span>
          <span className="text-slate-400 mx-2">·</span>
          <span className="text-slate-500">{tarih}</span>
        </div>

        {/* Sağ taraf butonlar: Onayla (if not onaylandi) + Sil */}
        <div className="shrink-0 flex items-center gap-1.5">
          {!item.onaylandi && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOnayla();
              }}
              disabled={onaylaIsPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
              title="Onayla"
            >
              {onaylaIsPending ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Onaylanıyor...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5" />
                  <span className="hidden sm:inline">Onayla</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSil();
            }}
            disabled={silIsPending}
            title="Sil"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Açılır detay paneli */}
      {acik && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50">
          {detayYukleniyor ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
              <Loader2 className="size-4 animate-spin" />
              Sorular yükleniyor...
            </div>
          ) : detaylar && detaylar.length > 0 ? (
            <>
              <div className="space-y-2 mb-4">
                {detaylar.map((d, i) => (
                  <div key={d.id} className={cn(
                    'flex items-start gap-3 px-3 py-2.5 rounded-lg border text-sm',
                    d.onaylandi
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-slate-200',
                  )}>
                    <span className="shrink-0 text-slate-400 font-medium w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800">{d.description}</p>
                      {d.kelime1 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {[d.kelime1, d.kelime2, d.kelime3, d.kelime4]
                            .filter(Boolean)
                            .map((k, j) => (
                              <span
                                key={j}
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs border font-medium',
                                  j === 0
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                    : 'bg-slate-100 border-slate-200 text-slate-600',
                                )}
                              >
                                {k}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    {d.onaylandi && <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />}
                  </div>
                ))}
              </div>
              {!item.onaylandi && (
                <button
                  onClick={onOnayla}
                  disabled={onaylaIsPending}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
                >
                  {onaylaIsPending
                    ? <><Loader2 className="size-4 animate-spin" />Onaylanıyor...</>
                    : <><ShieldCheck className="size-4" />Tümünü Onayla</>}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400 py-2">Soru bulunamadı.</p>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="h-5 w-40 rounded bg-slate-100 animate-pulse mb-5" />
      <div className="space-y-3">
        {[88, 72, 95, 65, 80, 60, 85, 70].map((w, i) => (
          <div
            key={i}
            className="h-3.5 rounded bg-slate-100 animate-pulse"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}
