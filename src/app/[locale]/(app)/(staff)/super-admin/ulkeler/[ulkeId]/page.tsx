'use client';

// Ülke detayı — Detay Route şablonu (4 Şablon Kuralı).
// URL-first: /super-admin/ulkeler/12 derin linklenebilir, yenilemeye dayanıklı.

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Globe, Pencil, Trash2 } from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { SlideOver } from '@/components/slide-over';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import {
  TemsilcilerPanel, KurumlarPanel, UlkeKitaplarPanel, UlkeSiniflarPanel, KurumSiniflarDetail,
} from '../panels';
import { UlkeDuzenleSlideOver, type UlkeOzet } from '../ulke-duzenle';

type Bolum = 'kurumlar' | 'temsilciler' | 'kitaplar' | 'siniflar';

interface UlkeSatir {
  id: number;
  name: string;
  ogretmenId: number | null;
  ogretmenAdi: string | null;
  kurumSayisi: number;
  ogrenciSayisi: number;
  visible: boolean;
}

const BOLUMLER: [Bolum, string][] = [
  ['kurumlar', 'Kurumlar'],
  ['temsilciler', 'Temsilciler'],
  ['kitaplar', 'Ders Kitapları'],
  ['siniflar', 'Sınıflar'],
];

export default function UlkeDetayPage() {
  const params = useParams<{ ulkeId: string }>();
  const ulkeId = Number(params?.ulkeId);
  const qc = useQueryClient();
  const router = useRouter();

  const [bolum, setBolum] = useState<Bolum>('kurumlar');
  const [editUlke, setEditUlke] = useState<UlkeOzet | null>(null);
  const editUlkeDirtyRef = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState<{ tip: 'ulke' | 'kurum'; id: number; name: string } | null>(null);
  const [seciliKurum, setSeciliKurum] = useState<{ id: number; name: string } | null>(null);

  function editUlkeAc(hedef: UlkeOzet) {
    if (editUlke && editUlkeDirtyRef.current
      && !window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    setEditUlke(hedef);
  }

  // Liste sorgusuyla aynı cache — ülke tekil endpoint'i olmadığından listeden bulunur
  const { data, isLoading } = useQuery({
    queryKey: ['sa-ulkeler', 'tumu'],
    queryFn: () => api.get('/api/super-admin/ulkeler', {
      params: { pageNumber: 1, pageSize: 500 }
    }).then(r => r.data),
  });
  const ulke = (data?.liste ?? []).find((u: UlkeSatir) => u.id === ulkeId);

  const silMutation = useMutation({
    mutationFn: ({ tip, id }: { tip: string; id: number }) => api.delete(`/api/super-admin/${tip}/${id}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sa-ulkeler'] });
      qc.invalidateQueries({ queryKey: ['sa-kurumlar'] });
      setDeleteTarget(null);
      if (vars.tip === 'ulke') router.push('/super-admin/ulkeler');
    },
  });

  if (!isLoading && !ulke) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-sm text-slate-500 mb-3">Ülke bulunamadı.</p>
        <Link href="/super-admin/ulkeler" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
          ← Ülke listesine dön
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Başlık */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/ulkeler"
            className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
            <ArrowLeft className="size-4" />
          </Link>
          <Globe className="size-5 text-blue-500 shrink-0" />
          <h2 className="text-base font-semibold text-slate-900">{ulke?.name ?? '…'}</h2>
          {ulke && (
            <>
              <span className="text-xs text-slate-400">{ulke.kurumSayisi} okul · {ulke.ogrenciSayisi} öğrenci</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${ulke.visible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {ulke.visible ? 'Aktif' : 'Pasif'}
              </span>
            </>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => ulke && editUlkeAc({ id: ulke.id, name: ulke.name, visible: ulke.visible, ogretmenId: ulke.ogretmenId ?? null, ogretmenAdi: ulke.ogretmenAdi ?? null })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Pencil className="size-3.5" />
              Düzenle
            </button>
            <button
              onClick={() => ulke && setDeleteTarget({ tip: 'ulke', id: ulke.id, name: ulke.name })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="size-3.5" />
              Sil
            </button>
          </div>
        </div>

        {/* Bölüm sekmeleri (sayfa içi ikincil navigasyon) */}
        <div className="flex gap-1 mt-3">
          {BOLUMLER.map(([b, label]) => (
            <button key={b} onClick={() => setBolum(b)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                bolum === b ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {bolum === 'temsilciler' && <TemsilcilerPanel ulkeId={ulkeId} ulkeAdi={ulke?.name ?? ''} />}
        {bolum === 'kurumlar' && (
          <KurumlarPanel
            ulkeId={ulkeId}
            onKurumClick={(id, name) => setSeciliKurum({ id, name })}
            onDeleteKurum={(id, name) => setDeleteTarget({ tip: 'kurum', id, name })}
          />
        )}
        {bolum === 'kitaplar' && <UlkeKitaplarPanel ulkeId={ulkeId} />}
        {bolum === 'siniflar' && <UlkeSiniflarPanel ulkeId={ulkeId} />}
      </div>

      {/* SlideOver: Kurum Sınıfları */}
      <SlideOver
        open={!!seciliKurum}
        onClose={() => setSeciliKurum(null)}
        title={seciliKurum?.name ?? ''}
        subtitle="Sınıflar"
        width="sm"
      >
        {seciliKurum && <KurumSiniflarDetail kurumId={seciliKurum.id} />}
      </SlideOver>

      <UlkeDuzenleSlideOver
        ulke={editUlke}
        onClose={() => setEditUlke(null)}
        onDirtyChange={d => { editUlkeDirtyRef.current = d; }}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        entityName={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && silMutation.mutate({ tip: deleteTarget.tip, id: deleteTarget.id })}
        onCancel={() => setDeleteTarget(null)}
        loading={silMutation.isPending}
      />
    </div>
  );
}
