"use client";

import { use, useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useRouter, useLocale } from '@/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, Zap, Heart, PenLine, BookOpen } from 'lucide-react';
import { PerdeGiris } from '@/components/perde-giris';
import { useAuthStore } from '@/stores/auth';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useGameSound } from '@/hooks/use-game-sound';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { type EtkinlikData, type Cevap } from '@/types/etkinlik';
import { AkilliKartPlayer } from '@/components/players/akilli-kart';
import { QuizPlayer } from '@/components/players/quiz';
import { KelimeleriEslestirPlayer } from '@/components/players/kelimeleri-eslestir';
import { CoktanSecmeliPlayer } from '@/components/players/coktan-secmeli';
import { CoktanSecmeliBoslukDoldurmaPlayer } from '@/components/players/coktan-secmeli-bosluk-doldurma';
import { ResimSesEslestirmePlayer } from '@/components/players/resim-ses-eslestirme';
import { OkuGecPlayer } from '@/components/players/oku-gec';
import { DogruYanlisPlayer } from '@/components/players/dogru-yanlis';
import { BoslukDoldurmaPlayer } from '@/components/players/bosluk-doldurma';
import { ResmeTiklaDinlePlayer } from '@/components/players/resme-tikla-dinle';
import { YaziyaTiklaDinlePlayer } from '@/components/players/yaziya-tikla-dinle';
import { ResimMetinEslestirmePlayer } from '@/components/players/resim-metin-eslestirme';
import { MetinSesEslestirmePlayer } from '@/components/players/metin-ses-eslestirme';
import { ResminSesiHangisiPlayer } from '@/components/players/resmin-sesi-hangisi';
import { ResimlerdenBiriniSecmePlayer } from '@/components/players/resimlerden-birini-secme';
import { KelimeleriSiralaPlayer } from '@/components/players/kelimeleri-sirala';
import { ResmeKelimeYazPlayer } from '@/components/players/resme-kelime-yaz';
import { SesiDinleveKelimeYazPlayer } from '@/components/players/sesi-dinle-ve-kelime-yaz';
import { KelimeleriGruplaPlayer } from '@/components/players/kelimeleri-grupla';
import { KelimelerdenCumleYapPlayer } from '@/components/players/kelimelerden-cumle-yap';
import { ResimliSoruCevapPlayer } from '@/components/players/resimli-soru-cevap';
import { KelimeleriAyristirPlayer } from '@/components/players/kelimeleri-ayristir';

interface CevapSonuc {
  puan: number;
  basarili: boolean;
  kazanilanXp: number;
  yeniToplam: number;
  combo: number;
  kalpAzaldi: boolean;
  kalanKalp: number;
}

interface EtkinlikListItem {
  id: string;
  bolum: string;
}

function KalpSifirScreen({ onRetry, onGeriDon }: { onRetry: () => void; onGeriDon: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
      <div className="bg-card border border-border rounded-[2rem] p-8 text-center max-w-xs w-full shadow-xl">
        <motion.div
          className="flex justify-center mb-5"
          animate={{ scale: [1, 1.25, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.85, ease: 'easeInOut', repeat: Infinity }}
        >
          <Heart className="size-16 fill-red-500 text-red-500" />
        </motion.div>
        <h2 className="text-2xl font-extrabold mb-2">Kalbin Bitti!</h2>
        <p className="text-muted-foreground text-sm mb-7">
          30 dakika bekle ya da başka bir etkinlik yap, kalbin yenilenir.
        </p>
        <div className="flex flex-col gap-2">
          <button
            ref={btnRef}
            onClick={onGeriDon}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-4 focus:ring-primary/40"
          >
            Haritaya Dön
          </button>
          <button
            onClick={onRetry}
            className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRating({ puan }: { puan: number }) {
  const stars = puan === 100 ? 3 : puan >= 90 ? 2 : puan >= 70 ? 1 : 0;
  return (
    <div className="flex gap-1 justify-center mb-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="star-pop"
          style={{ animationDelay: `${0.3 + i * 0.12}s` }}
        >
          <Star
            className={cn(
              'size-10',
              i <= stars ? 'fill-yellow-400 text-yellow-400 star-glow' : 'text-muted-foreground/20'
            )}
          />
        </div>
      ))}
    </div>
  );
}

