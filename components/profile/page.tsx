"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

export default function Profile() {
  const router = useRouter()
  const { toast } = useToast()

  // Mock user data
  const [user, setUser] = useState({
    name: "John Student",
    matricNumber: "20/52HA085",
    email: "john.student@example.com",
    department: "Computer Science",
    level: "300 Level",
    hasVoted: true,
    votedCategories: ["President", "Vice President", "Secretary", "Treasurer"],
  })

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleUpdatePassword = () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    // In a real app, you would make an API call to update the password
    toast({
      title: "Success",
      description: "Your password has been updated successfully",
    })

    setPassword("")
    setConfirmPassword("")
  }

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <DashboardLayout user={{ name: user.name, matricNumber: user.matricNumber }} onLogout={handleLogout}>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your personal and academic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{user.name}</h3>
                  <p className="text-muted-foreground">{user.matricNumber}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p>{user.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Level</p>
                  <p>{user.level}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Voting Status</p>
                  <Badge variant={user.hasVoted ? "default" : "outline"}>{user.hasVoted ? "Voted" : "Not Voted"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdatePassword}>Update Password</Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Voting History</CardTitle>
              <CardDescription>Categories you have voted in</CardDescription>
            </CardHeader>
            <CardContent>
              {user.hasVoted ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {user.votedCategories.map((category) => (
                    <div key={category} className="rounded-lg border p-4">
                      <p className="font-medium">{category}</p>
                      <p className="text-sm text-muted-foreground">Voted</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">You have not voted in any categories yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
