import { supabase } from "./supabase"
import { updateTrip, updateBusStatus, updateBusLocation, deleteBusLocation } from "./database"
import type { Trip } from "@/types"

// Garage location (Terminal Purbalingga, Jawa Tengah)
export const GARAGE_LOCATION = {
  lat: -7.3886,
  lng: 109.3686,
  name: "Garasi (Purbalingga)",
}

// Active tracking intervals - menggunakan Map untuk client-side tracking
const trackingIntervals = new Map<string, NodeJS.Timeout>()

// Client-side tracking function
export const startClientTracking = (trip: Trip) => {
  console.log("Starting CLIENT-SIDE tracking for:", trip.id)

  // Clear any existing interval for this trip
  stopClientTracking(trip.id)

  const interval = setInterval(async () => {
    try {
      // Get current trip data
      const { data: currentTrip, error } = await supabase.from("trips").select("*").eq("id", trip.id).single()

      if (error || !currentTrip || currentTrip.status !== "IN_PROGRESS") {
        console.log("Trip not found or not in progress, stopping client tracking")
        stopClientTracking(trip.id)
        return
      }

      // Calculate new progress (0.5% per second = 200 seconds for 100%)
      const newProgress = Math.min(100, currentTrip.progress + 0.5)
      console.log(`CLIENT: Trip ${trip.id} progress: ${newProgress}%`)

      // Calculate current position based on route
      let currentLat = currentTrip.current_lat
      let currentLng = currentTrip.current_lng

      if (currentTrip.route && Array.isArray(currentTrip.route) && currentTrip.route.length > 0) {
        const routeIndex = Math.floor((newProgress / 100) * (currentTrip.route.length - 1))
        const currentPosition = currentTrip.route[routeIndex] || currentTrip.route[0]
        currentLat = currentPosition.lat
        currentLng = currentPosition.lng
      }

      // Update trip progress
      const updates: Partial<Trip> = {
        progress: newProgress,
        current_lat: currentLat,
        current_lng: currentLng,
      }

      // If completed, mark as completed
      if (newProgress >= 100) {
        updates.status = "COMPLETED"
        updates.end_time = new Date().toISOString()
        console.log("CLIENT: Trip completed:", trip.id)
      }

      await updateTrip(trip.id, updates)

      // Update bus location for real-time tracking
      if (currentLat && currentLng) {
        await updateBusLocation({
          bus_id: trip.bus_id,
          trip_id: trip.id,
          lat: currentLat,
          lng: currentLng,
          progress: newProgress,
          elapsed_time_minutes: 0, // Add this field
          timestamp: Date.now(),
        })
      }

      // If completed, clean up
      if (newProgress >= 100) {
        await updateBusStatus(trip.bus_id, false)

        // Remove bus location after 5 seconds (bus returns to garage)
        setTimeout(async () => {
          await deleteBusLocation(trip.bus_id)
        }, 5000)

        stopClientTracking(trip.id)
      }
    } catch (error) {
      console.error("CLIENT: Error updating trip progress:", error)
    }
  }, 1000) // Update every 1 second for smooth movement

  trackingIntervals.set(trip.id, interval)
  console.log("CLIENT: Trip tracking started with interval:", trip.id)
}

export const stopClientTracking = (tripId: string) => {
  const interval = trackingIntervals.get(tripId)
  if (interval) {
    clearInterval(interval)
    trackingIntervals.delete(tripId)
    console.log("CLIENT: Trip tracking stopped:", tripId)
  }
}

// Legacy server functions (kept for compatibility)
export const startTripTracking = async (trip: Trip) => {
  console.log("Starting trip tracking (legacy):", trip.id)
  await updateBusStatus(trip.bus_id, true)
  // Start client-side tracking instead
  startClientTracking(trip)
}

export const stopTripTracking = (tripId: string) => {
  stopClientTracking(tripId)
}

export const cancelTripTracking = async (tripId: string, busId: string) => {
  console.log("Cancelling trip tracking:", tripId)
  stopClientTracking(tripId)
  await updateBusStatus(busId, false)
  await deleteBusLocation(busId)
}

// Initialize client-side tracking for existing in-progress trips
export const initializeClientTracking = async () => {
  try {
    console.log("Initializing CLIENT-SIDE tracking for existing trips...")

    const { data: inProgressTrips, error } = await supabase.from("trips").select("*").eq("status", "IN_PROGRESS")

    if (error) {
      console.error("Error loading in-progress trips:", error)
      return
    }

    if (inProgressTrips && inProgressTrips.length > 0) {
      console.log(`Found ${inProgressTrips.length} in-progress trips, starting CLIENT tracking...`)

      for (const trip of inProgressTrips) {
        startClientTracking(trip as Trip)
      }
    } else {
      console.log("No in-progress trips found")
    }
  } catch (error) {
    console.error("Error initializing client tracking:", error)
  }
}

// Clean up all intervals on app close
export const cleanupAllTracking = () => {
  console.log("Cleaning up all CLIENT tracking intervals")
  trackingIntervals.forEach((interval) => clearInterval(interval))
  trackingIntervals.clear()
}

// Export for backward compatibility
export const initializeTracking = initializeClientTracking
