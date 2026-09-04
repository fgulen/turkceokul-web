import { BookOpen, Users } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';

// kurum-yoneticisi'nin Lisanslar sekmesi ile ulke-temsilcisi'nin kurum lisans
// paneli ayni veri seklini (LisansService.KurumLisansDurumlari) ayni kart
// yapisiyla gosteriyordu, ikisi de kopya kod tasiyordu (code review bulgu #5).
// Bu dosya o ortak seyleri (tip, sabitler, tekil satir) tek yerde toplar.
export interface LisansKarti {
  id: string;
  name: string;
  seviye: string;
  thumbnailPicture: string | null;
  lisansTipi: 'Deneme' | 'Ucretli' | 'Sponsorlu' | null;
  toplamLisans: number;
  kullanilanLisans: number;
  buton: 'SatinAl' | 'Inceleniyor' | 'EkLisans' | 'UcretsizDene';
}

export const LISANS_TIPI_METIN: Record<string, string> = {
  Deneme: 'Deneme',
  Ucretli: 'Ücretli',
  Sponsorlu: 'Sponsorlu',
};

export const LISANS_TIPI_ROZET: Record<string, string> = {
  Deneme: 'bg-amber-100 text-amber-700',
  Ucretli: 'bg-emerald-100 text-emerald-700',
  Sponsorlu: 'bg-sky-100 text-sky-700',
};

interface LisansKartProps {
  kitap: LisansKarti;
  // Aksiyon alani (buton/rozet) her sayfanin kendi mutasyon/yetki mantigina
  // gore render-prop ile veriliyor — kurum-yoneticisi coklu-durum buton
  // (SatinAl/EkLisans/UcretsizDene), ulke-temsilcisi tek-amacli buton
  // (yalniz UcretsizDene aktif, digerleri salt-okunur rozet) kullaniyor.
  aksiyon: React.ReactNode;
  mesaj?: { tip: 'hata' | 'basari'; metin: string } | null;
  // Kartın ALTINDA tam genişlik render edilen isteğe bağlı alan. Aksiyon slotu kitap
  // adıyla aynı satırı paylaşır ve dar sütunlarda (admin kurum detayı 3'lü grid)
  // birkaç kontrolden fazlasını taşıyamaz — inline düzenleme formu gibi geniş
  // içerikler buraya verilir, başlık ezilmez.
  altSatir?: React.ReactNode;
}

export function LisansKart({ kitap: k, aksiyon, mesaj, altSatir }: LisansKartProps) {
  return (
    <div className="px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {k.thumbnailPicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toMediaUrl(k.thumbnailPicture)!}
              alt={k.name}
              className="w-12 h-16 object-cover rounded-md shrink-0"
            />
          ) : (
            <div className="w-12 h-16 bg-slate-100 rounded-md shrink-0 flex items-center justify-center">
              <BookOpen className="size-5 text-slate-400" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-slate-800 truncate">{k.name}</span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {k.seviye}
              </span>
              {k.lisansTipi && (
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  LISANS_TIPI_ROZET[k.lisansTipi],
                )}>
                  {LISANS_TIPI_METIN[k.lisansTipi]}
                </span>
              )}
            </div>
            {k.lisansTipi && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <Users className="size-3.5" />
                <span className="tabular-nums">{k.kullanilanLisans}/{k.toplamLisans}</span>
                <span>lisans kullanımda</span>
              </div>
            )}
          </div>
        </div>
        {aksiyon}
      </div>
      {altSatir && <div className="mt-3">{altSatir}</div>}
      {mesaj && (
        <p className={cn('text-xs mt-2', mesaj.tip === 'hata' ? 'text-red-500' : 'text-emerald-600')}>
          {mesaj.metin}
        </p>
      )}
    </div>
  );
}
