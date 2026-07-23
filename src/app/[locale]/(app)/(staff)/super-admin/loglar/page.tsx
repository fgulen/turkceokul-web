'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AuditLog {
  id: number;
  eylem: string;
  entityType: string;
  entityId?: number | string;
  detay?: string;
  admin: string;
  tarih: string;
}

const ENTITY_LABELS: Record<string, string> = {
  DersKitabi: 'Kitap',
  User: 'Kullanıcı',
  Ulke: 'Ülke',
  Kurum: 'Kurum',
  Sinif: 'Sınıf',
  UlkeDersKitabi: 'Ülke-Kitap',
  KurumLisans: 'Lisans',
  Siparis: 'Sipariş',
};

function eylemRenk(eylem: string): string {
  if (/Sil|Iptal|Kaldir/.test(eylem)) return 'bg-red-100 text-red-700';
  if (/Olustur|Ekle/.test(eylem)) return 'bg-green-100 text-green-700';
  return 'bg-blue-100 text-blue-700';
}
function LoglarTab() {
  const [logFilter, setLogFilter] = useState('Tümü');
  const { data: auditLog } = useQuery<AuditLog[]>({
    queryKey: ['sa-audit-log'],
    queryFn: () => api.get('/api/super-admin/audit-log').then(r => r.data),
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Son İşlemler</h3>
      </div>

      {/* Filtre pilleri */}
      {(auditLog ?? []).length > 0 && (() => {
        const logs = auditLog ?? [];
        const tipler = ['Tümü', ...Array.from(new Set(logs.map((l: AuditLog) => l.entityType)))];
        return (
          <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex gap-2 flex-wrap">
            {tipler.map((tip) => {
              const count = tip === 'Tümü' ? logs.length : logs.filter((l: AuditLog) => l.entityType === tip).length;
              const active = logFilter === tip;
              return (
                <button
                  key={tip}
                  onClick={() => setLogFilter(tip)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ENTITY_LABELS[tip] ?? tip}
                  <span className={`rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none ${
                    active ? 'bg-purple-500 text-white' : 'bg-white text-slate-500'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        );
      })()}

      <div className="divide-y divide-slate-50">
        {(() => {
          const logs = auditLog ?? [];
          const filtered = logFilter === 'Tümü' ? logs : logs.filter((l: AuditLog) => l.entityType === logFilter);
          if (!logs.length) return <p className="px-5 py-6 text-sm text-slate-400 text-center">Henüz işlem yok</p>;
          if (!filtered.length) return <p className="px-5 py-6 text-sm text-slate-400 text-center">Bu kategoride işlem yok</p>;
          return filtered.slice(0, 20).map((log: AuditLog) => (
            <div key={log.id} className="px-5 py-3 flex items-start gap-3">
              <span className={`shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded font-medium ${eylemRenk(log.eylem)}`}>
                {log.eylem}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {ENTITY_LABELS[log.entityType] ?? log.entityType}
                  </span>
                  {log.entityId && <span className="text-xs text-slate-400">#{log.entityId}</span>}
                </div>
                {log.detay && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[380px]">{log.detay}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-600">{log.admin}</p>
                <p className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.tarih).toLocaleString('tr', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

// ─── Kurumsal Satış ─────────────────────────────────────────────────────────


export default function Page() {
  return <LoglarTab />;
}
