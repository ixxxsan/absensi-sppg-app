import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';

// 5-minute memory cache to stay strictly within Nominatim usage limits
const geocodeCache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
    return NextResponse.json({ error: 'Invalid coordinate bounds' }, { status: 400 });
  }

  const cacheKey = `${latNum.toFixed(4)},${lonNum.toFixed(4)}`;
  const now = Date.now();
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data);
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lonNum}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AbsensiSPPGApp/1.0 (admin@absensi-sppg-teluknaga03.id)',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      }
    );

    if (!response.ok) {
      console.error(`Nominatim error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Nominatim fetch failed' }, { status: response.status });
    }

    const data = await response.json();
    geocodeCache.set(cacheKey, { data, expiresAt: now + 5 * 60 * 1000 });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
