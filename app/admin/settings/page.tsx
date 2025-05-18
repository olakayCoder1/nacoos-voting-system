"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { updateSettings } from "@/app/actions/admin"
import { useToast } from "@/hooks/use-toast"


export default function AdminSettings() {
  const router = useRouter()
  const { toast } = useToast()

  const [votingActive, setVotingActive] = useState(false)
  const [votingMessage, setVotingMessage] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [resultsMessage, setResultsMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Fetch current settings
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        const data = await response.json()
        console.log(data)
        if (data.voting_active) {
          setVotingActive(data.voting_active.status)
          setVotingMessage(data.voting_active.message)
        }

        if (data.show_results) {
          setShowResults(data.show_results.status)
          setResultsMessage(data.show_results.message)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)

      // Update voting active settings
      const votingResult = await updateSettings("voting_active", {
        status: votingActive,
        message: votingMessage || (votingActive ? "Voting is currently active" : "Voting is currently inactive"),
      })

      if (votingResult.error) {
        throw new Error(votingResult.error)
      }

      // Update show results settings
      const resultsResult = await updateSettings("show_results", {
        status: showResults,
        message: resultsMessage || (showResults ? "Results are now public" : "Results are not yet public"),
      })

      console.log(resultsResult)

      if (resultsResult.error) {
        throw new Error(resultsResult.error)
      }

      toast({
        title: "Success",
        description: "Settings updated successfully",
      })

      setIsSaving(false)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    router.push("/admin/login")
  }

  return (
    <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure voting system settings</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Voting Status</CardTitle>
                <CardDescription>Enable or disable voting across the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch id="voting-active" checked={votingActive} onCheckedChange={setVotingActive} />
                  <Label htmlFor="voting-active">Voting is {votingActive ? "active" : "inactive"}</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voting-message">Status Message</Label>
                  <Textarea
                    id="voting-message"
                    placeholder="Enter a message to display to users"
                    value={votingMessage}
                    onChange={(e) => setVotingMessage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be displayed to users when they attempt to vote
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results Visibility</CardTitle>
                <CardDescription>Control whether users can see voting results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch id="show-results" checked={showResults} onCheckedChange={setShowResults} />
                  <Label htmlFor="show-results">Results are {showResults ? "public" : "hidden"}</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="results-message">Status Message</Label>
                  <Textarea
                    id="results-message"
                    placeholder="Enter a message to display to users"
                    value={resultsMessage}
                    onChange={(e) => setResultsMessage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be displayed to users when they attempt to view results
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
