// Backend API base URL — tek yerden, 5 ayrı dosyaya dağılmış 'http://localhost:5221'
// fallback'i tekrarlamak yerine. Server context'te API_URL (private) önce denenir,
// client context'te yalnızca NEXT_PUBLIC_API_URL görünür.
const FALLBACK = 'http://localhost:5221';

export function getServerApiUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? FALLBACK;
}

export function getClientApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK;
}
