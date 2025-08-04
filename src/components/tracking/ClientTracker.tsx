"use client"

import { useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { updateTrip, updateBusStatus, updateBusLocation, deleteBusLocation } from "@/lib/database"
import type { Trip, Bus } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface ClientTrackerProps {
  trips: Trip[]
  buses?: Bus[]
  onTripUpdate?: (trip: Trip) => void
}

export function ClientTracker({ trips, buses = [], onTripUpdate }: ClientTrackerProps) {
  const trackingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const { toast } = useToast()

  // Start tracking for a specific trip
  const startTracking = useCallback(
    (trip: Trip) => {
      const bus = buses.find((b) => b.id === trip.bus_id)
      const tripName = bus?.nickname || trip.id.slice(0, 8)
      console.log("🚀 Starting CLIENT tracking for:", tripName)

      // Clear existing interval
      const existingInterval = trackingIntervals.current.get(trip.id)
      if (existingInterval) {
        clearInterval(existingInterval)
      }

      const interval = setInterval(async () => {
        try {
          // Get current trip data
          const { data: currentTrip, error } = await supabase.from("trips").select("*").eq("id", trip.id).single()
          if (error || !currentTrip || currentTrip.status !== "IN_PROGRESS") {
            console.log("❌ Trip not active, stopping tracking:", tripName)
            stopTracking(trip.id)
            return
          }

          // Calculate new progress (0.5% per second)
          const newProgress = Math.min(100, currentTrip.progress + 0.5)

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
            toast({
              title: "✅ Trip Completed",
              description: `${tripName} has reached destination`,
              variant: "success",
            })
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
            setTimeout(async () => {
              await deleteBusLocation(trip.bus_id)
            }, 5000)
            stopTracking(trip.id)
          }

          // Notify parent component
          if (onTripUpdate) {
            onTripUpdate({ ...currentTrip, ...updates } as Trip)
          }
        } catch (trackingError) {
          console.error("❌ Error in client tracking:", trackingError)
        }
      }, 1000) // Update every 1 second

      trackingIntervals.current.set(trip.id, interval)
      console.log("✅ Client tracking started for:", tripName)
    },
    [buses, toast, onTripUpdate],
  )

  // Stop tracking for a specific trip
  const stopTracking = useCallback((tripId: string) => {
    const interval = trackingIntervals.current.get(tripId)
    if (interval) {
      clearInterval(interval)
      trackingIntervals.current.delete(tripId)
      console.log("🛑 Client tracking stopped for:", tripId.slice(0, 8))
    }
  }, [])

  // Initialize tracking for in-progress trips
  useEffect(() => {
    console.log("🔄 Initializing client tracker with trips:", trips.length)
    const inProgressTrips = trips.filter((trip) => trip.status === "IN_PROGRESS")
    if (inProgressTrips.length > 0) {
      console.log(`🚀 Starting tracking for ${inProgressTrips.length} in-progress trips`)
      inProgressTrips.forEach((trip) => {
        startTracking(trip)
      })
      toast({
        title: "🚌 Tracking Active",
        description: `Monitoring ${inProgressTrips.length} active trips`,
        variant: "default",
      })
    }

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up all tracking intervals")
      const currentIntervals = trackingIntervals.current
      currentIntervals.forEach((interval) => clearInterval(interval))
      currentIntervals.clear()
    }
  }, [startTracking, toast, trips])

  // Handle trip status changes
  useEffect(() => {
    const inProgressTrips = trips.filter((trip) => trip.status === "IN_PROGRESS")
    const currentlyTracked = Array.from(trackingIntervals.current.keys())

    // Start tracking for new in-progress trips
    inProgressTrips.forEach((trip) => {
      if (!currentlyTracked.includes(trip.id)) {
        console.log("🆕 New trip to track:", trip.id.slice(0, 8))
        startTracking(trip)
      }
    })

    // Stop tracking for trips that are no longer in progress
    currentlyTracked.forEach((tripId) => {
      const trip = trips.find((t) => t.id === tripId)
      if (!trip || trip.status !== "IN_PROGRESS") {
        console.log("🛑 Stopping tracking for completed/cancelled trip:", tripId.slice(0, 8))
        stopTracking(tripId)
      }
    })
  }, [trips, startTracking, stopTracking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentIntervals = trackingIntervals.current
      currentIntervals.forEach((interval) => clearInterval(interval))
      currentIntervals.clear()
    }
  }, [])

  return null // This is a logic-only component
}
