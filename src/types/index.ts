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

export interface TollGate {
  name: string
  lat: number
  lng: number
}

export interface RouteSegment {
  id: string
  type: 'departure' | 'toll_entry' | 'toll_exit' | 'stop' | 'destination'
  location: Location
  toll_entry_gate?: TollGate
  toll_exit_gate?: TollGate
  stop_duration?: number // in minutes for stops
  order: number
}

export interface RouteTemplate {
  id: string
  name: string
  code: string
  description?: string | null
  segments: RouteSegment[]
  total_distance?: number | null
  estimated_duration?: number | null
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  bus_id: string
  route_template_id?: string | null
  departure: Location
  stops: Stop[]
  destination: Location
  route: { lat: number; lng: number }[]
  segments?: RouteSegment[]
  distance?: number | null
  estimated_duration?: number | null
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  progress: number
  current_lat?: number | null
  current_lng?: number | null
  speed: number // km/h
  start_time?: string | null
  end_time?: string | null
  created_at: string
  updated_at: string
  toll_info?: string | null
  toll_route?: string[] | null
}

export interface BusLocation {
  id: string
  bus_id: string
  trip_id: string
  lat: number
  lng: number
  progress: number
  elapsed_time_minutes?: number
  timestamp: number
  created_at: string
}

export interface CreateBusRequest {
  code: string
  nickname: string
  crew: string
  photo?: File
}

export interface UpdateBusRequest {
  id: string
  code?: string
  nickname?: string
  crew?: string
  photo?: File
}

export interface CreateTripRequest {
  bus_id: string
  route_template_id?: string | null
  departure: Location
  stops: Stop[]
  destination: Location
  segments?: RouteSegment[]
}

export interface BusWithTrip extends Bus {
  current_trip?: Trip
}

export interface CreateRouteTemplateRequest {
  name: string
  code: string
  description?: string | null
  segments: RouteSegment[]
}