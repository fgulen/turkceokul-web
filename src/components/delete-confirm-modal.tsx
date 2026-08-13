'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export interface DeleteImpactSatir {
  label: string;
  count: number;
}

interface Props {
  open: boolean;
  entityName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** İlk silme denemesi 409 (bağımlılık var) dönerse çağıran taraf bunu set eder —
   *  modal etki listesini gösterir, buton "Hepsini birlikte sil"e döner, bir sonraki
   *  onConfirm çağıranın tarafında zorla=true ile tekrar denenir. */
  impact?: DeleteImpactSatir[] | null;
}

export function DeleteConfirmModal({ open, entityName, onConfirm, onCancel, loading, impact }: Props) {
  const [input, setInput] = useState('');

  // Modal aynı bileşen örneğinde açılıp kapanıyor (parent koşullu render etmiyor,
  // `open` sadece null döndürüyor) — her yeni açılışta girdiyi sıfırla. onConfirm
  // sonrası HEMEN temizlemiyoruz artık: 409 (bağımlılık var) dönerse aynı "DELETE"
  // yazısı geçerli kalır, admin "Hepsini birlikte sil"e tekrar yazmadan basabilir.
  useEffect(() => {
    if (open) setInput('');
  }, [open]);

  if (!open) return null;

  function handleConfirm() {
    if (input !== 'DELETE') return;
    onConfirm();
  }

  function handleCancel() {
    setInput('');
    onCancel();
  }

  // Portal + z-[80]: SlideOver ile aynı sebep — üst öğelerin stacking
  // context'i modalı sticky header'ın altında bırakmasın.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Silmeyi onayla</h2>
          </div>
          <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-700 font-mono break-all">{entityName}</p>
        </div>

        {impact && impact.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-amber-800 mb-1.5">Bununla birlikte:</p>
            <ul className="text-xs text-amber-700 space-y-0.5">
              {impact.map(i => <li key={i.label}>• {i.count} {i.label}</li>)}
            </ul>
          </div>
        )}

        <p className="text-sm text-slate-600 mb-3">
          Bu işlem geri alınamaz. Devam etmek için aşağıya{' '}
          <span className="font-mono font-bold text-slate-900">DELETE</span> yazın.
        </p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder="DELETE"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleConfirm}
            disabled={input !== 'DELETE' || loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Siliniyor...' : impact && impact.length > 0 ? 'Hepsini birlikte sil' : 'Sil'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
