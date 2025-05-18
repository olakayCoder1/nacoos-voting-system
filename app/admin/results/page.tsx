"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BarChart3, BarChart, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExportResultsButton } from "@/components/export-results-button"
import { useRealTimeVotes } from "@/hooks/use-real-time-votes"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminResults() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState("overview")
  
  // Use the enhanced real-time votes hook
  const { results, stats, isLoading, error } = useRealTimeVotes(15000) 

  const handleLogout = () => {
    router.push("/admin/login")
  }

  // Handle error state
  if (error) {
    return (
      <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-red-500 mb-4">Error loading election data</div>
            <button 
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Handle loading state
  if (isLoading) {
    return (
      <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Handle no results (empty array)
  if (!results || results.length === 0) {
    return (
      <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex flex-col items-center justify-center py-20">
            <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Election Data Available</h2>
            <p className="text-muted-foreground">There are no active categories or candidates in the system.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Function to render the appropriate content based on selected category
  const renderContent = () => {
    if (activeCategory === "overview") {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voting Progress</CardTitle>
              <CardDescription>Overall voting participation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Participation</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalVoted} out of {stats.totalVoters} voters
                    </p>
                  </div>
                  <div className="text-sm font-medium">{stats.participationRate}%</div>
                </div>
                <Progress value={stats.participationRate || 0} className="h-2" /> 
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {results.slice(0, 2).map((result) => {
              const totalVotes = result.totalVotes

              return (
                <Card key={result.category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{result.category.name}</CardTitle>
                      <Badge variant={result.category.is_active ? "default" : "outline"}>
                        {result.category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {result.candidates.length} candidates, {totalVotes} votes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.candidates
                        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                        .map((candidate) => {
                          const percentage = totalVotes ? Math.round((candidate.votes / totalVotes) * 100) : 0

                          return (
                            <div key={candidate.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{candidate.name}</div>
                                </div>
                                <div className="text-sm">{percentage}%</div>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )
    } else {
      // Find the selected category
      const selectedResult = results.find(result => result.category.id === activeCategory)
      
      if (!selectedResult) return null
      
      const totalVotes = selectedResult.totalVotes

      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{selectedResult.category.name} Results</CardTitle>
              <CardDescription>Total votes: {totalVotes}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedResult.candidates
                  .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                  .map((candidate, index) => {
                    const percentage = totalVotes ? Math.round((candidate.votes / totalVotes) * 100) : 0

                    return (
                      <div key={candidate.id} className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            {index === 0 && <span className="text-lg font-bold">🏆</span>}
                            {index !== 0 && <span className="font-medium">{index + 1}</span>}
                          </div>
                          <div className="flex flex-1 items-center gap-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={candidate.image_url || "/placeholder.svg"} alt={candidate.name} />
                              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{candidate.name}</p>
                              <p className="text-sm text-muted-foreground">{candidate.votes} votes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{percentage}%</p>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution</CardTitle>
              <CardDescription>Visual representation of votes</CardDescription>
            </CardHeader>
            <CardContent className="flex h-80 items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-16 w-16" />
                <p>Chart visualization would appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return (
    <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Election Results</h1>
            <p className="text-muted-foreground">View and analyze the voting results</p>
          </div>
          <ExportResultsButton />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVoters}</div>
              <p className="text-xs text-muted-foreground">Registered in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVoted}</div>
              <p className="text-xs text-muted-foreground">{stats.participationRate}% participation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Categories</CardTitle> 
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.filter((r) => r.category.is_active).length}</div>
              <p className="text-xs text-muted-foreground">Out of {results.length} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.reduce((sum, result) => sum + result.candidates.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="font-medium">Category:</div>
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-full md:w-[260px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                {results.map((result) => (
                  <SelectItem key={result.category.id} value={result.category.id}>
                    {result.category.name} {!result.category.is_active && "(Inactive)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {renderContent()}
      </div>
    </DashboardLayout>
  )
}