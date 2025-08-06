"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import L, { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Bus, Trip, BusLocation } from "@/types"
import { GARAGE_LOCATION } from "@/lib/tracking"
import React from "react"

// Fix for default markers
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  })
}

interface BusMapProps {
  buses: Bus[]
  trips: Trip[]
  busLocations: BusLocation[]
  onBusClick?: (bus: Bus, trip?: Trip) => void
  showControls?: boolean
  autoFit?: boolean
  activeTripId?: string
}

const formatElapsedTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

const generateParkingPositions = (centerLat: number, centerLng: number, count: number) => {
  const positions = []
  const radius = 0.002
  const angleStep = (2 * Math.PI) / Math.max(count, 1)
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep
    const lat = centerLat + radius * Math.cos(angle)
    const lng = centerLng + radius * Math.sin(angle)
    positions.push({ lat, lng })
  }
  return positions
}

const MAX_MARKERS = 50

function BusMap({
  buses,
  trips,
  busLocations,
  onBusClick,
  showControls = false,
  autoFit = false,
  activeTripId,
}: BusMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const activeRoutePolyline = useRef<L.Polyline | null>(null)
  const initializedRef = useRef(false)
  const [activeRouteTripId, setActiveRouteTripId] = useState<string | null>(null)
  
  // FIXED: Enhanced user interaction tracking to prevent map movement during updates
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isUserCurrentlyInteracting, setIsUserCurrentlyInteracting] = useState(false)
  const userInteractionTimer = useRef<number | null>(null)
  const initialAutoFitDone = useRef(false)

  const handleBusClick = useCallback((bus: Bus, trip?: Trip) => {
    if (trip?.id && activeRouteTripId !== trip.id) {
      setActiveRouteTripId(trip.id)
    } else if (trip?.id && activeRouteTripId === trip.id) {
      setActiveRouteTripId(null) // Toggle off if same trip
    }
  }, [activeRouteTripId])

  // FIXED: Enhanced user interaction tracking
  const handleUserInteraction = useCallback((interactionType: string) => {
    console.log(`🗺️ User interaction detected: ${interactionType}`)
    setHasUserInteracted(true)
    setIsUserCurrentlyInteracting(true)
    
    if (userInteractionTimer.current) {
      clearTimeout(userInteractionTimer.current)
    }
    
    if (typeof window !== 'undefined') {
      userInteractionTimer.current = window.setTimeout(() => {
        setIsUserCurrentlyInteracting(false)
        console.log('🗺️ User interaction timeout - allowing gentle updates')
      }, 5000) // 5 seconds of no interaction before allowing updates
    }
  }, [])

  // Initialize map and event handlers
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return

    const javaCenter = [-7.5, 110.0]
    const map = L.map(mapRef.current, {
      center: javaCenter as [number, number],
      zoom: window.innerWidth < 768 ? 7 : 8,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    // Add garage marker
    const garageIcon = L.divIcon({
      html: `
        <div class="relative">
          <div class="bg-gray-600 text-white rounded-lg px-1 py-0.5 text-[10px] font-bold whitespace-nowrap max-w-[80px] truncate">
            🏢 ${GARAGE_LOCATION.name}
          </div>
        </div>
      `,
      className: "garage-marker",
      iconSize: [80, 12],
      iconAnchor: [40, 6],
    })

    const activeBuses = buses.filter((b) => b.is_active).length
    const busesWithLocations = busLocations.length
    const inGarage = buses.length - activeBuses - busesWithLocations

    L.marker([GARAGE_LOCATION.lat, GARAGE_LOCATION.lng], { icon: garageIcon })
      .bindPopup(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-lg mb-2">🏢 ${GARAGE_LOCATION.name}</h3>
          <div class="space-y-1 text-sm">
            <p><strong>Total Buses:</strong> ${buses.length}</p>
            <p><strong>In Garage:</strong> ${Math.max(0, inGarage)}</p>
            <p><strong>On Trip:</strong> ${activeBuses}</p>
            <p><strong>At Destination:</strong> ${busesWithLocations - activeBuses}</p>
          </div>
        </div>
      `)
      .addTo(map)

    mapInstanceRef.current = map

    // FIXED: Enhanced interaction tracking for all map movements
    const interactionEvents = [
      'dragstart', 'drag', 'dragend',
      'zoomstart', 'zoom', 'zoomend', 
      'movestart', 'move', 'moveend',
      'resize', 'viewreset'
    ]

    interactionEvents.forEach(eventName => {
      map.on(eventName, () => handleUserInteraction(eventName))
    })

    // Handle map click to clear route
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Only clear route if not clicking on a marker
      if (e.originalEvent.target === map.getContainer()) {
        setActiveRouteTripId(null)
        if (activeRoutePolyline.current) {
          map.removeLayer(activeRoutePolyline.current)
          activeRoutePolyline.current = null
        }
      }
    }
    map.on('click', handleMapClick)

    initializedRef.current = true
    console.log('🗺️ Map initialized - tracking user interactions')

    return () => {
      map.off('click', handleMapClick)
      
      interactionEvents.forEach(eventName => {
        map.off(eventName)
      })
      
      if (userInteractionTimer.current) {
        clearTimeout(userInteractionTimer.current)
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        initializedRef.current = false
        initialAutoFitDone.current = false
        setHasUserInteracted(false)
        setIsUserCurrentlyInteracting(false)
      }
    }
  }, [handleUserInteraction, buses, busLocations])

  // Effect to manage active route polyline - IMPROVED with real route display
  useEffect(() => {
    if (!mapInstanceRef.current || !initializedRef.current) return
    const map = mapInstanceRef.current

    // Remove previous polyline
    if (activeRoutePolyline.current) {
      map.removeLayer(activeRoutePolyline.current)
      activeRoutePolyline.current = null
    }

    // Handle active route display
    const tripId = activeTripId || activeRouteTripId
    if (tripId) {
      const trip = trips.find(t => t.id === tripId)
      if (trip?.route && trip.route.length > 0) {
        console.log(`🗺️ Displaying route for trip ${tripId.slice(0, 8)} with ${trip.route.length} points`)
        
        const latLngs: LatLngExpression[] = trip.route
          .filter(coord => typeof coord.lat === 'number' && typeof coord.lng === 'number' && !isNaN(coord.lat) && !isNaN(coord.lng))
          .map(coord => [coord.lat, coord.lng] as [number, number])

        if (latLngs.length > 0) {
          const color = 
            trip.status === "IN_PROGRESS" ? "#3b82f6" : 
            trip.status === "COMPLETED" ? "#10b981" : "#6b7280"

          // IMPROVED: Better route styling for real roads
          activeRoutePolyline.current = L.polyline(latLngs, {
            color,
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1, // Smooth the polyline for better appearance
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map)

          console.log(`✅ Route displayed with ${latLngs.length} coordinate points following real roads`)
        }
      }
    }
  }, [activeTripId, activeRouteTripId, trips])

  // FIXED: Effect to manage bus markers with smart auto-fit
  useEffect(() => {
    if (!mapInstanceRef.current || !initializedRef.current) return

    const map = mapInstanceRef.current
    const markers = markersRef.current

    console.log(`🗺️ Updating bus markers - User interacted: ${hasUserInteracted}, Currently interacting: ${isUserCurrentlyInteracting}`)

    // Clear existing markers
    markers.forEach((marker) => map.removeLayer(marker))
    markers.clear()

    // Add markers for buses with locations
    const visibleBusLocations = busLocations.slice(0, MAX_MARKERS)
    visibleBusLocations.forEach((location) => {
      const trip = trips.find((t) => t.id === location.trip_id)
      const bus = buses.find((b) => b.id === location.bus_id)
      if (!bus) return

      let elapsedMinutes = 0
      if (trip?.start_time) {
        const startTime = new Date(trip.start_time).getTime()
        const currentTime = Date.now()
        elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60))
      }
      if (location.elapsed_time_minutes !== undefined && location.elapsed_time_minutes > 0) {
        elapsedMinutes = location.elapsed_time_minutes
      }
      const elapsedTime = formatElapsedTime(elapsedMinutes)

      const isActive = bus.is_active
      const isCompleted = trip?.status === "COMPLETED"
      const isPending = trip?.status === "PENDING"
      
      let busColor = "blue-600"
      let statusText = "Sedang dalam Perjalanan di Jalan Real"
      let progressDisplay = ""
      
      if (isPending) {
        busColor = "yellow-600"
        statusText = "Standby di Titik Awal"
        progressDisplay = `
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full px-0.5 py-0.25 text-[6px] font-bold whitespace-nowrap">
            Ready
          </div>
        `
      } else if (isCompleted) {
        busColor = "green-600"
        statusText = "Sudah Sampai di Titik Akhir (Parkir)"
        progressDisplay = `
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white rounded-full px-0.5 py-0.25 text-[6px] font-bold whitespace-nowrap">
            Arrived
          </div>
        `
      } else if (isActive) {
        busColor = "blue-600"
        statusText = "Mengikuti Jalan Real (OSRM)"
        progressDisplay = `
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white rounded-full px-0.5 py-0.25 text-[6px] font-bold whitespace-nowrap">
            ${elapsedTime}
          </div>
        `
      }

      const busIcon = L.divIcon({
        html: `
          <div class="relative">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 rounded px-1 py-0.5 text-[10px] font-bold whitespace-nowrap max-w-[60px] truncate">
              ${bus.nickname}
            </div>
            <div class="bg-${busColor} text-white rounded-full w-4 h-4 flex items-center justify-center">
              <div class="text-[8px]">🚌</div>
            </div>
            ${progressDisplay}
          </div>
        `,
        className: "custom-bus-marker",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      let popupContent = `
        <div class="p-3 min-w-[250px]" onclick="event.stopPropagation()">
          <div class="flex items-center gap-3 mb-3">
            ${
              bus.photo_url
                ? `
              <div class="w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                <img src="${bus.photo_url}" alt="${bus.nickname}" class="w-full h-full object-cover"
                      onload="this.style.display='block'"
                      onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-12 rounded bg-gray-200 flex items-center justify-center\\'>No Photo</div>'"
                     style="display:none">
              </div>
            `
                : `
              <div class="w-16 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span class="text-gray-400 text-xs">No Photo</span>
              </div>
            `
            }
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-lg truncate">${bus.nickname}</h3>
              <p class="text-sm text-gray-500">${bus.code}</p>
            </div>
          </div>
          <div class="space-y-1 text-sm">
            <p><strong>Driver:</strong> ${bus.crew}</p>
            <p><strong>Status:</strong> <span class="text-${busColor.replace('600', '700')}">${statusText}</span></p>
      `

      if (trip) {
        const routeType = trip.segments && trip.segments.some(s => s.type === 'toll_entry') ? '🛣️ Toll Route' : '🚗 Regular Route'
        popupContent += `
            <p><strong>From:</strong> ${trip.departure.name}</p>
            <p><strong>To:</strong> ${trip.destination.name}</p>
            <p><strong>Route Type:</strong> ${routeType}</p>
        `
        if (isActive && trip.speed) {
          popupContent += `<p><strong>Current Speed:</strong> ${trip.speed} km/h</p>`
        }
        if (location.progress !== undefined) {
          popupContent += `<p><strong>Progress:</strong> ${location.progress.toFixed(1)}%</p>`
        }
        if (elapsedTime && (isActive || isCompleted)) {
          popupContent += `<p><strong>Travel Time:</strong> ${elapsedTime}</p>`
        }
        if (trip.route && trip.route.length > 0) {
          popupContent += `<p><strong>Route Points:</strong> ${trip.route.length} (Real Roads)</p>`
        }
      }

      popupContent += `
          </div>
          ${
            showControls
              ? `
            <div class="mt-3 pt-2 border-t">
              <button onclick="window.showBusDetails && window.showBusDetails('${bus.id}', '${trip?.id || ''}')" class="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 mb-2">
                View Details
              </button>
              ${trip && isActive ? `
                <button onclick="window.toggleRoute && window.toggleRoute('${trip.id}')" class="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                  ${activeRouteTripId === trip.id ? 'Hide Route' : 'Show Real Route'}
                </button>
              ` : ''}
            </div>
          `
              : ""
          }
        </div>
      `

      const marker = L.marker([location.lat, location.lng], { icon: busIcon })
        .bindPopup(popupContent, {
          closeOnClick: false,
          autoClose: false,
          closeButton: true,
          maxWidth: 300,
          keepInView: true
        })
        .addTo(map)

      // Prevent event propagation for marker clicks
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e)
        if (onBusClick) {
          handleBusClick(bus, trip)
          onBusClick(bus, trip)
        }
      })

      // Keep popup open and prevent auto-closing
      marker.on('popupopen', (e) => {
        const popup = e.popup.getElement()
        if (popup) {
          popup.addEventListener('click', (event) => {
            event.stopPropagation()
          })
        }
      })

      markers.set(location.bus_id, marker)
    })

    // Add parked buses at garage
    const busesWithLocations = new Set(busLocations.map(loc => loc.bus_id))
    const parkedBuses = buses.filter((bus) => !busesWithLocations.has(bus.id))
    const visibleParkedBuses = parkedBuses.slice(0, MAX_MARKERS - visibleBusLocations.length)

    if (visibleParkedBuses.length > 0) {
      const parkingPositions = generateParkingPositions(GARAGE_LOCATION.lat, GARAGE_LOCATION.lng, visibleParkedBuses.length)
      visibleParkedBuses.forEach((bus, index) => {
        const position = parkingPositions[index] || { lat: GARAGE_LOCATION.lat, lng: GARAGE_LOCATION.lng }

        const parkedBusIcon = L.divIcon({
          html: `
            <div class="relative">
              <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 rounded px-1 py-0.5 text-[10px] font-bold whitespace-nowrap max-w-[60px] truncate">
                ${bus.nickname}
              </div>
              <div class="bg-gray-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                <div class="text-[6px]">🚌</div>
              </div>
            </div>
          `,
          className: "parked-bus-marker",
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })

        const parkedMarker = L.marker([position.lat, position.lng], { icon: parkedBusIcon })
          .bindPopup(`
            <div class="p-3 min-w-[200px]" onclick="event.stopPropagation()">
              <div class="flex items-center gap-3 mb-3">
                ${
                  bus.photo_url
                    ? `
                  <div class="w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src="${bus.photo_url}" alt="${bus.nickname}" class="w-full h-full object-cover"
                         onload="this.style.display='block'"
                         onerror="this.parentElement.innerHTML='<div class=\\'w-16 h-12 rounded bg-gray-200 flex items-center justify-center\\'>No Photo</div>'"
                         style="display:none">
                  </div>
                `
                    : `
                  <div class="w-16 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span class="text-gray-400 text-xs">No Photo</span>
                  </div>
                `
                }
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-lg truncate">${bus.nickname}</h3>
                  <p class="text-sm text-gray-500">${bus.code}</p>
                </div>
              </div>
              <div class="space-y-1 text-sm">
                <p><strong>Driver:</strong> ${bus.crew}</p>
                <p><strong>Status:</strong> <span class="text-gray-600">Tersedia di ${GARAGE_LOCATION.name}</span></p>
                <p><strong>Location:</strong> <span class="text-green-600">Ready for Real Route Trip</span></p>
              </div>
              ${
                showControls
                  ? `
                <div class="mt-3 pt-2 border-t">
                  <button onclick="window.showParkedBusDetails && window.showParkedBusDetails('${bus.id}')" class="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
                    View Details
                  </button>
                </div>
              `
                  : ""
              }
            </div>
          `, {
            closeOnClick: false,
            autoClose: false,
            closeButton: true,
            maxWidth: 250,
            keepInView: true
          })
          .addTo(map)

        // Prevent event propagation
        parkedMarker.on("click", (e) => {
          L.DomEvent.stopPropagation(e)
          if (onBusClick) {
            onBusClick(bus)
          }
        })

        parkedMarker.on('popupopen', (e) => {
          const popup = e.popup.getElement()
          if (popup) {
            popup.addEventListener('click', (event) => {
              event.stopPropagation()
            })
          }
        })

        markers.set(`parked_${bus.id}`, parkedMarker)
      })
    }

    // FIXED: Smart auto-fit logic - only on initial load and if explicitly requested
    const shouldAutoFit = autoFit && 
                           visibleBusLocations.length > 0 && 
                           !activeRouteTripId && 
                           !activeTripId && 
                           !hasUserInteracted && 
                           !isUserCurrentlyInteracting &&
                           !initialAutoFitDone.current

    if (shouldAutoFit) {
      console.log('🗺️ Performing initial auto-fit to show all buses')
      const activeMarkers = Array.from(markers.values()).filter((_, index) => index < visibleBusLocations.length)
      if (activeMarkers.length > 0) {
        const group = new L.FeatureGroup(activeMarkers)
        map.fitBounds(group.getBounds().pad(0.1))
        initialAutoFitDone.current = true
      }
    } else if (hasUserInteracted || isUserCurrentlyInteracting) {
      console.log('🗺️ Skipping auto-fit - user has interacted with map')
    }

    // FIXED: Global functions for popup buttons - add window checks
    if (showControls && typeof window !== 'undefined') {
      (window as any).showBusDetails = (busId: string, tripId: string) => {
        const bus = buses.find((b) => b.id === busId)
        const trip = tripId ? trips.find((t) => t.id === tripId) : undefined
        if (bus && onBusClick) {
          onBusClick(bus, trip)
        }
      };
      
      (window as any).showParkedBusDetails = (busId: string) => {
        const bus = buses.find((b) => b.id === busId)
        if (bus && onBusClick) {
          onBusClick(bus)
        }
      };
      
      (window as any).toggleRoute = (tripId: string) => {
        if (activeRouteTripId === tripId) {
          setActiveRouteTripId(null)
        } else {
          setActiveRouteTripId(tripId)
        }
      };
    }
  }, [
    busLocations, 
    trips, 
    buses, 
    onBusClick, 
    showControls, 
    autoFit, 
    handleBusClick, 
    activeRouteTripId, 
    activeTripId, 
    hasUserInteracted, 
    isUserCurrentlyInteracting
  ])

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: "400px" }} />
}

export default React.memo(BusMap)