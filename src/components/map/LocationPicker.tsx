"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, MapPin, Search, Loader2, Heart, Star, Clock } from "lucide-react"
import { Loading } from "@/components/ui/loading"
import type { Location } from "@/types"
import { 
  getFavoriteLocations, 
  addFavoriteLocation, 
  removeFavoriteLocation, 
  getMostUsedLocations,
  searchFavoriteLocations,
  getDefaultLocations,
  type FavoriteLocation 
} from "@/lib/favorite-locations"

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void
  onClose: () => void
  title?: string
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
  place_id: string
  type: string
  importance: number
  address?: {
    road?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
  }
}

export default function LocationPicker({ onLocationSelect, onClose, title = "Select Location" }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationName, setLocationName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<"favorites" | "search" | "popular">("favorites")
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true)

  // Load favorite locations
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoadingFavorites(true)
      try {
        const favorites = await getFavoriteLocations()
        const defaults = getDefaultLocations()
        
        // Combine user favorites with defaults, avoiding duplicates
        const combined: FavoriteLocation[] = [...favorites];

        defaults.forEach((defaultLoc: { name: any }) => {
          if (!combined.some(fav => fav.name === defaultLoc.name)) {
            const filledDefault: FavoriteLocation = {
              id: crypto.randomUUID(), // atau string acak
              name: defaultLoc.name,
              lat: 0, // default lat
              lng: 0, // default lng
              category: 'custom', // default category
              usage_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            combined.push(filledDefault);
          }
        })
        
        setFavoriteLocations(combined.sort((a, b) => b.usage_count - a.usage_count))
      } catch (error) {
        console.error('Error loading favorites:', error)
        setFavoriteLocations(getDefaultLocations())
      } finally {
        setIsLoadingFavorites(false)
      }
    }

    loadFavorites()
  }, [])

  // Filter locations based on search and active tab
  const getFilteredLocations = useCallback(() => {
    let locations = favoriteLocations
    
    if (searchTerm.length >= 2) {
      locations = locations.filter(location =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (activeTab) {
      case 'favorites':
        return locations.filter(loc => !loc.id.startsWith('default-')).slice(0, 20)
      case 'popular':
        return locations.filter(loc => loc.usage_count > 50).slice(0, 15)
      default:
        return locations.slice(0, 25)
    }
  }, [favoriteLocations, searchTerm, activeTab])

  // Real-time search as user types
  const performSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) return
      setIsSearching(true)
      try {
        // Multiple search strategies for better results
        const searches = [
          // Primary search with Indonesia focus
          fetch(
            `https://nominatim.openstreetmap.org/search?` +
              new URLSearchParams({
                q: `${query}, Indonesia`,
                format: "json",
                addressdetails: "1",
                limit: "8",
                countrycodes: "id",
                bounded: "1",
                viewbox: "95,-11,141,6", // Indonesia bounding box
              }),
          ),
          // Secondary search for Jakarta area
          fetch(
            `https://nominatim.openstreetmap.org/search?` +
              new URLSearchParams({
                q: `${query}, Jakarta`,
                format: "json",
                addressdetails: "1",
                limit: "5",
                bounded: "1",
                viewbox: "106.5,-6.5,107.1,-5.9", // Jakarta bounding box
              }),
          ),
        ]

        const responses = await Promise.allSettled(searches)
        const allResults: SearchResult[] = []

        for (const response of responses) {
          if (response.status === "fulfilled" && response.value.ok) {
            const data = await response.value.json()
            allResults.push(...data)
          }
        }

        // Remove duplicates and sort by relevance
        const uniqueResults = allResults.filter(
          (result, index, self) => index === self.findIndex((r) => r.place_id === result.place_id),
        )

        // Enhanced sorting: prioritize exact matches and importance
        const sortedResults = uniqueResults
          .filter((result) => result.importance > 0.1)
          .sort((a, b) => {
            // Exact match bonus
            const aExact = a.display_name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
            const bExact = b.display_name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
            if (aExact !== bExact) return bExact - aExact
            // Then by importance
            return b.importance - a.importance
          })
          .slice(0, 10)

        setSearchResults(sortedResults)

        // Auto-switch to search tab if results found
        if (sortedResults.length > 0 && activeTab !== "search") {
          setActiveTab("search")
        }
      } catch (searchError) {
        console.error("Search error:", searchError)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [activeTab],
  )

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([])
      return
    }
    const timeoutId = setTimeout(async () => {
      await performSearch(searchTerm)
    }, 300) // Faster response time
    return () => clearTimeout(timeoutId)
  }, [searchTerm, performSearch])

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return

    // Initialize map with better mobile handling
    const map = L.map(mapRef.current, {
      center: [-6.2088, 106.8456], // Jakarta center
      zoom: window.innerWidth < 768 ? 10 : 11,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      dragging: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    mapInstanceRef.current = map

    // Add click handler
    map.on("click", (e) => {
      const { lat, lng } = e.latlng
      const name = locationName || `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      setSelectedLocation({ name, lat, lng })
      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
      }
      // Add new marker
      const marker = L.marker([lat, lng]).addTo(map)
      markerRef.current = marker
    })

    // Add favorite location markers
    favoriteLocations.slice(0, 20).forEach((location) => {
      const isUserFavorite = !location.id.startsWith('default-')
      const icon = L.divIcon({
        html: `
          <div class="bg-${isUserFavorite ? 'red' : 'blue'}-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border border-white cursor-pointer hover:scale-110 transition-transform">
            ${isUserFavorite ? '❤️' : '📍'}
          </div>
        `,
        className: "favorite-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker([location.lat, location.lng], { icon })
        .bindPopup(`
          <div class="p-2">
            <strong>${location.name}</strong>
            <br>
            <small>Used ${location.usage_count} times</small>
          </div>
        `)
        .addTo(map)

      // Add click handler for quick selection
      marker.on('click', () => {
        handleLocationSelect({
          name: location.name,
          lat: location.lat,
          lng: location.lng
        })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [locationName, favoriteLocations])

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location)
    setLocationName(location.name)
    if (mapInstanceRef.current) {
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current)
      }
      // Add new marker
      const marker = L.marker([location.lat, location.lng]).addTo(mapInstanceRef.current)
      markerRef.current = marker
      // Center map on location
      mapInstanceRef.current.setView([location.lat, location.lng], 15)
    }
  }, [])

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    // Create a cleaner name from the search result
    const nameParts = result.display_name.split(",")
    const cleanName = nameParts.slice(0, 2).join(", ").trim()
    const location: Location = {
      name: cleanName || result.display_name,
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
    }
    handleLocationSelect(location)
  }, [handleLocationSelect])

  const handleAddToFavorites = useCallback(async () => {
    if (!selectedLocation) return
    
    try {
      await addFavoriteLocation({
        name: selectedLocation.name,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        category: 'custom'
      })
      
      // Reload favorites
      const favorites = await getFavoriteLocations()
      setFavoriteLocations(favorites.sort((a: { usage_count: number }, b: { usage_count: number }) => b.usage_count - a.usage_count))
    } catch (error) {
      console.error('Error adding to favorites:', error)
    }
  }, [selectedLocation])

  const handleRemoveFromFavorites = useCallback(async (id: string) => {
    try {
      await removeFavoriteLocation(id)
      
      // Reload favorites
      const favorites = await getFavoriteLocations()
      setFavoriteLocations(favorites.sort((a: { usage_count: number }, b: { usage_count: number }) => b.usage_count - a.usage_count))
    } catch (error) {
      console.error('Error removing from favorites:', error)
    }
  }, [])

  const handleConfirm = useCallback(async () => {
    if (selectedLocation) {
      // Add to favorites if it's a new custom location
      if (!favoriteLocations.some(fav => fav.name === selectedLocation.name)) {
        await handleAddToFavorites()
      } else {
        // Update usage count
        await addFavoriteLocation({
          name: selectedLocation.name,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        })
      }
      
      onLocationSelect(selectedLocation)
    }
  }, [selectedLocation, favoriteLocations, handleAddToFavorites, onLocationSelect])

  const filteredLocations = getFilteredLocations()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col animate-fadeIn">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="btn-touch">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Responsive */}
          <div className="w-full md:w-96 border-r flex flex-col">
            {/* Search Input - Enhanced Mobile */}
            <div className="p-4 border-b space-y-3 form-mobile">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
                )}
              </div>
              <Input
                placeholder="Enter custom location name..."
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>

            {/* Tabs - Mobile Optimized */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 px-3 py-2 text-sm font-medium btn-touch ${
                  activeTab === "favorites"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Heart className="h-4 w-4 mx-auto mb-1" />
                <span className="hidden sm:inline">Favorites</span>
              </button>
              <button
                onClick={() => setActiveTab("popular")}
                className={`flex-1 px-3 py-2 text-sm font-medium btn-touch ${
                  activeTab === "popular"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Star className="h-4 w-4 mx-auto mb-1" />
                <span className="hidden sm:inline">Popular</span>
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 px-3 py-2 text-sm font-medium btn-touch ${
                  activeTab === "search"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Search className="h-4 w-4 mx-auto mb-1" />
                <span className="hidden sm:inline">Search ({searchResults.length})</span>
                <span className="sm:hidden">({searchResults.length})</span>
              </button>
            </div>

            {/* Content - Enhanced Scrolling */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {isLoadingFavorites ? (
                <Loading text="Loading locations..." />
              ) : (
                <>
                  {activeTab === "search" && (
                    <div className="space-y-2">
                      {searchResults.map((result) => {
                        const nameParts = result.display_name.split(",")
                        const mainName = nameParts[0]
                        const subName = nameParts.slice(1, 3).join(",").trim()
                        return (
                          <button
                            key={result.place_id}
                            onClick={() => handleSearchResultSelect(result)}
                            className="w-full text-left p-3 rounded-lg hover:bg-gray-100 text-sm transition-colors border btn-touch"
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{mainName}</p>
                                {subName && <p className="text-xs text-gray-500 truncate">{subName}</p>}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                      
                      {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <div className="text-center py-8 text-gray-500">
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No results found for "{searchTerm}"</p>
                          <p className="text-xs mt-1">Try different keywords</p>
                        </div>
                      )}
                      
                      {searchTerm.length < 2 && (
                        <div className="text-center py-8 text-gray-400">
                          <Search className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Type to search locations</p>
                          <p className="text-xs mt-1">Results appear as you type</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(activeTab === "favorites" || activeTab === "popular") && (
                    <div className="space-y-2">
                      {filteredLocations.map((location) => {
                        const isUserFavorite = !location.id.startsWith('default-')
                        return (
                          <div key={location.id} className="flex items-center gap-2">
                            <button
                              onClick={() => handleLocationSelect({
                                name: location.name,
                                lat: location.lat,
                                lng: location.lng
                              })}
                              className="flex-1 text-left p-3 rounded-lg hover:bg-gray-100 text-sm transition-colors border btn-touch"
                            >
                              <div className="flex items-center gap-2">
                                {isUserFavorite ? (
                                  <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate block">{location.name}</span>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    <span>Used {location.usage_count} times</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                            
                            {isUserFavorite && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveFromFavorites(location.id)}
                                className="text-red-500 hover:text-red-700 btn-touch"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                      
                      {filteredLocations.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No saved locations yet</p>
                          <p className="text-xs mt-1">Search and save your favorite places</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Selected Location - Enhanced Mobile */}
            {selectedLocation && (
              <div className="p-4 border-t bg-gray-50">
                <h4 className="font-medium mb-2">Selected Location</h4>
                <p className="text-sm text-gray-600 mb-3 break-words">{selectedLocation.name}</p>
                <div className="text-xs text-gray-500 mb-3">
                  Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConfirm} className="flex-1 btn-touch">
                    Confirm Selection
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedLocation(null)} className="btn-touch">
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Map - Hidden on mobile by default, can be toggled */}
          <div className="hidden md:block flex-1">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </div>

        {/* Instructions - Mobile Optimized */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <p>
            <strong>How to use:</strong> Search locations, select from favorites, or use popular destinations.
            <span className="hidden md:inline"> Click on the map to set custom locations.</span>
          </p>
        </div>
      </div>
    </div>
  )
}