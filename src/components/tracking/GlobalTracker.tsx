"use client"

import { useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { updateTrip, updateBusStatus, updateBusLocation, deleteBusLocation } from "@/lib/database"
import { realtimeStore } from "@/lib/realtime"
import type { Trip } from "@/types"
import { useToast } from "@/hooks/use-toast"

// Global tracking intervals
const trackingIntervals = new Map<string, NodeJS.Timeout>()
const tripStartTimes = new Map<string, number>()

// FIXED: Enhanced realistic speed calculation with proper toll speeds (80-100 km/h)
const getRealisticSpeed = (distance: number, tripSegments?: any[]): number => {
  let baseSpeed: number
  
  // Check if route has toll segments
  const hasTollSegments = tripSegments && tripSegments.some(s => s.type === 'toll_entry' || s.type === 'toll_exit')
  
  if (hasTollSegments) {
    // Toll highways: 80-100 km/h as requested
    baseSpeed = Math.floor(Math.random() * (100 - 80 + 1)) + 80
  } else if (distance < 50) {
    // City routes: 40-60 km/h (traffic, stops)
    baseSpeed = Math.floor(Math.random() * (60 - 40 + 1)) + 40
  } else if (distance < 150) {
    // Inter-city routes: 60-80 km/h (mixed roads)
    baseSpeed = Math.floor(Math.random() * (80 - 60 + 1)) + 60
  } else {
    // Long distance routes: 70-90 km/h (highways without toll)
    baseSpeed = Math.floor(Math.random() * (90 - 70 + 1)) + 70
  }
  
  // Add random variation for traffic conditions (-5 to +5 km/h)
  const variation = Math.floor(Math.random() * 11) - 5
  return Math.max(30, Math.min(105, baseSpeed + variation)) // Keep within 30-105 km/h bounds
}

// Calculate distance between two coordinates
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

export function GlobalTracker() {
  const { toast } = useToast()
  const isInitialized = useRef(false)

  // ENHANCED: Start tracking with proper toll speed handling
  const startTracking = useCallback(
    (trip: Trip) => {
      const buses = realtimeStore.getBuses()
      const bus = buses.find((b) => b.id === trip.bus_id)
      const tripName = bus?.nickname || trip.id.slice(0, 8)
      console.log("🚀 Starting ENHANCED tracking for:", tripName)

      // Clear existing interval
      const existingInterval = trackingIntervals.get(trip.id)
      if (existingInterval) {
        clearInterval(existingInterval)
      }

      // Store actual trip start time for accurate elapsed time calculation
      const actualStartTime = trip.start_time ? new Date(trip.start_time).getTime() : Date.now()
      tripStartTimes.set(trip.id, actualStartTime)

      // Calculate total distance for realistic speed
      let totalDistance = 0
      if (trip.route && trip.route.length > 1) {
        for (let i = 0; i < trip.route.length - 1; i++) {
          const point1 = trip.route[i]
          const point2 = trip.route[i + 1]
          totalDistance += calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng)
        }
      } else {
        // Fallback: calculate direct distance
        totalDistance = calculateDistance(
          trip.departure.lat,
          trip.departure.lng,
          trip.destination.lat,
          trip.destination.lng,
        )
      }

      // ENHANCED: Get realistic speed with toll consideration
      const realisticSpeed = getRealisticSpeed(totalDistance, trip.segments)
      
      // Calculate realistic completion time in minutes
      const estimatedTripTimeMinutes = (totalDistance / realisticSpeed) * 60
      
      // ENHANCED: Add stop duration to total time
      let totalStopDuration = 0
      if (trip.segments) {
        trip.segments.filter(s => s.type === 'stop').forEach(stop => {
          totalStopDuration += stop.stop_duration || 30
        })
      } else if (trip.stops) {
        trip.stops.forEach(stop => {
          totalStopDuration += stop.duration || 30
        })
      }
      
      const totalTripTime = estimatedTripTimeMinutes + totalStopDuration
      
      // Calculate progress per update (every 20 seconds for smoother movement)
      const updateIntervalSeconds = 20
      const totalUpdates = Math.ceil(totalTripTime * 60 / updateIntervalSeconds)
      const progressPerUpdate = 100 / totalUpdates

      const speedType = trip.segments && trip.segments.some(s => s.type === 'toll_entry') ? 'toll' : 'regular'
      console.log(
        `📊 ${tripName}: Distance: ${totalDistance.toFixed(1)}km, Speed: ${realisticSpeed}km/h (${speedType}), Est. time: ${totalTripTime.toFixed(0)}min (includes ${totalStopDuration}m stops)`
      )

      let currentSpeed = realisticSpeed

      const interval = setInterval(async () => {
        try {
          // Get current trip data
          const { data: currentTrip, error } = await supabase.from("trips").select("*").eq("id", trip.id).single()
          if (error || !currentTrip || currentTrip.status !== "IN_PROGRESS") {
            console.log("❌ Trip not active, stopping tracking:", tripName)
            stopTracking(trip.id)
            return
          }

          // Calculate ACCURATE elapsed time from stored start time
          const startTime = tripStartTimes.get(trip.id) || actualStartTime
          const elapsedTimeMs = Date.now() - startTime
          const elapsedTimeMinutes = elapsedTimeMs / (1000 * 60)

          // ENHANCED: Vary speed based on route type
          const speedVariation = (Math.random() - 0.5) * (speedType === 'toll' ? 8 : 6) // More variation on toll
          currentSpeed = Math.max(30, Math.min(105, realisticSpeed + speedVariation))

          // Calculate new progress based on realistic timing
          const newProgress = Math.min(100, currentTrip.progress + progressPerUpdate)

          // Calculate current position based on route
          let currentLat = currentTrip.current_lat
          let currentLng = currentTrip.current_lng
          if (currentTrip.route && Array.isArray(currentTrip.route) && currentTrip.route.length > 0) {
            const routeIndex = Math.floor((newProgress / 100) * (currentTrip.route.length - 1))
            const currentPosition = currentTrip.route[routeIndex] || currentTrip.route[0]
            currentLat = currentPosition.lat
            currentLng = currentPosition.lng
          }

          // Update trip progress with enhanced speed
          const updates: Partial<Trip> = {
            progress: newProgress,
            current_lat: currentLat,
            current_lng: currentLng,
            speed: Math.round(currentSpeed),
          }

          // If completed, mark as completed but keep bus at destination
          if (newProgress >= 100) {
            updates.status = "COMPLETED"
            updates.end_time = new Date().toISOString()
            console.log(`✅ ${tripName}: Trip completed - Bus staying at destination: ${trip.destination.name}`)
            toast({
              title: "✅ Trip Completed",
              description: `${tripName} has reached destination and is parked there (${speedType} route)`,
              variant: "success",
            })
          }

          // Update in database
          await updateTrip(trip.id, updates)

          // Update bus location for real-time tracking with ACCURATE elapsed time
          if (currentLat && currentLng) {
            await updateBusLocation({
              bus_id: trip.bus_id,
              trip_id: trip.id,
              lat: currentLat,
              lng: currentLng,
              progress: newProgress,
              elapsed_time_minutes: elapsedTimeMinutes, // Use accurate elapsed time
              timestamp: Date.now(),
            })
          }

          // If completed, update bus status but KEEP bus location at destination
          if (newProgress >= 100) {
            await updateBusStatus(trip.bus_id, false)
            console.log(`🏁 ${tripName}: Bus parked at destination - ${trip.destination.name}`)
            // DO NOT delete bus location - let it stay at destination
            stopTracking(trip.id)
          }

          const formattedTime = `${Math.floor(elapsedTimeMinutes / 60)}h ${Math.floor(elapsedTimeMinutes % 60)}m`
          console.log(`📊 ${tripName}: ${newProgress.toFixed(1)}% (${formattedTime}) - ${currentSpeed.toFixed(0)}km/h (${speedType})`)
        } catch (trackingError) {
          console.error("❌ Error in enhanced tracking:", trackingError)
        }
      }, updateIntervalSeconds * 1000) // Update every 20 seconds for smooth movement

      trackingIntervals.set(trip.id, interval)
      console.log(`✅ Enhanced tracking started for: ${tripName} at ${speedType} speeds`)
    },
    [toast],
  )

  // Stop tracking for a specific trip
  const stopTracking = useCallback((tripId: string) => {
    const interval = trackingIntervals.get(tripId)
    if (interval) {
      clearInterval(interval)
      trackingIntervals.delete(tripId)
      tripStartTimes.delete(tripId) // Clean up start time storage
      console.log("🛑 Enhanced tracking stopped for:", tripId.slice(0, 8))
    }
  }, [])

  // Position pending buses at departure points
  const positionPendingBuses = useCallback(async () => {
    try {
      const trips = realtimeStore.getTrips()
      const pendingTrips = trips.filter(trip => trip.status === "PENDING")
      
      console.log(`📍 Positioning ${pendingTrips.length} pending buses at departure points...`)
      
      for (const trip of pendingTrips) {
        try {
          // Remove any existing location for this bus
          await supabase.from("bus_locations").delete().eq("bus_id", trip.bus_id)
          
          // Position bus at departure location
          await supabase.from("bus_locations").insert({
            bus_id: trip.bus_id,
            trip_id: trip.id,
            lat: trip.departure.lat,
            lng: trip.departure.lng,
            progress: 0,
            elapsed_time_minutes: 0,
            timestamp: Date.now(),
          })
          
          console.log(`📍 Bus positioned at departure: ${trip.departure.name} for trip ${trip.id.slice(0, 8)}`)
        } catch (positionError) {
          console.error("Error positioning pending bus:", positionError)
        }
      }
    } catch (error) {
      console.error("Error in positionPendingBuses:", error)
    }
  }, [])

  // Initialize tracking on mount
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    console.log("🔄 Initializing Enhanced Global Tracker with proper toll speeds...")

    // Start tracking for existing in-progress trips
    const checkAndStartTracking = async () => {
      // Wait for store to be populated
      setTimeout(async () => {
        const trips = realtimeStore.getTrips()
        const inProgressTrips = trips.filter((trip) => trip.status === "IN_PROGRESS")
        console.log(`Found ${inProgressTrips.length} in-progress trips`)
        
        inProgressTrips.forEach((trip) => {
          if (!trackingIntervals.has(trip.id)) {
            startTracking(trip)
          }
        })
        
        // Position pending buses at departure points
        await positionPendingBuses()
        
        if (inProgressTrips.length > 0) {
          toast({
            title: "🚌 Enhanced Tracking Resumed",
            description: `Monitoring ${inProgressTrips.length} trips with toll-aware timing (80-100km/h on toll)`,
            variant: "default",
          })
        }
      }, 1000) // Wait 1 second for initial data to load
    }

    // Initial check
    checkAndStartTracking()

    // Subscribe to trip changes
    const unsubscribe = realtimeStore.subscribe(async () => {
      const trips = realtimeStore.getTrips()
      const inProgressTrips = trips.filter((trip) => trip.status === "IN_PROGRESS")
      const currentlyTracked = Array.from(trackingIntervals.keys())

      // Start tracking for new in-progress trips
      inProgressTrips.forEach((trip) => {
        if (!currentlyTracked.includes(trip.id)) {
          console.log("🆕 New enhanced trip to track:", trip.id.slice(0, 8))
          startTracking(trip)
        }
      })

      // Stop tracking for trips that are no longer in progress
      currentlyTracked.forEach((tripId) => {
        const trip = trips.find((t) => t.id === tripId)
        if (!trip || trip.status !== "IN_PROGRESS") {
          console.log("🛑 Stopping enhanced tracking for completed/cancelled trip:", tripId.slice(0, 8))
          stopTracking(tripId)
        }
      })

      // Re-position pending buses when there are changes
      await positionPendingBuses()
    })

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up Enhanced Global Tracker")
      trackingIntervals.forEach((interval) => clearInterval(interval))
      trackingIntervals.clear()
      tripStartTimes.clear()
      isInitialized.current = false
      unsubscribe()
    }
  }, [startTracking, stopTracking, positionPendingBuses, toast])

  return null // This is a logic-only component
}

