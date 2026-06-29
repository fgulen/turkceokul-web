'use client';

import { use, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Play, Users, Trophy, Wifi, ChevronRight,
  Square, AlertCircle, Sparkles, BookOpen, Check, Search,
} from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { useKahoot } from '@/hooks/use-kahoot';
import { cn, toMediaUrl } from '@/lib/utils';

interface KahootEtkinlik {
  id: string;
  name: string;
  etkinlikTuruId: string;
  turuAdi: string;
  isAiGenerated: boolean;
  soruSayisi: number;
  kitapId: string;
  kitapAdi: string;
  uniteId: string;
  uniteAdi: string;
}

// ── Etkinlik Seçim Ekranı ─────────────────────────────────────────────────────
function EtkinlikSecimEkrani({
  sinifId,
  onBaslat,
}: {
  sinifId: number;
  onBaslat: (etkinlikIdleri: string[]) => void;
}) {
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [arama, setArama] = useState('');
  const [kitapFiltre, setKitapFiltre] = useState('');
  const [uniteFiltre, setUniteFiltre] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: etkinlikler = [], isLoading } = useQuery<KahootEtkinlik[]>({
    queryKey: ['kahoot-secim-etkinlikler'],
    queryFn: () => api.get('/api/kahoot/secim-etkinlikler').then(r => r.data),
  });

  // Benzersiz kitaplar (sıralı)
  const kitaplar = [...new Map(etkinlikler.map(e => [e.kitapId, e.kitapAdi])).entries()];

  // Seçili kitaba göre üniteler
  const uniteler = kitapFiltre
    ? [...new Map(
        etkinlikler
          .filter(e => e.kitapId === kitapFiltre)
          .map(e => [e.uniteId, e.uniteAdi])
      ).entries()]
    : [];

  const filtrelenmis = etkinlikler.filter(e => {
    if (kitapFiltre && e.kitapId !== kitapFiltre) return false;
    if (uniteFiltre && e.uniteId !== uniteFiltre) return false;
    if (arama && !e.name.toLowerCase().includes(arama.toLowerCase())) return false;
    return true;
  });

  function toggle(id: string) {
    setSecili(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBaslat(demo: boolean) {
    setLoading(true);
    try {
      onBaslat(demo ? [] : [...secili]);
    } finally {
      setLoading(false);
    }
  }

  const toplamSoru = [...secili]
    .map(id => etkinlikler.find(e => e.id === id)?.soruSayisi ?? 0)
    .reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Üst bilgi */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">Etkinlik Seç</h2>
          <p className="text-sm text-muted-foreground">
            Kahoot'ta oynamak istediğin quiz etkinliklerini seç.
          </p>
        </div>
        {secili.size > 0 && (
          <div className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-lg">
            {secili.size} etkinlik · {toplamSoru} soru
          </div>
        )}
      </div>

      {/* Filtreler */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={kitapFiltre}
            onChange={e => { setKitapFiltre(e.target.value); setUniteFiltre(''); }}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Tüm kitaplar</option>
            {kitaplar.map(([id, adi]) => (
              <option key={id} value={id}>{adi}</option>
            ))}
          </select>
          <select
            value={uniteFiltre}
            onChange={e => setUniteFiltre(e.target.value)}
            disabled={!kitapFiltre}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
          >
            <option value="">Tüm üniteler</option>
            {uniteler.map(([id, adi]) => (
              <option key={id} value={id}>{adi}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder="Etkinlik ara..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Yükleniyor...</div>
        ) : filtrelenmis.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {arama ? 'Sonuç bulunamadı.' : 'Uygun quiz etkinliği yok.'}
          </div>
        ) : (
          filtrelenmis.map(e => {
            const checked = secili.has(e.id);
            return (
              <button
                key={e.id}
                onClick={() => toggle(e.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  checked
                    ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                    : 'bg-card border-border hover:bg-muted/40'
                )}
              >
                {/* Checkbox */}
                <div className={cn(
                  'size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                  checked ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {checked && <Check className="size-3 text-primary-foreground" />}
                </div>

                {/* İkon */}
                <div className={cn(
                  'size-8 rounded-lg flex items-center justify-center shrink-0',
                  e.isAiGenerated ? 'bg-fuchsia-100' : 'bg-blue-100'
                )}>
                  {e.isAiGenerated
                    ? <Sparkles className="size-4 text-fuchsia-600" />
                    : <BookOpen className="size-4 text-blue-600" />}
                </div>

                {/* Metin */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {e.isAiGenerated ? `${e.soruSayisi} soru` : `${e.kitapAdi} · ${e.uniteAdi} · ${e.soruSayisi} soru`}
                  </p>
                </div>

                {/* Tür badge */}
                <span className="text-xs text-muted-foreground shrink-0">
                  {e.isAiGenerated ? 'AI' : e.turuAdi}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Butonlar */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => handleBaslat(false)}
          disabled={secili.size === 0 || loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40"
        >
          <Play className="size-4 fill-current" />
          {loading ? 'Oluşturuluyor...' : `Başlat (${toplamSoru} soru)`}
        </button>
        <button
          onClick={() => handleBaslat(true)}
          disabled={loading}
          className="px-4 py-3 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-40"
        >
          Demo
        </button>
      </div>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function CanliKahootPage({ params }: { params: Promise<{ sinifId: string }> }) {
  const { sinifId } = use(params);
  const id = parseInt(sinifId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const storageKey = `kahoot_canli_${id}`;

  const [oyunKodu, setOyunKodu] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem(storageKey);
    return null;
  });
  const [oyunBaslatildi, setOyunBaslatildi] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(`${storageKey}_started`) === '1'
  );
  const [geriSayim, setGeriSayim] = useState(30);
  const kahoot = useKahoot();

  const { data: sinif } = useQuery({
    queryKey: ['sinif', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}`).then(r => r.data),
    enabled: !!user,
  });

  useEffect(() => {
    if (kahoot.oyunBitti) {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(`${storageKey}_started`);
    }
  }, [kahoot.oyunBitti, storageKey]);

  useEffect(() => {
    if (!kahoot.soruBilgisi || kahoot.oyunBitti) return;
    setGeriSayim(30);
    const timer = setInterval(() => {
      setGeriSayim(p => {
        if (p <= 1) { clearInterval(timer); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [kahoot.soruBilgisi?.soruNo, kahoot.oyunBitti]);

  useEffect(() => {
    if (kahoot.hata && oyunKodu) {
      sessionStorage.removeItem(storageKey);
      setOyunKodu(null);
      setOyunBaslatildi(false);
    }
  }, [kahoot.hata]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!oyunKodu) return;
    (async () => {
      const ok = await kahoot.connect();
      if (ok) await kahoot.joinAsTeacher(oyunKodu);
    })();
  }, [oyunKodu, kahoot.connect, kahoot.joinAsTeacher]);

  // Hub'dan gelen OyunDurumu gerçek başlatılma durumunu söylediğinde sessionStorage'ı güncelle
  useEffect(() => {
    if (kahoot.oyunDurumuBaslatildi === null) return;
    if (!kahoot.oyunDurumuBaslatildi) {
      sessionStorage.removeItem(`${storageKey}_started`);
      setOyunBaslatildi(false);
    }
  }, [kahoot.oyunDurumuBaslatildi]); // eslint-disable-line react-hooks/exhaustive-deps

  async function oyunOlustur(etkinlikIdleri: string[]) {
    const res = await api.post('/api/kahoot/olustur', { sinifId: id, etkinlikIdleri });
    sessionStorage.setItem(storageKey, res.data.oyunKodu);
    sessionStorage.removeItem(`${storageKey}_started`);
    setOyunBaslatildi(false);
    setOyunKodu(res.data.oyunKodu);
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
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const leaderboardRows = kahoot.leaderboard.slice(0, 10).map(s => (
    <div key={s.userId} className={cn(
      'flex items-center justify-between px-3 py-2.5 rounded-xl border',
      s.sira === 1 ? 'bg-secondary/10 border-secondary/30' :
      s.sira === 2 ? 'bg-muted/40 border-border' :
      s.sira === 3 ? 'bg-accent/10 border-accent/20' :
      'bg-card border-border'
    )}>
      <div className="flex items-center gap-2">
        <span className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0',
          s.sira === 1 ? 'bg-secondary text-secondary-foreground' :
          s.sira === 2 ? 'bg-slate-300 text-slate-700' :
          s.sira === 3 ? 'bg-accent text-accent-foreground' :
          'bg-muted text-muted-foreground'
        )}>
          {s.sira}
        </span>
        <span className="font-medium text-foreground text-sm truncate">{s.ad}</span>
      </div>
      <span className="font-bold text-primary text-sm shrink-0">{s.toplamPuan}</span>
    </div>
  ));

  return (
    <div className="min-h-[100dvh] bg-background">
      <main className="max-w-[1100px] mx-auto px-4 py-6">
        <Link href={`/ogretmen/sinif/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" />
          Sınıfa dön
        </Link>

        {/* Başlık + sınıf adı */}
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Wifi className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Canlı Kahoot</h1>
            <p className="text-sm text-muted-foreground">{sinif?.name ?? '...'}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6">
          {!oyunKodu ? (
            // ── Etkinlik Seçim ───────────────────────────────────────────────
            <EtkinlikSecimEkrani sinifId={id} onBaslat={oyunOlustur} />
          ) : (
            // ── Oyun Ekranı: sol sütun + sağ sütun (leaderboard) ─────────────
            <div className="lg:grid lg:grid-cols-[1fr_272px] lg:gap-5">

              {/* ── Sol / Ana ── */}
              <div className="space-y-4">

                {/* Katılım kodu — daha küçük */}
                <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 sm:p-6 text-center">
                  <p className="text-xs font-semibold text-primary/70 mb-1 uppercase tracking-wider">Oyun Kodu</p>
                  <div className="text-4xl sm:text-5xl font-black tracking-[0.2em] text-primary leading-none">{oyunKodu}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Öğrenciler nav&apos;daki <strong>Kahoot</strong> linkinden bu kodu girer
                  </p>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/40 rounded-xl p-3 text-center border border-border">
                    <Users className="size-4 text-muted-foreground mx-auto mb-1" />
                    <div className="text-xl font-bold text-foreground">{kahoot.oyuncuSayisi}</div>
                    <div className="text-xs text-muted-foreground">Katılan</div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center border border-border">
                    <Trophy className="size-4 text-muted-foreground mx-auto mb-1" />
                    <div className="text-xl font-bold text-foreground">
                      {kahoot.soruBilgisi ? `${kahoot.soruBilgisi.soruNo}/${kahoot.soruBilgisi.toplamSoru}` : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">Soru</div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center border border-border">
                    <div className={cn('size-3 rounded-full mx-auto mb-1.5', kahoot.connected ? 'bg-correct animate-pulse' : 'bg-destructive')} />
                    <div className="text-xs text-muted-foreground font-medium">
                      {kahoot.connected ? 'Bağlı' : 'Bağlantı yok'}
                    </div>
                  </div>
                </div>

                {/* Timer */}
                {oyunBaslatildi && !kahoot.oyunBitti && kahoot.soruBilgisi && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-1000 ease-linear', geriSayim <= 5 ? 'bg-destructive' : 'bg-primary')}
                        style={{ width: `${(geriSayim / 30) * 100}%` }}
                      />
                    </div>
                    <span className={cn('text-3xl font-black tabular-nums w-12 text-center shrink-0', geriSayim <= 5 ? 'text-destructive animate-pulse' : 'text-foreground')}>
                      {geriSayim}
                    </span>
                  </div>
                )}

                {/* Kontroller */}
                <div className="flex gap-3 justify-center flex-wrap">
                  {kahoot.oyunBitti ? (
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

                {/* Mevcut soru — daha büyük */}
                {!kahoot.oyunBitti && kahoot.soruBilgisi?.soru && (
                  <div className="bg-muted/40 rounded-2xl border border-border p-4 sm:p-6 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Soru {kahoot.soruBilgisi.soruNo} / {kahoot.soruBilgisi.toplamSoru}
                      </p>
                      {kahoot.soruBilgisi.turuAdi && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {kahoot.soruBilgisi.turuAdi}
                        </span>
                      )}
                    </div>
                    {kahoot.soruBilgisi.resimUrl && (
                      <img src={toMediaUrl(kahoot.soruBilgisi.resimUrl) ?? ''} alt="" className="w-full max-h-48 rounded-xl object-contain mb-3 bg-slate-50" />
                    )}
                    <p className="text-xl sm:text-2xl font-bold text-foreground mb-4 whitespace-pre-wrap">{kahoot.soruBilgisi.soru}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((harf, i) => {
                        const renkler = ['bg-red-500', 'bg-blue-500', 'bg-amber-400', 'bg-green-500'];
                        const metin = kahoot.soruBilgisi?.[`sec${harf}` as keyof typeof kahoot.soruBilgisi] as string | undefined;
                        if (!metin) return null;
                        return (
                          <div key={harf} className={cn('rounded-xl px-4 py-3 flex items-center gap-2', renkler[i])}>
                            <span className="text-white font-black text-base shrink-0">{harf}</span>
                            <span className="text-white text-sm font-semibold">{metin}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Leaderboard — sadece mobilde (lg'de sağda gösteriliyor) */}
                {kahoot.leaderboard.length > 0 && (
                  <div className="lg:hidden space-y-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anlık Sıralama</p>
                    {leaderboardRows}
                  </div>
                )}
              </div>

              {/* ── Sağ Panel: Leaderboard (sadece lg+) ── */}
              {kahoot.leaderboard.length > 0 && (
                <div className="hidden lg:block">
                  <div className="sticky top-20">
                    <div className="bg-muted/30 border border-border rounded-2xl p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Trophy className="size-3.5" />
                        Anlık Sıralama
                      </p>
                      <div className="space-y-2 max-h-[calc(100dvh-12rem)] overflow-y-auto scrollbar-thin">
                        {leaderboardRows}
                      </div>
                    </div>
                  </div>
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
