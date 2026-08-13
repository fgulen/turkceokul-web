'use client';

// Ülke hızlı düzenleme SlideOver'ı (4 Şablon Kuralı: SlideOver şablonu).
// Liste ve detay sayfası ortak kullanır.

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { apiHataMesaji } from '@/lib/utils';
import { SlideOver } from '@/components/slide-over';

export interface UlkeOzet {
  id: number;
  name: string;
  visible: boolean;
  ogretmenId: number | null;
  ogretmenAdi: string | null;
}

interface Ogretmen {
  id: number;
  name: string;
  surname: string;
  email: string;
}

interface Props {
  ulke: UlkeOzet | null;
  onClose: () => void;
  /** Ebeveyne güncel dirty durumunu bildirir — başka bir ülkeyi düzenlemeye
   *  geçmeden önce kaydedilmemiş değişiklik olup olmadığını sormak için. */
  onDirtyChange?: (dirty: boolean) => void;
}

const KAYDEDILMEMIS_UYARI = 'Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?';

export function UlkeDuzenleSlideOver({ ulke, onClose, onDirtyChange }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<UlkeOzet | null>(null);
  const [dirty, setDirty] = useState(false);
  const [ogretmenQuery, setOgretmenQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // SlideOver her açılışta güncel ülkeyle başlar
  useEffect(() => {
    setForm(ulke);
    setDirty(false);
    setOgretmenQuery('');
    setShowDropdown(false);
  }, [ulke]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (dirty && !window.confirm(KAYDEDILMEMIS_UYARI)) return;
    onClose();
  }

  const { data: ogretmenler = [] } = useQuery({
    queryKey: ['sa-ogretmenler', ogretmenQuery],
    queryFn: () => api.get('/api/super-admin/kullanicilar', {
      params: { rol: 'Ogretmen', arama: ogretmenQuery || undefined, sayfaBoyutu: 20 }
    }).then(r => r.data?.liste ?? []),
    enabled: !!form,
  });

  const guncelleMutation = useMutation({
    mutationFn: (d: { name: string; visible: boolean; ogretmenId: number | null }) =>
      api.put(`/api/super-admin/ulke/${form!.id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ulkeler'] });
      onClose();
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  return (
    <SlideOver
      open={!!ulke}
      onClose={handleClose}
      title="Ülke Düzenle"
      width="md"
      noDim
      footer={
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button
            onClick={() => form && guncelleMutation.mutate({ name: form.name, visible: form.visible, ogretmenId: form.ogretmenId })}
            disabled={guncelleMutation.isPending || !dirty}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {guncelleMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      }
    >
      {form && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Ülke Adı</label>
            <input
              value={form.name}
              onChange={e => { setForm(f => f && { ...f, name: e.target.value }); setDirty(true); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="edit-visible"
              checked={form.visible}
              onChange={e => { setForm(f => f && { ...f, visible: e.target.checked }); setDirty(true); }}
              className="size-4 rounded border-slate-300 accent-purple-600"
            />
            <label htmlFor="edit-visible" className="text-sm text-slate-700 cursor-pointer">Görünür (Aktif)</label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Sorumlu Öğretmen</label>
            {form.ogretmenId && form.ogretmenAdi && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                <span className="text-xs font-medium text-purple-800 flex-1">{form.ogretmenAdi}</span>
                <button
                  onClick={() => { setForm(f => f && { ...f, ogretmenId: null, ogretmenAdi: null }); setOgretmenQuery(''); setDirty(true); }}
                  className="text-purple-400 hover:text-purple-600">
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            <div className="relative">
              <input
                value={ogretmenQuery}
                onChange={e => { setOgretmenQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder={form.ogretmenId ? 'Değiştirmek için ara…' : 'Öğretmen ara…'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              {showDropdown && ogretmenler.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {ogretmenler.map((u: Ogretmen) => (
                    <button
                      key={u.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setForm(f => f && { ...f, ogretmenId: u.id, ogretmenAdi: `${u.name} ${u.surname}` });
                        setOgretmenQuery('');
                        setShowDropdown(false);
                        setDirty(true);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-baseline gap-1 transition-colors">
                      <span className="text-xs font-medium text-slate-800">{u.name} {u.surname}</span>
                      <span className="text-[11px] text-slate-400">({u.email})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!form.ogretmenId && (
              <div className="flex gap-2 mt-2">
                <a
                  href={`mailto:?subject=T%C3%BCrk%C3%A7eOkulu%20%C3%96%C4%9Fretmen%20Daveti&body=Merhaba%2C%20TürkçeOkulu%20platformuna%20öğretmen%20olarak%20katılmanızı%20bekliyoruz.%20Kayıt%3A%20https%3A%2F%2Fturkceokulu.com%2Fkayit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  E-posta ile Davet
                </a>
                <a
                  href="https://wa.me/?text=Merhaba!%20T%C3%BCrk%C3%A7eOkulu%20platformuna%20%C3%B6%C4%9Fretmen%20olarak%20kat%C4%B1lman%C4%B1z%C4%B1%20bekliyoruz.%20Kay%C4%B1t%3A%20https%3A%2F%2Fturkceokulu.com%2Fkayit"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                  WhatsApp ile Davet
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </SlideOver>
  );
}
