"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BarChart3 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExportResultsButton } from "@/components/export-results-button"
import { getVotingResults } from "@/app/actions/admin"
import { useRealTimeVotes } from "@/hooks/use-real-time-votes"
import { useToast } from "@/hooks/use-toast"

export default function AdminResults() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [results, setResults] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalVoters: 0,
    totalVoted: 0,
    participationRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Use real-time votes hook for live updates
  const { votes } = useRealTimeVotes()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true)

        const response = await getVotingResults()

        if (response.error) {
          throw new Error(response.error)
        }

        setResults(response.results || [])
        setStats(
          response.stats || {
            totalVoters: 0,
            totalVoted: 0,
            participationRate: 0,
          },
        )

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching results:", error)
        toast({
          title: "Error",
          description: "Failed to load voting results",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [toast])

  const handleLogout = () => {
    router.push("/admin/login")
  }

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {results.map((result) => (
              <TabsTrigger key={result.category.id} value={result.category.id}>
                {result.category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                  <Progress value={stats.participationRate} className="h-2" />
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
                          .sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0))
                          .map((candidate: any) => {
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
          </TabsContent>

          {results.map((result) => {
            const totalVotes = result.totalVotes

            return (
              <TabsContent key={result.category.id} value={result.category.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{result.category.name} Results</CardTitle>
                    <CardDescription>Total votes: {totalVotes}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {result.candidates
                        .sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0))
                        .map((candidate: any, index: number) => {
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
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
