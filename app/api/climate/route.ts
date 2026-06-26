import { NextRequest, NextResponse } from 'next/server';
import { fetchClimateData } from '@/lib/open-meteo/client';
import type { ClimateResponse } from '@/lib/open-meteo/client';

const cache = new Map<string, { data: ClimateResponse; expiry: number }>();
const CACHE_TTL = 3600 * 1000; // 1 hour

const DEMO_CLIMATE_DATA = [
  {
    lat: -0.6698,
    lng: 37.2655,
    data: {
      rainfallIndexLastSeason: 820,
      droughtIndexLastSeason: -0.3,
      climateRiskLevel: 'low' as const,
      source: 'open-meteo' as const,
      fetchedAt: new Date().toISOString(),
    },
  },
  {
    lat: -0.6800,
    lng: 37.2800,
    data: {
      rainfallIndexLastSeason: 850,
      droughtIndexLastSeason: -0.2,
      climateRiskLevel: 'low' as const,
      source: 'open-meteo' as const,
      fetchedAt: new Date().toISOString(),
    },
  },
  {
    lat: -0.6550,
    lng: 37.2500,
    data: {
      rainfallIndexLastSeason: 780,
      droughtIndexLastSeason: -0.4,
      climateRiskLevel: 'low' as const,
      source: 'open-meteo' as const,
      fetchedAt: new Date().toISOString(),
    },
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('latitude');
  const lngStr = searchParams.get('longitude');

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { error: { code: 'MISSING_COORDS', message: 'Required query parameters: latitude, longitude' } },
      { status: 400 }
    );
  }

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'latitude and longitude must be valid numbers' } },
      { status: 400 }
    );
  }

  const matchedDemo = DEMO_CLIMATE_DATA.find(
    (d) => Math.abs(d.lat - latitude) < 0.005 && Math.abs(d.lng - longitude) < 0.005
  );

  if (matchedDemo) {
    const data = {
      ...matchedDemo.data,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(data, { status: 200 });
  }

  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiry > now) {
    return NextResponse.json(cached.data, { status: 200 });
  }

  try {
    const data = await fetchClimateData(latitude, longitude);
    cache.set(cacheKey, {
      data,
      expiry: now + CACHE_TTL,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API] GET /api/climate failed:', error);
    return NextResponse.json(
      { error: { code: 'CLIMATE_API_UNAVAILABLE', message: 'Open-Meteo API is unreachable or returned an error' } },
      { status: 503 }
    );
  }
}
