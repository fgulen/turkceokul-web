'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  entityName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({ open, entityName, onConfirm, onCancel, loading }: Props) {
  const [input, setInput] = useState('');

  if (!open) return null;

  function handleConfirm() {
    if (input !== 'DELETE') return;
    onConfirm();
    setInput('');
  }

  function handleCancel() {
    setInput('');
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
            {loading ? 'Siliniyor...' : 'Sil'}
          </button>
        </div>
      </div>
    </div>
  );
}
