import type { Location, TollGate, RouteSegment } from "@/types"

// OSRM API for real routing
const OSRM_BASE_URL = "https://router.project-osrm.org"

// Toll road entrance/exit points in Java (major highways)
export const TOLL_GATES: TollGate[] = [
  { "name": "GT KRAKSAAN", "lat": -7.778106, "lng": 113.401204},
  { "name": "GT PAITON", "lat": -7.732100, "lng": 113.502673},
  { "name": "GT BESUKI", "lat": -7.736874, "lng": 113.720038},
  { "name": "GT SITUBONDO", "lat": -7.699739, "lng": 114.041820},
  { "name": "GT ASEMBAGUS", "lat": -7.755602, "lng": 114.179224},
  { "name": "GT BAJULMATI", "lat": -7.938809, "lng": 114.384457},
  { "name": "GT KETAPANG/BANYUWANGI", "lat": -8.111019, "lng": 114.401736},
  { "name": "GT MARGA ASIH TIMUR", "lat": -6.967544, "lng": 107.547896},
  { "name": "GT MARGA ASIH BARAT", "lat": -6.967663, "lng": 107.543624},
  { "name": "GT CIKAMPEK TIMUR", "lat": -6.404701, "lng": 107.454887},
  { "name": "GT CIKAMPEK BARAT", "lat": -6.400889, "lng": 107.449336},
  { "name": "GT TEGAL TIMUR", "lat": -6.876389, "lng": 109.138889},
  { "name": "GT TEGAL BARAT", "lat": -6.876389, "lng": 109.100000},
  { "name": "GT BREBES TIMUR", "lat": -6.876389, "lng": 109.000000},
  { "name": "GT BREBES BARAT", "lat": -6.876389, "lng": 108.950000},
  { "name": "GT PEJAGAN", "lat": -6.876389, "lng": 108.900000}
]

export interface RouteResponse {
  coordinates: { lat: number; lng: number }[]
  distance: number // in kilometers
  duration: number // in minutes
  segments: RouteSegment[]
}

