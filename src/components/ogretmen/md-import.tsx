'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2, Save, Check, Trash2, FileText, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';

interface MdSoru {
  soru?: string;
  cevap?: string;
  secenekler?: string[];
  ciftSol?: string;
  ciftSag?: string;
}

interface MdEtkinlik {
  tip: string;
  baslik: string;
  sorular: MdSoru[];
}

interface MdBolum {
  baslik: string;
  metin: string;
  etkinlikler: MdEtkinlik[];
}

interface MdParseResult {
  kitapAdi: string;
  duzey: string;
  bolumler: MdBolum[];
}

interface KayitSonuc {
  toplam: number;
  etkinlikler: { etkinlikId: string; tip: string; baslik: string; soruSayisi: number }[];
}

interface UniteDto { id: string; name: string; }
interface KitapDto { id: string; name: string; }

const TIP_ETIKET: Record<string, string> = {
  OkuGec: '📖 Okuma',
  BoslukDoldurma: '✏️ Boşluk',
  DogruYanlis: '✓✗ D/Y',
  CoktanSecmeli: '🔘 Çoktan',
  KelimeleriEslestir: '🔗 Eşleştir',
};

function cacheKey(dosya: string) { return `md-cache:${dosya}`; }

function readCache(dosya: string): MdParseResult | null {
  try { return JSON.parse(localStorage.getItem(cacheKey(dosya)) ?? 'null'); }
  catch { return null; }
}

function writeCache(dosya: string, data: MdParseResult) {
  try { localStorage.setItem(cacheKey(dosya), JSON.stringify(data)); } catch { /* ignore */ }
}

function clearCache(dosya: string) {
  try { localStorage.removeItem(cacheKey(dosya)); } catch { /* ignore */ }
}

