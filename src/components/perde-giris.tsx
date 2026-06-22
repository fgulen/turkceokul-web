'use client';

import { useState, useRef } from 'react';
import { BookOpen, Volume2 } from 'lucide-react';
import { toMediaUrl } from '@/lib/utils';
import { AudioPlayButton } from '@/components/players/ui';
import type { EtkinlikData } from '@/types/etkinlik';

interface Props {
  etkinlik: EtkinlikData;
  onBasla: () => void;
  // 0 = ilk zorunlu açılış (ceza yok), >0 = gönüllü tekrar (her biri -1 XP)
  acilmaSayisi: number;
}

export function PerdeGiris({ etkinlik, onBasla, acilmaSayisi }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resimUrl = toMediaUrl(etkinlik.resimLink);
  const sesUrl = toMediaUrl(etkinlik.sesLink);
  const videoUrl = toMediaUrl(etkinlik.videoLink);
  const metin = etkinlik.description;
  const ilkAcilis = acilmaSayisi === 0;

  function handlePlay() {
    if (!sesUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }
    const a = new Audio(sesUrl);
    audioRef.current = a;
    setPlaying(true);
    a.play();
    a.onended = () => { setPlaying(false); audioRef.current = null; };
  }

  function handleBasla() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    onBasla();
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" />
          <span>İpucu</span>
        </div>
        {!ilkAcilis && (
          <span className="text-xs font-semibold text-destructive">
            −1 XP (toplam: −{acilmaSayisi})
          </span>
        )}
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {ilkAcilis && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary font-medium text-center">
              💡 Perdeye hiç bakmadan tamamlarsan +2 bonus XP!
            </div>
          )}

          {resimUrl && (
            <img
              src={resimUrl}
              alt="Bağlam görseli"
              className="w-full h-auto rounded-xl object-cover"
            />
          )}

          {sesUrl && (
            <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
              <AudioPlayButton playing={playing} onPlay={handlePlay} />
              <span className="text-sm text-muted-foreground">Sesi dinle</span>
            </div>
          )}

          {videoUrl && (
            <video src={videoUrl} controls className="w-full rounded-xl" />
          )}

          {metin && (
            <div
              className="rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm leading-relaxed [&_p]:mb-2 [&_br]:block"
              dangerouslySetInnerHTML={{ __html: metin }}
            />
          )}
        </div>
      </div>

      {/* Başla butonu */}
      <div className="px-4 py-4 border-t shrink-0">
        <button
          onClick={handleBasla}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          {ilkAcilis ? 'Başla' : 'Etkinliğe Dön'}
        </button>
      </div>
    </div>
  );
}
