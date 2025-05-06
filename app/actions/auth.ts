// "use server"

// import { cookies } from "next/headers"
// import { redirect } from "next/navigation"
// import { createServerClient } from "@/lib/supabase/server"
// import * as bcrypt from "bcryptjs"

// export async function loginStudent(prevState: any, formData: FormData) {
//   const matricNumber = formData.get("matricNumber") as string
//   const password = formData.get("password") as string

//   if (!matricNumber || !password) {
//     return { error: "Matric number and password are required" }
//   }

//   try {
//     const supabase = createServerClient()

//     // Get user by matric number
//     const { data: user, error: userError } = await supabase
//       .from("users")
//       .select("*")
//       .eq("matric_number", matricNumber)
//       .single()

//     if (userError || !user) {
//       return { error: "Invalid credentials" }
//     }

//     // Verify password
//     const passwordMatch = await bcrypt.compare(password, user.password_hash)

//     if (!passwordMatch) {
//       return { error: "Invalid credentials" }
//     }

//     // Create session (in a real app, you'd use Supabase Auth)
//     cookies().set("user_id", user.id, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 60 * 60 * 24 * 7, // 1 week
//       path: "/",
//     })

//     return { success: true, user: { id: user.id, name: user.name, matricNumber: user.matric_number } }
//   } catch (error) {
//     console.error("Login error:", error)
//     return { error: "An error occurred during login" }
//   }
// }

// export async function loginAdmin(prevState: any, formData: FormData) {
//   const username = formData.get("username") as string
//   const password = formData.get("password") as string

//   if (!username || !password) {
//     return { error: "Username and password are required" }
//   }

//   try {
//     const supabase = createServerClient()

//     // Get admin by username
//     const { data: admin, error: adminError } = await supabase
//       .from("admins")
//       .select("*")
//       .eq("username", username)
//       .single()

//     if (adminError || !admin) {
//       return { error: "Invalid credentials" }
//     }

//     // Verify password
//     const passwordMatch = await bcrypt.compare(password, admin.password_hash)

//     if (!passwordMatch) {
//       return { error: "Invalid credentials" }
//     }

//     // Create session
//     cookies().set("admin_id", admin.id, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 60 * 60 * 24 * 7, // 1 week
//       path: "/",
//     })

//     return { success: true, admin: { id: admin.id, name: admin.name, role: admin.role } }
//   } catch (error) {
//     console.error("Login error:", error)
//     return { error: "An error occurred during login" }
//   }
// }

// export async function logout(isAdmin = false) {
//   if (isAdmin) {
//     cookies().delete("admin_id")
//   } else {
//     cookies().delete("user_id")
//   }

//   redirect(isAdmin ? "/admin/login" : "/login")
// }

// export async function registerStudent(prevState: any, formData: FormData) {
//   const matricNumber = formData.get("matricNumber") as string
//   const name = formData.get("name") as string
//   const email = formData.get("email") as string
//   const password = formData.get("password") as string
//   const department = formData.get("department") as string
//   const level = formData.get("level") as string

//   if (!matricNumber || !name || !password) {
//     return { error: "Matric number, name, and password are required" }
//   }

//   try {
//     const supabase = createServerClient()

//     // Check if user already exists
//     const { data: existingUser } = await supabase.from("users").select("id").eq("matric_number", matricNumber).single()

//     if (existingUser) {
//       return { error: "A user with this matric number already exists" }
//     }

//     // Hash password
//     const passwordHash = await bcrypt.hash(password, 10)

//     // Create user
//     const { data: newUser, error: createError } = await supabase
//       .from("users")
//       .insert({
//         matric_number: matricNumber,
//         name,
//         email,
//         password_hash: passwordHash,
//         department,
//         level,
//       })
//       .select()
//       .single()

//     if (createError) {
//       return { error: "Failed to create user" }
//     }

//     return { success: true, user: newUser }
//   } catch (error) {
//     console.error("Registration error:", error)
//     return { error: "An error occurred during registration" }
//   }
// }


"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import * as bcrypt from "bcryptjs"

