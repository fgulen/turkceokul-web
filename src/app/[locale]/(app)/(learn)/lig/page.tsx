'use client';

import { useTranslations } from 'next-intl';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Award, Clock, Info, User } from 'lucide-react';

const TERFI_ESIGI = 10;
const DUSME_ESIGI = 25;

const LIG_INFO = [
  { ad: 'Bronz',    renk: '#92400e', acik: '#fef3c7' },
  { ad: 'Gümüş',   renk: '#475569', acik: '#f1f5f9' },
  { ad: 'Altın',   renk: '#b45309', acik: '#fffbeb' },
  { ad: 'Elmas',   renk: '#1b75bc', acik: '#dbeafe' },
  { ad: 'Zümrüt',  renk: '#15803d', acik: '#f0fdf4' },
  { ad: 'Ametist', renk: '#6d28d9', acik: '#f5f3ff' },
  { ad: 'İnci',    renk: '#be185d', acik: '#fdf2f8' },
  { ad: 'Safir',   renk: '#0369a1', acik: '#f0f9ff' },
  { ad: 'Yakut',   renk: '#b91c1c', acik: '#fef2f2' },
  { ad: 'Taç',     renk: '#3730a3', acik: '#eef2ff' },
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

function getMotivasyon(sira: number, t: (key: string, params?: any) => string): { mesaj: string; renk: string } {
  if (sira <= TERFI_ESIGI)
    return { mesaj: t('lig.motivationPromote'), renk: 'text-[#15803d]' };
  const terfiIcin = sira - TERFI_ESIGI;
  if (terfiIcin <= 5)
    return { mesaj: t('lig.motivationClose', { count: terfiIcin }), renk: 'text-primary' };
  if (sira <= DUSME_ESIGI)
    return { mesaj: t('lig.motivationSafe'), renk: 'text-muted-foreground' };
  return { mesaj: t('lig.motivationDanger', { count: sira - DUSME_ESIGI }), renk: 'text-[#b91c1c]' };
}

function kalanSure(haftaBitis: string, t: (key: string, params?: any) => string) {
  const ms = new Date(haftaBitis).getTime() - Date.now();
  if (ms <= 0) return t('lig.timeExpired');
  const gun = Math.floor(ms / 86400000);
  const saat = Math.floor((ms % 86400000) / 3600000);
  const dk = Math.floor((ms % 3600000) / 60000);
  if (gun > 0) return t('lig.timeRemaining', { days: gun, hours: saat });
  if (saat > 0) return t('lig.timeRemainingHours', { hours: saat, minutes: dk });
  return t('lig.timeRemainingMinutes', { minutes: dk });
}

function satırZonu(sira: number) {
  if (sira <= TERFI_ESIGI) return 'border-l-2 border-[#15803d] bg-[#f0fdf4]';
  if (sira > DUSME_ESIGI)  return 'border-l-2 border-[#b91c1c] bg-[#fef2f2]';
  return '';
}

function LigYolu({ seviye }: { seviye: number }) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="flex items-center justify-center gap-0 min-w-max mx-auto px-2 py-1">
        {LIG_INFO.map((lig, i) => {
          const ligSeviye = i + 1;
          const gecmis  = ligSeviye < seviye;
          const aktif   = ligSeviye === seviye;
          const gelecek = ligSeviye > seviye;

          return (
            <div key={lig.ad} className="flex items-center">
              {i > 0 && (
                <div
                  className="w-4 h-0.5 shrink-0"
                  style={{ backgroundColor: gecmis || aktif ? lig.renk : '#cbd5e1' }}
                />
              )}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className="rounded-full flex items-center justify-center transition-all shrink-0"
                  style={{
                    width:  aktif ? 36 : 22,
                    height: aktif ? 36 : 22,
                    backgroundColor: gelecek ? '#cbd5e1' : lig.renk,
                    boxShadow: aktif ? `0 0 0 3px ${lig.acik}, 0 0 0 5px ${lig.renk}50` : undefined,
                    opacity: gelecek ? 0.45 : 1,
                  }}
                >
                  {aktif && <Award className="text-white" style={{ width: 16, height: 16 }} />}
                  {gecmis && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                {aktif && (
                  <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: lig.renk }}>
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

export default function LigPage() {
  const t = useTranslations();
  const { user, ready } = useAuthGuard();

  const { data: lig, isLoading } = useQuery<LigTablo>({
    queryKey: ['lig'],
    queryFn: () => api.get('/api/lig').then((r) => r.data),
    enabled: !!user,
  });

  if (!ready) return (
    <div className="h-[calc(100dvh-4rem)] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const ligBilgi = lig ? LIG_INFO[lig.seviye - 1] : LIG_INFO[0];
  const benim = lig?.tablo?.find((s) => s.benimSatir);
  const { mesaj, renk } = benim ? getMotivasyon(benim.sira, t) : { mesaj: '', renk: '' };
  const timeLabel = lig ? kalanSure(lig.haftaBitis, t) : '';

  return (
    <div className="bg-background">
      <main className="max-w-[600px] mx-auto px-4 pt-3 pb-4">

        <div className="mb-3">
          <LigYolu seviye={lig?.seviye ?? 1} />
        </div>

        <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-4 py-4 mb-3 shadow-sm">
          <div
            className="relative shrink-0 w-20 h-20 rounded-full flex items-center justify-center border-[3px] shadow-md"
            style={{ borderColor: ligBilgi.renk, backgroundColor: ligBilgi.acik }}
          >
            <div
              className="w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center text-white"
              style={{ backgroundColor: ligBilgi.renk }}
            >
              <Award className="size-6 mb-0.5" />
              <span className="font-black text-[10px] leading-tight text-center px-1">
                {lig ? lig.ligAdi.toUpperCase() : '—'}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <div className="text-xl font-black text-foreground leading-none">
                  {benim?.sira ?? '—'}
                  <span className="text-sm font-semibold text-muted-foreground"> / 30</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">{t('lig.yourRank')}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-primary leading-none">
                  {(benim?.haftalikXp ?? 0).toLocaleString('tr')}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">{t('lig.weeklyXp')}</div>
              </div>
            </div>
            {lig && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
                <Clock className="size-3 shrink-0" />
                {timeLabel}
              </div>
            )}
            {benim && (
              <div className={`text-xs font-semibold ${renk} leading-snug`}>
                {mesaj}
              </div>
            )}
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
                  <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 h-3.5 bg-muted animate-pulse rounded" />
                  <div className="w-14 h-3.5 bg-muted animate-pulse rounded" />
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
                    'flex items-center gap-3 px-4 py-2.5 transition-colors',
                    i < lig.tablo.length - 1 ? 'border-b border-border/60' : '',
                    satırZonu(satir.sira),
                    !satırZonu(satir.sira) && (satir.benimSatir ? 'bg-primary/5' : 'hover:bg-muted/40'),
                  ].filter(Boolean).join(' ')}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    {satir.sira === 1 && <Award className="size-4 text-yellow-500" />}
                    {satir.sira === 2 && <Award className="size-4 text-slate-400" />}
                    {satir.sira === 3 && <Award className="size-4 text-amber-500" />}
                    {satir.sira > 3 && <span className="font-black text-xs text-muted-foreground">{satir.sira}</span>}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="size-3.5 text-muted-foreground" />
                  </div>

                  <div className="flex-grow min-w-0">
                    <span className={`text-sm truncate block ${satir.benimSatir ? 'font-black text-foreground' : 'font-medium text-muted-foreground'}`}>
                      {satir.name}{satir.benimSatir && ` ${t('lig.youLabel')}`}
                    </span>
                  </div>

                  <div className="shrink-0">
                    <span className={`font-black text-xs ${satir.benimSatir ? 'text-primary' : 'text-muted-foreground'}`}>
                      {satir.haftalikXp.toLocaleString('tr')} XP
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="size-12 mx-auto mb-3 opacity-30" />
              <p>{t('lig.noLeague')}</p>
              <p className="text-sm mt-1">{t('lig.noLeagueHint')}</p>
            </div>
          )}
        </div>

        {lig && lig.tablo.length > 0 && (
          <div className="mt-3 p-4 bg-card rounded-2xl border border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-2.5 flex items-center gap-2 text-sm">
              <Info className="size-4 text-primary" />
              {t('lig.rules')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#15803d] shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{t('lig.promoteRule', { count: TERFI_ESIGI })}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#b91c1c] shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{t('lig.demoteRule', { count: 30 - DUSME_ESIGI })}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
