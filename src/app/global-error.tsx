'use client';

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // Kök layout'un kendisi çöktüğünde çalışır — app'in global CSS bundle'ının
  // yüklenmiş olacağı garanti değil, bu yüzden bilinçli olarak inline stil
  // kullanılıyor (Tailwind class'larına güvenmiyor).
  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc' }}>
        <div style={{
          minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '2rem',
            padding: '2rem', textAlign: 'center', maxWidth: '20rem', width: '100%',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Bir hata oluştu</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              Sayfa yüklenirken beklenmeyen bir sorun oluştu.
            </p>
            <button
              onClick={reset}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none',
                background: '#1b75bc', color: '#fff', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Tekrar dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
