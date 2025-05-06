// lib/auth-helper.js or lib/auth-helper.ts
import { supabase } from "@/lib/supabase/client"

/**
 * Helper function to check session and get user data
 * @returns {Promise<{user: any, error: any}>} User data or error
 */
export async function getAuthenticatedUser() {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("Session error:", sessionError)
      return { user: null, error: "Session error" }
    }
    
    if (!sessionData.session) {
      return { user: null, error: "No active session" }
    }
    
    // Session exists, get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, matric_number")
      .eq("id", sessionData.session.user.id)
      .single()
      
    if (userError) {
      console.error("User data error:", userError)
      return { user: null, error: "Failed to fetch user data" }
    }
    
    if (!userData) {
      return { user: null, error: "User not found" }
    }
    
    // Transform to camelCase for consistency
    return { 
      user: {
        id: userData.id,
        name: userData.name,
        matricNumber: userData.matric_number
      }, 
      error: null 
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { user: null, error: "Authentication failed" }
  }
}

/**
 * Checks if the user is authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

/**
 * Refreshes the current session
 * @returns {Promise<{success: boolean, error: any}>} Success status and error if any
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    return { success: !!data.session, error }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{success: boolean, error: any}>} Success status and error if any
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}