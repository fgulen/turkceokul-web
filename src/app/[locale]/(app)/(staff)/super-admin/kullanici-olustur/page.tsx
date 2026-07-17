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

function KullaniciOlusturTab() {
  return (
    <div className="max-w-xl">
      <RoleScopedUserForm
        baslik="Kullanıcı Oluştur"
        aciklama="Koordinatör, ülke temsilcisi, kurum yöneticisi veya öğretmen davet et."
        hedefRolSecenekleri={[
          { value: 'Koordinator', label: 'Koordinatör' },
          { value: 'UlkeTemsilcisi', label: 'Ülke Temsilcisi' },
          { value: 'KurumYoneticisi', label: 'Kurum Yöneticisi' },
          { value: 'Ogretmen', label: 'Öğretmen' },
        ]}
      />
    </div>
  );
}

// ─── Kullanıcılar ─────────────────────────────────────────────────────────────


export default function Page() {
  return <KullaniciOlusturTab />;
}
