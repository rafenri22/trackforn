import type { Location } from "@/types"

// OSRM API for real routing
const OSRM_BASE_URL = "https://router.project-osrm.org"

// Toll road entrance/exit points in Java (major highways)
const TOLL_GATES = [
    { "name": "GT ADI SUMARMO", "lat": -7.505793, "lng": 110.750801, "type": "entrance" },
    { "name": "GT AIR MADIDI", "lat": 1.409783, "lng": 124.981891, "type": "entrance" },
    { "name": "GT AMPLAS", "lat": 3.537460, "lng": 98.721856, "type": "entrance" },
    { "name": "GT AMPERA 1", "lat": -6.292449, "lng": 106.819245, "type": "entrance" },
    { "name": "GT AMPERA 2", "lat": -6.292336, "lng": 106.813441, "type": "entrance" },
    { "name": "GT ANCOL BARAT", "lat": -6.131417, "lng": 106.824951, "type": "entrance" },
    { "name": "GT ANCOL TIMUR", "lat": -6.125675, "lng": 106.851114, "type": "entrance" },
    { "name": "GT ANGKE 1", "lat": -6.140566, "lng": 106.787311, "type": "entrance" },
    { "name": "GT ANGKE 2", "lat": -6.144460, "lng": 106.789793, "type": "entrance" },
    { "name": "GT ASEMBAGUS", "lat": -7.755602, "lng": 114.179224, "type": "entrance" },
    { "name": "GT BAITUSSALAM", "lat": 5.586835, "lng": 95.405579, "type": "entrance" },
    { "name": "GT BAJULMATI", "lat": -7.938809, "lng": 114.384457, "type": "entrance" },
    { "name": "GT BAKAUHENI SELATAN", "lat": -5.842837, "lng": 105.728026, "type": "entrance" },
    { "name": "GT BAKAUHENI UTARA", "lat": -5.806735, "lng": 105.726361, "type": "entrance" },
    { "name": "GT BALARAJA BARAT", "lat": -6.200021, "lng": 106.459108, "type": "entrance" },
    { "name": "GT BALARAJA TIMUR", "lat": -6.204201, "lng": 106.485066, "type": "entrance" },
    { "name": "GT BAMBU APUS 1", "lat": -6.310196, "lng": 106.900910, "type": "entrance" },
    { "name": "GT BAMBU APUS 2", "lat": -6.307543, "lng": 106.895628, "type": "entrance" },
    { "name": "GT BANDAR", "lat": -7.579514, "lng": 112.137754, "type": "entrance" },
    { "name": "GT BANDAR SELAMAT 1", "lat": 3.599005, "lng": 98.724236, "type": "entrance" },
    { "name": "GT BANDAR SELAMAT 2", "lat": 3.599202, "lng": 98.723623, "type": "entrance" },
    { "name": "GT BANDAR SELAMAT 3", "lat": 3.595802, "lng": 98.723780, "type": "entrance" },
    { "name": "GT BANDAR SELAMAT 4", "lat": 3.595619, "lng": 98.724324, "type": "entrance" },
    { "name": "GT BANGIL", "lat": -7.614652, "lng": 112.762081, "type": "entrance" },
    { "name": "GT BANGKINANG", "lat": 0.384300, "lng": 101.021539, "type": "entrance" },
    { "name": "GT BANTAR GEBANG", "lat": -6.320320, "lng": 106.990341, "type": "entrance" },
    { "name": "GT BANYU URIP", "lat": -7.262932, "lng": 112.707526, "type": "entrance" },
    { "name": "GT BANYUMANIK", "lat": -7.065786, "lng": 110.431719, "type": "entrance" },
    { "name": "GT BAROS 1", "lat": -6.897442, "lng": 107.541831, "type": "entrance" },
    { "name": "GT BAROS 2", "lat": -6.899192, "lng": 107.541752, "type": "entrance" },
    { "name": "GT BATANG", "lat": -6.941533, "lng": 109.697993, "type": "entrance" },
    { "name": "GT BATHIN SOLAPAN", "lat": 1.425492, "lng": 101.268117, "type": "entrance" },
    { "name": "GT BAWEN", "lat": -7.245740, "lng": 110.446546, "type": "entrance" },
    { "name": "GT BELAWAN", "lat": 3.729793, "lng": 98.681036, "type": "entrance" },
    { "name": "GT BENDA UTAMA", "lat": -6.135509, "lng": 106.681669, "type": "entrance" },
    { "name": "GT BENOA", "lat": -8.735201, "lng": 115.207975, "type": "entrance" },
    { "name": "GT BERBEK 1", "lat": -7.342682, "lng": 112.758088, "type": "entrance" },
    { "name": "GT BERBEK 2", "lat": -7.343156, "lng": 112.752388, "type": "entrance" },
    { "name": "GT BESUKI", "lat": -7.736874, "lng": 113.720038, "type": "entrance" },
    { "name": "GT BINTARA", "lat": -6.221474, "lng": 106.950139, "type": "entrance" },
    { "name": "GT BINTARA JAYA", "lat": -6.249689, "lng": 106.950174, "type": "entrance" },
    { "name": "GT BINTARO 2", "lat": -6.273044, "lng": 106.748606, "type": "entrance" },
    { "name": "GT BIRA BARAT", "lat": -5.088141, "lng": 119.482640, "type": "entrance" },
    { "name": "GT BIRA TIMUR", "lat": -5.090170, "lng": 119.473401, "type": "entrance" },
    { "name": "GT BIRINGKANAYA", "lat": -5.075238, "lng": 119.516529, "type": "entrance" },
    { "name": "GT BITUNG 1", "lat": -6.218644, "lng": 106.565409, "type": "entrance" },
    { "name": "GT BITUNG 2", "lat": -6.219277, "lng": 106.566233, "type": "entrance" },
    { "name": "GT BLANG BINTANG", "lat": 5.508086, "lng": 95.446435, "type": "entrance" },
    { "name": "GT BOGOR 1", "lat": -6.597455, "lng": 106.817616, "type": "entrance" },
    { "name": "GT BOGOR 2", "lat": -6.595940, "lng": 106.826462, "type": "entrance" },
    { "name": "GT BOGOR SELATAN", "lat": -6.613720, "lng": 106.832399, "type": "entrance" },
    { "name": "GT BOJONGGEDE 1", "lat": -6.471068, "lng": 106.794438, "type": "entrance" },
    { "name": "GT BOJONGGEDE 2", "lat": -6.471101, "lng": 106.794003, "type": "entrance" },
    { "name": "GT BOYOLALI", "lat": -7.527176, "lng": 110.632063, "type": "entrance" },
    { "name": "GT BREBES BARAT", "lat": -6.899252, "lng": 109.015130, "type": "entrance" },
    { "name": "GT BREBES TIMUR", "lat": -6.898379, "lng": 109.067494, "type": "entrance" },
    { "name": "GT BUAH BATU 1", "lat": -6.961377, "lng": 107.635507, "type": "entrance" },
    { "name": "GT BUAH BATU 2", "lat": -6.961411, "lng": 107.636499, "type": "entrance" },
    { "name": "GT BUARAN INDAH 1", "lat": -6.180760, "lng": 106.653468, "type": "entrance" },
    { "name": "GT BUARAN INDAH 2", "lat": -6.181481, "lng": 106.652646, "type": "entrance" },
    { "name": "GT CAMBAYA", "lat": -5.113217, "lng": 119.426922, "type": "entrance" },
    { "name": "GT CARINGIN", "lat": -6.701226, "lng": 106.824640, "type": "entrance" },
    { "name": "GT CARUBAN", "lat": -7.519748, "lng": 111.627955, "type": "entrance" },
    { "name": "GT CAKUNG 1", "lat": -6.187145, "lng": 106.938447, "type": "entrance" },
    { "name": "GT CAKUNG 2", "lat": -6.178075, "lng": 106.943265, "type": "entrance" },
    { "name": "GT CAWANG", "lat": -6.243324, "lng": 106.859805, "type": "entrance" },
    { "name": "GT CBD 1", "lat": -6.306306, "lng": 106.642455, "type": "entrance" },
    { "name": "GT CBD 2", "lat": -6.307530, "lng": 106.643854, "type": "entrance" },
    { "name": "GT CBD 3", "lat": -6.309662, "lng": 106.641416, "type": "entrance" },
    { "name": "GT CEMPAKA PUTIH", "lat": -6.172230, "lng": 106.877191, "type": "entrance" },
    { "name": "GT CENGKARENG", "lat": -6.105803, "lng": 106.696339, "type": "entrance" },
    { "name": "GT CENGKARENG 2", "lat": -6.105168, "lng": 106.697739, "type": "entrance" },
    { "name": "GT CIBADAK", "lat": -6.862628, "lng": 106.777447, "type": "entrance" },
    { "name": "GT CIBADAK 1", "lat": -6.528532, "lng": 106.765856, "type": "entrance" },
    { "name": "GT CIBADAK 2", "lat": -6.528515, "lng": 106.765490, "type": "entrance" },
    { "name": "GT CIBATU", "lat": -6.332237, "lng": 107.162241, "type": "entrance" },
    { "name": "GT CIBITUNG", "lat": -6.289222, "lng": 107.081122, "type": "entrance" },
    { "name": "GT CIBITUNG 1", "lat": -6.287127, "lng": 107.083479, "type": "entrance" },
    { "name": "GT CIBITUNG 2", "lat": -6.285883, "lng": 107.085409, "type": "entrance" },
    { "name": "GT CIBITUNG 3", "lat": -6.283032, "lng": 107.075214, "type": "entrance" },
    { "name": "GT CIBITUNG 4", "lat": -6.285496, "lng": 107.081037, "type": "entrance" },
    { "name": "GT CIBITUNG 5", "lat": -6.287661, "lng": 107.083032, "type": "entrance" },
    { "name": "GT CIBITUNG 6", "lat": -6.285913, "lng": 107.084546, "type": "entrance" },
    { "name": "GT CIBITUNG 7", "lat": -6.286096, "lng": 107.079579, "type": "entrance" },
    { "name": "GT CIBITUNG 8", "lat": -6.286272, "lng": 107.080715, "type": "entrance" },
    { "name": "GT CIBITUNG 9", "lat": -6.288027, "lng": 107.081736, "type": "entrance" },
    { "name": "GT CIBUBUR 1", "lat": -6.365806, "lng": 106.895015, "type": "entrance" },
    { "name": "GT CIBUBUR 2", "lat": -6.365289, "lng": 106.894234, "type": "entrance" },
    { "name": "GT CIBUBUR 3", "lat": -6.373200, "lng": 106.896243, "type": "entrance" },
    { "name": "GT CIKAMPEK", "lat": -6.440027, "lng": 107.476810, "type": "entrance" },
    { "name": "GT CIKAMUNING", "lat": -6.818262, "lng": 107.480769, "type": "entrance" },
    { "name": "GT CIKANDE", "lat": -6.175274, "lng": 106.343970, "type": "entrance" },
    { "name": "GT CIKARANG BARAT", "lat": -6.311428, "lng": 107.140019, "type": "entrance" },
    { "name": "GT CIKARANG BARAT 1", "lat": -6.312766, "lng": 107.137165, "type": "entrance" },
    { "name": "GT CIKARANG BARAT 2", "lat": -6.311865, "lng": 107.136806, "type": "entrance" },
    { "name": "GT CIKARANG BARAT 3", "lat": -6.311960, "lng": 107.136024, "type": "entrance" },
    { "name": "GT CIKARANG BARAT 5", "lat": -6.313482, "lng": 107.135820, "type": "entrance" },
    { "name": "GT CIKARANG TIMUR", "lat": -6.341828, "lng": 107.185570, "type": "entrance" },
    { "name": "GT CIKARANG UTAMA", "lat": -6.303180, "lng": 107.120942, "type": "entrance" },
    { "name": "GT CIKEDUNG", "lat": -6.619119, "lng": 108.015182, "type": "entrance" },
    { "name": "GT CIKEUSAL", "lat": -6.214969, "lng": 106.259247, "type": "entrance" },
    { "name": "GT CIKOPO", "lat": -6.458229, "lng": 107.509226, "type": "entrance" },
    { "name": "GT CIKULUR", "lat": -6.418261, "lng": 106.152632, "type": "entrance" },
    { "name": "GT CIKUNIR 1", "lat": -6.253350, "lng": 106.958061, "type": "entrance" },
    { "name": "GT CIKUNIR 2", "lat": -6.256793, "lng": 106.960114, "type": "entrance" },
    { "name": "GT CIKUNIR 3", "lat": -6.256867, "lng": 106.954725, "type": "entrance" },
    { "name": "GT CIKUNIR 4", "lat": -6.256418, "lng": 106.954691, "type": "entrance" },
    { "name": "GT CIKUNIR 8", "lat": -6.257749, "lng": 106.959034, "type": "entrance" },
    { "name": "GT CILEDUg", "lat": -6.888258, "lng": 108.748972, "type": "entrance" },
    { "name": "GT CILEDUG 1", "lat": -6.239119, "lng": 106.758290, "type": "entrance" },
    { "name": "GT CILEDUG 2", "lat": -6.233600, "lng": 106.754847, "type": "entrance" },
    { "name": "GT CILEDUG 3", "lat": -6.240361, "lng": 106.758588, "type": "entrance" },
    { "name": "GT CILEDUG 4", "lat": -6.232630, "lng": 106.754171, "type": "entrance" },
    { "name": "GT CILEGON BARAT", "lat": -5.983789, "lng": 106.033417, "type": "entrance" },
    { "name": "GT CILEGON BARAT 1", "lat": -5.984455, "lng": 106.033166, "type": "entrance" },
    { "name": "GT CILEGON TIMUR", "lat": -6.023254, "lng": 106.089040, "type": "entrance" },
    { "name": "GT CILELES", "lat": -6.473410, "lng": 106.059691, "type": "entrance" },
    { "name": "GT CILEUNYI", "lat": -6.944224, "lng": 107.749472, "type": "entrance" },
    { "name": "GT CILANDAK", "lat": -6.298771, "lng": 106.803878, "type": "entrance" },
    { "name": "GT CILANDAK UTAMA", "lat": -6.299853, "lng": 106.804018, "type": "entrance" },
    { "name": "GT CILILITAN 2", "lat": -6.266069, "lng": 106.872722, "type": "entrance" },
    { "name": "GT CILILITAN 3", "lat": -6.265507, "lng": 106.873040, "type": "entrance" },
    { "name": "GT CILILITAN UTAMA", "lat": -6.267075, "lng": 106.872905, "type": "entrance" },
    { "name": "GT CIMALAKA", "lat": -6.801770, "lng": 107.940421, "type": "entrance" },
    { "name": "GT CIMANGGIS", "lat": -6.421041, "lng": 106.893659, "type": "entrance" },
    { "name": "GT CIMANGGIS 1", "lat": -6.390653, "lng": 106.895260, "type": "entrance" },
    { "name": "GT CIMANGGIS 2", "lat": -6.382810, "lng": 106.895695, "type": "entrance" },
    { "name": "GT CIMANGGIS 3", "lat": -6.386769, "lng": 106.896584, "type": "entrance" },
    { "name": "GT CIMANGGIS 4", "lat": -6.385150, "lng": 106.895552, "type": "entrance" },
    { "name": "GT CIMANGGIS 5", "lat": -6.387726, "lng": 106.898139, "type": "entrance" },
    { "name": "GT CIMANGGIS OFF RAMP", "lat": -6.421117, "lng": 106.893741, "type": "entrance" },
    { "name": "GT CIMANGGIS ON RAMP", "lat": -6.421041, "lng": 106.893659, "type": "entrance" },
    { "name": "GT CIMANGGIS UTAMA", "lat": -6.421117, "lng": 106.893741, "type": "entrance" },
    { "name": "GT CIPERNA BARAT", "lat": -6.760238, "lng": 108.529301, "type": "entrance" },
    { "name": "GT CIPERNA TIMUR", "lat": -6.766618, "lng": 108.527497, "type": "entrance" },
    { "name": "GT CIPUTAT 1", "lat": -6.284014, "lng": 106.774571, "type": "entrance" },
    { "name": "GT CIPUTAT 2", "lat": -6.284272, "lng": 106.774742, "type": "entrance" },
    { "name": "GT CIUJUNG", "lat": -6.141363, "lng": 106.286489, "type": "entrance" },
    { "name": "GT CIUJUNG ON RAMP", "lat": -6.141022, "lng": 106.287655, "type": "entrance" },
    { "name": "GT CIKUPA", "lat": -6.205479, "lng": 106.523699, "type": "entrance" },
    { "name": "GT CIKUPA 2", "lat": -6.205093, "lng": 106.520807, "type": "entrance" },
    { "name": "GT CIKUPA 3", "lat": -6.205720, "lng": 106.520902, "type": "entrance" },
    { "name": "GT CIKEAS", "lat": -6.383538, "lng": 106.945552, "type": "entrance" },
    { "name": "GT CISALAK 1", "lat": -6.381953, "lng": 106.872851, "type": "entrance" },
    { "name": "GT CISALAK 2", "lat": -6.382195, "lng": 106.871570, "type": "entrance" },
    { "name": "GT CISALAK 3", "lat": -6.380675, "lng": 106.864530, "type": "entrance" },
    { "name": "GT CISALAK 4", "lat": -6.381007, "lng": 106.861991, "type": "entrance" },
    { "name": "GT CITEUREUP 1", "lat": -6.482461, "lng": 106.874452, "type": "entrance" },
    { "name": "GT CITEUREUP 2", "lat": -6.483423, "lng": 106.873153, "type": "entrance" },
    { "name": "GT CITEUREUP 3", "lat": -6.486759, "lng": 106.872361, "type": "entrance" },
    { "name": "GT CITEUREUP 4", "lat": -6.486091, "lng": 106.871878, "type": "entrance" },
    { "name": "GT COLOMADU", "lat": -7.534929, "lng": 110.711172, "type": "entrance" },
    { "name": "GT DAWUAN", "lat": -6.691248, "lng": 108.112936, "type": "entrance" },
    { "name": "GT DRIYOREJO 1", "lat": -7.353322, "lng": 112.634330, "type": "entrance" },
    { "name": "GT DRIYOREJO 2", "lat": -7.353842, "lng": 112.634652, "type": "entrance" },
    { "name": "GT DRIYOREJO 3 RAMP 302", "lat": -7.354857, "lng": 112.625368, "type": "entrance" },
    { "name": "GT DRIYOREJO 4 RAMP 302", "lat": -7.355462, "lng": 112.625283, "type": "entrance" },
    { "name": "GT DUKUH 1", "lat": -6.301691, "lng": 106.883554, "type": "entrance" },
    { "name": "GT DUKUH 2", "lat": -6.303403, "lng": 106.883272, "type": "entrance" },
    { "name": "GT DUKUH 3", "lat": -6.299842, "lng": 106.883171, "type": "entrance" },
    { "name": "GT DUMAI", "lat": 1.576519, "lng": 101.395470, "type": "entrance" },
    { "name": "GT DUPAK 1", "lat": -7.241280, "lng": 112.712770, "type": "entrance" },
    { "name": "GT DUPAK 2", "lat": -7.241605, "lng": 112.711942, "type": "entrance" },
    { "name": "GT DUPAK 3", "lat": -7.246621, "lng": 112.709704, "type": "entrance" },
    { "name": "GT DUPAK 4", "lat": -7.242728, "lng": 112.711686, "type": "entrance" },
    { "name": "GT DUPAK 5", "lat": -7.242936, "lng": 112.712349, "type": "entrance" },
    { "name": "GT ENTRANCE BELAHANREJO", "lat": -7.329206, "lng": 112.533648, "type": "entrance" },
    { "name": "GT ENTRANCE BUNDER", "lat": -7.171743, "lng": 112.595530, "type": "entrance" },
    { "name": "GT ENTRANCE CERME", "lat": -7.216776, "lng": 112.575164, "type": "entrance" },
    { "name": "GT EXIT BELAHANREJO", "lat": -7.329804, "lng": 112.534248, "type": "entrance" },
    { "name": "GT EXIT BUNDER", "lat": -7.171807, "lng": 112.594972, "type": "entrance" },
    { "name": "GT EXIT CERME", "lat": -7.216609, "lng": 112.574344, "type": "entrance" },
    { "name": "GT FATMAWATI 1", "lat": -6.292116, "lng": 106.797977, "type": "entrance" },
    { "name": "GT FATMAWATI 2", "lat": -6.292390, "lng": 106.791484, "type": "entrance" }
]

