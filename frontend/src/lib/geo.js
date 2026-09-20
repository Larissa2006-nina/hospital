// Geolocation and OSRM Routing Utility

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2));
}

/**
 * Calls the Open Source Routing Machine (OSRM) to get real driving route, driving distance, and travel duration
 */
async function getDrivingRoute(startLat, startLng, endLat, endLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { headers: { 'User-Agent': 'BloodDonationSystem/1.0' } });
    
    if (!res.ok) {
      throw new Error(`OSRM API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Number((route.distance / 1000).toFixed(2)); // in km
      const durationMin = Math.round(route.duration / 60); // in minutes
      
      const steps = route.legs?.[0]?.steps?.map(step => ({
        instruction: step.maneuver?.type + (step.name ? ` onto ${step.name}` : ''),
        distanceKm: Number((step.distance / 1000).toFixed(2)),
        durationMin: Math.round(step.duration / 60),
      })) || [];

      return {
        success: true,
        distanceKm,
        durationMin,
        coordinates: route.geometry?.coordinates || [], // array of [lng, lat]
        steps,
        provider: 'OSRM'
      };
    }
  } catch (error) {
    console.warn('OSRM routing fetch failed, falling back to Haversine calculation:', error.message);
  }

  // Fallback if network/OSRM is temporarily unreachable
  const straightDistance = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  // Estimate road driving distance ~1.3x straight line, approx 40 km/h average speed in city
  const estimatedDrivingKm = Number((straightDistance * 1.3).toFixed(2));
  const estimatedDurationMin = Math.max(5, Math.round((estimatedDrivingKm / 40) * 60));

  return {
    success: true,
    distanceKm: estimatedDrivingKm,
    durationMin: estimatedDurationMin,
    coordinates: [
      [startLng, startLat],
      [endLng, endLat]
    ],
    steps: [
      { instruction: 'Depart from donor location', distanceKm: 0, durationMin: 0 },
      { instruction: 'Proceed along main road towards destination hospital', distanceKm: estimatedDrivingKm, durationMin: estimatedDurationMin },
      { instruction: 'Arrive at Hospital Blood Bank center', distanceKm: 0, durationMin: 0 }
    ],
    provider: 'Estimated'
  };
}

module.exports = {
  calculateHaversineDistance,
  getDrivingRoute,
};
