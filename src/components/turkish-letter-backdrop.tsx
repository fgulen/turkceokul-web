'use client';

type CharDef = { ch: string; top: string; left: string; size: number; rotate: number };

const SETS: Record<string, CharDef[]> = {
  giris: [
    { ch: 'Ğ', top: '8%',  left: '6%',  size: 160, rotate: -18 },
    { ch: 'Ş', top: '12%', left: '82%', size: 140, rotate: 14  },
    { ch: 'Ü', top: '55%', left: '3%',  size: 180, rotate: -8  },
    { ch: 'Ö', top: '72%', left: '88%', size: 150, rotate: 20  },
    { ch: 'İ', top: '82%', left: '18%', size: 130, rotate: -22 },
    { ch: 'Ç', top: '38%', left: '91%', size: 170, rotate: 10  },
    { ch: 'Â', top: '25%', left: '2%',  size: 120, rotate: 30  },
    { ch: 'Ğ', top: '90%', left: '70%', size: 110, rotate: -12 },
  ],
  kayit: [
    { ch: 'Ş', top: '5%',  left: '82%', size: 130, rotate: 14  },
    { ch: 'Ü', top: '60%', left: '-4%', size: 150, rotate: -8  },
    { ch: 'Ö', top: '78%', left: '80%', size: 140, rotate: 18  },
    { ch: 'Ğ', top: '15%', left: '-2%', size: 120, rotate: -20 },
    { ch: 'Ç', top: '42%', left: '88%', size: 160, rotate: 10  },
    { ch: 'İ', top: '88%', left: '30%', size: 110, rotate: -15 },
  ],
  'sifremi-unuttum': [
    { ch: 'Ş', top: '8%',  left: '80%', size: 140, rotate: 14  },
    { ch: 'Ü', top: '60%', left: '3%',  size: 170, rotate: -8  },
    { ch: 'Ö', top: '75%', left: '85%', size: 150, rotate: 20  },
    { ch: 'Ğ', top: '15%', left: '4%',  size: 130, rotate: -18 },
    { ch: 'Ç', top: '40%', left: '88%', size: 160, rotate: 10  },
  ],
  'sifremi-sifirla': [
    { ch: 'Ü', top: '10%', left: '82%', size: 150, rotate: 12  },
    { ch: 'Ğ', top: '15%', left: '2%',  size: 130, rotate: -20 },
    { ch: 'Ş', top: '65%', left: '5%',  size: 160, rotate: -8  },
    { ch: 'Ö', top: '78%', left: '84%', size: 140, rotate: 18  },
    { ch: 'İ', top: '40%', left: '90%', size: 170, rotate: 10  },
  ],
  'seviye-testi': [
    { ch: 'İ', top: '6%',  left: '7%',  size: 150, rotate: -20 },
    { ch: 'Ü', top: '10%', left: '82%', size: 145, rotate: 16  },
    { ch: 'Ö', top: '48%', left: '4%',  size: 165, rotate: -10 },
    { ch: 'Ç', top: '70%', left: '86%', size: 140, rotate: 22  },
    { ch: 'Ğ', top: '85%', left: '28%', size: 130, rotate: -15 },
    { ch: 'Ş', top: '32%', left: '91%', size: 155, rotate: 8   },
  ],
  'super-admin': [
    { ch: 'Ş', top: '5%',  left: '92%', size: 145, rotate: 16  },
    { ch: 'Ğ', top: '18%', left: '1%',  size: 125, rotate: -22 },
    { ch: 'Ü', top: '68%', left: '93%', size: 155, rotate: 12  },
    { ch: 'Ö', top: '86%', left: '4%',  size: 135, rotate: -14 },
    { ch: 'Â', top: '42%', left: '95%', size: 115, rotate: 20  },
  ],
  admin: [
    { ch: 'İ', top: '7%',  left: '89%', size: 140, rotate: -18 },
    { ch: 'Ç', top: '22%', left: '1%',  size: 150, rotate: 14  },
    { ch: 'Ş', top: '60%', left: '91%', size: 130, rotate: -10 },
    { ch: 'Ğ', top: '78%', left: '2%',  size: 145, rotate: 20  },
    { ch: 'Ü', top: '40%', left: '94%', size: 125, rotate: 8   },
  ],
  ogretmen: [
    { ch: 'Ö', top: '5%',  left: '87%', size: 145, rotate: -12 },
    { ch: 'Ü', top: '16%', left: '1%',  size: 135, rotate: 24  },
    { ch: 'Ğ', top: '55%', left: '90%', size: 155, rotate: -8  },
    { ch: 'İ', top: '72%', left: '3%',  size: 130, rotate: 18  },
    { ch: 'Ç', top: '36%', left: '92%', size: 120, rotate: -20 },
    { ch: 'Â', top: '90%', left: '76%', size: 115, rotate: 12  },
  ],
  kutuphane: [
    { ch: 'Ç', top: '4%',  left: '85%', size: 150, rotate: 10  },
    { ch: 'İ', top: '20%', left: '2%',  size: 140, rotate: -16 },
    { ch: 'Ö', top: '52%', left: '89%', size: 160, rotate: 14  },
    { ch: 'Ş', top: '80%', left: '1%',  size: 135, rotate: -22 },
    { ch: 'Ü', top: '38%', left: '93%', size: 125, rotate: 8   },
    { ch: 'Â', top: '68%', left: '74%', size: 115, rotate: -10 },
  ],
};

/**
 * Sayfaların arka planına Türkçe harfler koyar.
 * fixed=true (varsayılan) → viewport sabitli, scroll eden sayfalar için ideal.
 * fixed=false → absolute, position:relative+overflow:hidden bir kapsayıcı içinde kullan.
 * İçerik div'inin position:relative + zIndex:1 olması gerekir (harflerin arkasında kalmaması için).
 */
export function TurkishLetterBackdrop({
  variant,
  opacity = 0.055,
  color = '#1b75bc',
  fixed = true,
}: {
  variant: string;
  opacity?: number;
  color?: string;
  fixed?: boolean;
}) {
  const chars = SETS[variant] ?? [];
  return (
    <div
      aria-hidden="true"
      style={{
        position: fixed ? 'fixed' : 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {chars.map((c, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            fontSize: c.size,
            fontWeight: 900,
            lineHeight: 1,
            color,
            opacity,
            transform: `rotate(${c.rotate}deg)`,
            userSelect: 'none',
          }}
        >
          {c.ch}
        </span>
      ))}
    </div>
  );
}
