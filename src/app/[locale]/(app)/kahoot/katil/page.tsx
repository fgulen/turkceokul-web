'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Users, Trophy, CheckCircle, XCircle, AlertCircle, Volume2 } from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { useKahoot, type LeaderboardSatir } from '@/hooks/use-kahoot';
import { cn, toMediaUrl } from '@/lib/utils';

type Asama = 'kod-giris' | 'bekleme' | 'soru' | 'cevap-verildi' | 'leaderboard-ara' | 'bitti';

const CEVAP_RENKLERI = [
  { harf: 'A', bg: 'bg-red-500',   hover: 'hover:bg-red-600'   },
  { harf: 'B', bg: 'bg-blue-500',  hover: 'hover:bg-blue-600'  },
  { harf: 'C', bg: 'bg-amber-400', hover: 'hover:bg-amber-500' },
  { harf: 'D', bg: 'bg-green-500', hover: 'hover:bg-green-600' },
];

const SESSION_KEY = 'kahoot_aktif_kod';

export default function KahootKatilPage() {
  const { user, ready } = useAuthGuard();
  const kahoot = useKahoot();

  const [asama, setAsama] = useState<Asama>('kod-giris');
  const [kod, setKod] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hataMsg, setHataMsg] = useState('');
  const [aktifKod, setAktifKod] = useState('');
  const [geriSayim, setGeriSayim] = useState(30);
  const [araLeaderboard, setAraLeaderboard] = useState<LeaderboardSatir[]>([]);
  const baslangicRef = useRef<number>(0);

  useEffect(() => {
    if (asama !== 'soru') return;
    baslangicRef.current = Date.now();
    setGeriSayim(30);
    const timer = setInterval(() => {
      setGeriSayim(p => {
        if (p <= 1) { clearInterval(timer); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [asama, kahoot.soruBilgisi?.soruNo]);

  useEffect(() => {
    if (kahoot.oyunBasladi && asama === 'bekleme') setAsama('soru');
  }, [kahoot.oyunBasladi, asama]);

  useEffect(() => {
    if (kahoot.cevapAlindi && asama === 'soru') setAsama('cevap-verildi');
  }, [kahoot.cevapAlindi, asama]);

  useEffect(() => {
    if (kahoot.oyunBitti) return;
    if (kahoot.leaderboard.length > 0 && (asama === 'cevap-verildi' || asama === 'soru')) {
      setAraLeaderboard(kahoot.leaderboard);
      setAsama('leaderboard-ara');
    }
  }, [kahoot.leaderboard, kahoot.oyunBitti]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (kahoot.oyunBitti || !kahoot.soruBilgisi || asama !== 'leaderboard-ara') return;
    const timer = setTimeout(() => setAsama('soru'), 3000);
    return () => clearTimeout(timer);
  }, [kahoot.soruBilgisi, asama, kahoot.oyunBitti]);

  useEffect(() => {
    if (kahoot.oyunBitti) {
      setAsama('bitti');
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [kahoot.oyunBitti]);

  // Mid-game yenileme: sunucu oyunun başladığını bildirince bekleme→soru geç
  useEffect(() => {
    if (kahoot.oyunDurumuBaslatildi && asama === 'bekleme') setAsama('soru');
  }, [kahoot.oyunDurumuBaslatildi, asama]);

  // Sayfa yenilenince sessionStorage'dan kodu alıp otomatik bağlan
  useEffect(() => {
    if (!ready || !user) return;
    const kaydedilmisKod = sessionStorage.getItem(SESSION_KEY);
    if (!kaydedilmisKod) return;
    setYukleniyor(true);
    api.get(`/api/kahoot/kontrol/${kaydedilmisKod}`)
      .then(async () => {
        const ok = await kahoot.connect();
        if (!ok) { sessionStorage.removeItem(SESSION_KEY); return; }
        await kahoot.joinGame(kaydedilmisKod);
        setAktifKod(kaydedilmisKod);
        setAsama('bekleme');
      })
      .catch(() => sessionStorage.removeItem(SESSION_KEY))
      .finally(() => setYukleniyor(false));
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function oyunaKatil() {
    if (!kod.trim()) return;
    setYukleniyor(true);
    setHataMsg('');
    const girilenKod = kod.trim().toUpperCase();
    try {
      await api.get(`/api/kahoot/kontrol/${girilenKod}`);
      const ok = await kahoot.connect();
      if (!ok) return;
      await kahoot.joinGame(girilenKod);
      setAktifKod(girilenKod);
      sessionStorage.setItem(SESSION_KEY, girilenKod);
      setAsama('bekleme');
    } catch {
      setHataMsg('Oyun kodu bulunamadı veya oyun sona erdi.');
    } finally {
      setYukleniyor(false);
    }
  }

  async function cevapGonder(harf: string) {
    if (asama !== 'soru') return;
    const sureMs = Date.now() - baslangicRef.current;
    await kahoot.submitAnswer(aktifKod, harf, sureMs);
  }

  if (!ready) return (
    <div className="h-[calc(100dvh-4rem)] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  // Soru aşaması tam ekran — diğerleri kart
  const soruEkrani = asama === 'soru';

  return (
    <div className={cn('bg-background', soruEkrani && 'h-[calc(100dvh-4rem)]')}>
      <AnimatePresence mode="wait">

        {/* ── SORU — FULL SCREEN ───────────────────────────────────────────── */}
        {asama === 'soru' && (
          <motion.div
            key={`soru-${kahoot.soruBilgisi?.soruNo}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="h-[calc(100dvh-4rem)] flex flex-col px-3 py-3 gap-3 max-w-2xl mx-auto w-full"
          >
            {/* Üst bar: ilerleme + zamanlayıcı */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Progress */}
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground mb-1">
                  <span>Soru {kahoot.soruBilgisi?.soruNo} / {kahoot.soruBilgisi?.toplamSoru}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(geriSayim / 30) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </div>
              {/* Zamanlayıcı */}
              <div className={cn(
                'text-5xl font-black tabular-nums w-20 text-center shrink-0',
                geriSayim <= 5 ? 'text-destructive animate-pulse' : 'text-foreground'
              )}>
                {geriSayim}
              </div>
            </div>

            {/* Soru — resim kenardan kenara, altında ses/metin */}
            <div className="bg-card rounded-2xl border border-border shadow-sm shrink-0 text-center overflow-hidden">
              {kahoot.soruBilgisi?.resimUrl && (
                <img
                  src={toMediaUrl(kahoot.soruBilgisi.resimUrl) ?? ''}
                  alt=""
                  className="w-full object-contain max-h-56 bg-slate-50"
                />
              )}
              {(kahoot.soruBilgisi?.sesUrl || kahoot.soruBilgisi?.soru) && (
                <div className="px-6 py-4 space-y-2">
                  {kahoot.soruBilgisi?.sesUrl && (
                    <button
                      onClick={() => { const u = toMediaUrl(kahoot.soruBilgisi!.sesUrl!); if (u) new Audio(u).play().catch(() => {}); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold text-sm hover:bg-primary/20 transition-colors"
                    >
                      <Volume2 className="size-4" />
                      Sesi Dinle
                    </button>
                  )}
                  {kahoot.soruBilgisi?.soru && (
                    <p className="text-xl md:text-2xl font-bold text-foreground leading-snug whitespace-pre-wrap">
                      {kahoot.soruBilgisi.soru}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cevap butonları — kalan alanı doldurur */}
            <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
              {CEVAP_RENKLERI.map(({ harf, bg, hover }) => {
                const metin = kahoot.soruBilgisi?.[`sec${harf}` as keyof typeof kahoot.soruBilgisi] as string | undefined;
                return (
                  <motion.button
                    key={harf}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => cevapGonder(harf)}
                    className={cn(
                      'rounded-2xl shadow-lg transition-colors flex flex-col items-center justify-center gap-3 p-4 h-full w-full',
                      bg, hover,
                    )}
                  >
                    <span className="w-12 h-12 rounded-full bg-black/25 flex items-center justify-center text-white font-black text-2xl shrink-0">
                      {harf}
                    </span>
                    {metin && (
                      <span className="text-white font-bold text-xl md:text-2xl leading-snug text-center drop-shadow">
                        {metin}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── KOD GİRİŞ ───────────────────────────────────────────────────── */}
        {asama === 'kod-giris' && (
          <motion.div
            key="kod"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-[480px] mx-auto px-4 py-3"
          >
            <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wifi className="size-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Kahoot&apos;a Katıl</h1>
              <p className="text-muted-foreground text-sm mb-8">
                Öğretmenden aldığın 6 haneli kodu gir
              </p>

              <input
                type="text"
                value={kod}
                onChange={e => setKod(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && oyunaKatil()}
                maxLength={6}
                placeholder="ABCD12"
                className="w-full text-center text-3xl font-black tracking-[0.25em] uppercase border-2 border-border rounded-2xl px-4 py-4 focus:outline-none focus:border-primary transition-colors bg-background"
                autoFocus
              />

              {hataMsg && (
                <div className="mt-3 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-4 py-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {hataMsg}
                </div>
              )}

              <button
                onClick={oyunaKatil}
                disabled={kod.length !== 6 || yukleniyor}
                className="mt-6 w-full py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {yukleniyor ? 'Bağlanıyor...' : 'Oyuna Katıl'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── BEKLEME ──────────────────────────────────────────────────────── */}
        {asama === 'bekleme' && (
          <motion.div
            key="bekleme"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[480px] mx-auto px-4 py-3"
          >
            <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="size-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm mb-2">Oyuna katıldın!</p>
              <div className="text-5xl font-black tracking-[0.2em] text-primary mb-6">
                {aktifKod}
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Users className="size-4" />
                <span className="font-semibold">{kahoot.oyuncuSayisi}</span>
                <span className="text-sm">oyuncu katıldı</span>
              </div>
              <p className="text-muted-foreground text-sm mt-6 animate-pulse">
                Öğretmenin oyunu başlatmasını bekle...
              </p>
            </div>
          </motion.div>
        )}

        {/* ── CEVAP VERİLDİ ───────────────────────────────────────────────── */}
        {asama === 'cevap-verildi' && (
          <motion.div
            key="cevap"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[calc(100dvh-4rem)] flex items-center justify-center px-4"
          >
          <div className={cn(
            'w-full max-w-[480px] rounded-2xl border shadow-sm p-10 text-center',
            kahoot.cevapDogru === false ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border'
          )}>
            {kahoot.cevapDogru === false ? (
              <XCircle className="size-16 text-destructive mx-auto mb-4" />
            ) : (
              <CheckCircle className="size-16 text-correct mx-auto mb-4" />
            )}
            <p className="text-xl font-bold text-foreground mb-2">
              {kahoot.cevapDogru === false ? 'Yanlış cevap' : 'Doğru cevap!'}
            </p>
            <div className="text-5xl font-black text-primary">
              +{kahoot.kazanilanPuan}
            </div>
            <p className="text-muted-foreground text-sm mt-2">puan</p>
            <p className="text-muted-foreground text-sm mt-4 animate-pulse">
              Sıradaki soru bekleniyor...
            </p>
          </div>
          </motion.div>
        )}

        {/* ── ARA LEADERBOARD ──────────────────────────────────────────────── */}
        {asama === 'leaderboard-ara' && (
          <motion.div
            key="ara-lb"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[480px] mx-auto px-4 py-3"
          >
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="bg-foreground px-6 py-4 text-center">
                <Trophy className="size-6 text-secondary mx-auto mb-1" />
                <p className="text-primary-foreground font-bold">Ara Sıralama</p>
              </div>
              <div className="divide-y divide-border">
                {araLeaderboard.slice(0, 5).map(s => (
                  <div key={s.userId} className={cn(
                    'flex items-center justify-between px-6 py-3',
                    s.sira === 1 ? 'bg-secondary/10' : ''
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-black',
                        s.sira <= 3 ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {s.sira}
                      </span>
                      <span className="font-medium text-foreground">{s.ad}</span>
                    </div>
                    <span className="font-bold text-primary">{s.toplamPuan}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-sm text-center py-4 animate-pulse">
                Sıradaki soru geliyor...
              </p>
            </div>
          </motion.div>
        )}

        {/* ── OYUN BİTTİ ───────────────────────────────────────────────────── */}
        {asama === 'bitti' && (
          <motion.div
            key="bitti"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-[480px] mx-auto px-4 py-3"
          >
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary-dark px-6 py-8 text-center">
                <Trophy className="size-12 text-secondary mx-auto mb-2" />
                <h2 className="text-2xl font-black text-primary-foreground">Oyun Bitti!</h2>
              </div>
              <div className="p-4 space-y-2">
                {kahoot.leaderboard.map(s => (
                  <div key={s.userId} className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl border',
                    s.ad === user.name + ' ' + user.surname
                      ? 'bg-primary/10 border-primary/20'
                      : s.sira === 1 ? 'bg-secondary/10 border-secondary/30'
                      : 'bg-muted/40 border-border'
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black',
                        s.sira === 1 ? 'bg-secondary text-secondary-foreground' :
                        s.sira === 2 ? 'bg-slate-300 text-slate-700' :
                        s.sira === 3 ? 'bg-accent text-accent-foreground' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {s.sira}
                      </span>
                      <span className="font-semibold text-foreground">{s.ad}</span>
                    </div>
                    <span className="font-bold text-primary">{s.toplamPuan} puan</span>
                  </div>
                ))}
              </div>
              <div className="p-4 pt-0">
                <Link
                  href="/pano"
                  className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  Panoya Dön
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {kahoot.hata && (
        <div className="max-w-[480px] mx-auto px-4 mt-4">
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-4 py-3">
            <AlertCircle className="size-4 shrink-0" />
            {kahoot.hata}
          </div>
        </div>
      )}
    </div>
  );
}
