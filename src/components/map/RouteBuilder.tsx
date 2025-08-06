"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"
import { Plus, MapPin, Navigation, Clock, Trash2, ArrowDown, Edit2, Eye, EyeOff, AlertTriangle, Info } from "lucide-react"
import type { Location, RouteSegment, TollGate } from "@/types"
import { TOLL_GATES, findNearestTollGates, calculateRouteFromSegments } from "@/lib/routing"
import LocationPicker from "./LocationPicker"

const BusMap = dynamic(() => import("@/components/map/BusMap"), {
  ssr: false,
  loading: () => <Loading text="Loading route preview..." />
});

interface RouteBuilderProps {
  onSegmentsChange: (segments: RouteSegment[]) => void
  onRouteDataChange?: (routeData: {
    coordinates: { lat: number; lng: number }[]
    distance: number
    duration: number
  } | null) => void
  initialSegments?: RouteSegment[]
}

type StepType = 'location' | 'toll_or_stop' | 'toll_entry' | 'toll_exit' | 'stop_duration'

interface BuilderStep {
  id: string
  type: StepType
  data?: any
}

// Mock trip for route preview
const createMockTrip = (segments: RouteSegment[], routeCoordinates: { lat: number; lng: number }[]) => {
  const departureSegment = segments.find(s => s.type === 'departure') || segments[0]
  const destinationSegment = segments.find(s => s.type === 'destination') || segments[segments.length - 1]
  
  if (!departureSegment || !destinationSegment) return null
  
  return {
    id: 'preview',
    bus_id: 'preview',
    departure: departureSegment.location,
    stops: segments.filter(s => s.type === 'stop').map(s => ({ ...s.location, duration: s.stop_duration || 30 })),
    destination: destinationSegment.location,
    route: routeCoordinates,
    segments: segments,
    status: 'PENDING' as const,
    progress: 0,
    speed: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export default function RouteBuilder({ onSegmentsChange, onRouteDataChange, initialSegments = [] }: RouteBuilderProps) {
  const [segments, setSegments] = useState<RouteSegment[]>(initialSegments)
  const [currentStep, setCurrentStep] = useState<BuilderStep | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showTollPicker, setShowTollPicker] = useState(false)
  const [nearbyTollGates, setNearbyTollGates] = useState<TollGate[]>([])
  const [tempLocation, setTempLocation] = useState<Location | null>(null)
  const [tempStopDuration, setTempStopDuration] = useState(30)
  const [showRoutePreview, setShowRoutePreview] = useState(false)
  const [routeData, setRouteData] = useState<{
    coordinates: { lat: number; lng: number }[]
    distance: number
    duration: number
  } | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [isPartialPreview, setIsPartialPreview] = useState(false)

  // FIXED: Enhanced route calculation with better error handling
  const calculateRoutePreview = useCallback(async () => {
    console.log("🔧 RouteBuilder: Starting route calculation with", segments.length, "segments")
    
    if (segments.length === 0) {
      console.log("🔧 RouteBuilder: No segments, clearing route data")
      setRouteData(null)
      setIsPartialPreview(false)
      onRouteDataChange?.(null)
      return
    }

    // Check route completeness
    let previewSegments: RouteSegment[] = [...segments]
    let isPartial = false
    
    const hasRealDeparture = segments.some(s => s.type === 'departure')
    const hasRealDestination = segments.some(s => s.type === 'destination')
    
    // Always try to calculate some preview, even if partial
    if (!hasRealDeparture || !hasRealDestination) {
      isPartial = true
      console.log('🔧 RouteBuilder: Creating partial preview')
      
      // Create temporary segments for preview
      if (!hasRealDeparture && segments.length > 0) {
        const firstSegment = segments[0]
        const tempDeparture: RouteSegment = {
          id: 'temp-departure',
          type: 'departure',
          location: {
            name: `Start: ${firstSegment.location.name}`,
            lat: firstSegment.location.lat,
            lng: firstSegment.location.lng
          },
          order: 0
        }
        previewSegments = [tempDeparture, ...segments.map(s => ({ ...s, order: s.order + 1 }))]
      }
      
      if (!hasRealDestination && segments.length > 0) {
        const lastSegment = segments[segments.length - 1]
        const tempDestination: RouteSegment = {
          id: 'temp-destination',
          type: 'destination',
          location: {
            name: `End: ${lastSegment.location.name}`,
            lat: lastSegment.location.lat,
            lng: lastSegment.location.lng
          },
          order: previewSegments.length
        }
        previewSegments = [...previewSegments, tempDestination]
      }
    }

    if (previewSegments.length < 2) {
      console.log('🔧 RouteBuilder: Not enough segments for preview')
      setRouteData(null)
      setIsPartialPreview(false)
      onRouteDataChange?.(null)
      return
    }

    setIsCalculatingRoute(true)
    setIsPartialPreview(isPartial)
    
    try {
      console.log(`🗺️ RouteBuilder: Calculating ${isPartial ? 'PARTIAL' : 'COMPLETE'} route with ${previewSegments.length} segments`)
      
      const result = await calculateRouteFromSegments(previewSegments)
      
      const routePreviewData = {
        coordinates: result.coordinates,
        distance: result.distance,
        duration: result.duration
      }
      
      setRouteData(routePreviewData)
      
      // FIXED: Always call callback, let parent decide what to do with partial data
      if (!isPartial && onRouteDataChange) {
        onRouteDataChange(routePreviewData)
        console.log(`✅ RouteBuilder: COMPLETE route calculated and passed to parent: ${result.distance.toFixed(1)}km`)
      } else if (onRouteDataChange) {
        // For partial routes, still pass the data but mark it appropriately
        onRouteDataChange(isPartial ? null : routePreviewData)
        console.log(`⚠️ RouteBuilder: ${isPartial ? 'PARTIAL' : 'COMPLETE'} route calculated: ${result.distance.toFixed(1)}km`)
      }
      
    } catch (error) {
      console.error('RouteBuilder: Error calculating route preview:', error)
      setRouteData(null)
      setIsPartialPreview(false)
      onRouteDataChange?.(null)
    } finally {
      setIsCalculatingRoute(false)
    }
  }, [segments, onRouteDataChange])

  // Auto-calculate route preview when segments change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateRoutePreview()
    }, 500) // Increased debounce time

    return () => clearTimeout(timeoutId)
  }, [calculateRoutePreview])

  // FIXED: Better segment update with validation
  const updateSegments = useCallback((newSegments: RouteSegment[]) => {
    console.log("🔧 RouteBuilder: Updating segments:", newSegments.length)
    
    // Validate segments
    const validSegments = newSegments.filter(segment => {
      const isValid = segment && 
                     segment.location && 
                     typeof segment.location.lat === 'number' && 
                     typeof segment.location.lng === 'number' &&
                     !isNaN(segment.location.lat) && 
                     !isNaN(segment.location.lng)
      
      if (!isValid) {
        console.warn("RouteBuilder: Invalid segment filtered out:", segment)
      }
      
      return isValid
    })
    
    setSegments(validSegments)
    onSegmentsChange(validSegments)
  }, [onSegmentsChange])

  const handleAddSegment = useCallback(() => {
    if (segments.length === 0) {
      // First segment: departure location
      setCurrentStep({
        id: crypto.randomUUID(),
        type: 'location',
        data: { segmentType: 'departure' }
      })
      setShowLocationPicker(true)
    } else {
      // Ask what to add next
      setCurrentStep({
        id: crypto.randomUUID(),
        type: 'toll_or_stop'
      })
    }
  }, [segments])

  const handleLocationSelect = useCallback((location: Location) => {
    console.log("🔧 RouteBuilder: Location selected:", location.name)
    
    if (currentStep?.type === 'location') {
      setTempLocation(location)
      setShowLocationPicker(false)
      
      if (currentStep.data?.segmentType === 'departure') {
        // Add departure segment
        const newSegment: RouteSegment = {
          id: currentStep.id,
          type: 'departure',
          location,
          order: segments.length + 1
        }
        const newSegments = [...segments, newSegment]
        updateSegments(newSegments)
        setCurrentStep(null)
      } else if (currentStep.data?.segmentType === 'stop') {
        // Ask for stop duration
        setCurrentStep({
          ...currentStep,
          type: 'stop_duration',
          data: { ...currentStep.data, location }
        })
      } else if (currentStep.data?.segmentType === 'destination') {
        // Add destination segment
        const newSegment: RouteSegment = {
          id: currentStep.id,
          type: 'destination',
          location,
          order: segments.length + 1
        }
        const newSegments = [...segments, newSegment]
        updateSegments(newSegments)
        setCurrentStep(null)
      }
    }
  }, [currentStep, segments, updateSegments])

  const handleTollOrStopChoice = useCallback((choice: 'toll' | 'stop' | 'destination') => {
    if (choice === 'toll') {
      // Find nearby toll gates based on last location
      const lastSegment = segments[segments.length - 1]
      const lastLocation = lastSegment.location
      const nearby = findNearestTollGates(lastLocation, 10)
      setNearbyTollGates(nearby)
      setCurrentStep({
        id: crypto.randomUUID(),
        type: 'toll_entry'
      })
      setShowTollPicker(true)
    } else if (choice === 'stop') {
      setCurrentStep({
        id: crypto.randomUUID(),
        type: 'location',
        data: { segmentType: 'stop' }
      })
      setShowLocationPicker(true)
    } else if (choice === 'destination') {
      setCurrentStep({
        id: crypto.randomUUID(),
        type: 'location',
        data: { segmentType: 'destination' }
      })
      setShowLocationPicker(true)
    }
  }, [segments])

  const handleTollEntrySelect = useCallback((tollGate: TollGate) => {
    // Add toll entry segment
    const tollEntrySegment: RouteSegment = {
      id: currentStep!.id,
      type: 'toll_entry',
      location: {
        name: `Masuk Tol ${tollGate.name}`,
        lat: tollGate.lat,
        lng: tollGate.lng
      },
      toll_entry_gate: tollGate,
      order: segments.length + 1
    }
    
    const newSegments = [...segments, tollEntrySegment]
    updateSegments(newSegments)
    
    // Now ask for toll exit
    setCurrentStep({
      id: crypto.randomUUID(),
      type: 'toll_exit',
      data: { entryGate: tollGate }
    })
    // Keep toll picker open for exit selection
  }, [currentStep, segments, updateSegments])

  const handleTollExitSelect = useCallback((tollGate: TollGate) => {
    // Add toll exit segment
    const tollExitSegment: RouteSegment = {
      id: currentStep!.id,
      type: 'toll_exit',
      location: {
        name: `Keluar Tol ${tollGate.name}`,
        lat: tollGate.lat,
        lng: tollGate.lng
      },
      toll_exit_gate: tollGate,
      order: segments.length + 1
    }
    
    const newSegments = [...segments, tollExitSegment]
    updateSegments(newSegments)
    setShowTollPicker(false)
    setCurrentStep(null)
  }, [currentStep, segments, updateSegments])

  const handleStopDurationSubmit = useCallback(() => {
    if (currentStep && currentStep.data?.location) {
      const newSegment: RouteSegment = {
        id: currentStep.id,
        type: 'stop',
        location: currentStep.data.location,
        stop_duration: tempStopDuration,
        order: segments.length + 1
      }
      const newSegments = [...segments, newSegment]
      updateSegments(newSegments)
      setCurrentStep(null)
      setTempStopDuration(30)
    }
  }, [currentStep, segments, updateSegments, tempStopDuration])

  const handleRemoveSegment = useCallback((segmentId: string) => {
    const newSegments = segments.filter(s => s.id !== segmentId)
      .map((s, index) => ({ ...s, order: index + 1 }))
    updateSegments(newSegments)
  }, [segments, updateSegments])

  const handleEditSegment = useCallback((segment: RouteSegment) => {
    if (segment.type === 'stop') {
      setTempStopDuration(segment.stop_duration || 30)
      setCurrentStep({
        id: segment.id,
        type: 'stop_duration',
        data: { location: segment.location, isEdit: true }
      })
    }
  }, [])

  const handleEditStopDurationSubmit = useCallback(() => {
    if (currentStep && currentStep.data?.isEdit) {
      const newSegments = segments.map(s => 
        s.id === currentStep.id 
          ? { ...s, stop_duration: tempStopDuration }
          : s
      )
      updateSegments(newSegments)
      setCurrentStep(null)
      setTempStopDuration(30)
    }
  }, [currentStep, segments, updateSegments, tempStopDuration])

  const getSegmentIcon = (type: string) => {
    switch (type) {
      case 'departure': return '🚌'
      case 'toll_entry': return '🛣️ ↗️'
      case 'toll_exit': return '🛣️ ↙️'
      case 'stop': return '⏱️'
      case 'destination': return '🏁'
      default: return '📍'
    }
  }

  const getSegmentLabel = (segment: RouteSegment) => {
    switch (segment.type) {
      case 'departure': return 'Titik Awal'
      case 'toll_entry': return 'Masuk Tol'
      case 'toll_exit': return 'Keluar Tol'
      case 'stop': return `Pemberhentian (${segment.stop_duration}m)`
      case 'destination': return 'Tujuan Akhir'
      default: return 'Unknown'
    }
  }

  // Check route status
  const hasRealDeparture = segments.some(s => s.type === 'departure')
  const hasRealDestination = segments.some(s => s.type === 'destination')
  const isRouteComplete = hasRealDeparture && hasRealDestination
  const mockTrip = routeData ? createMockTrip(segments, routeData.coordinates) : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Route Builder with Real Roads
            {isPartialPreview && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Segments List */}
          <div className="space-y-2 mb-4">
            {segments.map((segment, index) => (
              <div key={segment.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{getSegmentIcon(segment.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{getSegmentLabel(segment)}</div>
                    <div className="text-xs text-gray-600 truncate">{segment.location.name}</div>
                  </div>
                  <div className="text-xs text-gray-500">#{index + 1}</div>
                </div>
                
                <div className="flex gap-1">
                  {segment.type === 'stop' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSegment(segment)}
                      className="btn-touch"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveSegment(segment.id)}
                    className="text-red-600 hover:text-red-700 btn-touch"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {segments.length > 0 && (
              <div className="flex justify-center">
                <ArrowDown className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>

          {/* Add Actions */}
          <div className="space-y-2">
            {segments.length === 0 ? (
              <Button onClick={handleAddSegment} className="w-full btn-touch">
                <MapPin className="h-4 w-4 mr-2" />
                Pilih Titik Awal
              </Button>
            ) : (
              <>
                {!hasRealDestination && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleTollOrStopChoice('toll')}
                      className="btn-touch"
                    >
                      🛣️ Masuk Tol
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTollOrStopChoice('stop')}
                      className="btn-touch"
                    >
                      ⏱️ Pemberhentian
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTollOrStopChoice('destination')}
                      className="btn-touch"
                    >
                      🏁 Tujuan Akhir
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Route Preview */}
          {segments.length >= 1 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  🗺️ Real Route Preview
                  {isCalculatingRoute && <Loading size="sm" />}
                  {routeData && !isPartialPreview && <span className="text-green-600 text-xs">✅ Ready</span>}
                  {routeData && isPartialPreview && <span className="text-yellow-600 text-xs">⚠️ Partial</span>}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRoutePreview(!showRoutePreview)}
                  className="btn-touch"
                >
                  {showRoutePreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showRoutePreview ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>

              {/* Status indicators */}
              {!isRouteComplete && segments.length > 0 && (
                <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Building Route...</span>
                  </div>
                  <ul className="text-xs text-yellow-700 mt-1 ml-6 space-y-1">
                    {!hasRealDeparture && <li>• Add departure point to start</li>}
                    {!hasRealDestination && <li>• Add destination point to complete</li>}
                  </ul>
                </div>
              )}

              {routeData && (
                <div className="space-y-2 text-sm">
                  <div className={`grid grid-cols-3 gap-4 p-2 rounded ${isPartialPreview ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                    <div>
                      <span className={`font-medium ${isPartialPreview ? 'text-yellow-600' : 'text-blue-600'}`}>Distance:</span>
                      <div className="font-bold">{routeData.distance.toFixed(1)} km</div>
                    </div>
                    <div>
                      <span className={`font-medium ${isPartialPreview ? 'text-yellow-600' : 'text-blue-600'}`}>Duration:</span>
                      <div className="font-bold">{Math.floor(routeData.duration / 60)}h {routeData.duration % 60}m</div>
                    </div>
                    <div>
                      <span className={`font-medium ${isPartialPreview ? 'text-yellow-600' : 'text-blue-600'}`}>Route Points:</span>
                      <div className="font-bold">{routeData.coordinates.length}</div>
                    </div>
                  </div>

                  {/* Status message */}
                  {isPartialPreview ? (
                    <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-700 border border-yellow-200">
                      ⚠️ <strong>Partial Preview:</strong> Add departure and destination for complete route
                    </div>
                  ) : (
                    <div className="p-2 bg-green-50 rounded text-xs text-green-700 border border-green-200">
                      ✅ <strong>Route Ready:</strong> This exact route will be used when the bus runs
                    </div>
                  )}
                  
                  {showRoutePreview && mockTrip && (
                    <div className="mt-3">
                      <div className="h-64 border rounded-lg overflow-hidden bg-gray-100">
                        <BusMap 
                          buses={[]}
                          trips={[mockTrip]}
                          busLocations={[]}
                          showControls={false}
                          autoFit={true}
                          activeTripId="preview"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {isPartialPreview ? 
                          '⚠️ Preview showing partial route with current segments' :
                          '✅ Preview showing REAL road routing that will be used in actual trip'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!routeData && !isCalculatingRoute && segments.length >= 1 && (
                <div className="text-center py-4 text-red-500">
                  <p className="text-sm">❌ Unable to calculate route preview</p>
                  <p className="text-xs">Please check your segment locations</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => {
            setShowLocationPicker(false)
            setCurrentStep(null)
          }}
          title={
            currentStep?.data?.segmentType === 'departure' ? 'Pilih Titik Awal' :
            currentStep?.data?.segmentType === 'stop' ? 'Pilih Lokasi Pemberhentian' :
            currentStep?.data?.segmentType === 'destination' ? 'Pilih Tujuan Akhir' :
            'Pilih Lokasi'
          }
        />
      )}

      {/* Toll Gate Picker Modal */}
      {showTollPicker && (
        <Dialog open={showTollPicker} onOpenChange={setShowTollPicker}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentStep?.type === 'toll_entry' ? 'Pilih Gerbang Tol Masuk' : 'Pilih Gerbang Tol Keluar'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-2">
              {nearbyTollGates.length > 0 ? (
                nearbyTollGates.map((gate) => (
                  <Button
                    key={gate.name}
                    variant="outline"
                    onClick={() => {
                      if (currentStep?.type === 'toll_entry') {
                        handleTollEntrySelect(gate)
                      } else {
                        handleTollExitSelect(gate)
                      }
                    }}
                    className="w-full text-left justify-start btn-touch"
                  >
                    <div className="flex items-center gap-2">
                      <span>🛣️</span>
                      <span>{gate.name}</span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Tidak ada gerbang tol di sekitar area ini</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Stop Duration Input Modal */}
      {currentStep?.type === 'stop_duration' && (
        <Dialog open={true} onOpenChange={() => setCurrentStep(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Durasi Pemberhentian</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Lokasi: {currentStep.data?.location?.name}</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Durasi (menit)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={tempStopDuration}
                  onChange={(e) => setTempStopDuration(Number(e.target.value) || 1)}
                  min={1}
                  max={480}
                  className="form-mobile"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={currentStep.data?.isEdit ? handleEditStopDurationSubmit : handleStopDurationSubmit}
                  className="flex-1 btn-touch"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {currentStep.data?.isEdit ? 'Update' : 'Tambah'} Pemberhentian
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(null)}
                  className="btn-touch"
                >
                  Batal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}