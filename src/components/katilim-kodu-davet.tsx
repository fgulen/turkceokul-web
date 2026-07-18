'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';

interface Props {
  katilimKodu: string;
  locale: string;
}

// sinif/[sinifId]/page.tsx'teki QR modalından çıkarıldı — sınıfa katılım QR + PIN
// gösterimi artık burada, hem o modalde hem yeni sınıf oluşturma sonrası davet
// ekranında (SinifFormSlideOver) kullanılıyor.
export function KatilimKoduDavet({ katilimKodu, locale }: Props) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/sinif/katil?kod=${katilimKodu}`;

  function kopyala() {
    navigator.clipboard.writeText(katilimKodu);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <QRCodeSVG value={joinUrl} size={200} bgColor="#ffffff" fgColor="#1a1a2e" level="M" />
      <div className="text-center">
        <p className="text-xs text-slate-400 mb-1">Katılım Kodu</p>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-3xl tracking-widest text-slate-800">{katilimKodu}</span>
          <button onClick={kopyala} className="text-slate-400 hover:text-primary transition-colors" title="Kopyala">
            {kopyalandi ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center">
        Öğrenciler bu QR kodu tarayarak veya kodu girerek sınıfa katılabilir.
      </p>
    </div>
  );
}
