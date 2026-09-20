import { NextResponse } from 'next/server';
import { getDrivingRoute, calculateHaversineDistance } from '@/lib/geo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { startLat, startLng, endLat, endLng } = body;

    if (startLat === undefined || startLng === undefined || endLat === undefined || endLng === undefined) {
      return NextResponse.json({ error: 'Missing start or end coordinates' }, { status: 400 });
    }

    const routeData = await getDrivingRoute(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng)
    );

    const straightDistance = calculateHaversineDistance(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng)
    );

    return NextResponse.json({
      success: true,
      straightDistanceKm: straightDistance,
      ...routeData,
    });
  } catch (error) {
    console.error('Geo route API error:', error);
    return NextResponse.json({ error: 'Failed to calculate driving route: ' + error.message }, { status: 500 });
  }
}
