'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Users, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { useKahoot, type LeaderboardSatir } from '@/hooks/use-kahoot';
import { cn } from '@/lib/utils';

type Asama = 'kod-giris' | 'bekleme' | 'soru' | 'cevap-verildi' | 'leaderboard-ara' | 'bitti';

const CEVAP_RENKLERI = [
  { harf: 'A', bg: 'bg-red-500 hover:bg-red-600', shadow: 'shadow-red-300' },
  { harf: 'B', bg: 'bg-blue-500 hover:bg-blue-600', shadow: 'shadow-blue-300' },
  { harf: 'C', bg: 'bg-amber-400 hover:bg-amber-500', shadow: 'shadow-amber-300' },
  { harf: 'D', bg: 'bg-emerald-500 hover:bg-emerald-600', shadow: 'shadow-emerald-300' },
];

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

  // Oyun başladığında geri sayımı başlat
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

  // Hub event'lerine göre aşama geçişleri
  useEffect(() => {
    if (kahoot.oyunBasladi && asama === 'bekleme') setAsama('soru');
  }, [kahoot.oyunBasladi, asama]);

  useEffect(() => {
    if (kahoot.cevapAlindi && asama === 'soru') setAsama('cevap-verildi');
  }, [kahoot.cevapAlindi, asama]);

  useEffect(() => {
    if (kahoot.leaderboard.length > 0 && (asama === 'cevap-verildi' || asama === 'soru')) {
      setAraLeaderboard(kahoot.leaderboard);
      setAsama('leaderboard-ara');
    }
  }, [kahoot.leaderboard]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (kahoot.soruBilgisi && asama === 'leaderboard-ara') setAsama('soru');
  }, [kahoot.soruBilgisi, asama]);

  useEffect(() => {
    if (kahoot.oyunBitti) setAsama('bitti');
  }, [kahoot.oyunBitti]);

  async function oyunaKatil() {
    if (!kod.trim()) return;
    setYukleniyor(true);
    setHataMsg('');
    const girilenKod = kod.trim().toUpperCase();
    try {
      await api.get(`/api/kahoot/kontrol/${girilenKod}`);
      await kahoot.connect();
      await kahoot.joinGame(girilenKod);
      setAktifKod(girilenKod);
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />
      <main className="max-w-[480px] mx-auto px-4 py-10">
        <AnimatePresence mode="wait">

          {/* KOD GİRİŞ */}
          {asama === 'kod-giris' && (
            <motion.div
              key="kod"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center"
            >
              <div className="size-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wifi className="size-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Kahoot'a Katıl</h1>
              <p className="text-slate-500 text-sm mb-8">
                Öğretmenden aldığın 6 haneli kodu gir
              </p>

              <input
                type="text"
                value={kod}
                onChange={e => setKod(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && oyunaKatil()}
                maxLength={6}
                placeholder="ABCD12"
                className="w-full text-center text-3xl font-black tracking-[0.25em] uppercase border-2 border-slate-200 rounded-2xl px-4 py-4 focus:outline-none focus:border-emerald-400 transition-colors"
                autoFocus
              />

              {hataMsg && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {hataMsg}
                </div>
              )}

              <button
                onClick={oyunaKatil}
                disabled={kod.length !== 6 || yukleniyor}
                className="mt-6 w-full py-4 bg-emerald-500 text-white rounded-2xl text-lg font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {yukleniyor ? 'Bağlanıyor...' : 'Oyuna Katıl'}
              </button>
            </motion.div>
          )}

          {/* BEKLEME */}
          {asama === 'bekleme' && (
            <motion.div
              key="bekleme"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center"
            >
              <div className="size-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="size-8 text-emerald-500" />
              </div>
              <p className="text-slate-500 text-sm mb-2">Oyuna katıldın!</p>
              <div className="text-5xl font-black tracking-[0.2em] text-emerald-600 mb-6">
                {aktifKod}
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Users className="size-4" />
                <span className="font-semibold">{kahoot.oyuncuSayisi}</span>
                <span className="text-sm">oyuncu katıldı</span>
              </div>
              <p className="text-slate-400 text-sm mt-6 animate-pulse">
                Öğretmenin oyunu başlatmasını bekle...
              </p>
            </motion.div>
          )}

          {/* SORU (Kahoot tarzı renkli butonlar) */}
          {asama === 'soru' && (
            <motion.div
              key={`soru-${kahoot.soruBilgisi?.soruNo}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Üst bar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                  <span>Soru {kahoot.soruBilgisi?.soruNo} / {kahoot.soruBilgisi?.toplamSoru}</span>
                  <span className={cn(
                    'font-bold text-base tabular-nums',
                    geriSayim <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-700'
                  )}>
                    {geriSayim}s
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(geriSayim / 30) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </div>

              {/* Cevap butonları */}
              <div className="grid grid-cols-2 gap-3">
                {CEVAP_RENKLERI.map(({ harf, bg, shadow }) => (
                  <motion.button
                    key={harf}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cevapGonder(harf)}
                    className={cn(
                      'aspect-square rounded-2xl text-white font-black text-5xl shadow-lg transition-transform',
                      bg, `shadow-md ${shadow}`
                    )}
                  >
                    {harf}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* CEVAP VERİLDİ */}
          {asama === 'cevap-verildi' && (
            <motion.div
              key="cevap"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center"
            >
              <CheckCircle className="size-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-700 mb-2">Cevabın alındı!</p>
              <div className="text-4xl font-black text-emerald-600">
                +{kahoot.kazanilanPuan}
              </div>
              <p className="text-slate-400 text-sm mt-2">puan</p>
              <p className="text-slate-400 text-sm mt-4 animate-pulse">
                Sıradaki soru bekleniyor...
              </p>
            </motion.div>
          )}

          {/* ARA LEADERBOARD */}
          {asama === 'leaderboard-ara' && (
            <motion.div
              key="ara-lb"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="bg-slate-800 px-6 py-4 text-center">
                <Trophy className="size-6 text-amber-400 mx-auto mb-1" />
                <p className="text-white font-bold">Ara Sıralama</p>
              </div>
              <div className="divide-y divide-slate-50">
                {araLeaderboard.slice(0, 5).map(s => (
                  <div key={s.userId} className={cn(
                    'flex items-center justify-between px-6 py-3',
                    s.sira === 1 ? 'bg-amber-50' : ''
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-black',
                        s.sira <= 3 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'
                      )}>
                        {s.sira}
                      </span>
                      <span className="font-medium text-slate-800">{s.ad}</span>
                    </div>
                    <span className="font-bold text-primary">{s.toplamPuan}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm text-center py-4 animate-pulse">
                Sıradaki soru geliyor...
              </p>
            </motion.div>
          )}

          {/* OYUN BİTTİ */}
          {asama === 'bitti' && (
            <motion.div
              key="bitti"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-8 text-center">
                <Trophy className="size-12 text-white mx-auto mb-2" />
                <h2 className="text-2xl font-black text-white">Oyun Bitti!</h2>
              </div>
              <div className="p-4 space-y-2">
                {kahoot.leaderboard.map(s => (
                  <div key={s.userId} className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl',
                    s.ad === user.name + ' ' + user.surname
                      ? 'bg-primary/10 border border-primary/20'
                      : s.sira === 1 ? 'bg-amber-50 border border-amber-200'
                      : 'bg-slate-50 border border-slate-100'
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black',
                        s.sira === 1 ? 'bg-amber-400 text-white' :
                        s.sira === 2 ? 'bg-slate-300 text-slate-700' :
                        s.sira === 3 ? 'bg-orange-300 text-white' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {s.sira}
                      </span>
                      <span className="font-semibold text-slate-800">{s.ad}</span>
                    </div>
                    <span className="font-bold text-primary">{s.toplamPuan} puan</span>
                  </div>
                ))}
              </div>
              <div className="p-4 pt-0">
                <a
                  href="/pano"
                  className="block w-full text-center py-3 bg-primary text-white rounded-xl font-semibold text-sm"
                >
                  Panoya Dön
                </a>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {kahoot.hata && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle className="size-4 shrink-0" />
            {kahoot.hata}
          </div>
        )}
      </main>
    </div>
  );
}
