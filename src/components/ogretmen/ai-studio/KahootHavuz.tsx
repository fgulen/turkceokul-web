'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Play, Info, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { KaynakSecici, type KaynakSecim } from './KaynakSecici';

interface HavuzItem {
  id: string;
  name: string;
  soruSayisi: number;
  hazirlayan: string;
  insertDate: string;
  uniteAdi: string;
  kitapAdi: string;
  benimMi: boolean;
}

interface SoruDetay {
  id: string;
  question: string;
  options?: string[];
  answer?: string;
}

interface HavuzListItemProps {
  item: HavuzItem;
  acik: boolean;
  onToggleDetay: (id: string) => void;
  onBaslat: (etkinlikId: string) => void;
}

function HavuzListItem({ item, acik, onToggleDetay, onBaslat }: HavuzListItemProps) {
  const { data: detaylar = [], isLoading: detayYukleniyor } = useQuery<SoruDetay[]>({
    queryKey: ['kahoot-detay', item.id],
    queryFn: () => api.get(`/api/ai/gecmis/${item.id}/detaylar`).then(r => r.data),
    enabled: acik,
  });

  const tarihBicim = (d: string) => new Date(d).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      {/* Satır başlığı */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>{item.soruSayisi} soru</span>
            <span className="text-slate-300">·</span>
            <span>{item.hazirlayan}</span>
            <span className="text-slate-300">·</span>
            <span>{tarihBicim(item.insertDate)}</span>
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleDetay(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Eye className="size-3.5" />
            Önizle
          </button>
          <button
            onClick={() => onBaslat(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors"
          >
            <Play className="size-3.5 fill-current" />
            Başlat
          </button>
          <button
            onClick={() => onToggleDetay(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
          >
            {acik ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Açılır detay paneli */}
      {acik && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50">
          {detayYukleniyor ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              Sorular yükleniyor...
            </div>
          ) : detaylar && detaylar.length > 0 ? (
            <div className="space-y-2">
              {detaylar.map((d, i) => (
                <div
                  key={d.id}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
                >
                  <span className="shrink-0 text-slate-400 font-medium w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800">{d.question}</p>
                    {d.options && d.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {d.options.map((opt, j) => (
                          <span
                            key={j}
                            className={cn(
                              'px-2 py-0.5 rounded text-xs border font-medium',
                              opt === d.answer
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                : 'bg-slate-100 border-slate-200 text-slate-600',
                            )}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Soru bulunamadı.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function KahootHavuz({
  onBaslat,
}: {
  onBaslat: (etkinlikId: string) => void;
}) {
  const [kaynak, setKaynak] = useState<KaynakSecim | null>(null);
  const [aciliBayrak, setAciliBayrak] = useState<Record<string, boolean>>({});

  const { data: havuz = [], isLoading } = useQuery<HavuzItem[]>({
    queryKey: ['kahoot-havuzu', kaynak?.kitapId, kaynak?.uniteId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (kaynak?.kitapId) params.append('kitapId', kaynak.kitapId);
      if (kaynak?.uniteId) params.append('uniteId', kaynak.uniteId);
      return api.get(`/api/ai/kahoot-havuzu?${params.toString()}`).then(r => r.data);
    },
    enabled: true,
  });

  function toggleDetay(id: string) {
    setAciliBayrak(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      {/* Bilgilendirme notu */}
      <div className="flex items-start gap-2 px-3 py-2.5 text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
        <Info className="size-4 mt-0.5 shrink-0" />
        <span>
          Güvenlik ve pedagojik denetim gereği, havuzda yalnızca resmi küratörlü içerikler ve kendi ürettiğiniz setler listelenir.
        </span>
      </div>

      {/* Kaynak filtresi */}
      <KaynakSecici secim={kaynak} onChange={setKaynak} />

      {/* Havuz listesi */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="size-5 animate-spin mr-2" />
            Yükleniyor...
          </div>
        ) : havuz.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">Havuzda şu anda uygun soru seti yok.</p>
          </div>
        ) : (
          havuz.map(item => (
            <HavuzListItem
              key={item.id}
              item={item}
              acik={aciliBayrak[item.id] ?? false}
              onToggleDetay={toggleDetay}
              onBaslat={onBaslat}
            />
          ))
        )}
      </div>
    </div>
  );
}
