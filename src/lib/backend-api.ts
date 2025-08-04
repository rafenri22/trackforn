"use client"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

export const backendApi = {
  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`)
      return await response.json()
    } catch (error) {
      console.error("Backend health check failed:", error)
      return null
    }
  },

  // Start trip tracking
  async startTrip(tripId: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/trips/${tripId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to start trip:", error)
      throw error
    }
  },

  // Cancel trip tracking
  async cancelTrip(tripId: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/trips/${tripId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to cancel trip:", error)
      throw error
    }
  },

  // Get active trips
  async getActiveTrips() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/trips/active`)
      return await response.json()
    } catch (error) {
      console.error("Failed to get active trips:", error)
      return []
    }
  },
}
