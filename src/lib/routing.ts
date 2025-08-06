import type { Location, TollGate, RouteSegment } from "@/types"

// OSRM API for real routing
const OSRM_BASE_URL = "https://router.project-osrm.org"

// Toll road entrance/exit points in Java (major highways)
export const TOLL_GATES: TollGate[] = [
  { "name": "GT CIPUTAT", "lat": -6.2744, "lng": 106.7394 },
  { "name": "GT PONDOK AREN", "lat": -6.2633, "lng": 106.7061 },
  { "name": "GT SERPONG", "lat": -6.2989, "lng": 106.6697 },
  { "name": "GT BSD", "lat": -6.3014, "lng": 106.6692 },
  { "name": "GT JATIASIH", "lat": -6.2744, "lng": 106.9789 },
  { "name": "GT CIKARANG BARAT", "lat": -6.2744, "lng": 107.1094 },
  { "name": "GT CIKARANG TIMUR", "lat": -6.2744, "lng": 107.1789 },
  { "name": "GT KARAWANG BARAT", "lat": -6.3011, "lng": 107.3319 },
  { "name": "GT KARAWANG TIMUR", "lat": -6.3011, "lng": 107.3819 },
  { "name": "GT CIKAMPEK", "lat": -6.4197, "lng": 107.4581 },
  { "name": "GT DAWUAN", "lat": -6.6394, "lng": 107.8789 },
  { "name": "GT JATIBARANG", "lat": -6.8394, "lng": 108.1789 },
  { "name": "GT PALIMANAN", "lat": -6.7063, "lng": 108.4071 },
  { "name": "GT PLUMBON", "lat": -6.7063, "lng": 108.4771 },
  { "name": "GT KANCI", "lat": -6.9394, "lng": 108.6789 },
  { "name": "GT BREBES TIMUR", "lat": -6.8394, "lng": 108.8789 },
  { "name": "GT BREBES BARAT", "lat": -6.8394, "lng": 108.7789 },
  { "name": "GT TEGAL", "lat": -6.8694, "lng": 109.1389 },
  { "name": "GT PEMALANG", "lat": -6.8994, "lng": 109.3789 },
  { "name": "GT PEKALONGAN", "lat": -6.8894, "lng": 109.6789 },
  { "name": "GT BATANG", "lat": -6.9094, "lng": 109.7389 },
  { "name": "GT WELERI", "lat": -6.9594, "lng": 110.0789 },
  { "name": "GT KENDAL", "lat": -6.9294, "lng": 110.2089 },
  { "name": "GT SEMARANG", "lat": -6.9913, "lng": 110.4213 },
  { "name": "GT UNGARAN", "lat": -7.1394, "lng": 110.4089 },
  { "name": "GT BAWEN", "lat": -7.2394, "lng": 110.4389 },
  { "name": "GT SALATIGA", "lat": -7.3194, "lng": 110.4989 },
  { "name": "GT BOYOLALI", "lat": -7.5294, "lng": 110.5989 },
  { "name": "GT KARTASURA", "lat": -7.5594, "lng": 110.7389 },
  { "name": "GT SOLO", "lat": -7.5700, "lng": 110.8267 },
  { "name": "GT SRAGEN", "lat": -7.4194, "lng": 111.0089 },
  { "name": "GT NGAWI", "lat": -7.4194, "lng": 111.4489 },
  { "name": "GT KERTOSONO", "lat": -7.5894, "lng": 112.0989 },
  { "name": "GT JOMBANG", "lat": -7.5494, "lng": 112.2389 },
  { "name": "GT MOJOKERTO", "lat": -7.4594, "lng": 112.4389 },
  { "name": "GT SIDOARJO", "lat": -7.4494, "lng": 112.7189 },
  { "name": "GT SURABAYA", "lat": -7.2575, "lng": 112.7521 },
  { "name": "GT GEMPOL", "lat": -7.5494, "lng": 112.7689 },
  { "name": "GT PANDAAN", "lat": -7.6494, "lng": 112.6889 },
  { "name": "GT MALANG", "lat": -7.9666, "lng": 112.6326 },
  { "name": "GT PEJAGAN", "lat": -6.8394, "lng": 108.8789 },
];

export interface RouteResponse {
  coordinates: { lat: number; lng: number }[]
  distance: number // in kilometers
  duration: number // in minutes
  segments: RouteSegment[]
}

// Enhanced speed calculation with proper toll speeds (80-100 km/h)
const getRealisticSpeed = (segmentType: string, distance: number): number => {
  let baseSpeed: number;
  
  if (segmentType === 'toll') {
    // Toll roads: 80-100 km/h as requested
    baseSpeed = Math.floor(Math.random() * (100 - 80 + 1)) + 80;
  } else if (distance < 20) {
    // City/local roads: 30-50 km/h
    baseSpeed = Math.floor(Math.random() * (50 - 30 + 1)) + 30;
  } else if (distance < 50) {
    // Regional roads: 50-70 km/h
    baseSpeed = Math.floor(Math.random() * (70 - 50 + 1)) + 50;
  } else {
    // Long distance non-toll: 60-80 km/h
    baseSpeed = Math.floor(Math.random() * (80 - 60 + 1)) + 60;
  }
  
  // Add small variation (-3 to +3 km/h)
  const variation = Math.floor(Math.random() * 7) - 3;
  return Math.max(20, Math.min(110, baseSpeed + variation));
};

