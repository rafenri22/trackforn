"use client"

import { supabase } from "./supabase"
import type { Bus, Trip, BusLocation } from "@/types"

// Real-time data store
class RealtimeStore {
  private buses: Bus[] = []
  private trips: Trip[] = []
  private busLocations: BusLocation[] = []
  private subscribers: Set<() => void> = new Set()

  // Subscribe to changes
  subscribe(callback: () => void) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // Notify all subscribers
  private notify() {
    this.subscribers.forEach((callback) => callback())
  }

  // Getters
  getBuses() {
    return this.buses
  }
  getTrips() {
    return this.trips
  }
  getBusLocations() {
    return this.busLocations
  }

  // Setters with notification
  setBuses(buses: Bus[]) {
    this.buses = buses
    this.notify()
  }

  setTrips(trips: Trip[]) {
    this.trips = trips
    this.notify()
  }

  setBusLocations(locations: BusLocation[]) {
    this.busLocations = locations
    this.notify()
  }

  // Update single items
  updateBus(updatedBus: Bus) {
    this.buses = this.buses.map((bus) => (bus.id === updatedBus.id ? updatedBus : bus))
    this.notify()
  }

  updateTrip(updatedTrip: Trip) {
    this.trips = this.trips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip))
    this.notify()
  }

  addBus(newBus: Bus) {
    this.buses = [newBus, ...this.buses]
    this.notify()
  }

  addTrip(newTrip: Trip) {
    this.trips = [newTrip, ...this.trips]
    this.notify()
  }

  removeBus(busId: string) {
    this.buses = this.buses.filter((bus) => bus.id !== busId)
    this.notify()
  }

  removeTrip(tripId: string) {
    this.trips = this.trips.filter((trip) => trip.id !== tripId)
    this.notify()
  }

  updateBusLocation(location: BusLocation) {
    // Remove old location for this bus and add new one
    this.busLocations = [location, ...this.busLocations.filter((loc) => loc.bus_id !== location.bus_id)]
    this.notify()
  }

  removeBusLocation(busId: string) {
    this.busLocations = this.busLocations.filter((loc) => loc.bus_id !== busId)
    this.notify()
  }
}

// Global store instance
export const realtimeStore = new RealtimeStore()

// Initialize real-time subscriptions
export const initializeRealtime = async () => {
  console.log("🔄 Initializing real-time subscriptions...")

  // Load initial data
  try {
    const [busesResponse, tripsResponse, locationsResponse] = await Promise.all([
      supabase.from("buses").select("*").order("created_at", { ascending: false }),
      supabase.from("trips").select("*").order("created_at", { ascending: false }),
      supabase.from("bus_locations").select("*").order("timestamp", { ascending: false }),
    ])

    if (busesResponse.data) realtimeStore.setBuses(busesResponse.data)
    if (tripsResponse.data) realtimeStore.setTrips(tripsResponse.data)
    if (locationsResponse.data) realtimeStore.setBusLocations(locationsResponse.data)

    console.log("✅ Initial data loaded:", {
      buses: busesResponse.data?.length || 0,
      trips: tripsResponse.data?.length || 0,
      locations: locationsResponse.data?.length || 0,
    })
  } catch (error) {
    console.error("❌ Error loading initial data:", error)
  }

  // Set up real-time subscriptions
  const busesChannel = supabase
    .channel("realtime_buses")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "buses",
      },
      (payload) => {
        console.log("🚌 Bus change:", payload.eventType, payload.new || payload.old)

        if (payload.eventType === "INSERT") {
          realtimeStore.addBus(payload.new as Bus)
        } else if (payload.eventType === "UPDATE") {
          realtimeStore.updateBus(payload.new as Bus)
        } else if (payload.eventType === "DELETE") {
          realtimeStore.removeBus(payload.old.id)
        }
      },
    )
    .subscribe((status) => {
      console.log("🚌 Buses subscription:", status)
    })

  const tripsChannel = supabase
    .channel("realtime_trips")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "trips",
      },
      (payload) => {
        console.log("🗺️ Trip change:", payload.eventType, payload.new || payload.old)

        if (payload.eventType === "INSERT") {
          realtimeStore.addTrip(payload.new as Trip)
        } else if (payload.eventType === "UPDATE") {
          realtimeStore.updateTrip(payload.new as Trip)
        } else if (payload.eventType === "DELETE") {
          realtimeStore.removeTrip(payload.old.id)
        }
      },
    )
    .subscribe((status) => {
      console.log("🗺️ Trips subscription:", status)
    })

  const locationsChannel = supabase
    .channel("realtime_locations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bus_locations",
      },
      (payload) => {
        console.log("📍 Location change:", payload.eventType, payload.new || payload.old)

        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          realtimeStore.updateBusLocation(payload.new as BusLocation)
        } else if (payload.eventType === "DELETE") {
          realtimeStore.removeBusLocation(payload.old.bus_id)
        }
      },
    )
    .subscribe((status) => {
      console.log("📍 Locations subscription:", status)
    })

  // Return cleanup function
  return () => {
    console.log("🧹 Cleaning up real-time subscriptions")
    busesChannel.unsubscribe()
    tripsChannel.unsubscribe()
    locationsChannel.unsubscribe()
  }
}

// Hook for using real-time data
export const useRealtimeData = () => {
  return {
    buses: realtimeStore.getBuses(),
    trips: realtimeStore.getTrips(),
    busLocations: realtimeStore.getBusLocations(),
    subscribe: realtimeStore.subscribe.bind(realtimeStore),
  }
}