export interface RouteResponse {
  coordinates: { lat: number; lng: number }[]
  distance: number // in kilometers
  duration: number // in minutes
  tollGates?: { name: string; lat: number; lng: number }[] // toll gates used
}

// Find nearest toll gate to a location
const findNearestTollGate = (location: Location): { name: string; lat: number; lng: number } => {
  let nearest = TOLL_GATES[0]
  let shortestDistance = calculateDistance(location.lat, location.lng, nearest.lat, nearest.lng)
  
  TOLL_GATES.forEach(gate => {
    const distance = calculateDistance(location.lat, location.lng, gate.lat, gate.lng)
    if (distance < shortestDistance) {
      shortestDistance = distance
      nearest = gate
    }
  })
  
  return nearest
}

// Create highway-focused route with toll preference
export const calculateRoute = async (
  departure: Location,
  stops: Location[],
  destination: Location,
): Promise<RouteResponse> => {
  try {
    // Find optimal toll routing strategy
    const routePoints = [departure, ...stops, destination]
    const tollOptimizedPoints: Location[] = []
    const usedTollGates: { name: string; lat: number; lng: number }[] = []
    
    for (let i = 0; i < routePoints.length; i++) {
      const currentPoint = routePoints[i]
      const nextPoint = routePoints[i + 1]
      
      tollOptimizedPoints.push(currentPoint)
      
      if (nextPoint) {
        const distance = calculateDistance(currentPoint.lat, currentPoint.lng, nextPoint.lat, nextPoint.lng)
        
        // If distance > 50km, use toll roads
        if (distance > 50) {
          // Find nearest toll entrance to current point
          const tollEntrance = findNearestTollGate(currentPoint)
          
          // Find nearest toll exit to next point
          const tollExit = findNearestTollGate(nextPoint)
          
          // Only add toll points if they're not too close to start/end points
          const entranceDistance = calculateDistance(currentPoint.lat, currentPoint.lng, tollEntrance.lat, tollEntrance.lng)
          const exitDistance = calculateDistance(nextPoint.lat, nextPoint.lng, tollExit.lat, tollExit.lng)
          
          if (entranceDistance > 5) { // 5km threshold
            tollOptimizedPoints.push({
              name: `Entry ${tollEntrance.name}`,
              lat: tollEntrance.lat,
              lng: tollEntrance.lng
            })
            usedTollGates.push(tollEntrance)
          }
          
          if (exitDistance > 5 && tollEntrance.name !== tollExit.name) {
            tollOptimizedPoints.push({
              name: `Exit ${tollExit.name}`,
              lat: tollExit.lat,
              lng: tollExit.lng
            })
            usedTollGates.push(tollExit)
          }
        }
      }
    }
    
    // Build waypoints string for OSRM with toll-optimized points
    const waypoints = tollOptimizedPoints.map((point) => `${point.lng},${point.lat}`).join(";")
    
    console.log("🛣️ Using toll-optimized route with", tollOptimizedPoints.length, "waypoints")
    console.log("🎫 Toll gates:", usedTollGates.map(g => g.name).join(", "))

    const response = await fetch(
      `${OSRM_BASE_URL}/route/v1/driving/${waypoints}?overview=full&geometries=geojson&annotations=true`
    )

    if (!response.ok) {
      throw new Error("Failed to calculate toll-optimized route")
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found")
    }

    const route = data.routes[0]
    const routeCoordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
      lat: coord[1],
      lng: coord[0],
    }))

    return {
      coordinates: routeCoordinates,
      distance: route.distance / 1000, // Convert to kilometers
      duration: Math.round(route.duration / 60), // Convert to minutes
      tollGates: usedTollGates,
    }
  } catch (error) {
    console.error("Error calculating toll route:", error)

    // Fallback: enhanced route with highway preference
    return calculateHighwayFallbackRoute(departure, stops, destination)
  }
}

