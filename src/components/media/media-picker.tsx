'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Howl } from 'howler';
import { Folder, Image as ImageIcon, Music, Pause, Play, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toMediaUrl } from '@/lib/utils';
import Image from 'next/image';

const KOK_PREFIX = 'Medya/';
const RESIM_UZANTILARI = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const SES_UZANTILARI = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];

type MediaTip = 'resim' | 'ses';

interface MediaOgesi {
  key: string;
  boyut: number;
}

interface MediaListeSonucu {
  klasorler: string[];
  dosyalar: MediaOgesi[];
  devamTokeni: string | null;
}

function dosyaTipi(key: string): MediaTip | null {
  const noktaIndex = key.lastIndexOf('.');
  if (noktaIndex === -1) return null;
  const uzanti = key.slice(noktaIndex).toLowerCase();
  if (RESIM_UZANTILARI.includes(uzanti)) return 'resim';
  if (SES_UZANTILARI.includes(uzanti)) return 'ses';
  return null;
}

function dosyaAdi(key: string): string {
  return key.slice(key.lastIndexOf('/') + 1);
}

function klasorAdi(prefix: string): string {
  const trimmed = prefix.replace(/\/$/, '');
  return trimmed.slice(trimmed.lastIndexOf('/') + 1);
}

// Mevcut seçili değerin bulunduğu klasörü çıkarır — picker'ı sıfırdan Medya/ kökü yerine
// doğrudan seçili dosyanın yanında açmak için. Medya/ dışı veya boş değerlerde köke düşer.
function baslangicPrefix(deger: string | null | undefined): string {
  if (!deger) return KOK_PREFIX;
  const normalized = deger.startsWith('/') ? deger.slice(1) : deger;
  if (!normalized.toLocaleLowerCase('tr').startsWith(KOK_PREFIX.toLocaleLowerCase('tr'))) return KOK_PREFIX;
  const sonSlash = normalized.lastIndexOf('/');
  return sonSlash === -1 ? KOK_PREFIX : normalized.slice(0, sonSlash + 1);
}

interface Props {
  open: boolean;
  tip: MediaTip;
  mevcutDeger?: string | null;
  onClose: () => void;
  onSelect: (key: string) => void;
}

