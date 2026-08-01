'use client';

import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const TONE = {
  danger: { icon: 'bg-red-100 text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
  primary: { icon: 'bg-indigo-100 text-indigo-600', btn: 'bg-primary hover:opacity-90' },
} as const;

// İki kademeli onay: buton tıklanınca bu modal açılır, durumu/sonucu tekrar hatırlatır,
// gerçek işlem yalnızca burada bir kez daha onaylanınca tetiklenir (bkz. DeleteConfirmModal
// ile aynı portal + stacking-context deseni).
export function ConfirmActionModal({
  open, title, message, confirmLabel, cancelLabel = 'Vazgeç', tone = 'danger',
  onConfirm, onCancel, loading,
}: Props) {
  if (!open) return null;
  const t = TONE[tone];

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${t.icon}`}>
              <AlertTriangle className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        <div className="text-sm text-slate-600 mb-5">{message}</div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${t.btn}`}
          >
            {loading ? 'İşleniyor...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
