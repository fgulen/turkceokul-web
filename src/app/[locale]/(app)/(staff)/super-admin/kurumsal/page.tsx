'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Users, Globe, BarChart3, Shield,
  Pencil, Trash2, Check, X, Search, Plus, Eye, EyeOff,
  RefreshCw, ExternalLink, LogIn, Package, AlertCircle,
  Megaphone, TrendingDown, ScrollText, ChevronRight, UserPlus, Sparkles
} from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { SlideOver } from '@/components/slide-over';
import { useAuthStore, impersonation } from '@/stores/auth';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { ROL_RENKLERI, TUM_ROLLER, apiHataMesaji } from '../shared';

function KurumsalSatisTab() {
  const kartlar = [
    { href: '/super-admin/paketler', icon: Package, title: 'Paketler', desc: 'Kurumsal katalogdaki kitap paketleri (salt okunur)' },
    { href: '/super-admin/kampanyalar', icon: Megaphone, title: 'Kampanyalar', desc: 'Zaman sınırlı indirim kampanyaları oluştur ve yönet' },
    { href: '/super-admin/hacim-indirimleri', icon: TrendingDown, title: 'Hacim İndirimleri', desc: 'Öğrenci sayısına göre kademeli indirim oranları' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kartlar.map(({ href, icon: Icon, title, desc }) => (
        <Link
          key={href}
          href={href}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition-all flex items-start gap-3"
        >
          <div className="size-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Icon className="size-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
          <ChevronRight className="size-4 text-slate-300 shrink-0 mt-2" />
        </Link>
      ))}
    </div>
  );
}

// ─── Kitaplar ─────────────────────────────────────────────────────────────────


export default function Page() {
  return <KurumsalSatisTab />;
}