// Export functions for manual control with enhanced timing
export const startTripTracking = (trip: Trip) => {
  const buses = realtimeStore.getBuses()
  const bus = buses.find((b) => b.id === trip.bus_id)
  const tripName = bus?.nickname || trip.id.slice(0, 8)
  console.log("🚀 Manual enhanced start tracking:", tripName)

  // Clear existing interval
  const existingInterval = trackingIntervals.get(trip.id)
  if (existingInterval) {
    clearInterval(existingInterval)
  }

  // Store start time for accurate elapsed time
  const startTime = trip.start_time ? new Date(trip.start_time).getTime() : Date.now()
  tripStartTimes.set(trip.id, startTime)

  // Calculate realistic timing based on distance and segments
  let totalDistance = 0
  if (trip.route && trip.route.length > 1) {
    for (let i = 0; i < trip.route.length - 1; i++) {
      const point1 = trip.route[i]
      const point2 = trip.route[i + 1]
      totalDistance += calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng)
    }
  } else {
    totalDistance = calculateDistance(
      trip.departure.lat,
      trip.departure.lng,
      trip.destination.lat,
      trip.destination.lng,
    )
  }

  // ENHANCED: Speed calculation with toll awareness
  const realisticSpeed = getRealisticSpeed(totalDistance, trip.segments)
  const estimatedTripTimeMinutes = (totalDistance / realisticSpeed) * 60
  
  // Add stop durations
  let totalStopDuration = 0
  if (trip.segments) {
    trip.segments.filter(s => s.type === 'stop').forEach(stop => {
      totalStopDuration += stop.stop_duration || 30
    })
  }
  
  const totalTripTime = estimatedTripTimeMinutes + totalStopDuration
  const updateIntervalSeconds = 20
  const totalUpdates = Math.ceil(totalTripTime * 60 / updateIntervalSeconds)
  const progressPerUpdate = 100 / totalUpdates

  const interval = setInterval(async () => {
    try {
      const { data: currentTrip, error } = await supabase.from("trips").select("*").eq("id", trip.id).single()
      if (error || !currentTrip || currentTrip.status !== "IN_PROGRESS") {
        console.log("❌ Trip not active, stopping manual enhanced tracking:", tripName)
        stopTripTracking(trip.id)
        return
      }

      // Calculate accurate elapsed time
      const tripStartTime = tripStartTimes.get(trip.id) || startTime
      const elapsedTimeMs = Date.now() - tripStartTime
      const elapsedTimeMinutes = elapsedTimeMs / (1000 * 60)

      const newProgress = Math.min(100, currentTrip.progress + progressPerUpdate)
      let currentLat = currentTrip.current_lat
      let currentLng = currentTrip.current_lng

      if (currentTrip.route && Array.isArray(currentTrip.route) && currentTrip.route.length > 0) {
        const routeIndex = Math.floor((newProgress / 100) * (currentTrip.route.length - 1))
        const currentPosition = currentTrip.route[routeIndex] || currentTrip.route[0]
        currentLat = currentPosition.lat
        currentLng = currentPosition.lng
      }

      const updates: Partial<Trip> = {
        progress: newProgress,
        current_lat: currentLat,
        current_lng: currentLng,
        speed: Math.round(realisticSpeed),
      }

      if (newProgress >= 100) {
        updates.status = "COMPLETED"
        updates.end_time = new Date().toISOString()
        console.log(`✅ ${tripName}: Enhanced trip completed - Bus staying at destination`)
      }

      await updateTrip(trip.id, updates)

      if (currentLat && currentLng) {
        await updateBusLocation({
          bus_id: trip.bus_id,
          trip_id: trip.id,
          lat: currentLat,
          lng: currentLng,
          progress: newProgress,
          elapsed_time_minutes: elapsedTimeMinutes, // Accurate elapsed time
          timestamp: Date.now(),
        })
      }

      if (newProgress >= 100) {
        await updateBusStatus(trip.bus_id, false)
        console.log(`🏁 ${tripName}: Enhanced bus parked at destination - keeping location visible`)
        // DO NOT delete bus location - let it stay visible at destination
        stopTripTracking(trip.id)
      }

      const speedType = trip.segments && trip.segments.some(s => s.type === 'toll_entry') ? 'toll' : 'regular'
      console.log(`📊 Manual Enhanced ${tripName}: ${newProgress.toFixed(1)}% (${Math.floor(elapsedTimeMinutes)}m) - ${realisticSpeed}km/h (${speedType})`)
    } catch (manualError) {
      console.error("❌ Error in manual enhanced tracking:", manualError)
    }
  }, updateIntervalSeconds * 1000)

  trackingIntervals.set(trip.id, interval)
  console.log("✅ Manual enhanced tracking started for:", tripName)
}

export const stopTripTracking = (tripId: string) => {
  const interval = trackingIntervals.get(tripId)
  if (interval) {
    clearInterval(interval)
    trackingIntervals.delete(tripId)
    tripStartTimes.delete(tripId)
    console.log("🛑 Manual enhanced tracking stopped for:", tripId.slice(0, 8))
  }
}