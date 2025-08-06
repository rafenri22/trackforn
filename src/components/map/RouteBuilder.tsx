"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"
import { Plus, MapPin, Navigation, Clock, Trash2, ArrowDown, Edit2 } from "lucide-react"
import type { Location, RouteSegment, TollGate } from "@/types"
import { TOLL_GATES, findNearestTollGates } from "@/lib/routing"
import LocationPicker from "./LocationPicker"

interface RouteBuilderProps {
  onSegmentsChange: (segments: RouteSegment[]) => void
  initialSegments?: RouteSegment[]
}

type StepType = 'location' | 'toll_or_stop' | 'toll_entry' | 'toll_exit' | 'stop_duration'

interface BuilderStep {
  id: string
  type: StepType
  data?: any
}

export default function RouteBuilder({ onSegmentsChange, initialSegments = [] }: RouteBuilderProps) {
  const [segments, setSegments] = useState<RouteSegment[]>(initialSegments)
  const [currentStep, setCurrentStep] = useState<BuilderStep | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showTollPicker, setShowTollPicker] = useState(false)
  const [nearbyTollGates, setNearbyTollGates] = useState<TollGate[]>([])
  const [tempLocation, setTempLocation] = useState<Location | null>(null)
  const [tempStopDuration, setTempStopDuration] = useState(30)

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
        setSegments(newSegments)
        onSegmentsChange(newSegments)
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
        setSegments(newSegments)
        onSegmentsChange(newSegments)
        setCurrentStep(null)
      }
    }
  }, [currentStep, segments, onSegmentsChange])

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
    setSegments(newSegments)
    
    // Now ask for toll exit
    setCurrentStep({
      id: crypto.randomUUID(),
      type: 'toll_exit',
      data: { entryGate: tollGate }
    })
    // Keep toll picker open for exit selection
  }, [currentStep, segments])

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
    setSegments(newSegments)
    onSegmentsChange(newSegments)
    setShowTollPicker(false)
    setCurrentStep(null)
  }, [currentStep, segments, onSegmentsChange])

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
      setSegments(newSegments)
      onSegmentsChange(newSegments)
      setCurrentStep(null)
      setTempStopDuration(30)
    }
  }, [currentStep, segments, onSegmentsChange, tempStopDuration])

  const handleRemoveSegment = useCallback((segmentId: string) => {
    const newSegments = segments.filter(s => s.id !== segmentId)
      .map((s, index) => ({ ...s, order: index + 1 }))
    setSegments(newSegments)
    onSegmentsChange(newSegments)
  }, [segments, onSegmentsChange])

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
      setSegments(newSegments)
      onSegmentsChange(newSegments)
      setCurrentStep(null)
      setTempStopDuration(30)
    }
  }, [currentStep, segments, onSegmentsChange, tempStopDuration])

  const getSegmentIcon = (type: string) => {
    switch (type) {
      case 'departure': return '🚌'
      case 'toll_entry': return '🛣️'
      case 'toll_exit': return '🛣️'
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

  const canAddDestination = segments.length > 0 && !segments.some(s => s.type === 'destination')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Route Builder
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
                {!segments.some(s => s.type === 'destination') && (
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
              {nearbyTollGates.map((gate) => (
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
              ))}
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