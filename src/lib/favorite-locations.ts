"use client"

import { supabase } from "./supabase"

export interface FavoriteLocation {
  id: string
  name: string
  lat: number
  lng: number
  category: 'terminal' | 'landmark' | 'custom'
  usage_count: number
  created_at: string
  updated_at: string
}

// Local storage key for favorite locations
const FAVORITES_KEY = 'tja_favorite_locations'

// Get favorite locations from localStorage and Supabase
export const getFavoriteLocations = async (): Promise<FavoriteLocation[]> => {
  try {
    // Try to get from Supabase first
    const { data, error } = await supabase
      .from('favorite_locations')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(50)

    if (!error && data) {
      // Also save to localStorage as backup
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(data))
      return data
    }
  } catch (error) {
    console.error('Error fetching favorites from Supabase, using localStorage:', error)
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Add or update favorite location
export const addFavoriteLocation = async (location: {
  name: string
  lat: number
  lng: number
  category?: 'terminal' | 'landmark' | 'custom'
}): Promise<FavoriteLocation> => {
  const favoriteData = {
    name: location.name,
    lat: location.lat,
    lng: location.lng,
    category: location.category || 'custom',
    usage_count: 1,
  }

  try {
    // Check if location already exists
    const { data: existing, error: checkError } = await supabase
      .from('favorite_locations')
      .select('*')
      .eq('name', location.name)
      .single()

    if (existing && !checkError) {
      // Update usage count
      const { data: updated, error: updateError } = await supabase
        .from('favorite_locations')
        .update({ usage_count: existing.usage_count + 1 })
        .eq('id', existing.id)
        .select()
        .single()

      if (!updateError && updated) {
        await updateLocalStorageFavorites()
        return updated as FavoriteLocation
      }
    } else {
      // Insert new favorite
      const { data: inserted, error: insertError } = await supabase
        .from('favorite_locations')
        .insert(favoriteData)
        .select()
        .single()

      if (!insertError && inserted) {
        await updateLocalStorageFavorites()
        return inserted as FavoriteLocation
      }
    }
  } catch (error) {
    console.error('Error adding to Supabase, using localStorage:', error)
  }

  // Fallback to localStorage
  const favorites = await getFavoriteLocations()
  const existingIndex = favorites.findIndex(f => f.name === location.name)
  
  if (existingIndex >= 0) {
    favorites[existingIndex].usage_count += 1
    favorites[existingIndex].updated_at = new Date().toISOString()
  } else {
    const newFavorite: FavoriteLocation = {
      id: Date.now().toString(),
      ...favoriteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    favorites.push(newFavorite)
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  return favorites[existingIndex] || favorites[favorites.length - 1]
}

// Remove favorite location
export const removeFavoriteLocation = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('favorite_locations')
      .delete()
      .eq('id', id)

    if (!error) {
      await updateLocalStorageFavorites()
      return
    }
  } catch (error) {
    console.error('Error removing from Supabase, using localStorage:', error)
  }

  // Fallback to localStorage
  const favorites = await getFavoriteLocations()
  const filtered = favorites.filter(f => f.id !== id)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered))
}

// Update localStorage with latest data from Supabase
const updateLocalStorageFavorites = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('favorite_locations')
      .select('*')
      .order('usage_count', { ascending: false })

    if (!error && data) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(data))
    }
  } catch (error) {
    console.error('Error updating localStorage:', error)
  }
}

// Get most used locations
export const getMostUsedLocations = async (limit: number = 10): Promise<FavoriteLocation[]> => {
  const favorites = await getFavoriteLocations()
  return favorites
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, limit)
}

// Search favorite locations
export const searchFavoriteLocations = async (query: string): Promise<FavoriteLocation[]> => {
  const favorites = await getFavoriteLocations()
  const lowerQuery = query.toLowerCase()
  
  return favorites.filter(location =>
    location.name.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => b.usage_count - a.usage_count)
}

// Default popular locations in Indonesia
export const getDefaultLocations = (): FavoriteLocation[] => [
  {
    id: 'default-1',
    name: 'Terminal Kampung Rambutan',
    lat: -6.2615,
    lng: 106.8776,
    category: 'terminal',
    usage_count: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-2',
    name: 'Terminal Lebak Bulus',
    lat: -6.2891,
    lng: 106.7749,
    category: 'terminal',
    usage_count: 95,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-3',
    name: 'Terminal Pulogadung',
    lat: -6.1951,
    lng: 106.8997,
    category: 'terminal',
    usage_count: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-4',
    name: 'Terminal Kalideres',
    lat: -6.1385,
    lng: 106.7297,
    category: 'terminal',
    usage_count: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-5',
    name: 'Bandung (Cicaheum)',
    lat: -6.9175,
    lng: 107.6191,
    category: 'terminal',
    usage_count: 80,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-6',
    name: 'Cirebon',
    lat: -6.7063,
    lng: 108.5571,
    category: 'terminal',
    usage_count: 75,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-7',
    name: 'Semarang',
    lat: -6.9913,
    lng: 110.4213,
    category: 'terminal',
    usage_count: 70,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-8',
    name: 'Yogyakarta (Giwangan)',
    lat: -7.8104,
    lng: 110.3822,
    category: 'terminal',
    usage_count: 65,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]