export async function loginStudent(prevState: any, formData: FormData) {
  const matricNumber = formData.get("matricNumber") as string
  const password = formData.get("password") as string

  if (!matricNumber || !password) {
    return { error: "Matric number and password are required" }
  }

  try {
    const supabase = createServerClient()

    // Get user by matric number
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("matric_number", matricNumber)
      .single()

    if (userError || !user) {
      return { error: "Invalid credentials" }
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return { error: "Invalid credentials" }
    }

    // Create Supabase Auth session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email || `${matricNumber}@student.edu`, // Fallback email if not provided
      password: password,
    })

    if (authError) {
      // If the user exists in our users table but not in auth, create an auth account
      if (authError.message.includes("Invalid login credentials")) {
        // Create auth user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: user.email || `${matricNumber}@student.edu`,
          password: password,
          options: {
            data: {
              matric_number: matricNumber,
              name: user.name,
            },
          },
        })

        if (signUpError) {
          console.error("Auth signup error:", signUpError)
          return { error: "Failed to create authentication session" }
        }
        
        // Update the user record with the new auth ID
        if (signUpData?.user) {
          await supabase
            .from("users")
            .update({ auth_id: signUpData.user.id })
            .eq("id", user.id)
        }
      } else {
        console.error("Auth error:", authError)
        return { error: "Authentication failed" }
      }
    }

    // As a fallback, also set the cookies for custom auth
    cookies().set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, user: { id: user.id, name: user.name, matricNumber: user.matric_number } }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An error occurred during login" }
  }
}

export async function loginAdmin(prevState: any, formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { error: "Username and password are required" }
  }

  try {
    const supabase = createServerClient()

    // Get admin by username
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("username", username)
      .single()

    if (adminError || !admin) {
      return { error: "Invalid credentials" }
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password_hash)

    if (!passwordMatch) {
      return { error: "Invalid credentials" }
    }

    // Create Supabase Auth session for admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: admin.email || `${username}@admin.edu`, // Fallback email if not provided
      password: password,
    })

    if (authError) {
      // If the admin exists in our admins table but not in auth, create an auth account
      if (authError.message.includes("Invalid login credentials")) {
        // Create auth user for admin
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: admin.email || `${username}@admin.edu`,
          password: password,
          options: {
            data: {
              username: username,
              name: admin.name,
              role: admin.role,
            },
          },
        })

        if (signUpError) {
          console.error("Admin auth signup error:", signUpError)
          return { error: "Failed to create authentication session" }
        }
        
        // Update the admin record with the new auth ID
        if (signUpData?.user) {
          await supabase
            .from("admins")
            .update({ auth_id: signUpData.user.id })
            .eq("id", admin.id)
        }
      } else {
        console.error("Admin auth error:", authError)
        return { error: "Authentication failed" }
      }
    }

    // As a fallback, also set the cookies for custom auth
    cookies().set("admin_id", admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true, admin: { id: admin.id, name: admin.name, role: admin.role } }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An error occurred during login" }
  }
}

export async function logout(isAdmin = false) {
  const supabase = createServerClient()
  
  // Sign out from Supabase Auth
  await supabase.auth.signOut()
  
  // Also clear cookies
  if (isAdmin) {
    cookies().delete("admin_id")
  } else {
    cookies().delete("user_id")
  }

  redirect(isAdmin ? "/admin/login" : "/login")
}

export async function registerStudent(prevState: any, formData: FormData) {
  const matricNumber = formData.get("matricNumber") as string
  const name = formData.get("name") as string
  const email = formData.get("email") as string || `${matricNumber}@student.edu`
  const password = formData.get("password") as string
  const department = formData.get("department") as string
  const level = formData.get("level") as string

  if (!matricNumber || !name || !password) {
    return { error: "Matric number, name, and password are required" }
  }

  try {
    const supabase = createServerClient()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("matric_number", matricNumber).single()

    if (existingUser) {
      return { error: "A user with this matric number already exists" }
    }

    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          matric_number: matricNumber,
          name,
          department,
          level,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { error: "Failed to create account" }
    }

    // Hash password for our custom users table
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user in our custom table
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        matric_number: matricNumber,
        name,
        email,
        password_hash: passwordHash,
        department,
        level,
        auth_id: authData.user?.id, // Store the auth user ID reference
      })
      .select()
      .single()

    if (createError) {
      return { error: "Failed to create user" }
    }

    return { success: true, user: newUser }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "An error occurred during registration" }
  }
}