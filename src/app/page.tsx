"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { initializeRealtime, realtimeStore } from "@/lib/realtime"
import type { Bus, Trip, BusLocation } from "@/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"
import { useToast } from "@/hooks/use-toast"
import { Map, Clock, MapPin, Users, Wifi, WifiOff, RefreshCw, Home, Maximize2, Activity } from "lucide-react"
import { GlobalTracker } from "@/components/tracking/GlobalTracker"

const BusMap = dynamic(() => import("@/components/map/BusMap"), {
  ssr: false,
  loading: () => <Loading text="Loading real-time map..." />,
})

export default function HomePage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [busLocations, setBusLocations] = useState<BusLocation[]>([])
  const [selectedBus, setSelectedBus] = useState<{ bus: Bus; trip?: Trip } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const { toast } = useToast()

  // Real-time data synchronization dengan optimasi performa
  const syncRealTimeData = useCallback(() => {
    const currentBuses = realtimeStore.getBuses()
    const currentTrips = realtimeStore.getTrips()
    const currentLocations = realtimeStore.getBusLocations()
    
    setBuses(prev => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(currentBuses)
      return hasChanged ? [...currentBuses] : prev
    })
    
    setTrips(prev => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(currentTrips)
      return hasChanged ? [...currentTrips] : prev
    })
    
    setBusLocations(prev => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(currentLocations)
      return hasChanged ? [...currentLocations] : prev
    })
    
    setLastUpdate(new Date().toLocaleTimeString())
    setIsOnline(true)
  }, [])

  // Inisialisasi sistem real-time dengan performa enhanced
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const initialize = async () => {
      try {
        setError(null)
        console.log("🚀 Menginisialisasi sistem real-time enhanced...")

        cleanup = await initializeRealtime()

        let updateTimeout: NodeJS.Timeout
        const unsubscribe = realtimeStore.subscribe(() => {
          clearTimeout(updateTimeout)
          updateTimeout = setTimeout(() => {
            console.log("📡 Data real-time terupdate, sinkronisasi UI...")
            syncRealTimeData()
          }, 25)
        })

        syncRealTimeData()
        setIsOnline(true)
        setLoading(false)

        toast({
          title: "🚌 Sistem Real-time Aktif",
          description: "Live bus tracking diaktifkan dengan update otomatis setiap 5 detik",
          variant: "success",
        })

        return () => {
          unsubscribe()
          if (cleanup) cleanup()
          clearTimeout(updateTimeout)
        }
      } catch (error) {
        console.error("❌ Error menginisialisasi sistem real-time:", error)
        setError(error instanceof Error ? error.message : "Gagal menginisialisasi sistem real-time")
        setIsOnline(false)
        setLoading(false)

        toast({
          title: "❌ Error Koneksi Real-time",
          description: "Beberapa fitur mungkin tidak berfungsi dengan baik",
          variant: "destructive",
        })
      }
    }

    initialize()

    return () => {
      if (cleanup) cleanup()
    }
  }, [toast, syncRealTimeData])

  // Enhanced real-time updates setiap 1 detik
  useEffect(() => {
    const interval = setInterval(() => {
      syncRealTimeData()
    }, 1000)
    
    return () => clearInterval(interval)
  }, [syncRealTimeData])

  // Update timestamp setiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date().toLocaleTimeString())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Handle bus click
  const handleBusClick = useCallback((bus: Bus, trip?: Trip) => {
    setSelectedBus({ bus, trip })
    setShowRoute(false)
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      console.log("🔄 Melakukan refresh data posisi bus...")
      await initializeRealtime()
      syncRealTimeData()
      toast({
        title: "🔄 Posisi Bus Diperbarui",
        description: "Data real-time berhasil disinkronisasi",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "❌ Gagal Refresh",
        description: "Tidak dapat memperbarui data real-time",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [syncRealTimeData, toast])

  const handleBackToHome = useCallback(() => {
    window.location.href = "https://trijayaagunglestari.web.id"
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(console.error)
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(console.error)
    }
  }, [])

  // Enhanced statistics
  const activeTrips = trips.filter((trip) => trip.status === "IN_PROGRESS")
  const activeBuses = buses.filter((bus) => bus.is_active)
  const busesAtDestination = buses.filter(bus => {
    const hasLocation = busLocations.some(loc => loc.bus_id === bus.id && loc.progress >= 100)
    return !bus.is_active && hasLocation
  })
  const busesInGarage = buses.filter(bus => {
    const hasLocation = busLocations.some(loc => loc.bus_id === bus.id)
    return !bus.is_active && !hasLocation
  })

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-fadeIn">
          <Loading text="Loading sistem tracking bus real-time..." size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md mx-auto p-6 animate-fadeIn">
          <div className="text-red-500 mb-4">
            <WifiOff className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Koneksi Real-time</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleRefresh} className="w-full btn-touch" disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Menghubungkan...' : 'Coba Lagi'}
            </Button>
            <p className="text-sm text-gray-500">Periksa koneksi internet dan coba lagi</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 safe-area-inset-top safe-area-inset-bottom">
      <GlobalTracker />

      <header className="bg-white shadow-sm border-b p-responsive z-10 no-select">
        <div className="flex items-center justify-between gap-responsive">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Map className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">TJA Real-time Tracking</h1>
              <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 md:gap-2">
                <span className="truncate">Live monitoring sistem</span>
                {isOnline ? (
                  <span className="flex items-center gap-1 text-green-600 flex-shrink-0">
                    <Wifi className="h-3 w-3" />
                    <Activity className="h-2 w-2 text-green-500 animate-pulse" />
                    <span className="hidden sm:inline">Live</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 flex-shrink-0">
                    <WifiOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Offline</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <div className="hidden sm:flex gap-2">
              <Card className="p-2 md:p-3 bg-white border border-gray-200">
                <div className="text-xs md:text-sm">
                  <span className="font-medium text-blue-600">{activeBuses.length}</span>
                  <span className="text-gray-600 ml-1 hidden md:inline">Active</span>
                </div>
              </Card>
              <Card className="p-2 md:p-3 bg-white border border-gray-200">
                <div className="text-xs md:text-sm">
                  <span className="font-medium text-green-600">{busesAtDestination.length}</span>
                  <span className="text-gray-600 ml-1 hidden md:inline">Dest</span>
                </div>
              </Card>
              <Card className="p-2 md:p-3 bg-white border border-gray-200">
                <div className="text-xs md:text-sm">
                  <span className="font-medium text-gray-600">{busesInGarage.length}</span>
                  <span className="text-gray-600 ml-1 hidden md:inline">Garage</span>
                </div>
              </Card>
            </div>

            <div className="sm:hidden">
              <Card className="p-2 bg-white border border-gray-200">
                <div className="text-xs whitespace-nowrap">
                  <span className="font-medium text-blue-600">{activeBuses.length}</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="font-medium text-green-600">{busesAtDestination.length}</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="font-medium text-gray-600">{busesInGarage.length}</span>
                </div>
              </Card>
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="btn-touch"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              className="btn-touch hidden md:flex"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBackToHome}
              className="btn-touch hidden md:flex items-center gap-2 bg-transparent"
            >
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline">Beranda</span>
            </Button>

            <Button size="sm" variant="outline" onClick={handleBackToHome} className="btn-touch md:hidden bg-transparent">
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="sm:hidden mt-2 flex justify-between text-xs text-gray-600">
          <span>Active: {activeBuses.length}</span>
          <span>At Dest: {busesAtDestination.length}</span>
          <span>In Garage: {busesInGarage.length}</span>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <BusMap
          buses={buses}
          trips={activeTrips}
          busLocations={busLocations}
          onBusClick={handleBusClick}
          showControls={true}
          autoFit={false}
        />

        {lastUpdate && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg text-xs text-gray-600 border animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
              <span className="hidden sm:inline">Last sync:</span>
              <span className="sm:hidden">Sync:</span>
              <span className="font-mono">{lastUpdate}</span>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs text-gray-600 border animate-fadeIn">
          <div className="flex items-center gap-2">
            <Activity className="w-2 h-2 text-green-500 animate-pulse" />
            <span className="hidden sm:inline">Real-time •</span>
            <span className="sm:hidden">Live •</span>
            <span className="font-medium">{activeTrips.length} active</span>
          </div>
        </div>

        {buses.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm p-4">
            <div className="text-center max-w-md mx-auto p-6 animate-fadeIn">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Bus Tersedia</h3>
              <p className="text-gray-500 mb-4 text-sm">Armada bus saat ini sedang tidak beroperasi</p>
              <p className="text-xs text-gray-400">Hubungi admin untuk menambahkan bus ke sistem</p>
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!selectedBus} onOpenChange={() => setSelectedBus(null)}>
        <DialogContent className="max-w-sm md:max-w-md mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Map className="h-5 w-5" />
              Detail Bus
            </DialogTitle>
          </DialogHeader>

          {selectedBus && (
            <div className="space-y-4">
              <div className="relative h-32 md:h-48 w-full rounded-lg overflow-hidden bg-gray-100">
                {selectedBus.bus.photo_url ? (
                  <img
                    src={selectedBus.bus.photo_url}
                    alt={selectedBus.bus.nickname}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "1"
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="h-full w-full flex items-center justify-center bg-gray-200">
                            <div class="text-center">
                              <div class="text-gray-400 text-2xl mb-2">📷</div>
                              <span class="text-gray-400 text-sm">Foto tidak tersedia</span>
                            </div>
                          </div>
                        `
                      }
                    }}
                    style={{ opacity: 0 }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200">
                    <div className="text-center">
                      <div className="text-gray-400 text-2xl mb-2">📷</div>
                      <span className="text-gray-400 text-sm">Tidak Ada Foto</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold truncate">{selectedBus.bus.nickname}</h3>
                  <p className="text-sm text-gray-500">Kode: {selectedBus.bus.code}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">Sopir: {selectedBus.bus.crew}</span>
                  </div>

                  {selectedBus.trip ? (
                    <>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="truncate">Dari: {selectedBus.trip.departure.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className="truncate">Ke: {selectedBus.trip.destination.name}</span>
                      </div>

                      {selectedBus.trip.stops.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="block">Pemberhentian:</span>
                            <span className="text-gray-600 text-xs break-words">
                              {selectedBus.trip.stops.map((stop) => stop.name).join(", ")}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedBus.trip.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                          <span>Status: Standby di Titik Awal ({selectedBus.trip.departure.name})</span>
                        </div>
                      )}

                      {selectedBus.trip.status === "IN_PROGRESS" ? (
                        <>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            <span>Status: Sedang dalam Perjalanan</span>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-blue-800">Progress Perjalanan</span>
                              <span className="text-sm font-bold text-blue-800">{selectedBus.trip.progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${selectedBus.trip.progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs text-blue-700">
                              <span>Kecepatan: {selectedBus.trip.speed} km/jam</span>
                              <span>🛣️ Rute Tol</span>
                            </div>
                          </div>
                        </>
                      ) : selectedBus.trip.status === "COMPLETED" ? (
                        <>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span>Status: Sudah Sampai di Titik Akhir ({selectedBus.trip.destination.name})</span>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">Perjalanan Selesai</span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">Bus sedang parkir di tujuan</p>
                          </div>
                        </>
                      ) : null}

                      {selectedBus.trip.distance && (
                        <div className="text-sm text-gray-600">
                          Jarak: {selectedBus.trip.distance.toFixed(1)} km
                        </div>
                      )}

                      {selectedBus.trip.estimated_duration && (
                        <div className="text-sm text-gray-600">
                          Durasi: {Math.floor(selectedBus.trip.estimated_duration / 60)}j{" "}
                          {selectedBus.trip.estimated_duration % 60}m
                        </div>
                      )}

                      {selectedBus.trip.route && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Rute Perjalanan</h4>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowRoute(!showRoute)}
                              className="btn-touch"
                            >
                              {showRoute ? "Sembunyikan Rute" : "Tampilkan Rute"}
                            </Button>
                          </div>
                          
                          {showRoute && selectedBus.trip?.route && (
                            <div className="h-48 border rounded-lg overflow-hidden relative">
                              <BusMap 
                                buses={[selectedBus.bus]} 
                                trips={selectedBus.trip ? [selectedBus.trip] : []} 
                                busLocations={[]}
                                showControls={false}
                              />
                            </div>
                          )}
                          
                          {selectedBus.trip.toll_route && selectedBus.trip.toll_route.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <span>🛣️ Gerbang Tol Dilalui:</span>
                                <span className="text-blue-600">{selectedBus.trip.toll_route.join(" → ")}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>Status: Tersedia di Garasi (Purbalingga)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}