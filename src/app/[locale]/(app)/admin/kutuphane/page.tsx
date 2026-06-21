'use client';
import { useEffect } from 'react';
import { useRouter } from '@/navigation';

export default function AdminKutuphaneRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/editor/kutuphane'); }, [router]);
  return null;
}
