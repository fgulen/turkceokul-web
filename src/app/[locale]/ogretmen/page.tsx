'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, GraduationCap, Plus, Users, ClipboardList, ArrowRight,
  Building2, Globe, UserCheck, AlertCircle,
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Link } from '@/navigation';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Sinif {
  id: number;
  name: string;
  katilimKodu: string;
  dersKitabiId: string | null;
  ogrenciSayisi: number;
  odevSayisi: number;
  olusturmaTarihi: string;
}

interface IdName { id: number; name: string }
interface OgretmenItem { id: number; ad: string }

interface FormData {
  rol: string;
  ulkeler?: IdName[];
  ulke?: IdName | null;
  kurumlar?: IdName[];
  kurum?: IdName | null;
  ogretmenler?: OgretmenItem[];
}

export default function OgretmenDashboard() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const qc = useQueryClient();
  const [formAcik, setFormAcik] = useState(false);

  // Form state
  const [sinifAdi, setSinifAdi] = useState('');
  const [seciliUlkeId, setSeciliUlkeId] = useState<number | null>(null);
  const [seciliKurumId, setSeciliKurumId] = useState<number | null>(null);
  const [seciliOgretmenId, setSeciliOgretmenId] = useState<number | null>(null);

  const { data: siniflar, isLoading } = useQuery<Sinif[]>({
    queryKey: ['siniflarim'],
    queryFn: () => api.get('/api/ogretmen/siniflarim').then(r => r.data),
    enabled: !!user,
  });

  const { data: formData } = useQuery<FormData>({
    queryKey: ['sinif-form-data'],
    queryFn: () => api.get('/api/ogretmen/sinif-form-data').then(r => r.data),
    enabled: !!user && formAcik,
  });

  // Cascade: SuperAdmin ülke seçince kurumları çek
  const { data: cascadeKurumlar } = useQuery<IdName[]>({
    queryKey: ['kurumlar-by-ulke', seciliUlkeId],
    queryFn: () => api.get(`/api/ogretmen/kurumlar?ulkeId=${seciliUlkeId}`).then(r => r.data),
    enabled: !!seciliUlkeId && (formData?.rol === 'SuperAdmin' || formData?.rol === 'UlkeTemsilcisi'),
  });

  // Cascade: kurum seçince öğretmenleri çek (SuperAdmin + UlkeTemsilcisi)
  const { data: cascadeOgretmenler } = useQuery<OgretmenItem[]>({
    queryKey: ['ogretmenler-by-kurum', seciliKurumId],
    queryFn: () => api.get(`/api/ogretmen/ogretmenler?kurumId=${seciliKurumId}`).then(r => r.data),
    enabled: !!seciliKurumId && (formData?.rol === 'SuperAdmin' || formData?.rol === 'UlkeTemsilcisi'),
  });

  const olusturMutation = useMutation({
    mutationFn: () => {
      const rol = formData?.rol;
      const body: Record<string, unknown> = { name: sinifAdi };
      if (rol === 'SuperAdmin') {
        if (seciliKurumId) body.kurumId = seciliKurumId;
        if (seciliOgretmenId) body.ogretmenUserId = seciliOgretmenId;
      } else if (rol === 'KurumYoneticisi') {
        if (seciliOgretmenId) body.ogretmenUserId = seciliOgretmenId;
      }
      return api.post('/api/ogretmen/sinif', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siniflarim'] });
      resetForm();
    },
  });

  function resetForm() {
    setSinifAdi('');
    setSeciliUlkeId(null);
    setSeciliKurumId(null);
    setSeciliOgretmenId(null);
    setFormAcik(false);
  }

  function handleUlkeChange(ulkeId: number) {
    setSeciliUlkeId(ulkeId);
    setSeciliKurumId(null);
    setSeciliOgretmenId(null);
  }

  function handleKurumChange(kurumId: number) {
    setSeciliKurumId(kurumId);
    setSeciliOgretmenId(null);
  }

  // Hangi öğretmen listesi kullanılacak
  const ogretmenListesi: OgretmenItem[] =
    formData?.rol === 'KurumYoneticisi'
      ? (formData.ogretmenler ?? [])
      : (cascadeOgretmenler ?? []);

  // "Oluştur" butonu ne zaman aktif?
  const rol = formData?.rol ?? '';
  const olusturAktif = sinifAdi.trim().length > 0 && !olusturMutation.isPending;

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Başlık */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">İyi günler, {user.name}!</h1>
            <p className="text-slate-500 text-sm mt-1">Öğretmen Paneli</p>
          </div>
          <button
            onClick={() => setFormAcik(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Yeni Sınıf
          </button>
        </div>

        {/* Yeni sınıf formu */}
        {formAcik && (
          <div className="mb-6 p-5 bg-white rounded-2xl border border-border shadow-sm">
            <h3 className="font-semibold mb-4">Yeni Sınıf Oluştur</h3>

            {!formData ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="size-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
                Yükleniyor...
              </div>
            ) : (
              <div className="space-y-3">

                {/* Öğretmen: salt-okunur ülke + kurum */}
                {rol === 'Ogretmen' && (
                  <div className="flex flex-wrap gap-2">
                    {formData.ulke && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        <Globe className="size-3.5" />
                        {formData.ulke.name}
                      </span>
                    )}
                    {formData.kurum && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
                        <Building2 className="size-3.5" />
                        {formData.kurum.name}
                      </span>
                    )}
                  </div>
                )}

                {/* KurumYoneticisi: salt-okunur kurum + öğretmen dropdown */}
                {rol === 'KurumYoneticisi' && (
                  <>
                    {formData.kurum && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
                        <Building2 className="size-3.5" />
                        {formData.kurum.name}
                      </span>
                    )}
                    <OgretmenSelect
                      ogretmenler={formData.ogretmenler ?? []}
                      value={seciliOgretmenId}
                      onChange={setSeciliOgretmenId}
                    />
                    {(formData.ogretmenler ?? []).length === 0 && (
                      <UyariMesaji text="Bu kurumda kayıtlı ve onaylı öğretmen bulunamadı." />
                    )}
                  </>
                )}

                {/* SuperAdmin + UlkeTemsilcisi: cascade dropdown'lar */}
                {(rol === 'SuperAdmin' || rol === 'UlkeTemsilcisi') && (
                  <>
                    {/* Ülke */}
                    {rol === 'SuperAdmin' ? (
                      <SelectField
                        label="Ülke"
                        icon={<Globe className="size-3.5" />}
                        placeholder="Ülke seçin"
                        options={(formData.ulkeler ?? []).map(u => ({ value: u.id, label: u.name }))}
                        value={seciliUlkeId}
                        onChange={v => handleUlkeChange(v as number)}
                      />
                    ) : (
                      formData.ulke && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                          <Globe className="size-3.5" />
                          {formData.ulke.name}
                        </span>
                      )
                    )}

                    {/* Kurum */}
                    <SelectField
                      label="Kurum"
                      icon={<Building2 className="size-3.5" />}
                      placeholder={seciliUlkeId || rol === 'UlkeTemsilcisi' ? 'Kurum seçin' : 'Önce ülke seçin'}
                      options={(cascadeKurumlar ?? formData.kurumlar ?? []).map(k => ({ value: k.id, label: k.name }))}
                      value={seciliKurumId}
                      onChange={v => handleKurumChange(v as number)}
                      disabled={!seciliUlkeId && rol === 'SuperAdmin'}
                    />

                    {/* Öğretmen */}
                    <SelectField
                      label="Öğretmen"
                      icon={<UserCheck className="size-3.5" />}
                      placeholder={seciliKurumId ? 'Öğretmen seçin (opsiyonel)' : 'Önce kurum seçin'}
                      options={(cascadeOgretmenler ?? []).map(o => ({ value: o.id, label: o.ad }))}
                      value={seciliOgretmenId}
                      onChange={v => setSeciliOgretmenId(v as number | null)}
                      disabled={!seciliKurumId}
                      optional
                    />

                    {seciliKurumId && cascadeOgretmenler?.length === 0 && (
                      <UyariMesaji text="Bu kurumda kayıtlı ve onaylı öğretmen bulunamadı." />
                    )}
                  </>
                )}

                {/* Sınıf adı — her rolde */}
                <input
                  type="text"
                  value={sinifAdi}
                  onChange={e => setSinifAdi(e.target.value)}
                  placeholder="Sınıf adı (örn: A1 Grubu)"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={e => e.key === 'Enter' && olusturAktif && olusturMutation.mutate()}
                />

                {olusturMutation.isError && (
                  <p className="text-red-500 text-sm">{(olusturMutation.error as Error).message}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => olusturMutation.mutate()}
                    disabled={!olusturAktif}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
                  >
                    {olusturMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm hover:bg-slate-200 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sınıf kartları */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-white animate-pulse" />)}
          </div>
        ) : !siniflar?.length ? (
          <div className="text-center py-20">
            <GraduationCap className="size-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Henüz sınıf oluşturmadınız.</p>
            <p className="text-slate-400 text-sm mt-1">Yukarıdan yeni bir sınıf ekleyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {siniflar.map(sinif => (
              <Link
                key={sinif.id}
                href={`/ogretmen/sinif/${sinif.id}`}
                className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="size-11 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="size-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-mono">
                    {sinif.katilimKodu}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors mb-3">
                  {sinif.name}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {sinif.ogrenciSayisi} öğrenci
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="size-3.5" />
                    {sinif.odevSayisi} ödev
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Sınıfa git <ArrowRight className="size-3.5" />
                </div>
              </Link>
            ))}

            <button
              onClick={() => setFormAcik(true)}
              className="p-5 bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary min-h-[160px]"
            >
              <Plus className="size-8" />
              <span className="text-sm font-medium">Yeni Sınıf</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Yardımcı bileşenler ────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  options: { value: number; label: string }[];
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  optional?: boolean;
}

function SelectField({ label, icon, placeholder, options, value, onChange, disabled, optional }: SelectFieldProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
        {icon}
        <span className="text-xs font-medium">{label}{optional ? '' : '*'}</span>
      </div>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        disabled={disabled || options.length === 0}
        className={cn(
          'w-full pl-24 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none',
          (disabled || options.length === 0) && 'bg-slate-50 text-slate-400 cursor-not-allowed',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function OgretmenSelect({
  ogretmenler, value, onChange,
}: {
  ogretmenler: OgretmenItem[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
        <UserCheck className="size-3.5" />
        <span className="text-xs font-medium">Öğretmen</span>
      </div>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        disabled={ogretmenler.length === 0}
        className={cn(
          'w-full pl-28 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none',
          ogretmenler.length === 0 && 'bg-slate-50 text-slate-400 cursor-not-allowed',
        )}
      >
        <option value="">Kendiniz için (siz)</option>
        {ogretmenler.map(o => (
          <option key={o.id} value={o.id}>{o.ad}</option>
        ))}
      </select>
    </div>
  );
}

function UyariMesaji({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
      <AlertCircle className="size-4 shrink-0" />
      {text}
    </div>
  );
}
