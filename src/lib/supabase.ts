import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Storage helpers
export const uploadBusPhoto = async (file: File, busId: string) => {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${busId}.${fileExt}`
    console.log("Uploading file:", fileName, "Size:", file.size)

    const { data, error } = await supabase.storage.from("bus-photos").upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    })

    if (error) {
      console.error("Upload error:", error)
      throw error
    }

    console.log("Upload successful:", data)
    const {
      data: { publicUrl },
    } = supabase.storage.from("bus-photos").getPublicUrl(fileName)

    console.log("Public URL:", publicUrl)
    return publicUrl
  } catch (uploadError) {
    console.error("Error in uploadBusPhoto:", uploadError)
    throw uploadError
  }
}

export const deleteBusPhoto = async (busId: string) => {
  try {
    // Try to delete common image formats
    const extensions = ["jpg", "jpeg", "png", "webp", "gif"]
    for (const ext of extensions) {
      const fileName = `${busId}.${ext}`
      const { error } = await supabase.storage.from("bus-photos").remove([fileName])
      if (!error) {
        console.log("Deleted photo:", fileName)
      }
    }
  } catch (deleteError) {
    console.error("Error deleting bus photo:", deleteError)
    // Don't throw error as this is not critical
  }
}

// Test Supabase connection
export const testConnection = async () => {
  try {
    const { error } = await supabase.from("buses").select("count").limit(1)
    if (error) {
      console.error("Connection test failed:", error)
      return false
    }
    console.log("Supabase connection successful")
    return true
  } catch (connectionError) {
    console.error("Connection test error:", connectionError)
    return false
  }
}
