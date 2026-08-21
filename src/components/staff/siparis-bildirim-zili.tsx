'use client';

// Global header zili (staff-shell.tsx) — SuperAdmin dashboard'undaki her-zaman-açık
// "Bekleyen Siparişler" bloğu ortamı karıştırıyordu (kullanıcı geri bildirimi); yerine
// admin/page.tsx'teki Bell deseninin global header'a taşınmış hali: sadece işlem
// gerektiren bekleyen sipariş varsa görünür, tıklayınca liste açılır.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SlideOver } from '@/components/slide-over';
import { BekleyenSiparisRow, type Siparis } from '@/components/staff/bekleyen-siparis-row';

export function SiparisBildirimZili() {
  const [acik, setAcik] = useState(false);

  const { data: bekleyenSiparisler = [], isLoading } = useQuery<Siparis[]>({
    queryKey: ['sa-siparisler-bekleyen'],
    queryFn: () => api.get('/api/super-admin/siparisler?durum=Beklemede').then(r => r.data),
  });

  const sayi = bekleyenSiparisler.length;
  if (isLoading || sayi === 0) return null;

  return (
    <>
      <motion.button
        onClick={() => setAcik(true)}
        title="Bekleyen Siparişler"
        className="relative shrink-0 size-9 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
        animate={{ rotate: [0, -14, 11, -8, 5, -2, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
      >
        <Bell className="size-5" />
        <motion.span
          className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
        >
          {sayi}
        </motion.span>
      </motion.button>

      <SlideOver open={acik} onClose={() => setAcik(false)} title="Bekleyen Siparişler" width="md">
        <div className="space-y-3">
          {bekleyenSiparisler.map(s => (
            <BekleyenSiparisRow key={s.id} siparis={s}
              siparisEndpoint="/api/super-admin"
              bekleyenQueryKey={['sa-siparisler-bekleyen']}
              extraInvalidateKeys={[['sa-istatistikler']]} />
          ))}
        </div>
      </SlideOver>
    </>
  );
}
