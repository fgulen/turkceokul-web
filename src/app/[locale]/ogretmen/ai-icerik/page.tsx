'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sparkles, FileText, Copy, Check, Download,
  ListChecks, Shuffle, PenLine, MessageSquare, Newspaper,
  Loader2, AlertTriangle, BookOpen, X, Image as ImageIcon, Upload, Save,
  Trash2, Plus, History, Clock,
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SEVIYELER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SORU_SAYILARI = [5, 8, 10, 15, 20];
const KONULAR = [
  'Aile ve Ev', 'Yiyecek ve İçecek', 'Seyahat', 'İş Hayatı',
  'Eğitim', 'Sağlık', 'Alışveriş', 'Hava Durumu', 'Hobiler', 'Şehir Hayatı',
];

type TabId = 'quiz' | 'eslestir' | 'bosluk_doldur' | 'worksheet' | 'konusma' | 'bulten' | 'resim_analiz';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; aciklama: string }[] = [
  { id: 'quiz',          label: 'Quiz',              icon: ListChecks,    aciklama: 'Çoktan seçmeli quiz soruları' },
  { id: 'eslestir',      label: 'Eşleştirme',        icon: Shuffle,       aciklama: 'Kelime veya cümle eşleştirme aktivitesi' },
  { id: 'bosluk_doldur', label: 'Boşluk Doldur',     icon: PenLine,       aciklama: 'Boşluk doldurma alıştırmaları' },
  { id: 'worksheet',     label: 'Çalışma Kağıdı',    icon: FileText,      aciklama: 'Karma sorular — Word (.docx) export destekli' },
  { id: 'konusma',       label: 'Konuşma Egzersizi', icon: MessageSquare, aciklama: 'Diyalog, kelimeler ve anlama soruları' },
  { id: 'bulten',        label: 'Sınıf Bülteni',     icon: Newspaper,     aciklama: 'Sınıf istatistiklerine göre veli bülteni' },
  { id: 'resim_analiz',  label: 'Resimli',            icon: ImageIcon,     aciklama: 'Resim yükleyin — AI her biri için Türkçe açıklama ve kelime üretsin' },
];

interface PromptSablon {
  id: string;
  label: string;
  aciklama: string;
  ekPrompt: string;
  gizliTablar?: TabId[];
}