export function MediaPicker({ open, tip, mevcutDeger, onClose, onSelect }: Props) {
  const [prefix, setPrefix] = useState(KOK_PREFIX);
  const [arama, setArama] = useState('');
  const [calanKey, setCalanKey] = useState<string | null>(null);
  const howlRef = useRef<Howl | null>(null);
  const mevcutDegerRef = useRef(mevcutDeger);
  mevcutDegerRef.current = mevcutDeger;

  useEffect(() => {
    if (open) { setPrefix(baslangicPrefix(mevcutDegerRef.current)); setArama(''); }
  }, [open]);

  const sesDurdur = () => {
    howlRef.current?.stop();
    howlRef.current?.unload();
    howlRef.current = null;
    setCalanKey(null);
  };

  // Modal kapanınca veya klasör değişince çalan ses varsa durdur — audio overlap engeli.
  useEffect(() => {
    if (!open) sesDurdur();
  }, [open]);
  useEffect(() => {
    sesDurdur();
  }, [prefix]);
  useEffect(() => () => sesDurdur(), []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onCloseRef.current(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['media', prefix],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      api.get<MediaListeSonucu>('/api/media', { params: { prefix, devamTokeni: pageParam } }).then(r => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: MediaListeSonucu) => lastPage.devamTokeni ?? undefined,
    enabled: open,
  });

  const klasorler = useMemo(() => data?.pages.flatMap(p => p.klasorler) ?? [], [data]);
  const dosyalar = useMemo(() => data?.pages.flatMap(p => p.dosyalar) ?? [], [data]);

  const aramaKucuk = arama.trim().toLocaleLowerCase('tr');
  const gorunurKlasorler = aramaKucuk
    ? klasorler.filter(k => klasorAdi(k).toLocaleLowerCase('tr').includes(aramaKucuk))
    : klasorler;
  const gorunurDosyalar = aramaKucuk
    ? dosyalar.filter(d => dosyaAdi(d.key).toLocaleLowerCase('tr').includes(aramaKucuk))
    : dosyalar;

  const breadcrumb = prefix.replace(/\/$/, '').split('/').filter(Boolean);

  function klasoreGir(yeniPrefix: string) {
    setArama('');
    setPrefix(yeniPrefix);
  }

  function breadcrumbaGit(index: number) {
    setArama('');
    setPrefix(breadcrumb.slice(0, index + 1).join('/') + '/');
  }

  function onizle(item: MediaOgesi) {
    if (calanKey === item.key) { sesDurdur(); return; }
    sesDurdur();
    const url = toMediaUrl(item.key);
    if (!url) return;
    const howl = new Howl({ src: [url], html5: true });
    howl.play();
    howlRef.current = howl;
    setCalanKey(item.key);
    howl.once('end', () => setCalanKey(null));
    howl.once('loaderror', () => setCalanKey(null));
    howl.once('playerror', () => setCalanKey(null));
  }

  function sec(item: MediaOgesi) {
    sesDurdur();
    onSelect(item.key);
    onClose();
  }

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-[min(700px,90vh)] w-[min(880px,95vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Medya Seç</h2>
            <nav className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
              {breadcrumb.map((seg, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-slate-300">/</span>}
                  <button
                    type="button"
                    onClick={() => breadcrumbaGit(i)}
                    className="hover:text-primary hover:underline"
                  >
                    {seg}
                  </button>
                </span>
              ))}
            </nav>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Kapat">
            <X className="size-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={arama}
              onChange={e => setArama(e.target.value)}
              placeholder="Bu klasörde ara…"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <ImageIcon className="size-8" />
              <p className="text-sm">Medya deposuna ulaşılamadı. Daha sonra tekrar deneyin.</p>
            </div>
          ) : (
            <>
              {gorunurKlasorler.length > 0 && (
                <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {gorunurKlasorler.map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => klasoreGir(k)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 hover:border-primary/40 hover:bg-primary/5"
                    >
                      <Folder className="size-4 shrink-0 text-amber-500" />
                      <span className="truncate">{klasorAdi(k)}</span>
                    </button>
                  ))}
                </div>
              )}

              {gorunurDosyalar.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {gorunurDosyalar.map(item => {
                    const itemTip = dosyaTipi(item.key);
                    const uygunTip = itemTip === tip;
                    const secili = !!mevcutDeger && (mevcutDeger.startsWith('/') ? mevcutDeger : '/' + mevcutDeger) === item.key;
                    return (
                      <div
                        key={item.key}
                        className={`group relative rounded-xl border ${secili ? 'border-primary ring-2 ring-primary/30' : uygunTip ? 'border-slate-200' : 'border-slate-100 opacity-40'}`}
                      >
                        {itemTip === 'resim' ? (
                          <button
                            type="button"
                            disabled={!uygunTip}
                            onClick={() => sec(item)}
                            className="block w-full disabled:cursor-not-allowed"
                            title={uygunTip ? dosyaAdi(item.key) : 'Bu ekran resim bekliyor'}
                          >
                            <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-slate-50">
                              <Image
                                src={toMediaUrl(item.key) ?? ''}
                                alt={dosyaAdi(item.key)}
                                fill
                                unoptimized
                                sizes="150px"
                                className="object-cover"
                              />
                            </div>
                            <p className="truncate px-2 py-1.5 text-[11px] text-slate-500">{dosyaAdi(item.key)}</p>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-2 px-3 py-4">
                            <button
                              type="button"
                              onClick={() => onizle(item)}
                              disabled={!uygunTip}
                              className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:cursor-not-allowed"
                              aria-label={calanKey === item.key ? 'Durdur' : 'Dinle'}
                            >
                              {calanKey === item.key ? <Pause className="size-4" /> : <Play className="size-4" />}
                            </button>
                            <p className="line-clamp-1 w-full text-center text-[11px] text-slate-500" title={dosyaAdi(item.key)}>
                              {dosyaAdi(item.key)}
                            </p>
                            <button
                              type="button"
                              disabled={!uygunTip}
                              onClick={() => sec(item)}
                              className="rounded-lg bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary/90 disabled:opacity-40"
                            >
                              Seç
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : gorunurKlasorler.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                  {tip === 'resim' ? <ImageIcon className="size-8" /> : <Music className="size-8" />}
                  <p className="text-sm">Bu klasörde {arama ? 'eşleşen ' : ''}dosya yok.</p>
                </div>
              ) : null}

              {hasNextPage && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla yükle'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
