'use client';
import { useEffect } from 'react';
import { useRouter } from '@/navigation';

export default function AdminKutuphaneYeniRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/editor/kutuphane/yeni'); }, [router]);
  return null;
}
