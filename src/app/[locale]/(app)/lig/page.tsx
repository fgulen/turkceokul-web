'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { AppNav } from '@/components/app-nav';
import { Award, Clock, Info, User } from 'lucide-react';

// --- Sabitler ---
const TERFI_ESIGI = 10;
const DUSME_ESIGI = 25;

const LIG_INFO = [
  { ad: 'Bronz',    renk: '#a16207', acik: '#fef3c7' },
  { ad: 'Gümüş',   renk: '#6b7280', acik: '#f1f5f9' },
  { ad: 'Altın',   renk: '#eab308', acik: '#fefce8' },
  { ad: 'Elmas',   renk: '#3b82f6', acik: '#eff6ff' },
  { ad: 'Zümrüt',  renk: '#10b981', acik: '#ecfdf5' },
  { ad: 'Ametist', renk: '#8b5cf6', acik: '#f5f3ff' },
  { ad: 'İnci',    renk: '#e879f9', acik: '#fdf4ff' },
  { ad: 'Safir',   renk: '#0ea5e9', acik: '#f0f9ff' },
  { ad: 'Yakut',   renk: '#ef4444', acik: '#fef2f2' },
  { ad: 'Taç',     renk: '#9333ea', acik: '#faf5ff' },
];

interface LigSatir {
  sira: number;
  userId: number;
  name: string;
  haftalikXp: number;
  benimSatir: boolean;
}

interface LigTablo {
  ligAdi: string;
  seviye: number;
  haftaBitis: string;
  tablo: LigSatir[];
}

// --- Helpers ---
function getMotivasyon(sira: number): { mesaj: string; renk: string } {
  if (sira <= TERFI_ESIGI)
    return { mesaj: 'Terfi bölgesindesin! Sıranı koru.', renk: 'text-correct' };
  const terfiIcin = sira - TERFI_ESIGI;
  if (terfiIcin <= 5)
    return { mesaj: `${terfiIcin} kişiyi geç, bir üst lige çık!`, renk: 'text-primary' };
  if (sira <= DUSME_ESIGI)
    return { mesaj: 'Güvenli bölgedesin, devam et.', renk: 'text-muted-foreground' };
  return { mesaj: `Dikkat! ${sira - DUSME_ESIGI} kişiyi geç, düşmekten kaçın.`, renk: 'text-wrong' };
}

function kalanSure(haftaBitis: string) {
  const ms = new Date(haftaBitis).getTime() - Date.now();
  if (ms <= 0) return 'Bitti';
  const gun = Math.floor(ms / 86400000);
  const saat = Math.floor((ms % 86400000) / 3600000);
  const dk = Math.floor((ms % 3600000) / 60000);
  if (gun > 0) return `${gun} gün ${saat} saat kaldı`;
  if (saat > 0) return `${saat} saat ${dk} dk kaldı`;
  return `${dk} dk kaldı`;
}

function satırZonu(sira: number) {
  if (sira <= TERFI_ESIGI) return 'border-l-2 border-correct bg-correct/5';
  if (sira > DUSME_ESIGI)  return 'border-l-2 border-wrong  bg-wrong/5';
  return '';
}

