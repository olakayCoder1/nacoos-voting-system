"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { loginAdmin } from "@/app/actions/auth"
import { useActionState } from "react"

const initialState = {
  error: null,
  success: false,
  admin: null,
}

export default function AdminLogin() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState)

  // Redirect if login was successful
  if (state.success && state.admin) {
    router.push("/admin/dashboard")
    return null
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
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="admin" required />
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
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-primary underline underline-offset-4">
                Student Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
