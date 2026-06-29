'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Loader2, Check, RotateCcw, FileText, ExternalLink } from 'lucide-react';
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

interface KitapOlusturSonuc {
  kitapId: string;
  kitapAdi?: string;
  bolumSayisi: number;
  etkinlikSayisi: number;
  mesaj?: string;
}

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
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [islemAdi, setIslemAdi] = useState('');
  const [hata, setHata] = useState('');
  const [kayitSonuc, setKayitSonuc] = useState<KitapOlusturSonuc | null>(null);
  const [cachedSonuc, setCachedSonuc] = useState<MdParseResult | null>(null);
  const [kitapAdi, setKitapAdi] = useState('');
  const [yazar, setYazar] = useState('');
  const [seviye, setSeviye] = useState('');

  // Dosya adı değişince cache'i yükle
  useEffect(() => {
    const cached = readCache(mdDosyaAdi);
    setCachedSonuc(cached);
    if (cached) {
      setKitapAdi(cached.kitapAdi ?? '');
      setYazar('');
      setSeviye(cached.duzey ?? '');
    }
    setKayitSonuc(null);
    setHata('');
  }, [mdDosyaAdi]);

  const toplamEtkinlik = cachedSonuc
    ? cachedSonuc.bolumler.reduce((acc, b) => acc + b.etkinlikler.length, 0)
    : 0;

  // Adım 1: MD dosyasını Claude'a gönder, parse et, cache'e yaz
  async function handleCozumle() {
    setIslemYapiliyor(true);
    setIslemAdi('Claude analiz ediyor (~60 sn)…');
    setHata('');
    try {
      const { data } = await api.post('/api/ai/md-import', { mdDosyaAdi });
      const sonuc = data as MdParseResult;
      writeCache(mdDosyaAdi, sonuc);
      setCachedSonuc(sonuc);
      setKitapAdi(sonuc.kitapAdi ?? '');
      setYazar('');
      setSeviye(sonuc.duzey ?? '');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data
        ?? (err instanceof Error ? err.message : 'İşlem başarısız');
      setHata(String(msg));
    } finally {
      setIslemYapiliyor(false);
      setIslemAdi('');
    }
  }

  // Adım 2: Parse sonucunu kitap-olustur endpoint'ine gönder
  async function handleKitapOlustur() {
    if (!cachedSonuc) return;
    setIslemYapiliyor(true);
    setIslemAdi('Kitap oluşturuluyor…');
    setHata('');
    try {
      const { data } = await api.post('/api/ai/md-import/kitap-olustur', {
        kitapAdi: kitapAdi || cachedSonuc.kitapAdi,
        yazar: yazar || '',
        seviye: seviye || cachedSonuc.duzey || '',
        bolumler: cachedSonuc.bolumler.map(b => ({
          baslik: b.baslik,
          metin: b.metin,
          etkinlikler: b.etkinlikler,
        })),
      });
      setKayitSonuc(data as KitapOlusturSonuc);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data
        ?? (err instanceof Error ? err.message : 'İşlem başarısız');
      setHata(String(msg));
    } finally {
      setIslemYapiliyor(false);
      setIslemAdi('');
    }
  }

  function handleYenidenParse() {
    clearCache(mdDosyaAdi);
    setCachedSonuc(null);
    setKayitSonuc(null);
    setHata('');
  }

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
            <strong>{cachedSonuc.kitapAdi}</strong> cache&apos;de —{' '}
            {cachedSonuc.bolumler.length} bölüm · {toplamEtkinlik} etkinlik
            <span className="text-muted-foreground ml-1">(Claude çağrısı yok)</span>
          </span>
        </div>
      )}

      {/* Adım 1: Çözümle — cache yoksa */}
      {!cachedSonuc && !kayitSonuc && (
        <button
          onClick={handleCozumle}
          disabled={islemYapiliyor || !mdDosyaAdi}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 text-sm"
        >
          {islemYapiliyor
            ? <Loader2 className="size-4 animate-spin" />
            : <FileText className="size-4" />}
          {islemYapiliyor ? islemAdi : 'Çözümle'}
        </button>
      )}

      {/* Adım 2: Önizleme + Oluştur — cache var, henüz kayıt yok */}
      {cachedSonuc && !kayitSonuc && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Tespit edildi:{' '}
            <strong>{cachedSonuc.bolumler.length} bölüm</strong>
            {' · '}
            <strong>{toplamEtkinlik} etkinlik</strong>
          </p>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Kitap Adı</label>
              <input
                value={kitapAdi}
                onChange={e => setKitapAdi(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border bg-background text-sm"
                placeholder="Kitap adı"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Yazar</label>
              <input
                value={yazar}
                onChange={e => setYazar(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border bg-background text-sm"
                placeholder="Yazar adı"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Seviye</label>
              <select
                value={seviye}
                onChange={e => setSeviye(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border bg-background text-sm"
              >
                <option value="">Seviye seç</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleKitapOlustur}
            disabled={islemYapiliyor}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 text-sm"
          >
            {islemYapiliyor
              ? <Loader2 className="size-4 animate-spin" />
              : <BookOpen className="size-4" />}
            {islemYapiliyor
              ? islemAdi
              : `Okuma Kitabı Oluştur (${cachedSonuc.bolumler.length} bölüm)`}
          </button>
        </div>
      )}

      {islemYapiliyor && islemAdi && !cachedSonuc && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">{islemAdi}</p>
      )}

      {/* Hata */}
      {hata && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm border border-red-200">
          {hata}
        </div>
      )}

      {/* Başarı ekranı */}
      {kayitSonuc && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
          <p className="font-semibold text-green-800 dark:text-green-400 flex items-center gap-2 text-sm">
            <Check className="size-4" /> Kitap oluşturuldu!
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            {kayitSonuc.bolumSayisi} bölüm · {kayitSonuc.etkinlikSayisi} etkinlik
          </p>
          {kayitSonuc.mesaj && (
            <p className="text-xs text-muted-foreground">{kayitSonuc.mesaj}</p>
          )}
          {kayitSonuc.kitapId && (
            <a
              href={`/ogretmen/okuma/kitap/${kayitSonuc.kitapId}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
            >
              <ExternalLink className="size-3.5" />
              Kitabı görüntüle
            </a>
          )}
          <button
            onClick={handleYenidenParse}
            className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Yeni kitap aktar
          </button>
        </div>
      )}
    </div>
  );
}
