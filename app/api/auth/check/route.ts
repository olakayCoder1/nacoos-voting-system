// app/api/auth/check/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Try to get session from Supabase Auth
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // If we have a session, get the user data from our users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, matric_number")
        .eq("auth_id", session.user.id)
        .single()
      
      if (!userError && userData) {
        return NextResponse.json(userData)
      }
      
      // If we couldn't find user data with auth_id, return session user data
      return NextResponse.json({
        id: session.user.id,
        name: session.user.user_metadata.name || "Student",
        matric_number: session.user.user_metadata.matric_number || "",
      })
    }
    
    // If no Supabase session, check if we have a cookie
    const userId = (await cookies()).get("user_id")?.value
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Get user data from our custom users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, matric_number")
      .eq("id", userId)
      .single()
    
    if (userError || !user) {
      (await cookies()).delete("user_id") // Clear invalid cookie
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error("Auth check error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
