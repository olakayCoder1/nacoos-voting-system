
"use client"
import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { loginStudent } from "@/app/actions/auth"

// Matric number validation schema
const matricSchema = z.string().regex(/^\d{2}\/\d{2}HA\d{3}$/, {
  message: "Invalid matric number format. Example: 20/52HA085",
})

export default function Login() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState("")
  
  // Client-side validation
  const validateMatricNumber = (matricNumber: unknown) => {
    try {
      matricSchema.parse(matricNumber)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message)
      }
      return false
    }
  }

  // Form submit handler with validation
  const handleSubmit = (event: { preventDefault: () => void; target: any }) => {
    event.preventDefault()
    setValidationError("")
    setError(null)
    
    // Get form values directly
    const form = event.target
    const matricNumber = form.matricNumber.value
    const password = form.password.value
    
    // Validate matric number
    if (!validateMatricNumber(matricNumber)) {
      return
    }
    
    // Create FormData manually to ensure it's populated
    const formData = new FormData()
    formData.append("matricNumber", matricNumber)
    formData.append("password", password)
    
    console.log("Form data before submission:", {
      matricNumber,
      password: password ? "[PROVIDED]" : "[EMPTY]"
    })
    
    // Use startTransition to wrap the server action
    startTransition(async () => {
      try {
        const result = await loginStudent({},formData)
        
        if (result?.error) {
          setError(result.error)
        } else if (result?.success && result?.user) {
          router.push("/dashboard")
        } else {
          // Handle unexpected response format
          setError("Invalid response from server. Please try again.")
          // console.error("Unexpected response format:", result)
        }
      } catch (err) {
        // console.error("Login error:", err)
        setError("An unexpected error occurred. Please try again.")
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Student Login</CardTitle>
            <CardDescription>Enter your matric number and password to vote</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || validationError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError || error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="matricNumber">Matric Number</Label>
                <Input id="matricNumber" name="matricNumber" placeholder="e.g., 20/52HA085" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="hover:text-primary underline underline-offset-4">
                Register here
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link href="/forgot-password" className="hover:text-primary underline underline-offset-4">
                Forgot password?
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link href="/admin/login" className="hover:text-primary underline underline-offset-4">
                Admin Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}