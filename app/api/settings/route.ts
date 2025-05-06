import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get all settings
    const { data: settings, error } = await supabase.from("settings").select("key, value")

    if (error) {
      throw error
    }

    // Convert to object with key as property name
    const settingsObject = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, any>,
    )

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
