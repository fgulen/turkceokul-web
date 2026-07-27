'use client';

// Kurum oluştur/düzenle SlideOver'ları — ülke-temsilcisi panelinde doğdu, admin
// (Koordinator) panelinde de aynen kullanılır. "Yeni Ekle standardı: buton →
// SlideOver" (bkz. table-kit.tsx) — inline form YASAK.

import { useEffect, useState } from 'react';
import { SlideOver } from '@/components/slide-over';

interface KurumMinimal {
  id: number;
  name: string;
  sehir: string | null;
}

export function KurumDuzenleSlideOver({ kurum, onClose, onKaydet, kaydediliyor }: {
  kurum: KurumMinimal | null;
  onClose: () => void;
  onKaydet: (form: { name: string; sehir: string }) => void;
  kaydediliyor: boolean;
}) {
  const [form, setForm] = useState({ name: '', sehir: '' });

  useEffect(() => {
    if (kurum) setForm({ name: kurum.name, sehir: kurum.sehir ?? '' });
  }, [kurum]);

  return (
    <SlideOver
      open={!!kurum}
      onClose={onClose}
      title="Kurumu Düzenle"
      width="sm"
      footer={
        <button
          form="kurum-duzenle-form"
          type="submit"
          disabled={kaydediliyor || !form.name.trim()}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      }
    >
      {kurum && (
        <form
          id="kurum-duzenle-form"
          onSubmit={e => { e.preventDefault(); onKaydet(form); }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Kurum Adı</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Şehir</label>
            <input
              value={form.sehir}
              onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </form>
      )}
    </SlideOver>
  );
}

export function KurumOlusturSlideOver({ open, onClose, onOlustur, olusturuluyor, ulkeAdi, ulkeSecenekleri }: {
  open: boolean;
  onClose: () => void;
  onOlustur: (form: { name: string; sehir: string; ulkeId?: string }) => void;
  olusturuluyor: boolean;
  /** Sabit ülke bağlamı — verilirse metin olarak gösterilir (ör. ülke-temsilcisi: kendi ülkesi). */
  ulkeAdi?: string;
  /** Verilirse ülke seçilebilir dropdown render edilir (ör. admin: Koordinator tüm ülkeleri yönetir). */
  ulkeSecenekleri?: { id: number; name: string }[];
}) {
  const [form, setForm] = useState({ name: '', sehir: '', ulkeId: '' });

  useEffect(() => {
    if (open) setForm({ name: '', sehir: '', ulkeId: '' });
  }, [open]);

  const ulkeGerekliAmaSecilmedi = !!ulkeSecenekleri && !form.ulkeId;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Yeni Kurum"
      width="sm"
      footer={
        <button
          form="kurum-olustur-form"
          type="submit"
          disabled={olusturuluyor || !form.name.trim() || ulkeGerekliAmaSecilmedi}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {olusturuluyor ? 'Oluşturuluyor…' : 'Oluştur'}
        </button>
      }
    >
      <form
        id="kurum-olustur-form"
        onSubmit={e => { e.preventDefault(); onOlustur(form); }}
        className="space-y-4"
      >
        <p className="text-xs text-slate-400">
          Boş bir kurum kaydı oluşturur — lisans/deneme veya kurum yöneticisi ataması
          bu adımda yapılmaz, sonra ayrıca eklenebilir.
        </p>
        {ulkeAdi && <p className="text-xs text-slate-500">Ülke: <strong>{ulkeAdi}</strong> (sabit)</p>}
        {ulkeSecenekleri && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Ülke *</label>
            <select
              value={form.ulkeId}
              onChange={e => setForm(f => ({ ...f, ulkeId: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">Seçiniz</option>
              {ulkeSecenekleri.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Kurum Adı *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Şehir</label>
          <input
            value={form.sehir}
            onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      </form>
    </SlideOver>
  );
}