// Enhanced fallback route calculation with highway preference
const calculateHighwayFallbackRoute = (departure: Location, stops: Location[], destination: Location): RouteResponse => {
  const allPoints = [departure, ...stops, destination]
  const coordinates: { lat: number; lng: number }[] = []
  let totalDistance = 0
  const usedTollGates: { name: string; lat: number; lng: number }[] = []

  // Generate enhanced interpolated points with highway routing simulation
  for (let i = 0; i < allPoints.length - 1; i++) {
    const start = allPoints[i]
    const end = allPoints[i + 1]

    // Calculate distance between points
    const segmentDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng)
    totalDistance += segmentDistance

    // For long distances, simulate highway routing
    if (segmentDistance > 50) {
      const tollEntry = findNearestTollGate(start)
      const tollExit = findNearestTollGate(end)
      
      usedTollGates.push(tollEntry, tollExit)
      
      // Route via toll gates: start -> toll entry -> toll exit -> end
      const segments = [
        { from: start, to: { name: tollEntry.name, lat: tollEntry.lat, lng: tollEntry.lng } },
        { from: { name: tollEntry.name, lat: tollEntry.lat, lng: tollEntry.lng }, to: { name: tollExit.name, lat: tollExit.lat, lng: tollExit.lng } },
        { from: { name: tollExit.name, lat: tollExit.lat, lng: tollExit.lng }, to: end }
      ]
      
      segments.forEach(segment => {
        // Generate more points for highway segments (smoother animation)
        const points = segment.from.name?.includes("Tol") || segment.to.name?.includes("Tol") ? 30 : 15
        for (let j = 0; j <= points; j++) {
          const ratio = j / points
          coordinates.push({
            lat: segment.from.lat + (segment.to.lat - segment.from.lat) * ratio,
            lng: segment.from.lng + (segment.to.lng - segment.from.lng) * ratio,
          })
        }
      })
    } else {
      // Direct route for short distances
      for (let j = 0; j <= 20; j++) {
        const ratio = j / 20
        coordinates.push({
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio,
        })
      }
    }
  }

  // Highway speed estimate: 70-80 km/h average
  const highwaySpeed = 75
  const estimatedDuration = Math.round((totalDistance / highwaySpeed) * 60)

  console.log("🛣️ Fallback highway route:", {
    distance: totalDistance.toFixed(1) + "km",
    duration: estimatedDuration + " minutes",
    tollGates: usedTollGates.length
  })

  return {
    coordinates,
    distance: totalDistance,
    duration: estimatedDuration,
    tollGates: usedTollGates,
  }
}

// Calculate distance between two coordinates using Haversine formulaa
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