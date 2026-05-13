"use client";

import { use, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Zap, Heart } from 'lucide-react';
import { AppNav } from '@/components/app-nav';
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
import { ResimSesEslestirmePlayer } from '@/components/players/resim-ses-eslestirme';
import { OkuGecPlayer } from '@/components/players/oku-gec';
import { DogruYanlisPlayer } from '@/components/players/dogru-yanlis';
import { BoslukDoldurmaPlayer } from '@/components/players/bosluk-doldurma';

interface CevapSonuc {
  puan: number;
  basarili: boolean;
  kazanilanXp: number;
  yeniToplam: number;
  combo: number;
  kalpAzaldi: boolean;
  kalanKalp: number;
}

function StarRating({ puan }: { puan: number }) {
  const stars = puan === 100 ? 3 : puan >= 90 ? 2 : puan >= 70 ? 1 : 0;
  return (
    <div className="flex gap-1 justify-center mb-5">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
        >
          <Star
            className={cn(
              'size-10',
              i <= stars ? 'fill-yellow-400 text-yellow-400 star-glow' : 'text-muted-foreground/20'
            )}
          />
        </motion.div>
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

const PARTICLE_COUNT = 7;
// Yıldızlar ve kart ~950ms'de görünüyor; parçacıklar ondan sonra başlasın
const FLY_START_DELAY = 1150;

function XpFly() {
  const [pos, setPos] = useState<{
    start: { x: number; y: number };
    nav: { x: number; y: number };
  } | null>(null);
  const [done, setDone] = useState(false);

  const offsets = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      dx: Math.cos((i / PARTICLE_COUNT) * Math.PI * 2) * 36 + (Math.random() - 0.5) * 14,
      dy: Math.sin((i / PARTICLE_COUNT) * Math.PI * 2) * 16 + (Math.random() - 0.5) * 8,
    }))
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const badge = document.getElementById('result-xp-badge');
      const nav   = document.getElementById('nav-xp-counter');
      const br = badge?.getBoundingClientRect();
      const nr = nav?.getBoundingClientRect();
      setPos({
        start: {
          x: br ? br.left + br.width  / 2 : window.innerWidth  / 2,
          y: br ? br.top  + br.height / 2 : window.innerHeight * 0.52,
        },
        nav: {
          x: nr ? nr.left + nr.width  / 2 : window.innerWidth  - 80,
          y: nr ? nr.top  + nr.height / 2 : 28,
        },
      });
    }, FLY_START_DELAY);
    return () => clearTimeout(t);
  }, []);

  if (!pos || done) return null;
  const { start, nav } = pos;

  return createPortal(
    <>
      {offsets.current.map((off, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none z-[150]"
          style={{ left: start.x + off.dx, top: start.y + off.dy }}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: [1, 1, 0.8, 0],
            scale: [1, 1.2, 0.7],
            x: nav.x - (start.x + off.dx),
            y: nav.y - (start.y + off.dy),
          }}
          transition={{ duration: 0.72, delay: i * 0.055, ease: [0.4, 0, 0.6, 1] }}
          onAnimationComplete={i === PARTICLE_COUNT - 1 ? () => setDone(true) : undefined}
        >
          <Zap className="size-4 fill-current drop-shadow-sm" style={{ color: 'var(--correct)' }} />
        </motion.div>
      ))}
    </>,
    document.body
  );
}

