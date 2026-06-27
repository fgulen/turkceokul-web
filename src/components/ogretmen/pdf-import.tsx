'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, Loader2, Save, Eye, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PdfBolum {
  tip: 'okuma' | 'etkinlik' | 'atla';
  baslik: string;
  sayfaAralik: number[];
  metin?: string | null;
  etkinlikTuru?: string;
  sorular?: { soru: string; secenekler?: string[]; cevap?: string }[];
}

interface PdfSonuc {
  baslik: string;
  bolumler: PdfBolum[];
}

interface UniteDto { id: string; name: string; }
interface Kitap { id: string; name: string; }

const ETKINLIK_TUR_RENKLERI: Record<string, string> = {
  okuma: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  etkinlik: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
  atla: 'border-l-gray-300 bg-gray-50 dark:bg-gray-800/20 opacity-60',
};

export function PdfImport() {
  const [pdfYolu, setPdfYolu] = useState('books/cirkin-ordek-yavrusu.pdf');
  const [sonuc, setSonuc] = useState<PdfSonuc | null>(null);
  const [cozumlemeYapiliyor, setCozumlemeYapiliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [seciliBolumler, setSeciliBolumler] = useState<Set<number>>(new Set());
  const [kayitYapiliyor, setKayitYapiliyor] = useState<number | null>(null);
  const [kayitSonuc, setKayitSonuc] = useState<Record<number, string>>({});
  const [kayitHata, setKayitHata] = useState<Record<number, string>>({});

  const [seciliKitapId, setSeciliKitapId] = useState('');
  const [seciliUniteId, setSeciliUniteId] = useState('');

  const { data: kitaplar = [] } = useQuery<Kitap[]>({
    queryKey: ['derskitaplari'],
    queryFn: () => api.get('/api/derskitaplari').then(r => r.data),
  });

  const { data: uniteler = [] } = useQuery<UniteDto[]>({
    queryKey: ['uniteler', seciliKitapId],
    queryFn: () => api.get(`/api/uniteler/${seciliKitapId}`).then(r => r.data),
    enabled: !!seciliKitapId,
  });

  async function handleCozumle() {
    setHata('');
    setSonuc(null);
    setCozumlemeYapiliyor(true);
    try {
      const { data } = await api.post('/api/ai/pdf-cozumle', { pdfYolu });
      const jobId = data.jobId as string;
      if (!jobId) throw new Error('Job ID alınamadı.');

      // Poll every 3sn
      let tamam = false;
      while (!tamam) {
        await new Promise(r => setTimeout(r, 3000));
        const { data: durum } = await api.get(`/api/ai/pdf-cozumle/${jobId}`);

        if (durum.durum === 'tamam') {
          const bolumler = (durum.sonuc as { bolumler: PdfBolum[] }).bolumler;
          setSonuc({ baslik: durum.sonuc.baslik, bolumler });
          const ilkSecim = new Set<number>();
          bolumler.forEach((b, i) => { if (b.tip !== 'atla') ilkSecim.add(i); });
          setSeciliBolumler(ilkSecim);
          tamam = true;
        } else if (durum.durum === 'hata') {
          throw new Error(durum.hata as string);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Çözümleme başarısız';
      setHata(msg);
    } finally {
      setCozumlemeYapiliyor(false);
    }
  }

  function toggleBolum(idx: number) {
    setSeciliBolumler(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  async function handleKaydet(bolum: PdfBolum, idx: number) {
    if (!seciliUniteId) { setHata('Lütfen bir ünite seçin'); return; }
    setKayitYapiliyor(idx);
    try {
      const tip = bolum.tip === 'okuma' ? 'OkuGec' : bolum.etkinlikTuru;
      const sorular = bolum.sorular?.map(s => ({
        soru: s.soru,
        kelime1: s.secenekler?.[0],
        kelime2: s.secenekler?.[1],
        kelime3: s.secenekler?.[2],
        kelime4: s.secenekler?.[3],
      })) ?? [];

      const { data } = await api.post('/api/ai/pdf-cozumle/kaydet', {
        uniteId: seciliUniteId,
        etkinlikTuru: tip,
        baslik: bolum.baslik,
        bolumAdi: 'Okuma Kitabı',
        duzey: 'A1',
        okumaMetni: bolum.metin,
        sorular,
      });
      setKayitSonuc(prev => ({ ...prev, [idx]: data.etkinlikId }));
      setKayitHata(prev => { const n = { ...prev }; delete n[idx]; return n; });
    } catch (err: unknown) {
      setKayitSonuc(prev => ({ ...prev, [idx]: 'hata' }));
      const msg = err instanceof Error ? err.message : err && typeof err === 'object' && 'response' in err ? String((err as any).response?.data ?? err) : 'Bilinmeyen hata';
      setKayitHata(prev => ({ ...prev, [idx]: msg }));
    } finally {
      setKayitYapiliyor(null);
    }
  }

  const turRenk = (tip: string) => ETKINLIK_TUR_RENKLERI[tip] ?? 'border-l-gray-300';
  const turEtiket = (tip: string) =>
    tip === 'okuma' ? '📖 Okuma' : tip === 'etkinlik' ? '🎯 Etkinlik' : '⏭️ Atla';

  return (
    <div className="space-y-4">
      {/* Dosya seçimi */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">PDF Dosya Yolu</label>
          <input
            value={pdfYolu}
            onChange={e => setPdfYolu(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            placeholder="books/cirkin-ordek-yavrusu.pdf"
          />
        </div>
        <button
          onClick={handleCozumle}
          disabled={cozumlemeYapiliyor || !pdfYolu}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {cozumlemeYapiliyor ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
          Çözümle
        </button>
      </div>

      {/* Hata */}
      {hata && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm border border-red-200">
          {hata}
        </div>
      )}

      {/* Bölüm listesi */}
      {sonuc && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="size-4" />
              {sonuc.baslik} — {sonuc.bolumler.length} bölüm
            </h3>
            <span className="text-xs text-muted-foreground">
              {seciliBolumler.size} bölüm seçili
            </span>
          </div>

          {/* Ünite seçimi */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={seciliKitapId}
              onChange={e => { setSeciliKitapId(e.target.value); setSeciliUniteId(''); }}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
            >
              <option value="">Kitap seçin</option>
              {kitaplar.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <select
              value={seciliUniteId}
              onChange={e => setSeciliUniteId(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              disabled={!seciliKitapId}
            >
              <option value="">Ünite seçin</option>
              {uniteler.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {/* Bölüm kartları */}
          {sonuc.bolumler.map((bolum, idx) => (
            <div
              key={idx}
              className={cn(
                'p-3 rounded-lg border border-l-4 text-sm transition-colors',
                turRenk(bolum.tip),
                seciliBolumler.has(idx) ? 'ring-1 ring-primary/30' : ''
              )}
            >
                {kayitHata[idx] && (
                  <div className="mb-2 p-2 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[11px] border border-red-200">
                    {kayitHata[idx]}
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{turEtiket(bolum.tip)}</span>
                    {bolum.etkinlikTuru && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {bolum.etkinlikTuru}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      sf. {bolum.sayfaAralik[0]}{bolum.sayfaAralik[1] !== bolum.sayfaAralik[0] ? `-${bolum.sayfaAralik[1]}` : ''}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate">{bolum.baslik}</p>
                  {bolum.metin && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bolum.metin}</p>
                  )}
                  {bolum.sorular && bolum.sorular.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{bolum.sorular.length} soru</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {kayitSonuc[idx] && kayitSonuc[idx] !== 'hata' ? (
                    <a
                      href={`/etkinlik/${kayitSonuc[idx]}`}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded"
                    >
                      <Check className="size-3" /> Görüntüle
                    </a>
                  ) : (
                    <>
                      {bolum.tip !== 'atla' && (
                        <button
                          onClick={() => handleKaydet(bolum, idx)}
                          disabled={kayitYapiliyor === idx || !seciliUniteId}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-40"
                        >
                          {kayitYapiliyor === idx
                            ? <Loader2 className="size-3 animate-spin" />
                            : <Save className="size-3" />}
                          Kaydet
                        </button>
                      )}
                      <button
                        onClick={() => toggleBolum(idx)}
                        className={cn(
                          'size-6 rounded flex items-center justify-center transition-colors',
                          seciliBolumler.has(idx)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {seciliBolumler.has(idx) ? <Check className="size-3" /> : <X className="size-3" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Toplu kaydet */}
          {seciliBolumler.size > 0 && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 text-sm">
              <Save className="size-4" />
              Seçili {seciliBolumler.size} bölümü kaydet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
