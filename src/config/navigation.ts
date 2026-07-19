import type { LucideIcon } from 'lucide-react';
import {
  Shield, LayoutDashboard, Building2, Globe, Users, Sparkles,
  Library, BookOpen, Package, Megaphone, TrendingDown,
  BarChart3, ScrollText,
} from 'lucide-react';
import type { UserRole } from '@/stores/auth';

// Staff sidebar'ının tek veri kaynağı. Menü yalnızca var olan ekranları içerir;
// parite modülleri (Çeviriler, Oturumlar vb.) ekranı yapıldığında buraya eklenir.
// Kural: sidebar en fazla 2 seviye (grup → link); sayfa içi navigasyon route'ta kalır.

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  /** Staff kabuğundan çıkıp öğrenci görünümüne (learn shell) götüren linkler */
  external?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const STAFF: UserRole[] = ['SuperAdmin', 'Koordinator', 'Editor', 'UlkeTemsilcisi', 'KurumYoneticisi', 'Ogretmen'];
const OGRETMENLIK: UserRole[] = ['SuperAdmin', 'Koordinator', 'UlkeTemsilcisi', 'KurumYoneticisi', 'Ogretmen'];

export const STAFF_NAV: NavGroup[] = [
  {
    label: 'Paneller',
    items: [
      { href: '/super-admin',     label: 'Super Admin',     icon: Shield,          roles: ['SuperAdmin'] },
      { href: '/admin',           label: 'Admin Paneli',    icon: LayoutDashboard, roles: ['SuperAdmin', 'Koordinator'] },
      { href: '/ulke-temsilcisi', label: 'Ülke Paneli',     icon: Globe,           roles: ['UlkeTemsilcisi'] },
      { href: '/kurum-yoneticisi', label: 'Kurum Paneli',   icon: Building2,       roles: ['KurumYoneticisi'] },
      { href: '/ogretmen',        label: 'Öğretmen Paneli', icon: Users,           roles: OGRETMENLIK },
    ],
  },
  {
    label: 'Okul',
    items: [
      { href: '/super-admin/kitaplar', label: 'Ders Kitapları',  icon: BookOpen, roles: ['SuperAdmin'] },
      { href: '/editor/kutuphane',     label: 'Okuma Kitapları', icon: Library,  roles: ['SuperAdmin', 'Koordinator', 'Editor'] },
    ],
  },
  {
    label: 'Organizasyon',
    items: [
      { href: '/super-admin/ulkeler', label: 'Ülkeler & Okullar', icon: Globe, roles: ['SuperAdmin'] },
    ],
  },
  {
    label: 'Kullanıcılar',
    items: [
      // "Kullanıcı Oluştur" bilinçli olarak menüde değil: oluşturma eylemi
      // DataTable şablonu gereği liste sayfasının toolbar'ında (Yeni Kullanıcı)
      { href: '/super-admin/kullanicilar', label: 'Kullanıcılar', icon: Users, roles: ['SuperAdmin'] },
    ],
  },
  {
    label: 'Satış',
    items: [
      { href: '/super-admin/kurumsal',          label: 'Kurumsal Satış',    icon: Package,      roles: ['SuperAdmin'] },
      { href: '/super-admin/paketler',          label: 'Paketler',          icon: Package,      roles: ['SuperAdmin'] },
      { href: '/super-admin/kampanyalar',       label: 'Kampanyalar',       icon: Megaphone,    roles: ['SuperAdmin'] },
      { href: '/super-admin/hacim-indirimleri', label: 'Hacim İndirimleri', icon: TrendingDown, roles: ['SuperAdmin'] },
    ],
  },
  {
    label: 'İçerik',
    items: [
      { href: '/ogretmen/ai-icerik', label: 'AI İçerik Stüdyosu', icon: Sparkles, roles: OGRETMENLIK },
      { href: '/kutuphane',          label: 'Kütüphane',          icon: BookOpen, roles: STAFF, external: true },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { href: '/super-admin/raporlar',   label: 'Raporlar',          icon: BarChart3,  roles: ['SuperAdmin'] },
      { href: '/super-admin/loglar',     label: 'Loglar',            icon: ScrollText, roles: ['SuperAdmin'] },
      { href: '/super-admin/ai-ayarlar', label: 'AI Yapılandırma',   icon: Sparkles,   roles: ['SuperAdmin'] },
    ],
  },
];

export function navForRole(role: UserRole): NavGroup[] {
  return STAFF_NAV
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
}

// Breadcrumb etiketleri: nav item'ları + nav'da olmayan ara segmentler.
export const SEGMENT_LABELS: Record<string, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'ogretmen': 'Öğretmen',
  'ulke-temsilcisi': 'Ülke Paneli',
  'kurum-yoneticisi': 'Kurum Paneli',
  'paketler': 'Paketler',
  'kampanyalar': 'Kampanyalar',
  'hacim-indirimleri': 'Hacim İndirimleri',
  'kitaplar': 'Ders Kitapları',
  'editor': 'Okuma Kitapları',
  'kullanicilar': 'Kullanıcı Listesi',
  'ulkeler': 'Ülkeler & Okullar',
  'kurumsal': 'Kurumsal Satış',
  'loglar': 'Loglar',
  'ai-ayarlar': 'AI Yapılandırma',
  'ai-icerik': 'AI İçerik Stüdyosu',
  'kutuphane': 'Kütüphane',
  'sinif': 'Sınıf',
  'kurum': 'Kurum',
  'etkinlik': 'Etkinlik',
  'raporlar': 'Raporlar',
  'okuma': 'Okuma',
  'canli': 'Canlı Oyun',
  'duzenle': 'Düzenle',
  'yeni': 'Yeni',
};

// Sayısal id gibi dinamik segmentlerin breadcrumb'da görünen adı
export const DYNAMIC_SEGMENT_LABEL = 'Detay';
