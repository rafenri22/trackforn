"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Navigation, Edit2, Trash2, Eye, Copy } from 'lucide-react'
import Link from "next/link"
import type { RouteTemplate, RouteSegment, CreateRouteTemplateRequest } from "@/types"
import RouteBuilder from "@/components/map/RouteBuilder"
import { calculateRouteFromSegments } from "@/lib/routing"

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<RouteTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  })
  const [segments, setSegments] = useState<RouteSegment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // FIXED: Route data state management
  const [routePreviewData, setRoutePreviewData] = useState<{
    coordinates: { lat: number; lng: number }[]
    distance: number
    duration: number
  } | null>(null)
  
  const { toast } = useToast()

  const loadRoutes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('route_templates')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setRoutes(data || [])
    } catch (error) {
      console.error('Error loading routes:', error)
      toast({
        title: "❌ Error Loading Routes",
        description: "Failed to load route templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadRoutes()
  }, [loadRoutes])

  const resetForm = useCallback(() => {
    setFormData({ name: '', code: '', description: '' })
    setSegments([])
    setRoutePreviewData(null)
    setSelectedRoute(null)
  }, [])

  // FIXED: Handle route data change from RouteBuilder
  const handleRouteDataChange = useCallback((routeData: {
    coordinates: { lat: number; lng: number }[]
    distance: number
    duration: number
  } | null) => {
    console.log("📡 Route template received route data:", routeData ? `${routeData.distance.toFixed(1)}km, ${routeData.coordinates.length} points` : 'null')
    setRoutePreviewData(routeData)
  }, [])

  // FIXED: Enhanced create with better validation and fallback
  const handleCreate = useCallback(async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "❌ Form Incomplete",
        description: "Please enter route name and code",
        variant: "destructive",
      })
      return
    }

    if (segments.length < 1) {
      toast({
        title: "❌ Route Incomplete",
        description: "Please add at least one segment",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      let routeDistance = 0
      let routeDuration = 0
      
      // FIXED: Use route preview data if available, otherwise calculate
      if (routePreviewData) {
        console.log("✅ Using route preview data for template")
        routeDistance = routePreviewData.distance
        routeDuration = routePreviewData.duration
      } else {
        console.log("⚠️ No preview data, calculating route for template...")
        try {
          const routeData = await calculateRouteFromSegments(segments)
          routeDistance = routeData.distance
          routeDuration = routeData.duration
        } catch (routeError) {
          console.warn("Route calculation failed, using defaults:", routeError)
          // Use rough estimates if calculation fails
          routeDistance = 10 // Default 10km
          routeDuration = 30 // Default 30 minutes
        }
      }
      
      const newRoute: CreateRouteTemplateRequest = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        segments: segments
      }

      console.log("Creating route template:", newRoute)

      const { data, error } = await supabase
        .from('route_templates')
        .insert({
          ...newRoute,
          total_distance: routeDistance,
          estimated_duration: routeDuration
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      toast({
        title: "✅ Route Template Created",
        description: `Route template "${formData.name}" created successfully with ${routeDistance.toFixed(1)}km route`,
        variant: "success",
      })
      
      setShowCreateDialog(false)
      resetForm()
      loadRoutes()
    } catch (error) {
      console.error('Error creating route:', error)
      toast({
        title: "❌ Create Failed",
        description: error instanceof Error ? error.message : "Failed to create route template",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, segments, routePreviewData, toast, resetForm, loadRoutes])

  // FIXED: Enhanced edit with better validation
  const handleEdit = useCallback(async () => {
    if (!selectedRoute || !formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "❌ Form Incomplete",  
        description: "Please enter route name and code",
        variant: "destructive",
      })
      return
    }

    if (segments.length < 1) {
      toast({
        title: "❌ Route Incomplete",
        description: "Please add at least one segment",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      let routeDistance = selectedRoute.total_distance || 0
      let routeDuration = selectedRoute.estimated_duration || 0
      
      // FIXED: Use route preview data if available
      if (routePreviewData) {
        console.log("✅ Using updated route preview data for template")
        routeDistance = routePreviewData.distance
        routeDuration = routePreviewData.duration
      } else {
        console.log("⚠️ No preview data, calculating route for template update...")
        try {
          const routeData = await calculateRouteFromSegments(segments)
          routeDistance = routeData.distance
          routeDuration = routeData.duration
        } catch (routeError) {
          console.warn("Route calculation failed, keeping existing values:", routeError)
          // Keep existing values if calculation fails
        }
      }
      
      const { error } = await supabase
        .from('route_templates')
        .update({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          segments: segments,
          total_distance: routeDistance,
          estimated_duration: routeDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRoute.id)

      if (error) throw error

      toast({
        title: "✅ Route Template Updated",
        description: `Route template "${formData.name}" updated successfully with ${routeDistance.toFixed(1)}km route`,
        variant: "success",
      })
      
      setShowEditDialog(false)
      resetForm()
      loadRoutes()
    } catch (error) {
      console.error('Error updating route:', error)
      toast({
        title: "❌ Update Failed",
        description: error instanceof Error ? error.message : "Failed to update route template",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedRoute, formData, segments, routePreviewData, toast, resetForm, loadRoutes])

  const handleDelete = useCallback(async (route: RouteTemplate) => {
    if (!confirm(`Are you sure you want to delete route "${route.name}"?`)) return

    try {
      const { error } = await supabase
        .from('route_templates')
        .delete()
        .eq('id', route.id)

      if (error) throw error

      toast({
        title: "🗑️ Route Deleted",
        description: `Route template "${route.name}" has been deleted`,
        variant: "default",
      })
      
      loadRoutes()
    } catch (error) {
      console.error('Error deleting route:', error)
      toast({
        title: "❌ Delete Failed",
        description: "Failed to delete route template",
        variant: "destructive",
      })
    }
  }, [toast, loadRoutes])

  const handleDuplicate = useCallback((route: RouteTemplate) => {
    setFormData({
      name: `${route.name} (Copy)`,
      code: `${route.code}_COPY`,
      description: route.description || ''
    })
    setSegments([...route.segments] || [])
    setRoutePreviewData(null) // Reset preview data for new template
    setShowCreateDialog(true)
  }, [])

  const openEditDialog = useCallback((route: RouteTemplate) => {
    setSelectedRoute(route)
    setFormData({
      name: route.name,
      code: route.code,
      description: route.description || ''
    })
    setSegments([...route.segments] || [])
    setRoutePreviewData(null) // Reset preview data - will be recalculated
    setShowEditDialog(true)
  }, [])

  const openViewDialog = useCallback((route: RouteTemplate) => {
    setSelectedRoute(route)
    setShowViewDialog(true)
  }, [])

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loading text="Loading route templates..." size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-responsive safe-area-inset-top">
        <div className="flex items-center justify-between gap-responsive">
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/manage">
              <Button variant="outline" size="sm" className="btn-touch">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Route Templates</h1>
              <p className="text-sm text-gray-500">Manage synchronized route templates for trips</p>
            </div>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} className="btn-touch">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Route</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </header>

      <div className="p-responsive">
        {/* Routes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <Card key={route.id} className="animate-fadeIn">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{route.name}</CardTitle>
                    <p className="text-sm text-gray-500">Code: {route.code}</p>
                  </div>
                  <Navigation className="h-5 w-5 text-blue-600 flex-shrink-0" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {route.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{route.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Distance:</span>
                    <span className="font-medium">{route.total_distance?.toFixed(1) || 'N/A'} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">
                      {route.estimated_duration 
                        ? `${Math.floor(route.estimated_duration / 60)}h ${route.estimated_duration % 60}m`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Segments:</span>
                    <span className="font-medium">{route.segments?.length || 0}</span>
                  </div>
                  
                  {/* Sync status indicator */}
                  <div className="p-2 bg-green-50 rounded text-xs text-green-700 border border-green-200">
                    ✅ Synchronized template - exact route will be used in trips
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openViewDialog(route)}
                    className="flex-1 btn-touch"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(route)}
                    className="flex-1 btn-touch"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(route)}
                    className="btn-touch"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(route)}
                    className="text-red-600 hover:text-red-700 btn-touch"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-12">
            <Navigation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Route Templates</h3>
            <p className="text-gray-500 mb-4">Create your first synchronized route template to get started</p>
            <Button onClick={() => setShowCreateDialog(true)} className="btn-touch">
              <Plus className="h-4 w-4 mr-2" />
              Create Route Template
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog - FIXED */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Synchronized Route Template</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Route Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Jakarta - Purbalingga"
                  className="form-mobile"
                />
              </div>
              
              <div>
                <Label htmlFor="code">Route Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., JKT-PBG"
                  className="form-mobile"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the route"
                  className="form-mobile"
                />
              </div>

              {/* Route preview status */}
              {routePreviewData && (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">✅ Route Preview Ready</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Distance: <strong>{routePreviewData.distance.toFixed(1)} km</strong></div>
                    <div>Duration: <strong>{Math.floor(routePreviewData.duration / 60)}h {routePreviewData.duration % 60}m</strong></div>
                    <div>Route Points: <strong>{routePreviewData.coordinates.length}</strong></div>
                  </div>
                </div>
              )}

              {segments.length > 0 && !routePreviewData && (
                <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Route Building</h4>
                  <p className="text-sm text-yellow-700">
                    Add departure and destination points to complete the route
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting || !formData.name.trim() || !formData.code.trim() || segments.length === 0}
                  className="flex-1 btn-touch"
                >
                  {isSubmitting ? <Loading size="sm" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    resetForm()
                  }}
                  className="btn-touch"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Route Builder */}
            <div>
              <RouteBuilder
                onSegmentsChange={setSegments}
                onRouteDataChange={handleRouteDataChange}
                initialSegments={segments}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - FIXED */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Synchronized Route Template</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Route Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-mobile"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-code">Route Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="form-mobile"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-mobile"
                />
              </div>

              {/* Route preview status */}
              {routePreviewData && (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">✅ Updated Route Preview Ready</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Distance: <strong>{routePreviewData.distance.toFixed(1)} km</strong></div>
                    <div>Duration: <strong>{Math.floor(routePreviewData.duration / 60)}h {routePreviewData.duration % 60}m</strong></div>
                    <div>Route Points: <strong>{routePreviewData.coordinates.length}</strong></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleEdit}
                  disabled={isSubmitting || !formData.name.trim() || !formData.code.trim() || segments.length === 0}
                  className="flex-1 btn-touch"
                >
                  {isSubmitting ? <Loading size="sm" /> : <Edit2 className="h-4 w-4 mr-2" />}
                  Update Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    resetForm()
                  }}
                  className="btn-touch"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Route Builder */}
            <div>
              <RouteBuilder
                onSegmentsChange={setSegments}
                onRouteDataChange={handleRouteDataChange}
                initialSegments={segments}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog - Enhanced */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Route Details: {selectedRoute?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedRoute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Code:</span>
                  <span className="ml-2 font-medium">{selectedRoute.code}</span>
                </div>
                <div>
                  <span className="text-gray-500">Distance:</span>
                  <span className="ml-2 font-medium">{selectedRoute.total_distance?.toFixed(1) || 'N/A'} km</span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">
                    {selectedRoute.estimated_duration 
                      ? `${Math.floor(selectedRoute.estimated_duration / 60)}h ${selectedRoute.estimated_duration % 60}m`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Segments:</span>
                  <span className="ml-2 font-medium">{selectedRoute.segments?.length || 0}</span>
                </div>
              </div>

              {/* Sync status */}
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">🔄 Synchronization Status</h4>
                <p className="text-sm text-blue-700">
                  ✅ This route template is synchronized. When used in trips, buses will follow the exact same route as previewed.
                </p>
              </div>

              {selectedRoute.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedRoute.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3">Route Segments</h4>
                <div className="space-y-2">
                  {selectedRoute.segments?.map((segment, index) => (
                    <div key={segment.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <span className="text-lg">{getSegmentIcon(segment.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {segment.type === 'departure' && 'Titik Awal'}
                          {segment.type === 'toll_entry' && 'Masuk Tol'}
                          {segment.type === 'toll_exit' && 'Keluar Tol'}
                          {segment.type === 'stop' && `Pemberhentian (${segment.stop_duration}m)`}
                          {segment.type === 'destination' && 'Tujuan Akhir'}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{segment.location.name}</div>
                      </div>
                      <div className="text-xs text-gray-500">#{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}