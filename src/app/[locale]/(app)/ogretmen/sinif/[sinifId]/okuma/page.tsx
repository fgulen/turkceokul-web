'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle2, Lock, Unlock, AlertTriangle, ChevronLeft, BookOpen } from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { toast } from 'sonner';

interface BolumDurumu {
  id: string;
  name: string;
  durum: 'kilitli' | 'acildi' | 'tamamlandi';
  bitisTarihi: string | null;
}

interface OgrenciRow {
  userId: number;
  ad: string;
  bolumler: BolumDurumu[];
  sonGiris: string | null;
  tamamlananBolum: number;
}

interface OkumaIlerleme {
  atama: { dersKitabiId: string; baslik: string; teslimTarihi: string | null } | null;
  bolumler: { id: string; name: string; orderNo: number }[];
  ogrenciler: OgrenciRow[];
}

function riskSeviyesi(sonGiris: string | null): 'normal' | 'risk' {
  if (!sonGiris) return 'risk';
  const fark = (Date.now() - new Date(sonGiris).getTime()) / (1000 * 60 * 60 * 24);
  return fark >= 3 ? 'risk' : 'normal';
}

export default function OkumaIlerlemePage({
  params,
}: {
  params: Promise<{ sinifId: string; locale: string }>;
}) {
  useAuthGuard('Ogretmen');
  const { sinifId } = use(params);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery<OkumaIlerleme>({
    queryKey: ['ogretmen-okuma', sinifId],
    queryFn: () => api.get(`/api/ogretmen/sinif/${sinifId}/okuma`).then(r => r.data),
  });

  const bolumAcMut = useMutation({
    mutationFn: ({ uniteId, userId }: { uniteId: string; userId?: number }) =>
      api.post('/api/ogretmen/okuma/bolum-ac', { sinifId: parseInt(sinifId, 10), uniteId, userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ogretmen-okuma', sinifId] }),
    onError: () => toast.error('Bölüm açılamadı. Lütfen tekrar deneyin.'),
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#F3F4F6]">
        <div className="max-w-[1000px] mx-auto px-4 py-8">
          <div className="p-8 text-muted-foreground">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[100dvh] bg-[#F3F4F6]">
        <div className="max-w-[1000px] mx-auto px-4 py-8">
          <div className="p-8 text-red-600">
            Sınıf verisi yüklenemedi.{' '}
            <Link href="/ogretmen" className="underline">
              Geri dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (!data.atama) {
    return (
      <div className="min-h-[100dvh] bg-[#F3F4F6]">
        <div className="max-w-[1000px] mx-auto px-4 py-8">
          <Link
            href={`/ogretmen/sinif/${sinifId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ChevronLeft className="size-4" />
            Sınıfa dön
          </Link>
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center">
            <BookOpen className="size-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Bu sınıfa henüz okuma kitabı atanmamış.</p>
            <p className="text-slate-400 text-sm mt-1">
              Sınıf sayfasından bir okuma kitabı atayın.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const gecikmisMi =
    data.atama.teslimTarihi && new Date(data.atama.teslimTarihi) < new Date();

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">
      <div className="max-w-[1000px] mx-auto px-4 py-8 space-y-6">
        {/* Geri + Başlık */}
        <div>
          <Link
            href={`/ogretmen/sinif/${sinifId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ChevronLeft className="size-4" />
            Sınıfa dön
          </Link>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                <BookOpen className="size-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{data.atama.baslik}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {data.bolumler.length} bölüm · {data.ogrenciler.length} öğrenci
                </p>
              </div>
            </div>
            {data.atama.teslimTarihi && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                gecikmisMi
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-600',
              )}>
                {gecikmisMi && <AlertTriangle className="size-3" />}
                Son tarih: {new Date(data.atama.teslimTarihi).toLocaleDateString('tr-TR')}
              </div>
            )}
          </div>
        </div>

        {/* Matris tablosu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-5 font-medium text-slate-500 whitespace-nowrap">
                    Öğrenci
                  </th>
                  {data.bolumler.map(b => (
                    <th
                      key={b.id}
                      className="text-center py-3 px-3 font-medium text-slate-500 min-w-[90px]"
                    >
                      <span className="text-xs leading-tight block">
                        {b.name.length > 14 ? b.name.slice(0, 12) + '…' : b.name}
                      </span>
                    </th>
                  ))}
                  <th className="text-right py-3 px-5 font-medium text-slate-500 whitespace-nowrap">
                    İlerleme
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.ogrenciler.map(ogr => {
                  const risk = riskSeviyesi(ogr.sonGiris);
                  const gunOnce = ogr.sonGiris
                    ? Math.round((Date.now() - new Date(ogr.sonGiris).getTime()) / 86400000)
                    : null;

                  return (
                    <tr
                      key={ogr.userId}
                      className={cn(
                        'border-b border-slate-100 last:border-0 transition-colors',
                        risk === 'risk' ? 'bg-orange-50/60' : 'hover:bg-slate-50/60',
                      )}
                    >
                      {/* Öğrenci adı */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {risk === 'risk' && (
                            <AlertTriangle className="size-3.5 text-orange-400 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{ogr.ad}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {ogr.tamamlananBolum}/{data.bolumler.length} bölüm
                              {gunOnce !== null && (
                                <> · {gunOnce === 0 ? 'bugün' : `${gunOnce} gün önce`}</>
                              )}
                              {ogr.sonGiris === null && ' · hiç girmedi'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Bölüm hücreleri — master listeye göre hizalanır */}
                      {data.bolumler.map(masterBolum => {
                        const b = ogr.bolumler.find(x => x.id === masterBolum.id);
                        const durum = b?.durum ?? 'kilitli';
                        return (
                          <td key={masterBolum.id} className="text-center py-3 px-3">
                            {durum === 'tamamlandi' && (
                              <CheckCircle2 className="size-5 text-emerald-500 mx-auto" />
                            )}
                            {durum === 'acildi' && (
                              <div className="flex flex-col items-center gap-0.5">
                                <Unlock className="size-4 text-blue-400 mx-auto" />
                                <span className="text-[10px] text-blue-400 leading-none">açıldı</span>
                              </div>
                            )}
                            {durum === 'kilitli' && (
                              <button
                                onClick={() =>
                                  bolumAcMut.mutate({ uniteId: masterBolum.id, userId: ogr.userId })
                                }
                                disabled={bolumAcMut.isPending}
                                className="group flex flex-col items-center gap-0.5 mx-auto disabled:opacity-50 min-h-[44px] min-w-[44px] justify-center"
                                title={`${ogr.ad} için "${masterBolum.name}" bölümünü aç`}
                              >
                                <Lock className="size-4 text-slate-300 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] text-slate-300 group-hover:text-primary transition-colors leading-none">
                                  Aç
                                </span>
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* İlerleme yüzdesi */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full',
                            ogr.tamamlananBolum === data.bolumler.length
                              ? 'bg-emerald-100 text-emerald-700'
                              : risk === 'risk'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {data.bolumler.length > 0
                            ? Math.round((ogr.tamamlananBolum / data.bolumler.length) * 100)
                            : 0}
                          %
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {data.ogrenciler.length === 0 && (
                  <tr>
                    <td
                      colSpan={data.bolumler.length + 2}
                      className="py-10 text-center text-slate-400 text-sm"
                    >
                      Bu sınıfta henüz öğrenci yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Açıklama */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Tamamlandı
          </span>
          <span className="flex items-center gap-1.5">
            <Unlock className="size-3.5 text-blue-400" />
            Öğretmen açtı
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-slate-300" />
            Kilitli (tıkla → aç)
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-orange-400" />
            3+ gündür ilerleme yok
          </span>
        </div>
      </div>
    </div>
  );
}
