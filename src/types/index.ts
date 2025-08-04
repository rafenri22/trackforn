export interface Bus {
  id: string
  code: string
  nickname: string
  crew: string
  photo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  name: string
  lat: number
  lng: number
}

export interface Stop extends Location {
  duration: number // in minutes
}

export interface Trip {
  id: string
  bus_id: string
  departure: Location
  stops: Stop[]
  destination: Location
  route: { lat: number; lng: number }[]
  distance?: number
  estimated_duration?: number
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  progress: number
  current_lat?: number
  current_lng?: number
  speed: number // km/h
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
  toll_info?: string // Info gerbang tol yang dilalui
  toll_route?: string[] // Array rute gerbang tol berurutan
}

export interface BusLocation {
  id: string
  bus_id: string
  trip_id: string
  lat: number
  lng: number
  progress: number
  elapsed_time_minutes?: number // Make this optional
  timestamp: number
  created_at: string
}

export interface CreateBusRequest {
  code: string
  nickname: string
  crew: string
  photo?: File
}

export interface CreateTripRequest {
  bus_id: string
  departure: Location
  stops: Stop[]
  destination: Location
}

export interface BusWithTrip extends Bus {
  current_trip?: Trip
}