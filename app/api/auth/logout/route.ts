import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createServerClient()
    
    // Sign out from Supabase Auth
    await supabase.auth.signOut()
    
    // Clear custom cookie
    ;(await
          // Clear custom cookie
          cookies()).delete("user_id")
    ;(await cookies()).delete("admin_id")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}