function AnimatedScore({ puan }: { puan: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(puan / 30);
    const id = setInterval(() => {
      start = Math.min(start + step, puan);
      setDisplay(start);
      if (start >= puan) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [puan]);

  return <span>{display}</span>;
}


function ResultScreen({
  sonuc,
  onRetry,
  returnUrl,
  sonrakiUrl,
}: {
  sonuc: CevapSonuc;
  onRetry: () => void;
  returnUrl: string | null;
  sonrakiUrl: string | null;
}) {
  const router = useRouter();
  const updateUser = useAuthStore((s) => s.updateUser);
  const { play } = useGameSound();

  useEffect(() => {
    // Puan + kalp anında güncelle — Tekrar Dene erken basılsa bile veri kaybolmaz
    updateUser({ puan: sonuc.yeniToplam, kalp: sonuc.kalanKalp });
    play(sonuc.basarili ? 'complete' : 'wrong');
  }, [sonuc, updateUser, play]);

  const devamUrl = sonrakiUrl ?? returnUrl;

  return (
    <div className="result-screen-in fixed inset-0 gradient-result-bg flex flex-col items-center justify-center p-6 z-[60]">
      {/* Dekoratif Türkçe harfler */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[
          { ch: 'Ğ', top: '6%',  left: '5%',  size: 150, rotate: -18 },
          { ch: 'Ş', top: '10%', left: '80%', size: 130, rotate: 14  },
          { ch: 'Ü', top: '52%', left: '2%',  size: 170, rotate: -8  },
          { ch: 'Ö', top: '70%', left: '86%', size: 140, rotate: 20  },
          { ch: 'İ', top: '80%', left: '15%', size: 120, rotate: -22 },
          { ch: 'Ç', top: '35%', left: '88%', size: 160, rotate: 10  },
        ].map((c, i) => (
          <span key={i} style={{
            position: 'absolute', top: c.top, left: c.left,
            fontSize: c.size, fontWeight: 900, lineHeight: 1,
            color: '#1b75bc', opacity: 0.07,
            transform: `rotate(${c.rotate}deg)`,
            userSelect: 'none', fontFamily: 'inherit',
          }}>{c.ch}</span>
        ))}
      </div>

      {/* Glass kart */}
      <div className="result-card-in glass-card relative w-full max-w-sm rounded-[2rem] overflow-hidden flex flex-col items-center py-10 px-8 text-center">
        <StarRating puan={sonuc.puan} />

        {/* Puan */}
        <div className={cn('result-a1 text-7xl font-extrabold mb-1 tabular-nums tracking-tight',
          sonuc.basarili ? 'text-primary' : 'text-muted-foreground')}
        >
          <AnimatedScore puan={sonuc.puan} />
        </div>

        <p className="result-a2 text-muted-foreground text-sm mb-5">
          {sonuc.basarili ? 'Harika iş! Etkinliği tamamladın.' : 'Geçemedin. Tekrar dene!'}
        </p>

        {/* XP + Combo + Kalp badges */}
        <div className="result-a3 flex gap-2 flex-wrap justify-center mb-6">
          {sonuc.kazanilanXp > 0 && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              <Zap className="size-3.5 fill-current" />
              +{sonuc.kazanilanXp} XP
            </div>
          )}
          {sonuc.combo >= 3 && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
              x{sonuc.combo} Combo
            </div>
          )}
          {sonuc.kalpAzaldi && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-100 text-red-500 font-bold text-sm">
              <Heart className="size-3.5" />
              -{1} Kalp
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="result-a4 grid grid-cols-2 gap-2 w-full mb-7">
          <div className="bg-muted/60 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Doğruluk</p>
            <p className="font-bold text-foreground tabular-nums">{sonuc.puan}%</p>
          </div>
          <div className="bg-muted/60 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Kalan Kalp</p>
            <p className="font-bold text-foreground">{sonuc.kalanKalp} / 5</p>
          </div>
        </div>

        {/* Butonlar */}
        <div className="result-a5 flex flex-col gap-2 w-full">
          <button
            onClick={() => devamUrl ? router.push(devamUrl) : router.back()}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            {sonrakiUrl ? 'Sonraki Etkinlik →' : 'Devam Et →'}
          </button>
          <button
            onClick={onRetry}
            className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EtkinlikPage({
  params,
}: {
  params: Promise<{ etkinlikId: string }>;
}) {
  const { etkinlikId } = use(params);
  const { user, ready } = useAuthGuard(undefined, true);
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const uniteId = searchParams.get('uniteId');
  const kitapId = searchParams.get('kitapId');
  const bolum = searchParams.get('bolum');
  const returnUrl = uniteId && kitapId
    ? `/ders/${kitapId}?uniteId=${uniteId}${bolum ? `&bolum=${encodeURIComponent(bolum)}` : ''}&lastId=${etkinlikId}`
    : null;

  const queryClient = useQueryClient();
  const [sonuc, setSonuc] = useState<CevapSonuc | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [key, setKey] = useState(0);
  const [perdeGosteriliyor, setPerdeGosteriliyor] = useState(false);
  const [perdeAcimaSayisi, setPerdeAcimaSayisi] = useState(0); // gönüllü re-open sayısı

  // Aynı sayfada etkinlikId değişince (otomatik geçiş) state'i sıfırla
  useEffect(() => {
    setSonuc(null);
    setSubmitting(false);
    setKey((k) => k + 1);
    setPerdeAcimaSayisi(0);
  }, [etkinlikId]);

  const { data: etkinlik, isLoading } = useQuery<EtkinlikData>({
    queryKey: ['etkinlik', etkinlikId],
    queryFn: () => api.get(`/api/etkinlik/${etkinlikId}`).then((r) => r.data),
    enabled: !!user,
  });

  const { data: etkinlikListesi } = useQuery<EtkinlikListItem[]>({
    queryKey: ['etkinlikler', uniteId],
    queryFn: () => api.get(`/api/etkinlikler/${uniteId}`).then((r) => r.data),
    enabled: !!user && !!uniteId,
  });

  const sonrakiUrl = useMemo(() => {
    if (!etkinlikListesi || !bolum || !uniteId || !kitapId) return null;
    const bolumList = etkinlikListesi.filter((e) => e.bolum === bolum);
    const idx = bolumList.findIndex((e) => e.id === etkinlikId);
    if (idx === -1 || idx + 1 >= bolumList.length) return null;
    const nextId = bolumList[idx + 1].id;
    return `/etkinlik/${nextId}?uniteId=${uniteId}&kitapId=${kitapId}&bolum=${encodeURIComponent(bolum)}`;
  }, [etkinlikListesi, bolum, etkinlikId, uniteId, kitapId]);

  // OkuGec: Etkinlik.ResimLink/SesLink = içeriğin kendisi (okuma metni + ses).
  // Migration bu alanları detay tablosundan kopyaladığı için etkinlik-level dolu görünür; perde değil.
  // Diğer tüm tiplerde Etkinlik-level ResimLink/SesLink/VideoLink = gerçek perde
  // (eski admin UI'da "Perde: Resim/Ses/Video" etiketiyle tüm tipler için aynı form).
  const PERDE_DISI = ['OkuGec'];

  // Perde verisi olan etkinliklerde başlarken perdeyi göster
  useEffect(() => {
    if (!etkinlik) return;
    if (PERDE_DISI.includes(etkinlik.etkinlikTuru)) return;
    const hasPerde = !!(etkinlik.resimLink || etkinlik.sesLink || etkinlik.videoLink || etkinlik.description);
    if (hasPerde) {
      setPerdeGosteriliyor(true);
      setPerdeAcimaSayisi(0);
    }
  }, [etkinlik?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPerde = !!(etkinlik?.resimLink || etkinlik?.sesLink || etkinlik?.videoLink || etkinlik?.description)
    && !PERDE_DISI.includes(etkinlik?.etkinlikTuru ?? '');

  function handlePerdeBasla() {
    setPerdeGosteriliyor(false);
  }

  function handlePerdeyeBak() {
    setPerdeAcimaSayisi((n) => n + 1);
    setPerdeGosteriliyor(true);
  }

  async function handleComplete(cevaplar: Cevap[]) {
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/etkinlik/cevapla', {
        etkinlikId,
        detaylar: cevaplar,
        perdeAcimaSayisi,
      });
      setSonuc(data);
      if (uniteId) queryClient.invalidateQueries({ queryKey: ['etkinlikler', uniteId] });
      if (kitapId) queryClient.invalidateQueries({ queryKey: ['uniteler', kitapId] });
    } catch {
      // If API fails, still show something
      setSonuc({ puan: 0, basarili: false, kazanilanXp: 0, yeniToplam: user?.puan ?? 0, combo: 0, kalpAzaldi: false, kalanKalp: user?.kalp ?? 5 });
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setSonuc(null);
    setKey((k) => k + 1);
  }

  function renderPlayer(e: EtkinlikData) {
    const props = { etkinlik: e, onComplete: handleComplete, kitapId, uniteId };
    switch (e.etkinlikTuru) {
      case 'CoktanSecmeli': return <CoktanSecmeliPlayer key={key} {...props} />;
      case 'AkilliKart': return <AkilliKartPlayer key={key} {...props} />;
      case 'Quiz': return <QuizPlayer key={key} {...props} />;
      case 'KelimeleriEslestir': return <KelimeleriEslestirPlayer key={key} {...props} />;
      case 'CoktanSecmeliBoslukDoldurma': return <CoktanSecmeliBoslukDoldurmaPlayer key={key} {...props} />;
      case 'ResimSesEslestirme': return <ResimSesEslestirmePlayer key={key} {...props} />;
      case 'OkuGec': return <OkuGecPlayer key={key} {...props} />;
      case 'MetinDogruYanlis':
      case 'MetinCheckBox':
      case 'ResimMetinEslestirmeDogruYanlis': return <DogruYanlisPlayer key={key} {...props} />;
      case 'BoslukDoldurma': return <BoslukDoldurmaPlayer key={key} {...props} />;
      case 'ResmeTiklaDinle': return <ResmeTiklaDinlePlayer key={key} {...props} />;
      case 'YaziyaTiklaDinle': return <YaziyaTiklaDinlePlayer key={key} {...props} />;
      case 'ResimMetinEslestirme': return <ResimMetinEslestirmePlayer key={key} {...props} />;
      case 'MetinSesEslestirme': return <MetinSesEslestirmePlayer key={key} {...props} />;
      case 'ResminSesiHangisi': return <ResminSesiHangisiPlayer key={key} {...props} />;
      case 'ResimlerdenBiriniSecme': return <ResimlerdenBiriniSecmePlayer key={key} {...props} />;
      case 'KelimeleriSirala': return <KelimeleriSiralaPlayer key={key} {...props} />;
      case 'ResmeKelimeYaz': return <ResmeKelimeYazPlayer key={key} {...props} />;
      case 'SesiDinleveKelimeYaz': return <SesiDinleveKelimeYazPlayer key={key} {...props} />;
      case 'KelimeleriGrupla': return <KelimeleriGruplaPlayer key={key} {...props} />;
      case 'KelimelerdenCumleYap': return <KelimelerdenCumleYapPlayer key={key} {...props} />;
      case 'ResimliSoruCevap':
      case 'SoruCevap': return <ResimliSoruCevapPlayer key={key} {...props} />;
      case 'KelimeleriAyristir': return <KelimeleriAyristirPlayer key={key} {...props} />;
      case 'ResimSesEslestirmeDogruYanlis': return <ResimSesEslestirmePlayer key={key} {...props} />;
      case 'MetinSesEslestirmeDogruYanlis': return <MetinSesEslestirmePlayer key={key} {...props} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Etkinlik tipi:</p>
            <p className="font-semibold text-lg mb-8">{e.etkinlikTuru}</p>
            <button
              onClick={() => handleComplete(e.detaylar.map((d) => ({ id: d.id, cevap: '1' })))}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Tamamla
            </button>
          </div>
        );
    }
  }

  if (!ready) return <div className="h-[calc(100dvh-4rem)] flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="bg-background">
      <main className="max-w-2xl mx-auto px-4 pt-3 pb-8">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => returnUrl ? router.push(returnUrl) : router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Geri
          </button>
          {user && (user.role === 'Koordinator' || user.role === 'SuperAdmin' || user.role === 'Editor') && (
            <a
              href={`/${locale}/ogretmen/etkinlik/${etkinlikId}/duzenle`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <PenLine className="size-4" />
              <span className="hidden sm:inline">Düzenle</span>
            </a>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-2 rounded-full bg-muted animate-pulse" />
            <div className="h-60 rounded-2xl bg-muted animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
            </div>
          </div>
        ) : submitting ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground">Sonuç hesaplanıyor…</p>
          </div>
        ) : sonuc && sonuc.kalanKalp === 0 && !sonuc.basarili ? (
          <KalpSifirScreen
            onRetry={handleRetry}
            onGeriDon={() => returnUrl ? router.push(returnUrl) : router.back()}
          />
        ) : sonuc && etkinlik ? (
          <ResultScreen sonuc={sonuc} onRetry={handleRetry} returnUrl={returnUrl} sonrakiUrl={sonrakiUrl} />
        ) : etkinlik ? (
          <>
            {/* "Perdeye Bak" floating butonu — yalnızca perde verisi olan etkinliklerde */}
            {hasPerde && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={handlePerdeyeBak}
                  className="inline-flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-400 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                >
                  <BookOpen className="size-3.5" />
                  İpucuna Bak
                  {perdeAcimaSayisi > 0 && (
                    <span className="ml-1 text-destructive font-semibold">−{perdeAcimaSayisi} XP</span>
                  )}
                </button>
              </div>
            )}
            {renderPlayer(etkinlik)}
          </>
        ) : null}
      </main>

      {/* Perde overlay — etkinliğin üzerini tam kaplar */}
      <AnimatePresence>
        {etkinlik && perdeGosteriliyor && (
          <PerdeGiris
            key="perde"
            etkinlik={etkinlik}
            onBasla={handlePerdeBasla}
            acilmaSayisi={perdeAcimaSayisi}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