// Calculate route from segments
export const calculateRouteFromSegments = async (segments: RouteSegment[]): Promise<RouteResponse> => {
  try {
    console.log('🛣️ Calculating route from', segments.length, 'segments');
    
    const routePoints: Location[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    const allCoordinates: { lat: number; lng: number }[] = [];
    
    // Process each segment
    for (let i = 0; i < segments.length - 1; i++) {
      const currentSegment = segments[i];
      const nextSegment = segments[i + 1];
      
      let startPoint: Location;
      let endPoint: Location;
      let segmentType = 'direct';
      
      // Determine start point
      if (currentSegment.type === 'toll_entry' && currentSegment.toll_entry_gate) {
        startPoint = {
          name: currentSegment.toll_entry_gate.name,
          lat: currentSegment.toll_entry_gate.lat,
          lng: currentSegment.toll_entry_gate.lng
        };
      } else {
        startPoint = currentSegment.location;
      }
      
      // Determine end point and segment type
      if (nextSegment.type === 'toll_entry' && nextSegment.toll_entry_gate) {
        endPoint = {
          name: nextSegment.toll_entry_gate.name,
          lat: nextSegment.toll_entry_gate.lat,
          lng: nextSegment.toll_entry_gate.lng
        };
      } else if (nextSegment.type === 'toll_exit' && nextSegment.toll_exit_gate) {
        endPoint = {
          name: nextSegment.toll_exit_gate.name,
          lat: nextSegment.toll_exit_gate.lat,
          lng: nextSegment.toll_exit_gate.lng
        };
        segmentType = 'toll'; // This is a toll segment
      } else {
        endPoint = nextSegment.location;
      }
      
      // Calculate segment route
      const segmentDistance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);
      const segmentSpeed = getRealisticSpeed(segmentType, segmentDistance);
      const segmentDurationMinutes = (segmentDistance / segmentSpeed) * 60;
      
      totalDistance += segmentDistance;
      totalDuration += segmentDurationMinutes;
      
      // Add stop duration if this is a stop
      if (currentSegment.type === 'stop' && currentSegment.stop_duration) {
        totalDuration += currentSegment.stop_duration;
      }
      
      // Generate coordinates for this segment
      const segmentCoords = generateSegmentCoordinates(startPoint, endPoint, segmentType);
      allCoordinates.push(...segmentCoords);
      
      console.log(`📍 Segment ${i + 1}: ${startPoint.name} → ${endPoint.name} (${segmentDistance.toFixed(1)}km, ${segmentSpeed}km/h, ${segmentType})`);
    }
    
    console.log(`🏁 Route complete: ${totalDistance.toFixed(1)}km, ${Math.round(totalDuration)} minutes`);
    
    return {
      coordinates: allCoordinates,
      distance: totalDistance,
      duration: Math.round(totalDuration),
      segments: segments
    };
    
  } catch (error) {
    console.error('Error calculating route from segments:', error);
    throw error;
  }
};

// Generate smooth coordinates between two points
const generateSegmentCoordinates = (start: Location, end: Location, segmentType: string): { lat: number; lng: number }[] => {
  const coordinates: { lat: number; lng: number }[] = [];
  
  // More points for toll segments (smoother highway animation)
  const numPoints = segmentType === 'toll' ? 50 : 20;
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    coordinates.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    });
  }
  
  return coordinates;
};

// Legacy function for backward compatibility
export const calculateRoute = async (
  departure: Location,
  stops: Location[],
  destination: Location,
): Promise<RouteResponse> => {
  // Convert to segments format
  const segments: RouteSegment[] = [
    {
      id: '1',
      type: 'departure',
      location: departure,
      order: 1
    }
  ];
  
  // Add stops
  stops.forEach((stop, index) => {
    segments.push({
      id: `stop-${index + 1}`,
      type: 'stop',
      location: stop,
      stop_duration: 30, // Default 30 minutes
      order: index + 2
    });
  });
  
  // Add destination
  segments.push({
    id: 'destination',
    type: 'destination',
    location: destination,
    order: segments.length + 1
  });
  
  return calculateRouteFromSegments(segments);
};

// Find nearest toll gates
export const findNearestTollGates = (location: Location, limit: number = 5): TollGate[] => {
  return TOLL_GATES
    .map(gate => ({
      ...gate,
      distance: calculateDistance(location.lat, location.lng, gate.lat, gate.lng)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ distance, ...gate }) => gate);
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}