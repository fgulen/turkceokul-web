'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Check, ChevronRight, Key, Languages, Library, LogOut, Mail, Phone, Receipt, Shield, User, Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter, useLocale } from '@/navigation';
import { useAuthStore } from '@/stores/auth';
import { PlusBanner } from '@/components/plus-banner';
import { cn } from '@/lib/utils';

export default function ProfilPage() {
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name ?? '');
  const [editEmail, setEditEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(user?.email ?? '');
  const [editPhone, setEditPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lang, setLang] = useState<'tr' | 'en'>('tr');

  // Mock school subscription data
  const schoolSubscription = {
    aktif: true,
    okulAdi: 'Türkçe Okulu Akademisi',
    ogretmen: 'Ayşe Kara',
    sinif: 'A1 - Grupp 3',
    hesapTipi: 'Öğrenci',
  };

  // Mock purchase history
  const purchases = [
    { id: 1, tarih: '2025-04-15', aciklama: 'Premium Bireysel - 1 Aylık', tutar: '£9.99', durum: 'Tamamlandı' },
    { id: 2, tarih: '2025-03-01', aciklama: 'Premium Bireysel - 1 Aylık', tutar: '£9.99', durum: 'Tamamlandı' },
  ];

  // Load avatar from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user-avatar');
    if (saved) setAvatarUrl(saved);
  }, []);

  function handleLogout() {
    logout();
    router.push('/', { locale });
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        try {
          localStorage.setItem('user-avatar', result);
        } catch {
          // localStorage may be full for large images
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function saveName() {
    if (nameDraft.trim()) {
      updateUser({ name: nameDraft.trim() });
    }
    setEditName(false);
  }

  function saveEmail() {
    if (emailDraft.trim()) {
      updateUser({ email: emailDraft.trim() });
    }
    setEditEmail(false);
  }

  function savePhone() {
    setEditPhone(false);
  }

  function handlePasswordChange() {
    if (newPassword === confirmPassword && newPassword.length >= 6) {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Greeting */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Profil Ayarları</h2>
          <p className="text-slate-500 mt-1">Kişisel bilgilerinizi buradan güncelleyin.</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Settings Card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-lg text-slate-900">Hesap Ayarları</h3>
              </div>

              {/* Name */}
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Ad Soyad</p>
                    {editName ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          autoFocus
                        />
                        <button
                          onClick={saveName}
                          className="size-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{user.name}</p>
                    )}
                  </div>
                </div>
                {!editName && (
                  <button
                    onClick={() => { setEditName(true); setNameDraft(user.name); }}
                    className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 shrink-0"
                  >
                    Düzenle <ChevronRight className="size-4" />
                  </button>
                )}
              </div>

              {/* Email */}
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">E-posta</p>
                    {editEmail ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="email"
                          value={emailDraft}
                          onChange={(e) => setEmailDraft(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          autoFocus
                        />
                        <button
                          onClick={saveEmail}
                          className="size-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{user.email}</p>
                    )}
                  </div>
                </div>
                {!editEmail && (
                  <button
                    onClick={() => { setEditEmail(true); setEmailDraft(user.email); }}
                    className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 shrink-0"
                  >
                    Düzenle <ChevronRight className="size-4" />
                  </button>
                )}
              </div>

              {/* Phone */}
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Telefon</p>
                    {editPhone ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="tel"
                          value={phoneDraft}
                          onChange={(e) => setPhoneDraft(e.target.value)}
                          placeholder="+44 7XXX XXX XXX"
                          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          autoFocus
                        />
                        <button
                          onClick={savePhone}
                          className="size-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{phoneDraft || 'Telefon eklenmedi'}</p>
                    )}
                  </div>
                </div>
                {!editPhone && (
                  <button
                    onClick={() => setEditPhone(true)}
                    className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 shrink-0"
                  >
                    Düzenle <ChevronRight className="size-4" />
                  </button>
                )}
              </div>

              {/* Password */}
              <div className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Key className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Şifreyi Güncelle</p>
                    <p className="text-sm text-slate-500">Son değişiklik: 3 ay önce</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 shrink-0"
                >
                  Güncelle <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Language */}
              <div className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Languages className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Dil Tercihleri</p>
                    <p className="text-sm text-slate-500">Arayüz dili: {lang === 'tr' ? 'Türkçe' : 'English'}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {(['tr', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                        lang === l
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                      )}
                    >
                      {l === 'tr' ? 'TR' : 'EN'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unknown Words */}
              <div className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Library className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Bilinmeyen Kelimelerim</p>
                    <p className="text-sm text-slate-500">Kendi sözlüğünü oluştur</p>
                  </div>
                </div>
                <button className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 shrink-0">
                  Görüntüle <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* School Subscription */}
            {schoolSubscription.aktif && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  <h3 className="font-semibold text-lg text-slate-900">Okul Aboneliği</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Okul</span>
                    <span className="text-sm font-semibold text-slate-900">{schoolSubscription.okulAdi}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Öğretmen</span>
                    <span className="text-sm font-semibold text-slate-900">{schoolSubscription.ogretmen}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Sınıf</span>
                    <span className="text-sm font-semibold text-slate-900">{schoolSubscription.sinif}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Hesap Tipi</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                      {schoolSubscription.hesapTipi}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-lg text-slate-900">Satın Alma Geçmişi</h3>
              </div>
              {purchases.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <Receipt className="size-5" />
                  </div>
                  <p className="text-sm text-slate-500">Henüz bir işlem yok</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {purchases.map((p) => (
                    <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Receipt className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{p.aciklama}</p>
                          <p className="text-xs text-slate-500">{p.tarih}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{p.tutar}</p>
                        <p className="text-xs text-green-600 font-medium">{p.durum}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promo Image */}
            <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-emerald-100/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white font-semibold text-lg mb-1">Dil Yolculuğuna Devam Et</h3>
                <p className="text-white/80 text-sm max-w-md">
                  Profilindeki eksik bilgileri tamamlayarak arkadaşlarınla daha iyi etkileşime geçebilirsin.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Photo Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profil"
                    className="w-full h-full rounded-full object-cover border-4 border-primary/10"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/10 border-4 border-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="size-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <h4 className="font-semibold text-lg">{user.name}</h4>
              <p className="text-sm text-slate-500">{user.puan.toLocaleString('tr')} XP</p>
            </div>

            {/* Plus Banner */}
            <PlusBanner />

            {/* Quick Stats */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Hızlı İstatistikler</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Toplam XP</span>
                  <span className="text-sm font-bold text-slate-900">{user.puan.toLocaleString('tr')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Streak</span>
                  <span className="text-sm font-bold text-orange-500">{user.streakCount} gün</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Kalan Kalp</span>
                  <span className="text-sm font-bold text-red-500">{user.kalp} / 5</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 font-semibold hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <LogOut className="size-4" />
              Çıkış Yap
            </button>

            {/* Decorative */}
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <div className="w-full h-36 bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center">
                <Zap className="size-12 text-primary/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-lg text-slate-900 mb-4">Şifre Değiştir</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Mevcut Şifre</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Yeni Şifre</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                {newPassword !== confirmPassword && confirmPassword.length > 0 && (
                  <p className="text-xs text-red-500">Şifreler eşleşmiyor</p>
                )}
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={newPassword !== confirmPassword || newPassword.length < 6}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
