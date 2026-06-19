'use client';

import { use, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, Users, Trophy, Wifi, ChevronRight, Square, AlertCircle } from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { useKahoot } from '@/hooks/use-kahoot';
import { cn } from '@/lib/utils';

export default function CanliKahootPage({ params }: { params: Promise<{ sinifId: string }> }) {
  const { sinifId } = use(params);
  const id = parseInt(sinifId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const storageKey = `kahoot_canli_${id}`;
  const [oyunKodu, setOyunKodu] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem(storageKey);
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [oyunBaslatildi, setOyunBaslatildi] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(`${storageKey}_started`) === '1'
  );
  const kahoot = useKahoot();

  const { data: sinif } = useQuery({
    queryKey: ['sinif', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}`).then(r => r.data),
    enabled: !!user,
  });

  // Oyun bitti (manuel EndGame veya otomatik son soru) → sessionStorage temizle
  useEffect(() => {
    if (kahoot.oyunBitti) {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(`${storageKey}_started`);
    }
  }, [kahoot.oyunBitti, storageKey]);

  // Hub hatası → kayıtlı kod artık geçersiz (sunucu yeniden başlatıldı vb.) → sıfırla
  useEffect(() => {
    if (kahoot.hata && oyunKodu) {
      sessionStorage.removeItem(storageKey);
      setOyunKodu(null);
      setOyunBaslatildi(false);
    }
  }, [kahoot.hata]); // eslint-disable-line react-hooks/exhaustive-deps

  // Oyun oluşturulunca (veya sessionStorage'dan geri yüklenince) hub'a bağlan
  useEffect(() => {
    if (!oyunKodu) return;
    (async () => {
      const ok = await kahoot.connect();
      if (ok) await kahoot.joinAsTeacher(oyunKodu);
    })();
  }, [oyunKodu, kahoot.connect, kahoot.joinAsTeacher]);

  async function oyunOlustur() {
    setLoading(true);
    try {
      const res = await api.post('/api/kahoot/olustur', { sinifId: id, etkinlikIdleri: [] });
      sessionStorage.setItem(storageKey, res.data.oyunKodu);
      setOyunKodu(res.data.oyunKodu);
    } finally {
      setLoading(false);
    }
  }

  async function oyunuBaslat() {
    if (!oyunKodu) return;
    await kahoot.startGame(oyunKodu);
    sessionStorage.setItem(`${storageKey}_started`, '1');
    setOyunBaslatildi(true);
  }

  async function sonrakiSoru() {
    if (!oyunKodu) return;
    await kahoot.nextQuestion(oyunKodu);
  }

  async function oyunuBitir() {
    if (!oyunKodu) return;
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(`${storageKey}_started`);
    await kahoot.endGame(oyunKodu);
  }

  const sonSoru = kahoot.soruBilgisi
    ? kahoot.soruBilgisi.soruNo === kahoot.soruBilgisi.toplamSoru
    : false;

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[800px] mx-auto px-4 py-8">
        <Link href={`/ogretmen/sinif/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="size-4" />
          Sınıfa dön
        </Link>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wifi className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Canlı Kahoot Modu</h1>
          <p className="text-muted-foreground mb-8">{sinif?.name ?? '...'}</p>

          {!oyunKodu ? (
            <div className="space-y-3">
              <button
                onClick={oyunOlustur}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Play className="size-5 fill-current" />
                {loading ? 'Oluşturuluyor...' : 'Demo Sorularla Başlat'}
              </button>
              <p className="text-xs text-muted-foreground">5 hazır Türkçe sorusu · Etkinlik seçimi yakında</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Katılım kodu */}
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-8">
                <p className="text-sm font-semibold text-primary/70 mb-2 uppercase tracking-wider">Oyun Kodu</p>
                <div className="text-6xl font-black tracking-[0.2em] text-primary">
                  {oyunKodu}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Öğrenciler navdaki <strong>Kahoot</strong> linkinden bu kodu girer
                </p>
              </div>

              {/* Canlı istatistikler */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/40 rounded-xl p-4 text-center border border-border">
                  <Users className="size-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-2xl font-bold text-foreground">{kahoot.oyuncuSayisi}</div>
                  <div className="text-xs text-muted-foreground">Katılan</div>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 text-center border border-border">
                  <Trophy className="size-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-2xl font-bold text-foreground">
                    {kahoot.soruBilgisi ? `${kahoot.soruBilgisi.soruNo}/${kahoot.soruBilgisi.toplamSoru}` : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">Soru</div>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 text-center border border-border">
                  <div className={cn(
                    'size-3 rounded-full mx-auto mb-2',
                    kahoot.connected ? 'bg-correct animate-pulse' : 'bg-destructive'
                  )} />
                  <div className="text-xs text-muted-foreground font-medium">
                    {kahoot.connected ? 'Bağlı' : 'Bağlantı yok'}
                  </div>
                </div>
              </div>

              {/* Kontroller */}
              <div className="flex gap-3 justify-center flex-wrap">
                {kahoot.oyunBitti ? (
                  /* Oyun bitti — XP kaydedildi */
                  <div className="w-full text-center py-4 px-6 bg-primary/5 border border-primary/20 rounded-2xl">
                    <Trophy className="size-8 text-secondary mx-auto mb-2" />
                    <p className="font-bold text-foreground">Oyun Bitti!</p>
                    <p className="text-sm text-muted-foreground mt-1">Puanlar öğrenci hesaplarına XP olarak eklendi.</p>
                    <Link
                      href={`/ogretmen/sinif/${id}`}
                      className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      <ArrowLeft className="size-4" />
                      Sınıfa Dön
                    </Link>
                  </div>
                ) : !oyunBaslatildi ? (
                  <button
                    onClick={oyunuBaslat}
                    disabled={!kahoot.connected || kahoot.oyuncuSayisi === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    <Play className="size-4 fill-current" />
                    Oyunu Başlat
                  </button>
                ) : (
                  <>
                    {/* Son soruda "Sonraki Soru" gizlenir */}
                    {!sonSoru && (
                      <button
                        onClick={sonrakiSoru}
                        disabled={!kahoot.connected}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        <ChevronRight className="size-4" />
                        Sonraki Soru
                      </button>
                    )}
                    <button
                      onClick={oyunuBitir}
                      disabled={!kahoot.connected}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-destructive/10 text-destructive rounded-xl font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      <Square className="size-4" />
                      Oyunu Bitir
                    </button>
                  </>
                )}
              </div>

              {/* Mevcut soru (demo modda gösterilir) */}
              {kahoot.soruBilgisi?.soru && (
                <div className="bg-muted/40 rounded-2xl border border-border p-6 text-left">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Soru {kahoot.soruBilgisi.soruNo} / {kahoot.soruBilgisi.toplamSoru}
                  </p>
                  <p className="text-lg font-bold text-foreground mb-4">{kahoot.soruBilgisi.soru}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((harf, i) => {
                      const renkler = ['bg-red-500', 'bg-blue-500', 'bg-amber-400', 'bg-green-500'];
                      const metin = kahoot.soruBilgisi?.[`sec${harf}` as keyof typeof kahoot.soruBilgisi] as string | undefined;
                      if (!metin) return null;
                      return (
                        <div key={harf} className={cn('rounded-xl px-3 py-2 flex items-center gap-2', renkler[i])}>
                          <span className="text-white font-black text-sm">{harf}</span>
                          <span className="text-white text-xs font-medium">{metin}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              {kahoot.leaderboard.length > 0 && (
                <div className="text-left space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Anlık Sıralama
                  </p>
                  {kahoot.leaderboard.slice(0, 10).map(s => (
                    <div key={s.userId} className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl border',
                      s.sira === 1 ? 'bg-secondary/10 border-secondary/30' :
                      s.sira === 2 ? 'bg-muted/40 border-border' :
                      s.sira === 3 ? 'bg-accent/10 border-accent/20' :
                      'bg-card border-border'
                    )}>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-sm font-black',
                          s.sira === 1 ? 'bg-secondary text-secondary-foreground' :
                          s.sira === 2 ? 'bg-slate-300 text-slate-700' :
                          s.sira === 3 ? 'bg-accent text-accent-foreground' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {s.sira}
                        </span>
                        <span className="font-medium text-foreground">{s.ad}</span>
                      </div>
                      <span className="font-bold text-primary">{s.toplamPuan} puan</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {kahoot.hata && (
            <div className="mt-4 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-4 py-3">
              <AlertCircle className="size-4 shrink-0" />
              {kahoot.hata}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
