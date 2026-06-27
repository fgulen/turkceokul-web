import { NextRequest, NextResponse } from 'next/server';

// Vercel'de uzun Claude çağrısı için — local dev'de limit yok
export const maxDuration = 300;

const BACKEND = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const body = await req.json();

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/ai/md-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(290_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Backend bağlantı hatası';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: res.status });
  } catch {
    return new NextResponse(text, { status: res.status });
  }
}
