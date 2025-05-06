
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CandidateCard } from "@/components/candidate-card"
import { supabase } from "@/lib/supabase/client"
import { castVote, getVotingStatus } from "@/app/actions/voting"
import { useRealTimeVotes } from "@/hooks/use-real-time-votes"
import { useToast } from "@/hooks/use-toast"
import type { Category, Candidate } from "@/lib/types"

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({})
  const [votedCandidates, setVotedCandidates] = useState<Record<string, string>>({})
  const [votingActive, setVotingActive] = useState(true)
  const [votingMessage, setVotingMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; name: string; matricNumber: string } | null>(null)

  // Use real-time votes hook
  const { votes } = useRealTimeVotes()

  // Check authentication status
  const checkAuth = async () => {
    try {
      // First try with Supabase Auth
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session) {
        // If no session, try checking for our custom cookie-based auth
        const response = await fetch('/api/auth/check', { 
          method: 'GET',
          credentials: 'include' 
        });
        
        if (!response.ok) {
          // No authentication, redirect to login
          router.push("/login")
          return false
        }
        
        const userData = await response.json()
        setUser({
          id: userData.id,
          name: userData.name,
          matricNumber: userData.matric_number
        })
        return true
      }
      
      // Authentication with Supabase exists
      return true
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/login")
      return false
    }
  }

  // Fetch user data, categories, candidates, and voting status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Check authentication first
        const isAuthenticated = await checkAuth()
        if (!isAuthenticated) return
        
        // Get current user if not already set by checkAuth
        if (!user) {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          
          if (authUser) {
            // Get additional user data from our custom table
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("id, name, matric_number")
              .eq("auth_id", authUser.id)
              .single()
            
            if (!userError && userData) {
              setUser({
                id: userData.id,
                name: userData.name,
                matricNumber: userData.matric_number,
              })
            } else {
              // Try to get user data from auth metadata
              const metaData = authUser.user_metadata
              if (metaData) {
                setUser({
                  id: authUser.id,
                  name: metaData.name || "Student",
                  matricNumber: metaData.matric_number || "",
                })
              }
            }
          }
        }

        // Get categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })

        if (categoriesError) {
          throw categoriesError
        }

        setCategories(categoriesData || [])

        if (categoriesData && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id)

          // Get candidates for each category
          const candidatesRecord: Record<string, Candidate[]> = {}

          await Promise.all(
            categoriesData.map(async (category) => {
              const { data: categoryData, error: candidatesError } = await supabase
                .from("candidates")
                .select("*")
                .eq("category_id", category.id)

              if (candidatesError) {
                throw candidatesError
              }

              candidatesRecord[category.id] = categoryData || []
            }),
          )

          setCandidates(candidatesRecord)
        }

        // Get user's votes
        if (user) {
          const { data: userVotes, error: votesError } = await supabase
            .from("votes")
            .select("category_id, candidate_id")
            .eq("user_id", user.id)

          if (votesError) {
            throw votesError
          }

          const votedRecord: Record<string, string> = {}

          userVotes?.forEach((vote) => {
            votedRecord[vote.category_id] = vote.candidate_id
          })

          setVotedCandidates(votedRecord)
        }

        // Get voting status
        const votingStatus = await getVotingStatus()
        setVotingActive(votingStatus.active)
        setVotingMessage(votingStatus.message)

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load voting data",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, toast, user?.id])

  const handleVote = async (categoryId: string, candidateId: string) => {
    if (votedCandidates[categoryId]) {
      return // Already voted in this category
    }

    try {
      const result = await castVote(categoryId, candidateId)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setVotedCandidates((prev) => ({
        ...prev,
        [categoryId]: candidateId,
      }))

      toast({
        title: "Success",
        description: result.message || "Your vote has been recorded",
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Voting error:", error)
      toast({
        title: "Error",
        description: "Failed to cast your vote",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      // Sign out from Supabase Auth
      await supabase.auth.signOut()
      
      // Also call our server logout action to clear cookies
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout user={{ name: "Loading...", matricNumber: "" }} onLogout={handleLogout}>
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      user={{ name: user?.name || "Student", matricNumber: user?.matricNumber || "" }}
      onLogout={handleLogout}
    >
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Student Voting Dashboard</h1>
          <p className="text-muted-foreground">Cast your vote for the student election</p>
        </div>

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <Alert variant="default" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>Your vote has been recorded successfully.</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {!votingActive && (
          <Alert variant="default" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Voting Closed</AlertTitle>
            <AlertDescription>
              {votingMessage || "The voting period has ended. Thank you for your participation."}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Voting Status</CardTitle>
            <CardDescription>Track your voting progress across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {votedCandidates[category.id] ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                        >
                          Voted
                        </Badge>
                        <span className="text-sm">
                          {candidates[category.id]?.find((c) => c.id === votedCandidates[category.id])?.name}
                        </span>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                      >
                        Not Voted
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {categories.length > 0 && (
          <Tabs value={activeCategory || categories[0].id} onValueChange={setActiveCategory} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {candidates[category.id]?.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      isVoted={votedCandidates[category.id] === candidate.id}
                      isVotingActive={votingActive}
                      hasVotedInCategory={!!votedCandidates[category.id]}
                      onVote={() => handleVote(category.id, candidate.id)}
                      voteCount={votes[candidate.id] || 0}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}