const PROMPT_SABLON: PromptSablon[] = [
  {
    id: 'ing_ceviri',
    label: '🇬🇧 İngilizce',
    aciklama: 'Her soruya parantez içinde İngilizce çeviri ekler',
    ekPrompt: 'Her soru veya seçeneğin yanına parantez içinde İngilizce karşılığını ekle.',
    gizliTablar: ['bulten', 'resim_analiz'],
  },
  {
    id: 'alm_ceviri',
    label: '🇩🇪 Almanca',
    aciklama: 'Her soruya parantez içinde Almanca çeviri ekler',
    ekPrompt: 'Her soru veya seçeneğin yanına parantez içinde Almanca karşılığını ekle.',
    gizliTablar: ['bulten', 'resim_analiz'],
  },
  {
    id: 'fransizca',
    label: '🇫🇷 Fransızca',
    aciklama: 'Parantez içinde Fransızca çeviri ekler',
    ekPrompt: 'Her soru veya seçeneğin yanına parantez içinde Fransızca karşılığını ekle.',
    gizliTablar: ['bulten', 'resim_analiz'],
  },
  {
    id: 'arapca',
    label: '🇸🇦 Arapça',
    aciklama: 'Parantez içinde Arapça çeviri ekler',
    ekPrompt: 'Her soru veya seçeneğin yanına parantez içinde Arapça karşılığını ekle.',
    gizliTablar: ['bulten', 'resim_analiz'],
  },
  {
    id: 'gramer',
    label: '📖 Gramer notu',
    aciklama: 'Her sorunun altına kısa gramer açıklaması ekler',
    ekPrompt: 'Her sorunun description alanının sonuna kısa bir gramer notu ekle (örn: "Not: -de/-da hal eki kullanılır").',
    gizliTablar: ['bulten', 'eslestir', 'resim_analiz'],
  },
  {
    id: 'kademeli',
    label: '📈 Kolay→Zor',
    aciklama: 'Sorular kolaydan zora doğru sıralanır',
    ekPrompt: 'Soruları zorluk sırasına göre düzenle: ilk sorular çok basit, sonrakiler giderek zorlaşsın.',
    gizliTablar: ['bulten', 'resim_analiz'],
  },
  {
    id: 'gunluk',
    label: '🏠 Günlük hayat',
    aciklama: 'Sorular gerçek hayat senaryolarına dayandırılır',
    ekPrompt: 'Soruları günlük hayattan somut senaryolara dayandır (alışveriş, yemek, seyahat, iş hayatı vb.).',
    gizliTablar: ['bulten'],
  },
  {
    id: 'kultur',
    label: '🇹🇷 Kültürel not',
    aciklama: 'Türk kültürüne kısa referanslar ekler',
    ekPrompt: 'Uygun sorularda Türk kültürüne, geleneklerine veya güncel yaşamına kısa bir referans ekle.',
    gizliTablar: ['bulten', 'resim_analiz'],
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
interface Kitap       { id: string; name: string; seviye?: string; }
interface UniteDto    { id: string; name: string; }
interface GecmisItem  {
  id: string; name: string; tip: string; unite: string;
  soruSayisi: number; insertDate: string; zorluk: number;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AIIcerikPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const [aktifTab, setAktifTab] = useState<TabId>('quiz');

  // Form state
  const [seviye, setSeviye] = useState('A1');
  const [girdi, setGirdi] = useState('');
  const [soruSayisi, setSoruSayisi] = useState(10);
  const [konu, setKonu] = useState('');
  const [seciliSinifId, setSeciliSinifId] = useState<number | ''>('');
  const [seciliSablonlar, setSeciliSablonlar] = useState<Set<string>>(new Set());

  // Pedagogy parametreleri
  const [supportLanguage, setSupportLanguage] = useState(''); // 'EN'|'DE'|'FR'|'AR'|''
  const [focusMode, setFocusMode] = useState('');             // 'Grammar'|'Culture'|'DailyLife'|'EasyToHard'|''

  // Kaynak ünite state
  const [seciliKitapId, setSeciliKitapId] = useState('');
  const [seciliUniteId, setSeciliUniteId] = useState('');
  const [seciliUniteAdi, setSeciliUniteAdi] = useState('');

  // Resim state
  const [resimDosyalari, setResimDosyalari] = useState<File[]>([]);
  const [resimOnizleme, setResimOnizleme] = useState<string[]>([]);
  const capturedResimUrls = useRef<string[]>([]);

  // Sonuçlar: sekme başına saklanır
  const [sonuclar, setSonuclar] = useState<Partial<Record<TabId, TabSonuc>>>({});
  const [kopyalandi, setKopyalandi] = useState(false);
  const [kaydedildi, setKaydedildi] = useState<string | null>(null); // etkinlikId
  const [kaydetHata, setKaydetHata] = useState('');
  const [hata, setHata] = useState('');
  const [duzenlemeModuAktif, setDuzenlemeModuAktif] = useState(false);

  const { data: siniflar = [] } = useQuery<Sinif[]>({
    queryKey: ['siniflarim'],
    queryFn: () => api.get('/api/ogretmen/siniflarim').then(r => r.data),
    enabled: !!user,
  });

  const { data: kitaplar = [] } = useQuery<Kitap[]>({
    queryKey: ['derskitaplari'],
    queryFn: () => api.get('/api/derskitaplari').then(r => r.data),
    enabled: !!user,
  });

  const { data: uniteler = [] } = useQuery<UniteDto[]>({
    queryKey: ['uniteler', seciliKitapId],
    queryFn: () => api.get(`/api/uniteler/${seciliKitapId}`).then(r => r.data),
    enabled: !!seciliKitapId,
  });

  const { data: gecmisData, refetch: gecmisYenile } = useQuery<{
    toplam: number; liste: GecmisItem[];
  }>({
    queryKey: ['ai-gecmis'],
    queryFn: () => api.get('/api/ai/gecmis?boyut=50').then(r => r.data),
    enabled: !!user,
  });

  const silMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/ai/gecmis/${id}`),
    onSuccess: () => gecmisYenile(),
  });

  const ekYonlendirme = PROMPT_SABLON
    .filter(s => seciliSablonlar.has(s.id))
    .map(s => s.ekPrompt)
    .join(' ');

  const uretMutation = useMutation({
    mutationFn: async () => {
      if (aktifTab === 'resim_analiz') {
        capturedResimUrls.current = [...resimOnizleme];
        const base64ler = await Promise.all(resimDosyalari.map(toBase64));
        const mediaTipleri = resimDosyalari.map(f => f.type || 'image/jpeg');
        return api.post('/api/ai/resim-analiz', {
          resimler: base64ler,
          mediaTipleri,
          duzey: seviye,
        }).then(r => r.data);
      }
      if (aktifTab === 'bulten')
        return api.post('/api/ai/sinif-bulteni', { sinifId: seciliSinifId }).then(r => r.data);
      if (aktifTab === 'konusma')
        return api.post('/api/ai/konusma-egzersizi', {
          seviye, konu, uniteId: seciliUniteId || undefined,
        }).then(r => r.data);
      return api.post('/api/ai/icerik-uret', {
        tip: aktifTab, girdi, soruSayisi, duzey: seviye,
        ciktiFormati: 'etkinlik',
        uniteId: seciliUniteId || undefined,
        ekYonlendirme: ekYonlendirme || undefined,
        supportLanguage: supportLanguage || undefined,
        focusMode: focusMode || undefined,
      }).then(r => r.data);
    },
    onSuccess: (data: unknown) => {
      setHata('');
      setDuzenlemeModuAktif(false);
      const tabId = aktifTab;
      const resimUrls = tabId === 'resim_analiz' ? capturedResimUrls.current : [];

      if (typeof data === 'object' && data !== null && 'icerik' in data) {
        setSonuclar(prev => ({ ...prev, [tabId]: { icerik: null, metin: (data as { icerik: string }).icerik, resimUrls } }));
      } else if (typeof data === 'object' && data !== null && 'sorular' in data) {
        setSonuclar(prev => ({ ...prev, [tabId]: { icerik: data as IcerikSonuc, metin: '', resimUrls } }));
      } else {
        setSonuclar(prev => ({ ...prev, [tabId]: { icerik: null, metin: JSON.stringify(data, null, 2), resimUrls } }));
      }
    },
    onError: (err: Error) => setHata(err.message || 'Bilinmeyen hata'),
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
    setSeciliSablonlar(new Set());
    setSupportLanguage('');
    setFocusMode('');
    setDuzenlemeModuAktif(false);
  }

  function kitapDegistir(kitapId: string) {
    setSeciliKitapId(kitapId);
    setSeciliUniteId('');
    setSeciliUniteAdi('');
  }

  function uniteDegistir(uniteId: string) {
    setSeciliUniteId(uniteId);
    const unite = uniteler.find(u => u.id === uniteId);
    setSeciliUniteAdi(unite?.name ?? '');
  }

  function uniteTemizle() {
    setSeciliKitapId('');
    setSeciliUniteId('');
    setSeciliUniteAdi('');
  }

  function sablonToggle(id: string) {
    setSeciliSablonlar(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
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
    try {
      const res = await api.post('/api/ai/icerik-uret', {
        tip: aktifTab, girdi, soruSayisi, duzey: seviye, ciktiFormati: 'word',
        uniteId: seciliUniteId || undefined,
        supportLanguage: supportLanguage || undefined,
        focusMode: focusMode || undefined,
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calisma-kagidi-${seviye}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setHata(e instanceof Error ? e.message : 'İndirme hatası');
    }
  }

  const kaydetMutation = useMutation({
    mutationFn: async () => {
      const sonuc = sonuclar[aktifTab];
      if (!sonuc?.icerik?.sorular?.length) throw new Error('Önce içerik üretin.');
      const sorular = sonuc.icerik.sorular.map(s => ({
        question: s.question ?? s.description ?? '',
        options: s.options ?? [s.kelime1, s.kelime2, s.kelime3, s.kelime4].filter(Boolean) as string[],
        answer: s.answer ?? s.kelime1 ?? '',
      }));
      return api.post('/api/ai/sinifa-kaydet', {
        tip: aktifTab,
        uniteId: seciliUniteId,
        duzey: seviye,
        baslik: sonuc.icerik.baslik ?? undefined,
        sorular,
      }).then(r => r.data);
    },
    onSuccess: (data: { etkinlikId: string }) => {
      setKaydedildi(data.etkinlikId);
      setKaydetHata('');
      setTimeout(() => setKaydedildi(null), 5000);
    },
    onError: (e: Error) => setKaydetHata(e.message),
  });

  const mevcutSonuc = sonuclar[aktifTab];
  const varSonuc = !!(mevcutSonuc?.icerik || mevcutSonuc?.metin);
  const jsonTabAktif = aktifTab !== 'konusma' && aktifTab !== 'bulten' && aktifTab !== 'resim_analiz';
  const kaynakTabAktif = aktifTab !== 'bulten' && aktifTab !== 'resim_analiz';
  const canKaydet = jsonTabAktif && !!seciliUniteId && !!mevcutSonuc?.icerik?.sorular?.length && !kaydedildi;

  const canUret = aktifTab === 'bulten'
    ? !!seciliSinifId
    : aktifTab === 'konusma'
      ? konu.trim().length > 0 || !!seciliUniteId
      : aktifTab === 'resim_analiz'
        ? resimDosyalari.length > 0
        : girdi.trim().length > 0 || !!seciliUniteId;

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />
      <main className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            AI İçerik Stüdyosu
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Claude AI ile saniyeler içinde Türkçe öğretim materyalleri üretin
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-slate-100 shadow-sm rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => tabDegistir(id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                aktifTab === id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              )}
            >
              <Icon className="size-4" />
              {label}
              {sonuclar[id] && aktifTab !== id && (
                <span className="size-1.5 rounded-full bg-emerald-400 ml-0.5" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-6 items-start">
          {/* Form panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <p className="text-xs font-medium text-slate-400">
              {TABS.find(t => t.id === aktifTab)?.aciklama}
            </p>

            {/* Kaynak ünite seçici */}
            {kaynakTabAktif && (
              <UniteKaynakSecici
                kitaplar={kitaplar}
                uniteler={uniteler}
                seciliKitapId={seciliKitapId}
                seciliUniteId={seciliUniteId}
                seciliUniteAdi={seciliUniteAdi}
                onKitap={kitapDegistir}
                onUnite={uniteDegistir}
                onTemizle={uniteTemizle}
              />
            )}

            {aktifTab === 'bulten' ? (
              <BultenForm
                siniflar={siniflar}
                seciliSinifId={seciliSinifId}
                onChange={setSeciliSinifId}
              />
            ) : aktifTab === 'konusma' ? (
              <KonusmaForm
                seviye={seviye}
                konu={konu}
                uniteSecili={!!seciliUniteId}
                onSeviye={setSeviye}
                onKonu={setKonu}
              />
            ) : aktifTab === 'resim_analiz' ? (
              <ResimYuklemeFormu
                seviye={seviye}
                dosyalar={resimDosyalari}
                onizlemeler={resimOnizleme}
                onSeviye={setSeviye}
                onDegisim={(d, o) => { setResimDosyalari(d); setResimOnizleme(o); }}
              />
            ) : (
              <IcerikForm
                seviye={seviye}
                girdi={girdi}
                soruSayisi={soruSayisi}
                uniteSecili={!!seciliUniteId}
                supportLanguage={supportLanguage}
                focusMode={focusMode}
                onSeviye={setSeviye}
                onGirdi={setGirdi}
                onSoruSayisi={setSoruSayisi}
                onSupportLanguage={setSupportLanguage}
                onFocusMode={setFocusMode}
              />
            )}

            {/* Ek yönlendirme şablonları — sadece metin tabları için */}
            {(aktifTab === 'konusma') && (
              <EkSecenekler
                tabId={aktifTab}
                secili={seciliSablonlar}
                onToggle={sablonToggle}
              />
            )}

            <button
              onClick={() => uretMutation.mutate()}
              disabled={!canUret || uretMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors text-sm"
            >
              {uretMutation.isPending
                ? <><Loader2 className="size-4 animate-spin" />Üretiliyor...</>
                : <><Sparkles className="size-4" />Üret</>}
            </button>
          </div>

          {/* Sonuç panel */}
          <div>
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
                    {seciliUniteAdi && (
                      <p className="text-xs text-primary mt-0.5">
                        Kaynak: {seciliUniteAdi}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    {jsonTabAktif && mevcutSonuc?.icerik && (
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
                    {jsonTabAktif && mevcutSonuc?.icerik && (
                      <button
                        onClick={wordIndir}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        <Download className="size-3.5" />
                        Word İndir
                      </button>
                    )}
                    {canKaydet && (
                      <button
                        onClick={() => kaydetMutation.mutate()}
                        disabled={kaydetMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                        title={`"${seciliUniteAdi}" ünitesine kaydet`}
                      >
                        {kaydetMutation.isPending
                          ? <><Loader2 className="size-3.5 animate-spin" />Kaydediliyor...</>
                          : <><Save className="size-3.5" />Üniteye Kaydet</>}
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
                {kaydedildi && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-4">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>İçerik üniteye kaydedildi! Öğrenci akışında görünecek.</span>
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
          </div>
        </div>

        {/* Geçmiş kütüphanesi */}
        {(gecmisData?.liste?.length ?? 0) > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <History className="size-5 text-slate-400" />
              <h2 className="font-semibold text-slate-700">Üretim Geçmişi</h2>
              <span className="text-xs text-slate-400 ml-1">({gecmisData!.toplam} kayıt)</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {gecmisData!.liste.map(item => (
                <GecmisKart
                  key={item.id}
                  item={item}
                  onSil={() => silMutation.mutate(item.id)}
                  silIsPending={silMutation.isPending}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ── Alt bileşenler ────────────────────────────────────────────────────────────

function UniteKaynakSecici({
  kitaplar, uniteler, seciliKitapId, seciliUniteId, seciliUniteAdi,
  onKitap, onUnite, onTemizle,
}: {
  kitaplar: Kitap[]; uniteler: UniteDto[];
  seciliKitapId: string; seciliUniteId: string; seciliUniteAdi: string;
  onKitap: (id: string) => void; onUnite: (id: string) => void; onTemizle: () => void;
}) {
  if (seciliUniteId) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/8 border border-primary/20 rounded-lg">
        <BookOpen className="size-3.5 text-primary shrink-0" />
        <span className="text-xs text-primary font-medium flex-1 min-w-0 truncate">{seciliUniteAdi}</span>
        <button onClick={onTemizle} className="text-primary/60 hover:text-primary transition-colors">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Kaynak Ünite <span className="normal-case font-normal">(isteğe bağlı)</span>
      </label>
      <select
        value={seciliKitapId}
        onChange={e => onKitap(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
      >
        <option value="">Kitap seçin...</option>
        {kitaplar.map(k => (
          <option key={k.id} value={k.id}>
            {k.name}{k.seviye ? ` (${k.seviye})` : ''}
          </option>
        ))}
      </select>
      {seciliKitapId && (
        <select
          value={seciliUniteId}
          onChange={e => onUnite(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Ünite seçin...</option>
          {uniteler.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function SeviyeSecici({ seviye, onSeviye }: { seviye: string; onSeviye: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        CEFR Seviyesi
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {SEVIYELER.map(s => (
          <button
            key={s}
            onClick={() => onSeviye(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              seviye === s
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40',
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

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

const SUPPORT_LANGS = [
  { code: 'EN', label: '🇬🇧 EN' },
  { code: 'DE', label: '🇩🇪 DE' },
  { code: 'FR', label: '🇫🇷 FR' },
  { code: 'AR', label: '🇸🇦 AR' },
];

const FOCUS_MODES = [
  { code: 'Grammar',    label: '📖 Gramer' },
  { code: 'Culture',    label: '🇹🇷 Kültür' },
  { code: 'DailyLife',  label: '🏠 Günlük' },
  { code: 'EasyToHard', label: '📈 Kolay→Zor' },
];

function IcerikForm({
  seviye, girdi, soruSayisi, uniteSecili, supportLanguage, focusMode,
  onSeviye, onGirdi, onSoruSayisi, onSupportLanguage, onFocusMode,
}: {
  seviye: string; girdi: string; soruSayisi: number; uniteSecili: boolean;
  supportLanguage: string; focusMode: string;
  onSeviye: (v: string) => void; onGirdi: (v: string) => void; onSoruSayisi: (v: number) => void;
  onSupportLanguage: (v: string) => void; onFocusMode: (v: string) => void;
}) {
  const [ilhamAcik, setIlhamAcik] = useState(false);

  return (
    <div className="space-y-4">
      <SeviyeSecici seviye={seviye} onSeviye={onSeviye} />
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Yönetmen Talimatı{uniteSecili && <span className="normal-case font-normal ml-1">(isteğe bağlı)</span>}
        </label>
        <textarea
          value={girdi}
          onChange={e => onGirdi(e.target.value)}
          placeholder={uniteSecili
            ? 'Örn: Sadece fiil çekimlerine odaklan, yanlış şıklara neden yanlış olduklarını İngilizce ekle.'
            : 'Örn: İstanbul turu senaryosu kur, ipuçlarını Almanca ver.'}
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
        <div className="flex gap-1.5">
          {SORU_SAYILARI.map(n => (
            <button
              key={n}
              onClick={() => onSoruSayisi(n)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                soruSayisi === n
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* İpucu Dili */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          İpucu Dili <span className="normal-case font-normal">(isteğe bağlı)</span>
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {SUPPORT_LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => onSupportLanguage(supportLanguage === l.code ? '' : l.code)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                supportLanguage === l.code
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Odak Modu */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Odak <span className="normal-case font-normal">(isteğe bağlı)</span>
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {FOCUS_MODES.map(f => (
            <button
              key={f.code}
              onClick={() => onFocusMode(focusMode === f.code ? '' : f.code)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                focusMode === f.code
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function KonusmaForm({
  seviye, konu, uniteSecili, onSeviye, onKonu,
}: {
  seviye: string; konu: string; uniteSecili: boolean;
  onSeviye: (v: string) => void; onKonu: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <SeviyeSecici seviye={seviye} onSeviye={onSeviye} />
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Konu{uniteSecili && <span className="normal-case font-normal ml-1">(isteğe bağlı)</span>}
        </label>
        <select
          value={KONULAR.includes(konu) ? konu : ''}
          onChange={e => onKonu(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Konu seçin...</option>
          {KONULAR.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <input
          type="text"
          value={konu}
          onChange={e => onKonu(e.target.value)}
          placeholder={uniteSecili ? 'veya kendi konunuzu yazın...' : 'veya kendi konunuzu yazın'}
          className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

function BultenForm({
  siniflar, seciliSinifId, onChange,
}: {
  siniflar: Sinif[]; seciliSinifId: number | '';
  onChange: (v: number | '') => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Sınıf
        </label>
        {siniflar.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Henüz sınıf oluşturmadınız.</p>
        ) : (
          <select
            value={seciliSinifId}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            <option value="">Sınıf seçin...</option>
            {siniflar.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        Seçili sınıfın aktivite verilerine göre velilere gönderilecek haftalık bülten oluşturulur.
      </p>
    </div>
  );
}

function ResimYuklemeFormu({
  seviye, dosyalar, onizlemeler, onSeviye, onDegisim,
}: {
  seviye: string;
  dosyalar: File[];
  onizlemeler: string[];
  onSeviye: (v: string) => void;
  onDegisim: (dosyalar: File[], onizlemeler: string[]) => void;
}) {
  const [surukleniyor, setSurukleniyor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX = 10;

  function dosyaEkle(liste: FileList | null) {
    if (!liste) return;
    const kalan = MAX - dosyalar.length;
    if (kalan <= 0) return;
    const yeniDosyalar = Array.from(liste)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, kalan);
    const yeniOnizlemeler = yeniDosyalar.map(f => URL.createObjectURL(f));
    onDegisim([...dosyalar, ...yeniDosyalar], [...onizlemeler, ...yeniOnizlemeler]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function resimSil(i: number) {
    onDegisim(dosyalar.filter((_, j) => j !== i), onizlemeler.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-4">
      <SeviyeSecici seviye={seviye} onSeviye={onSeviye} />

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Resimler{' '}
          <span className="normal-case font-normal">({dosyalar.length}/{MAX})</span>
        </label>

        {dosyalar.length < MAX && (
          <div
            onDragOver={e => { e.preventDefault(); setSurukleniyor(true); }}
            onDragLeave={() => setSurukleniyor(false)}
            onDrop={e => { e.preventDefault(); setSurukleniyor(false); dosyaEkle(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors',
              surukleniyor ? 'border-primary/60 bg-primary/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            <Upload className="size-5 mx-auto mb-1.5 text-slate-300" />
            <p className="text-xs text-slate-400">Sürükle veya tıkla</p>
            <p className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, WEBP</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => dosyaEkle(e.target.files)}
        />

        {onizlemeler.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {onizlemeler.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => resimSil(i)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white rounded px-1">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {dosyalar.length === 0 && (
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            AI her resim için ayrı bir Türkçe açıklama ve kelime üretir.
          </p>
        )}
      </div>
    </div>
  );
}

function EkSecenekler({
  tabId, secili, onToggle,
}: {
  tabId: TabId;
  secili: Set<string>;
  onToggle: (id: string) => void;
}) {
  const gorunur = PROMPT_SABLON.filter(s => !s.gizliTablar?.includes(tabId));
  if (gorunur.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Ek Yönlendirme
      </label>
      <div className="flex flex-wrap gap-1.5">
        {gorunur.map(s => (
          <button
            key={s.id}
            title={s.aciklama}
            onClick={() => onToggle(s.id)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
              secili.has(s.id)
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SonucKartlari({ sonuc, resimUrls }: { sonuc: IcerikSonuc; resimUrls?: string[] }) {
  const harfler = ['A', 'B', 'C', 'D'];
  const resimli = resimUrls && resimUrls.length > 0;

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

        return (
          <div key={i} className={cn('bg-slate-50 rounded-xl p-4', resimli && 'flex gap-3 items-start')}>
            {resimUrls?.[i] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resimUrls[i]} alt="" className="w-24 h-24 object-cover rounded-lg shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 mb-3">
                <span className="text-primary mr-1.5">{i + 1}.</span>
                {soruMetni}
              </p>

              {/* Seçenekler */}
              {!resimli && seçenekler.length > 0 && (
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

              {resimli && (
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
  const distractorCount = tabId === 'quiz' ? 3 : tabId === 'eslestir' ? 2 : 0;

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

const TIP_ETIKETLER: Record<string, { label: string; renk: string }> = {
  Quiz:             { label: 'Quiz',          renk: 'bg-blue-50 text-blue-700 border-blue-200' },
  KelimeleriEslestir: { label: 'Eşleştirme', renk: 'bg-purple-50 text-purple-700 border-purple-200' },
  BoslukDoldurma:   { label: 'Boşluk Doldur', renk: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function GecmisKart({
  item, onSil, silIsPending,
}: {
  item: GecmisItem;
  onSil: () => void;
  silIsPending: boolean;
}) {
  const etiket = TIP_ETIKETLER[item.tip] ?? { label: item.tip, renk: 'bg-slate-50 text-slate-600 border-slate-200' };
  const tarih = new Date(item.insertDate).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const seviyeMetin = item.zorluk === 1 ? 'A1–A2' : item.zorluk === 2 ? 'B1–B2' : 'C1–C2';

  return (
    <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className={cn('shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full border', etiket.renk)}>
        {etiket.label}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{item.unite}</p>
      </div>
      <div className="shrink-0 flex items-center gap-3 text-xs text-slate-400">
        <span className="hidden sm:inline">{item.soruSayisi} soru</span>
        <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">{seviyeMetin}</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {tarih}
        </span>
      </div>
      <button
        onClick={onSil}
        disabled={silIsPending}
        title="Sil"
        className="shrink-0 p-1.5 rounded-lg text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
      >
        <Trash2 className="size-4" />
      </button>
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
