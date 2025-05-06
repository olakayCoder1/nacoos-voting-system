import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define protected routes
  const isAdminRoute = path.startsWith("/admin") && !path.startsWith("/admin/login")
  const isStudentRoute = path.startsWith("/dashboard") || path.startsWith("/profile") || path.startsWith("/results")

  // Get authentication cookies
  const adminId = request.cookies.get("admin_id")?.value
  const userId = request.cookies.get("user_id")?.value

  // Check admin routes
  if (isAdminRoute && !adminId) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // Check student routes
  if (isStudentRoute && !userId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/dashboard", "/profile", "/results"],
}
