"use client"

import { supabase } from "./supabase"
import type { Bus, Trip, BusLocation, CreateBusRequest, CreateTripRequest } from "@/types"

// Bus operations
export const getBuses = async (): Promise<Bus[]> => {
  const { data, error } = await supabase.from("buses").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const createBus = async (busData: CreateBusRequest): Promise<Bus> => {
  const { data, error } = await supabase
    .from("buses")
    .insert({
      code: busData.code,
      nickname: busData.nickname,
      crew: busData.crew,
      photo_url: null, // Will be updated after photo upload
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateBusPhoto = async (busId: string, photoUrl: string): Promise<void> => {
  const { error } = await supabase.from("buses").update({ photo_url: photoUrl }).eq("id", busId)

  if (error) throw error
}

export const deleteBus = async (busId: string): Promise<void> => {
  const { error } = await supabase.from("buses").delete().eq("id", busId)

  if (error) throw error
}

export const updateBusStatus = async (busId: string, isActive: boolean): Promise<void> => {
  const { error } = await supabase.from("buses").update({ is_active: isActive }).eq("id", busId)

  if (error) throw error
}

// Trip operations
export const getTrips = async (): Promise<Trip[]> => {
  const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const createTrip = async (tripData: CreateTripRequest): Promise<Trip> => {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      bus_id: tripData.bus_id,
      departure: tripData.departure,
      stops: tripData.stops,
      destination: tripData.destination,
      current_lat: tripData.departure.lat,
      current_lng: tripData.departure.lng,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTrip = async (tripId: string, updates: Partial<Trip>): Promise<void> => {
  const { error } = await supabase.from("trips").update(updates).eq("id", tripId)

  if (error) throw error
}

export const startTrip = async (tripId: string): Promise<void> => {
  const { error } = await supabase
    .from("trips")
    .update({
      status: "IN_PROGRESS",
      start_time: new Date().toISOString(),
    })
    .eq("id", tripId)

  if (error) throw error
}

export const cancelTrip = async (tripId: string): Promise<void> => {
  const { error } = await supabase
    .from("trips")
    .update({
      status: "CANCELLED",
      end_time: new Date().toISOString(),
    })
    .eq("id", tripId)

  if (error) throw error
}

// Bus location operations
export const getBusLocations = async (): Promise<BusLocation[]> => {
  const { data, error } = await supabase.from("bus_locations").select("*").order("timestamp", { ascending: false })

  if (error) throw error
  return data || []
}

export const updateBusLocation = async (location: Omit<BusLocation, "id" | "created_at">): Promise<void> => {
  // Delete old location for this bus
  await supabase.from("bus_locations").delete().eq("bus_id", location.bus_id)

  // Insert new location with default elapsed_time_minutes if not provided
  const locationData = {
    ...location,
    elapsed_time_minutes: location.elapsed_time_minutes || 0,
  }

  const { error } = await supabase.from("bus_locations").insert(locationData)

  if (error) throw error
}

export const deleteBusLocation = async (busId: string): Promise<void> => {
  const { error } = await supabase.from("bus_locations").delete().eq("bus_id", busId)

  if (error) throw error
}