// --- Alt Bileşenler ---
function LigYolu({ seviye }: { seviye: number }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-center gap-0 min-w-max mx-auto px-4">
        {LIG_INFO.map((lig, i) => {
          const ligSeviye = i + 1;
          const gecmis = ligSeviye < seviye;
          const aktif  = ligSeviye === seviye;
          const gelecek = ligSeviye > seviye;

          return (
            <div key={lig.ad} className="flex items-center">
              {/* Bağlantı çizgisi */}
              {i > 0 && (
                <div
                  className="w-5 h-0.5 shrink-0"
                  style={{ backgroundColor: gecmis || aktif ? lig.renk : '#e2e8f0' }}
                />
              )}

              {/* Lig dairesi */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full flex items-center justify-center transition-all shrink-0"
                  style={{
                    width:  aktif ? 40 : 26,
                    height: aktif ? 40 : 26,
                    backgroundColor: gelecek ? '#e2e8f0' : lig.renk,
                    boxShadow: aktif ? `0 0 0 3px ${lig.acik}, 0 0 0 5px ${lig.renk}40` : undefined,
                    opacity: gelecek ? 0.4 : 1,
                  }}
                >
                  {aktif && <Award className="text-white" style={{ width: 18, height: 18 }} />}
                  {gecmis && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                {/* Aktif ligin adı */}
                {aktif && (
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: lig.renk }}>
                    {lig.ad}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KisiselDurum({ sira, haftalikXp }: { sira: number; haftalikXp: number }) {
  const { mesaj, renk } = getMotivasyon(sira);
  return (
    <div className="w-full bg-card border border-border rounded-2xl px-5 py-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <div className="text-2xl font-black text-foreground">{sira}<span className="text-base font-semibold text-muted-foreground"> / 30</span></div>
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Sıran</div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="text-center">
          <div className="text-2xl font-black text-primary">{haftalikXp.toLocaleString('tr')}</div>
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Bu Hafta XP</div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="text-center">
          <div className="text-2xl font-black text-foreground">{TERFI_ESIGI}</div>
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Terfi Eşiği</div>
        </div>
      </div>
      <div className={`text-sm font-semibold text-center pt-3 border-t border-border ${renk}`}>
        {mesaj}
      </div>
    </div>
  );
}

// --- Ana Sayfa ---
export default function LigPage() {
  const { user, ready } = useAuthGuard();

  const { data: lig, isLoading } = useQuery<LigTablo>({
    queryKey: ['lig'],
    queryFn: () => api.get('/api/lig').then((r) => r.data),
    enabled: !!user,
  });

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const ligBilgi = lig ? LIG_INFO[lig.seviye - 1] : LIG_INFO[0];
  const benim = lig?.tablo?.find((s) => s.benimSatir);

  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      <main className="mt-16 mb-32 max-w-[600px] mx-auto px-4">

        {/* 1. Lig Yolu Şeridi */}
        <div className="mt-8 mb-6">
          <LigYolu seviye={lig?.seviye ?? 1} />
        </div>

        {/* 2. Lig Rozeti + Süre */}
        <div className="flex flex-col items-center mb-2">
          <div
            className="relative w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-lg"
            style={{ borderColor: ligBilgi.renk, backgroundColor: ligBilgi.acik }}
          >
            <div
              className="w-24 h-24 rounded-full flex flex-col items-center justify-center text-white"
              style={{ backgroundColor: ligBilgi.renk }}
            >
              <Award className="size-10 mb-0.5" />
              <span className="font-black text-base leading-tight text-center">
                {lig ? lig.ligAdi.toUpperCase() : '—'}
              </span>
            </div>
            {lig && (
              <div className="absolute -bottom-4 bg-card border border-border px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {kalanSure(lig.haftaBitis)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Kişisel Durum Kartı */}
        {benim && (
          <KisiselDurum sira={benim.sira} haftalikXp={benim.haftalikXp} />
        )}

        {/* 4. Leaderboard */}
        <div className="mt-6">
          {isLoading ? (
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
                  <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : lig && lig.tablo.length > 0 ? (
            <motion.div
              className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {lig.tablo.map((satir, i) => (
                <motion.div
                  key={satir.userId}
                  className={[
                    'flex items-center gap-4 px-5 py-3.5 transition-colors',
                    i < lig.tablo.length - 1 ? 'border-b border-border' : '',
                    satırZonu(satir.sira),
                    !satırZonu(satir.sira) && (satir.benimSatir ? 'bg-primary/8' : 'hover:bg-muted/40'),
                  ].filter(Boolean).join(' ')}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* Sıra */}
                  <div className="w-7 flex justify-center shrink-0">
                    {satir.sira === 1 && <Award className="size-5 text-yellow-500" />}
                    {satir.sira === 2 && <Award className="size-5 text-slate-400" />}
                    {satir.sira === 3 && <Award className="size-5 text-amber-500" />}
                    {satir.sira > 3 && <span className="font-black text-sm text-muted-foreground">{satir.sira}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="size-4 text-muted-foreground" />
                  </div>

                  {/* İsim */}
                  <div className="flex-grow min-w-0">
                    <span className={`text-sm truncate block ${satir.benimSatir ? 'font-black text-foreground' : 'font-medium text-muted-foreground'}`}>
                      {satir.name}{satir.benimSatir && ' (sen)'}
                    </span>
                  </div>

                  {/* XP */}
                  <div className="shrink-0">
                    <span className={`font-black text-sm ${satir.benimSatir ? 'text-primary' : 'text-muted-foreground'}`}>
                      {satir.haftalikXp.toLocaleString('tr')} XP
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="size-12 mx-auto mb-3 opacity-30" />
              <p>Henüz bir lig grubunda değilsin.</p>
              <p className="text-sm mt-1">İlk etkinliği tamamlayınca otomatik katılırsın.</p>
            </div>
          )}
        </div>

        {/* 5. Lig Kuralları */}
        {lig && lig.tablo.length > 0 && (
          <div className="mt-6 p-5 bg-card rounded-2xl border border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Info className="size-4 text-primary" />
              Lig Kuralları
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-correct shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">İlk {TERFI_ESIGI} oyuncu</span> bir üst lige terfi eder.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-wrong shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">Son {30 - DUSME_ESIGI} oyuncu</span> bir alt lige düşme tehlikesi yaşar.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
