'use client';

// Ulke temsilcisinin kurum drill-down rapor sayfasi — /ulke-temsilcisi/kurum/[kurumId]
// (yonetim: lisans/ogretmen/sinif listesi) ile ayni desendeki kardes rota, tipki
// /ogretmen/sinif/[id] (yonetim) vs /ogretmen/sinif/[id]/raporlar (rapor) ayrimi gibi.
// Spec: docs/superpowers/specs/2026-07-25-rol-bazli-raporlama-design.md

import { use, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AramaInput, SortTh, useSiralama, trSirala } from '@/components/staff/table-kit';
import { ContextBreadcrumb } from '@/components/context-breadcrumb';

interface PanelKurum {
  id: number;
  name: string;
  sehir: string | null;
}
interface UlkePanel {
  id: number;
  name: string;
  kurumlar: PanelKurum[];
}

interface SinifRaporOzeti {
  sinifId: number;
  sinifAdi: string;
  ogrenciSayisi: number;
  aktifOgrenciSayisi: number;
  ortalamaIlerleme: number;
  ortalamaPuan: number;
  sonAktivite: string | null;
}

function ilerlemeRengi(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-400';
  if (pct >= 20) return 'bg-orange-300';
  return 'bg-slate-200';
}

function sonAktiviteMetni(tarih: string | null) {
  if (!tarih) return 'Hiç aktivite yok';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function metinEslesiyorMu(alanlar: (string | null)[], arama: string) {
  if (!arama) return true;
  const q = arama.toLocaleLowerCase('tr');
  return alanlar.some(a => (a ?? '').toLocaleLowerCase('tr').includes(q));
}

export default function UlkeTemsilcisiKurumRaporlarPage({ params }: { params: Promise<{ kurumId: string }> }) {
  const { kurumId } = use(params);
  const id = Number(kurumId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const gecerli = !!user && user.role === 'UlkeTemsilcisi';
  const [arama, setArama] = useState('');
  const { sortKey, sortDir, toggleSort } = useSiralama<'sinifAdi' | 'ogrenciSayisi' | 'ortalamaIlerleme' | 'ortalamaPuan'>('sinifAdi');

  const { data: panel } = useQuery<UlkePanel>({
    queryKey: ['ulke-temsilcisi-panel'],
    queryFn: () => api.get('/api/ulke-temsilcisi/panel').then(r => r.data),
    enabled: gecerli,
  });
  const kurum = panel?.kurumlar.find(k => k.id === id);

  const { data: raporlar, isLoading } = useQuery<SinifRaporOzeti[]>({
    queryKey: ['ulke-temsilcisi-kurum-raporlar', id],
    queryFn: () => api.get(`/api/ulke-temsilcisi/kurum/${id}/raporlar`).then(r => r.data),
    enabled: gecerli,
  });

  const filtreli = useMemo(() => {
    const ham = raporlar ?? [];
    if (!arama) return ham;
    return ham.filter(s => metinEslesiyorMu([s.sinifAdi], arama));
  }, [raporlar, arama]);
  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);

  if (!ready) return (
    <div className="py-24 flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="bg-[#F3F4F6]">
      <main className="px-4 py-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/ulke-temsilcisi/kurum/${id}`}
            className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors shrink-0">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex-1">{kurum?.name ?? '...'} — Raporlar</h1>
        </div>
        <div className="pl-11 mb-6">
          <ContextBreadcrumb
            crumbs={[
              panel?.name ? { level: 'ulke', label: panel.name } : null,
              kurum?.name ? { level: 'kurum', label: kurum.name } : null,
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-800">Sınıflar</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{sirali.length}</span>
            <AramaInput value={arama} onChange={setArama} placeholder="Sınıf ara..." />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <SortTh colKey="sinifAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Sınıf</SortTh>
                <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center" className="hidden sm:table-cell">Öğrenci</SortTh>
                <SortTh colKey="ortalamaPuan" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center" className="hidden md:table-cell">Ort. Puan</SortTh>
                <SortTh colKey="ortalamaIlerleme" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>İlerleme</SortTh>
                <th className="px-4 py-2.5 text-right font-medium text-slate-600 hidden sm:table-cell">Son Aktivite</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [1, 2, 3].map(i => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
              ) : sirali.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Bu kurumda sınıf yok.</td></tr>
              ) : (
                sirali.map(s => (
                  <tr key={s.sinifId} className="odd:bg-white even:bg-slate-50/40">
                    <td className="px-4 py-2 font-medium text-slate-900">{s.sinifAdi}</td>
                    <td className="px-4 py-2 text-center text-xs text-slate-600 hidden sm:table-cell">
                      {s.aktifOgrenciSayisi}/{s.ogrenciSayisi} aktif
                    </td>
                    <td className="px-4 py-2 text-center text-xs font-semibold text-slate-700 hidden md:table-cell">
                      {s.ogrenciSayisi === 0 ? '—' : Math.round(s.ortalamaPuan)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', ilerlemeRengi(s.ortalamaIlerleme))} style={{ width: `${Math.round(s.ortalamaIlerleme)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-9 text-right">%{Math.round(s.ortalamaIlerleme)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-slate-400 hidden sm:table-cell">{sonAktiviteMetni(s.sonAktivite)}</td>
                    <td className="px-4 py-2">
                      <Link href={`/ogretmen/sinif/${s.sinifId}/raporlar`}>
                        <ChevronRight className="size-4 text-slate-300" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 px-1 mt-3">
          Bu sıralama farklı sayıda etkinlik atanmış sınıfları birebir kıyaslamaz, genel eğilimi gösterir.
        </p>
      </main>
    </div>
  );
}