function ResultScreen({
  sonuc,
  onRetry,
  returnUrl,
}: {
  sonuc: CevapSonuc;
  onRetry: () => void;
  returnUrl: string | null;
}) {
  const router = useRouter();
  const updateUser = useAuthStore((s) => s.updateUser);
  const { play } = useGameSound();

  useEffect(() => {
    // Puan + kalp anında güncelle — Tekrar Dene erken basılsa bile veri kaybolmaz
    updateUser({ puan: sonuc.yeniToplam, kalp: sonuc.kalanKalp });
    play(sonuc.basarili ? 'complete' : 'wrong');
  }, [sonuc, updateUser, play]);

  return (
    <motion.div
      className="fixed inset-0 gradient-result-bg flex flex-col items-center justify-center p-6 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {sonuc.kazanilanXp > 0 && <XpFly />}

      {/* Dekoratif floating elementler */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[12%] left-[14%] w-3 h-3 bg-primary/30 rounded-full" />
        <div className="absolute top-[18%] right-[18%] w-2.5 h-2.5 bg-purple-400/30 rounded-sm rotate-12" />
        <div className="absolute bottom-[22%] left-[10%] w-5 h-2 bg-yellow-400/30 rounded-full -rotate-12" />
        <div className="absolute top-[42%] right-[8%] w-2 h-5 bg-primary/20 rounded-full rotate-[25deg]" />
        <div className="absolute bottom-[35%] right-[15%] w-3 h-3 bg-purple-300/25 rounded-full" />
      </div>

      {/* Glass kart */}
      <motion.div
        className="glass-card relative w-full max-w-sm rounded-[2rem] overflow-hidden flex flex-col items-center py-10 px-8 text-center"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <StarRating puan={sonuc.puan} />

        {/* Puan */}
        <motion.div
          className={cn('text-7xl font-extrabold mb-1 tabular-nums tracking-tight',
            sonuc.basarili ? 'text-primary' : 'text-muted-foreground')}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.55, type: 'spring', stiffness: 200 }}
        >
          <AnimatedScore puan={sonuc.puan} />
        </motion.div>

        <motion.p
          className="text-muted-foreground text-sm mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {sonuc.basarili ? 'Harika iş! Etkinliği tamamladın.' : 'Geçemedin. Tekrar dene!'}
        </motion.p>

        {/* XP + Combo + Kalp badges */}
        <motion.div
          className="flex gap-2 flex-wrap justify-center mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
        >
          {sonuc.kazanilanXp > 0 && (
            <div id="result-xp-badge" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-bold text-sm">
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
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 gap-2 w-full mb-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <div className="bg-muted/60 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Doğruluk</p>
            <p className="font-bold text-foreground tabular-nums">{sonuc.puan}%</p>
          </div>
          <div className="bg-muted/60 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Kalan Kalp</p>
            <p className="font-bold text-foreground">{sonuc.kalanKalp} / 5</p>
          </div>
        </motion.div>

        {/* Butonlar */}
        <motion.div
          className="flex flex-col gap-2 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <button
            onClick={() => returnUrl ? router.push(returnUrl) : router.back()}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            Devam Et →
          </button>
          <button
            onClick={onRetry}
            className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Tekrar Dene
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function EtkinlikPage({
  params,
}: {
  params: Promise<{ etkinlikId: string }>;
}) {
  const { etkinlikId } = use(params);
  const { user, ready } = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();

  const uniteId = searchParams.get('uniteId');
  const kitapId = searchParams.get('kitapId');
  const returnUrl = uniteId && kitapId ? `/ders/${kitapId}?uniteId=${uniteId}` : null;

  const queryClient = useQueryClient();
  const [sonuc, setSonuc] = useState<CevapSonuc | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [key, setKey] = useState(0);

  const { data: etkinlik, isLoading } = useQuery<EtkinlikData>({
    queryKey: ['etkinlik', etkinlikId],
    queryFn: () => api.get(`/api/etkinlik/${etkinlikId}`).then((r) => r.data),
    enabled: !!user,
  });

  async function handleComplete(cevaplar: Cevap[]) {
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/etkinlik/cevapla', {
        etkinlikId,
        detaylar: cevaplar,
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
    const props = { etkinlik: e, onComplete: handleComplete };
    switch (e.etkinlikTuru) {
      case 'AkilliKart': return <AkilliKartPlayer key={key} {...props} />;
      case 'Quiz': return <QuizPlayer key={key} {...props} />;
      case 'KelimeleriEslestir': return <KelimeleriEslestirPlayer key={key} {...props} />;
      case 'CoktanSecmeliBoslukDoldurma': return <CoktanSecmeliPlayer key={key} {...props} />;
      case 'ResimSesEslestirme': return <ResimSesEslestirmePlayer key={key} {...props} />;
      case 'OkuGec': return <OkuGecPlayer key={key} {...props} />;
      case 'MetinDogruYanlis':
      case 'MetinCheckBox':
      case 'ResimMetinEslestirmeDogruYanlis': return <DogruYanlisPlayer key={key} {...props} />;
      case 'BoslukDoldurma': return <BoslukDoldurmaPlayer key={key} {...props} />;
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

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => returnUrl ? router.push(returnUrl) : router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Geri
          </button>
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
        ) : sonuc && etkinlik ? (
          <ResultScreen sonuc={sonuc} onRetry={handleRetry} returnUrl={returnUrl} />
        ) : etkinlik ? (
          renderPlayer(etkinlik)
        ) : null}
      </main>
    </div>
  );
}