// FIXED: Enhanced OSRM route calculation dengan better error handling
const getRouteFromOSRM = async (startPoint: Location, endPoint: Location): Promise<{
  coordinates: { lat: number; lng: number }[]
  distance: number
  duration: number
}> => {
  try {
    console.log(`🛣️ Frontend: Getting OSRM route from ${startPoint.name} to ${endPoint.name}`)
    
    // Validate coordinates
    if (!isValidCoordinate(startPoint.lat, startPoint.lng) || 
        !isValidCoordinate(endPoint.lat, endPoint.lng)) {
      console.warn('Frontend: Invalid coordinates, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    // Format coordinates for OSRM (lng,lat)
    const coordinates = `${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}`
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`
    
    console.log(`📡 Frontend OSRM API URL: ${url}`)
    
    // FIXED: Better fetch with timeout and error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'TJA-Tracking-System/1.0'
      }
    }).finally(() => clearTimeout(timeoutId))
    
    if (!response.ok) {
      console.warn(`Frontend OSRM API failed (${response.status}), falling back to direct route`)
      return getDirectRoute(startPoint, endPoint)
    }
    
    const data = await response.json()
    
    if (!data.routes || data.routes.length === 0) {
      console.warn('Frontend: No routes found from OSRM, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    const route = data.routes[0]
    const geometry = route.geometry
    
    // Validate geometry
    if (!geometry || !geometry.coordinates || !Array.isArray(geometry.coordinates)) {
      console.warn('Frontend: Invalid geometry from OSRM, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    // Convert GeoJSON coordinates to our format
    const routeCoordinates = geometry.coordinates
      .filter((coord: number[]) => Array.isArray(coord) && coord.length >= 2)
      .map((coord: number[]) => ({
        lat: coord[1], // GeoJSON uses [lng, lat]
        lng: coord[0]
      }))
      .filter((coord: {lat: number, lng: number}) => isValidCoordinate(coord.lat, coord.lng))
    
    if (routeCoordinates.length === 0) {
      console.warn('Frontend: No valid coordinates from OSRM, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    const distanceKm = route.distance / 1000 // Convert meters to kilometers
    const durationMin = route.duration / 60   // Convert seconds to minutes
    
    console.log(`✅ Frontend OSRM route: ${distanceKm.toFixed(1)}km, ${durationMin.toFixed(0)} minutes, ${routeCoordinates.length} points`)
    
    return {
      coordinates: routeCoordinates,
      distance: distanceKm,
      duration: durationMin
    }
    
  } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Frontend: OSRM API timeout, falling back to direct route');
      } else {
          console.warn('Frontend: Error calling OSRM API:', error);
      }
      console.log('Frontend: Falling back to direct route calculation');
      return getDirectRoute(startPoint, endPoint);
  }
}

// Enhanced fallback direct route calculation
const getDirectRoute = (startPoint: Location, endPoint: Location): {
  coordinates: { lat: number; lng: number }[]
  distance: number
  duration: number
} => {
  const directDistance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng)
  const directDuration = (directDistance / 50) * 60 // Assume 50 km/h average
  
  // Generate smooth curve points for better animation
  const coordinates = []
  const numPoints = Math.max(20, Math.min(100, Math.floor(directDistance * 3))) // More points for smoother animation
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints
    
    // Add slight curve to make it look less robotic
    const curveFactor = 0.0001 // Small curve
    const curve = Math.sin(ratio * Math.PI) * curveFactor
    
    coordinates.push({
      lat: startPoint.lat + (endPoint.lat - startPoint.lat) * ratio + curve,
      lng: startPoint.lng + (endPoint.lng - startPoint.lng) * ratio,
    })
  }
  
  console.log(`📍 Frontend direct route fallback: ${directDistance.toFixed(1)}km, ${directDuration.toFixed(0)} minutes`)
  
  return {
    coordinates,
    distance: directDistance,
    duration: directDuration
  }
}

// ENHANCED: Route calculation dengan support untuk partial routes dan better error handling
export const calculateRouteFromSegments = async (segments: RouteSegment[]): Promise<RouteResponse> => {
  try {
    console.log('🛣️ Frontend: Calculating route from', segments.length, 'segments with REAL road data')
    
    if (!segments || segments.length === 0) {
      throw new Error("No segments provided for route calculation")
    }

    if (segments.length === 1) {
      // Single segment - create a small loop for preview
      const segment = segments[0]
      const coordinates = [
        segment.location,
        {
          lat: segment.location.lat + 0.001,
          lng: segment.location.lng + 0.001
        },
        segment.location
      ]
      
      return {
        coordinates,
        distance: 0.1,
        duration: 1,
        segments: segments
      }
    }

    let totalDistance = 0
    let totalDuration = 0
    const allCoordinates: { lat: number; lng: number }[] = []
    
    // Sort segments by order
    const sortedSegments = [...segments].sort((a, b) => a.order - b.order)
    
    // FIXED: Better segment validation
    const validSegments = sortedSegments.filter(segment => {
      const isValid = segment && 
                     segment.location && 
                     typeof segment.location.lat === 'number' && 
                     typeof segment.location.lng === 'number' &&
                     isValidCoordinate(segment.location.lat, segment.location.lng)
      
      if (!isValid) {
        console.warn('Frontend: Filtering out invalid segment:', segment)
      }
      
      return isValid
    })
    
    if (validSegments.length < 2) {
      throw new Error("Need at least 2 valid segments to calculate route")
    }
    
    // ENHANCED: Process each segment pair dengan better error handling
    for (let i = 0; i < validSegments.length - 1; i++) {
      const currentSegment = validSegments[i]
      const nextSegment = validSegments[i + 1]
      
      let startPoint: Location
      let endPoint: Location
      let segmentType = 'direct'
      
      // Determine start point
      if (currentSegment.type === 'toll_entry' && currentSegment.toll_entry_gate) {
        startPoint = {
          name: currentSegment.toll_entry_gate.name,
          lat: currentSegment.toll_entry_gate.lat,
          lng: currentSegment.toll_entry_gate.lng
        }
      } else {
        startPoint = currentSegment.location
      }
      
      // Determine end point and segment type
      if (nextSegment.type === 'toll_entry' && nextSegment.toll_entry_gate) {
        endPoint = {
          name: nextSegment.toll_entry_gate.name,
          lat: nextSegment.toll_entry_gate.lat,
          lng: nextSegment.toll_entry_gate.lng
        }
      } else if (nextSegment.type === 'toll_exit' && nextSegment.toll_exit_gate) {
        endPoint = {
          name: nextSegment.toll_exit_gate.name,
          lat: nextSegment.toll_exit_gate.lat,
          lng: nextSegment.toll_exit_gate.lng
        }
        segmentType = 'toll' // This is a toll segment
      } else {
        endPoint = nextSegment.location
      }
      
      // Skip if start and end points are too close (same location)
      const segmentDistance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng)
      if (segmentDistance < 0.01) {
        console.log(`⚠️ Frontend: Skipping segment ${i + 1} (distance too small: ${segmentDistance.toFixed(3)}km)`)
        continue
      }
      
      // ENHANCED: Get real route with better error handling
      console.log(`🚗 Frontend: Getting REAL route: ${startPoint.name} → ${endPoint.name} (${segmentType})`)
      
      let routeData
      try {
        routeData = await getRouteFromOSRM(startPoint, endPoint)
      } catch (error) {
        console.warn(`Frontend: Route calculation failed for ${startPoint.name} → ${endPoint.name}:`, error)
        routeData = getDirectRoute(startPoint, endPoint)
      }
      
      if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
        console.warn(`Frontend: No route data for segment ${i + 1}, using direct route`)
        routeData = getDirectRoute(startPoint, endPoint)
      }
      
      // Add calculated segment to totals
      totalDistance += routeData.distance
      totalDuration += routeData.duration
      
      // Add stop duration if this is a stop
      if (currentSegment.type === 'stop' && currentSegment.stop_duration) {
        totalDuration += currentSegment.stop_duration
        console.log(`⏱️ Frontend: Added ${currentSegment.stop_duration} minutes stop time at ${currentSegment.location.name}`)
      }
      
      // Add coordinates from this segment (avoid duplication)
      if (i === 0) {
        allCoordinates.push(...routeData.coordinates)
      } else {
        // Skip first point to avoid duplication, but ensure continuity
        const lastCoord = allCoordinates[allCoordinates.length - 1]
        const firstNewCoord = routeData.coordinates[0]
        
        // Check if there's a gap between segments
        if (lastCoord && firstNewCoord) {
          const gap = calculateDistance(lastCoord.lat, lastCoord.lng, firstNewCoord.lat, firstNewCoord.lng)
          if (gap > 0.1) { // If gap > 100m, add connecting line
            console.log(`🔗 Frontend: Adding connection between segments (gap: ${gap.toFixed(2)}km)`)
            allCoordinates.push(firstNewCoord)
          }
        }
        
        allCoordinates.push(...routeData.coordinates.slice(1)) // Skip first point to avoid duplication
      }
      
      console.log(`📍 Frontend Segment ${i + 1}: ${startPoint.name} → ${endPoint.name} (${routeData.distance.toFixed(1)}km, ${routeData.duration.toFixed(0)}min, ${segmentType}, ${routeData.coordinates.length} points)`)
    }
    
    // Ensure we have some coordinates
    if (allCoordinates.length === 0) {
      console.log('🔄 Frontend: No coordinates found, creating fallback')
      
      // Use first and last segment locations for fallback
      const firstSegment = validSegments[0]
      const lastSegment = validSegments[validSegments.length - 1]
      
      if (firstSegment && lastSegment) {
        const fallbackRoute = await getRouteFromOSRM(firstSegment.location, lastSegment.location)
        allCoordinates.push(...fallbackRoute.coordinates)
        totalDistance = fallbackRoute.distance
        totalDuration = fallbackRoute.duration
      }
    }
    
    // Ensure minimum values
    totalDistance = Math.max(0.1, totalDistance)
    totalDuration = Math.max(1, totalDuration)
    
    console.log(`🏁 Frontend Complete route: ${totalDistance.toFixed(1)}km, ${Math.round(totalDuration)} minutes, ${allCoordinates.length} coordinate points following REAL roads`)
    
    return {
      coordinates: allCoordinates,
      distance: totalDistance,
      duration: Math.round(totalDuration),
      segments: segments
    }
    
  } catch (error) {
    console.error('Frontend: Error calculating route from segments:', error)
    
    // ENHANCED: Better emergency fallback
    if (segments.length >= 2) {
      const validSegments = segments.filter(segment => 
        segment && segment.location && 
        isValidCoordinate(segment.location.lat, segment.location.lng)
      )
      
      if (validSegments.length >= 2) {
        const firstSegment = validSegments[0]
        const lastSegment = validSegments[validSegments.length - 1]
        
        console.log('🚨 Frontend: Using enhanced emergency fallback route')
        
        try {
          const emergencyRoute = await getRouteFromOSRM(firstSegment.location, lastSegment.location)
          return {
            coordinates: emergencyRoute.coordinates,
            distance: emergencyRoute.distance,
            duration: Math.round(emergencyRoute.duration),
            segments: segments
          }
        } catch (emergencyError) {
          console.error('Frontend: Emergency fallback also failed:', emergencyError)
          
          // Ultimate fallback - direct line
          const directRoute = getDirectRoute(firstSegment.location, lastSegment.location)
          return {
            coordinates: directRoute.coordinates,
            distance: directRoute.distance,
            duration: Math.round(directRoute.duration),
            segments: segments
          }
        }
      }
    }
    
    throw new Error('Unable to calculate any route from the provided segments')
  }
}

// Enhanced coordinate validation
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return typeof lat === 'number' && typeof lng === 'number' &&
         !isNaN(lat) && !isNaN(lng) && 
         isFinite(lat) && isFinite(lng) &&
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180 &&
         (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001) // Exclude null island and very close to 0,0
}

// Find nearest toll gates with better filtering
export const findNearestTollGates = (location: Location, limit: number = 5): TollGate[] => {
  if (!location || !isValidCoordinate(location.lat, location.lng)) {
    return []
  }

  return TOLL_GATES
    .map(gate => ({
      ...gate,
      distance: calculateDistance(location.lat, location.lng, gate.lat, gate.lng)
    }))
    .filter(gate => gate.distance <= 200) // Only gates within 200km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ distance, ...gate }) => gate)
}

// Enhanced distance calculation with validation
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  // Validate inputs
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    console.warn('Invalid coordinates for distance calculation:', lat1, lng1, lat2, lng2)
    return 0
  }

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return isNaN(distance) ? 0 : distance
}

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

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
  ]
  
  // Add stops
  stops.forEach((stop, index) => {
    segments.push({
      id: `stop-${index + 1}`,
      type: 'stop',
      location: stop,
      stop_duration: 30, // Default 30 minutes
      order: index + 2
    })
  })
  
  // Add destination
  segments.push({
    id: 'destination',
    type: 'destination',
    location: destination,
    order: segments.length + 1
  })
  
  return calculateRouteFromSegments(segments)
}