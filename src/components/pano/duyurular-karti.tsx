'use client';

import { useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send } from 'lucide-react';
import { api } from '@/lib/api';

interface Yorum {
  id: number;
  icerik: string;
  olusturmaTarihi: string;
  name: string;
}

interface Duyuru {
  id: number;
  icerik: string;
  olusturmaTarihi: string;
  yorumlar: Yorum[];
}

interface Sinifim {
  id: number;
}

export function DuyurularKarti() {
  const t = useTranslations();

  const { data: sinifim, isLoading: sinifimLoading } = useQuery<Sinifim | null>({
    queryKey: ['sinifim'],
    queryFn: () => api.get('/api/sinifim').then((r) => r.data),
  });

  const { data: duyurular, isPending: duyurularPending } = useQuery<Duyuru[]>({
    queryKey: ['sinif-duyurular', sinifim?.id],
    queryFn: () => api.get(`/api/sinif/${sinifim!.id}/duyurular`).then((r) => r.data),
    enabled: !!sinifim?.id,
  });

  // sinifim henüz yüklenmeden duyurular sorgusu disabled kalır ve isLoading=false
  // döner (v5'te isLoading = isPending && isFetching) — bu da "duyuru yok" boş
  // durumunun bir an için yanlış görünmesine (flash) yol açar. sinifim.id bilinip
  // duyurular ilk kez çözümlenene kadar da yükleniyor say.
  const isLoading = sinifimLoading || (!!sinifim?.id && duyurularPending);

  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="size-5 text-primary" />
        <h2 className="font-semibold text-lg">{t('pano.duyurular.title')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !duyurular?.length ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Megaphone className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('pano.duyurular.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {duyurular.map((d) => (
            <DuyuruSatiri key={d.id} duyuru={d} sinifId={sinifim!.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function DuyuruSatiri({ duyuru, sinifId }: { duyuru: Duyuru; sinifId: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const qc = useQueryClient();
  const [yorum, setYorum] = useState('');
  // React state güncellemesi bir sonraki render'a kadar isPending'i yansıtmaz —
  // hızlı çift tıklama/dokunma aradaki pencerede mutate()'i iki kez tetikleyip
  // mükerrer yorum oluşturabilir. Senkron kontrol edilen bir ref bunu engeller.
  const gonderiliyor = useRef(false);

  const yorumMutation = useMutation({
    mutationFn: () => api.post(`/api/duyuru/${duyuru.id}/yorum`, { icerik: yorum }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-duyurular', sinifId] });
      setYorum('');
    },
    onSettled: () => {
      gonderiliyor.current = false;
    },
  });

  function gonder() {
    if (!yorum.trim() || gonderiliyor.current) return;
    gonderiliyor.current = true;
    yorumMutation.mutate();
  }

  return (
    <div className="p-4 rounded-xl border border-border">
      <p className="text-sm leading-relaxed">{duyuru.icerik}</p>
      <p className="text-xs text-muted-foreground mt-2">
        {new Date(duyuru.olusturmaTarihi).toLocaleDateString(locale)}
      </p>

      {duyuru.yorumlar.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {duyuru.yorumlar.map((y) => (
            <div key={y.id} className="text-xs">
              <span className="font-semibold">{y.name}</span>{' '}
              <span className="text-muted-foreground">{y.icerik}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={yorum}
          onChange={(e) => setYorum(e.target.value)}
          placeholder={t('pano.duyurular.commentPlaceholder')}
          className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <button
          onClick={gonder}
          disabled={!yorum.trim() || yorumMutation.isPending}
          className="shrink-0 size-9 flex items-center justify-center rounded-lg bg-primary text-white disabled:opacity-40 transition-opacity"
          title={yorumMutation.isPending ? t('pano.duyurular.sending') : t('pano.duyurular.send')}
        >
          <Send className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