export function MdImport() {
  const [mdDosyaAdi, setMdDosyaAdi] = useState('cirkin-ordek-yavrusu.md');
  const [seciliKitapId, setSeciliKitapId] = useState('');
  const [seciliUniteId, setSeciliUniteId] = useState('');

  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [islemAdi, setIslemAdi] = useState('');
  const [hata, setHata] = useState('');
  const [kayitSonuc, setKayitSonuc] = useState<KayitSonuc | null>(null);

  const [cachedSonuc, setCachedSonuc] = useState<MdParseResult | null>(null);

  // Dosya adı değişince cache'i yükle
  useEffect(() => {
    setCachedSonuc(readCache(mdDosyaAdi));
    setKayitSonuc(null);
    setHata('');
  }, [mdDosyaAdi]);

  const { data: kitaplar = [] } = useQuery<KitapDto[]>({
    queryKey: ['derskitaplari'],
    queryFn: () => api.get('/api/derskitaplari').then(r => r.data),
  });

  const { data: uniteler = [] } = useQuery<UniteDto[]>({
    queryKey: ['uniteler', seciliKitapId],
    queryFn: () => api.get(`/api/uniteler/${seciliKitapId}`).then(r => r.data),
    enabled: !!seciliKitapId,
  });

  const toplamEtkinlik = cachedSonuc
    ? cachedSonuc.bolumler.reduce((acc, b) => acc + 1 + b.etkinlikler.length, 0)
    : 0;

  async function handleKaydet() {
    if (!seciliUniteId) { setHata('Lütfen ünite seçin'); return; }
    setIslemYapiliyor(true);
    setHata('');

    try {
      let sonuc = cachedSonuc;

      if (!sonuc) {
        setIslemAdi('Claude analiz ediyor (~60 sn)…');
        const { data } = await api.post('/api/ai/md-import', { mdDosyaAdi });
        sonuc = data as MdParseResult;
        writeCache(mdDosyaAdi, sonuc);
        setCachedSonuc(sonuc);
      }

      setIslemAdi('Kaydediliyor…');
      const { data } = await api.post('/api/ai/md-import/kaydet', {
        uniteId: seciliUniteId,
        duzey: sonuc.duzey ?? 'A1',
        bolumler: sonuc.bolumler,
      });
      setKayitSonuc(data as KayitSonuc);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data
        ?? (err instanceof Error ? err.message : 'İşlem başarısız');
      setHata(String(msg));
    } finally {
      setIslemYapiliyor(false);
      setIslemAdi('');
    }
  }

  async function handleSil() {
    if (!seciliUniteId) return;
    if (!confirm('Bu ünitedeki tüm Okuma Kitabı etkinlikleri silinecek. Emin misiniz?')) return;
    setIslemYapiliyor(true);
    setHata('');
    try {
      await api.delete(`/api/ai/md-import/unite-temizle/${seciliUniteId}`);
      setKayitSonuc(null);
    } catch {
      setHata('Silme başarısız');
    } finally {
      setIslemYapiliyor(false);
    }
  }

  function handleYenidenParse() {
    clearCache(mdDosyaAdi);
    setCachedSonuc(null);
    setKayitSonuc(null);
    setHata('');
  }

  const butonMetni = islemYapiliyor
    ? islemAdi
    : cachedSonuc
      ? `Bu üniteye kaydet (${toplamEtkinlik} etkinlik)`
      : 'Çözümle ve Kaydet';

  return (
    <div className="space-y-4">
      {/* MD dosyası */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">MD Dosya Adı</label>
        <div className="flex gap-2">
          <input
            value={mdDosyaAdi}
            onChange={e => setMdDosyaAdi(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
            placeholder="books/kitap-adi.md"
          />
          {cachedSonuc && (
            <button
              onClick={handleYenidenParse}
              title="Cache'i temizle, yeniden Claude'a gönder"
              className="px-3 py-2 border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cache bilgisi */}
      {cachedSonuc && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
          <Check className="size-3.5" />
          <span>
            <strong>{cachedSonuc.kitapAdi}</strong> cache'de —{' '}
            {cachedSonuc.bolumler.length} bölüm · {toplamEtkinlik} etkinlik
            <span className="text-muted-foreground ml-1">(Claude çağrısı yok)</span>
          </span>
        </div>
      )}

      {/* Kitap + Ünite seçimi */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Kitap</label>
          <select
            value={seciliKitapId}
            onChange={e => { setSeciliKitapId(e.target.value); setSeciliUniteId(''); }}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          >
            <option value="">Kitap seçin</option>
            {kitaplar.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Ünite</label>
          <select
            value={seciliUniteId}
            onChange={e => setSeciliUniteId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            disabled={!seciliKitapId}
          >
            <option value="">Ünite seçin</option>
            {uniteler.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Eylem butonları */}
      <div className="flex gap-2">
        <button
          onClick={handleKaydet}
          disabled={islemYapiliyor || !mdDosyaAdi || !seciliUniteId}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 text-sm"
        >
          {islemYapiliyor
            ? <Loader2 className="size-4 animate-spin" />
            : cachedSonuc
              ? <Save className="size-4" />
              : <FileText className="size-4" />}
          {butonMetni}
        </button>

        {seciliUniteId && (
          <button
            onClick={handleSil}
            disabled={islemYapiliyor}
            title="Bu ünitedeki Okuma Kitabı etkinliklerini sil"
            className="px-3 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {islemYapiliyor && islemAdi && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">{islemAdi}</p>
      )}

      {/* Hata */}
      {hata && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm border border-red-200">
          {hata}
        </div>
      )}

      {/* Kayıt sonucu */}
      {kayitSonuc && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 space-y-2">
          <p className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 text-sm">
            <Check className="size-4" /> {kayitSonuc.toplam} etkinlik oluşturuldu
          </p>
          <div className="flex flex-wrap gap-1.5">
            {kayitSonuc.etkinlikler.map(e => (
              <a
                key={e.etkinlikId}
                href={`/etkinlik/${e.etkinlikId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:underline"
              >
                {TIP_ETIKET[e.tip] ?? e.tip} — {e.baslik.slice(0, 28)}
              </a>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <BookOpen className="size-3" />
            Başka bir üniteye de kaydetmek için ünite değiştirip tekrar kaydet.
          </p>
        </div>
      )}
    </div>
  );
}
