"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CandidateCard } from "@/components/candidate-card"
import { supabase } from "@/lib/supabase/client"
import { castVote } from "@/app/actions/voting"
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
  const [categoryStatuses, setCategoryStatuses] = useState<Record<string, boolean>>({})
  const [authError, setAuthError] = useState<string | null>(null)

  // Use real-time votes hook only when voting is active
  const { votes } = useRealTimeVotes(votingActive)

  // Check authentication status with timeout
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Set a timeout to avoid hanging
        const authTimeout = setTimeout(() => {
          console.error("Auth check timed out")
          setAuthError("Authentication check timed out. Please try refreshing the page.")
          setIsLoading(false)
        }, 5000) // 5 second timeout
        
        // First try with Supabase Auth
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        // Clear timeout since we got a response
        clearTimeout(authTimeout)
        
        if (sessionError) {
          throw sessionError
        }
        
        if (!sessionData.session) {
          // If no session, try checking for our custom cookie-based auth
          try {
            const response = await fetch('/api/auth/check', { 
              method: 'GET',
              credentials: 'include',
              // Add a timeout to the fetch using AbortController
              signal: AbortSignal.timeout(3000)
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
          } catch (fetchError) {
            console.error("Custom auth check error:", fetchError)
            router.push("/login")
            return false
          }
        }
        
        // Authentication with Supabase exists
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
          
        if (userError) {
          throw userError
        }
        
        if (authUser) {
          // Get additional user data from our custom table
          const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("id, name, matric_number")
            .eq("auth_id", authUser.id)
            .single()
          
          if (!userDataError && userData) {
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
        
        return true
      } catch (error) {
        console.error("Auth check error:", error)
        setAuthError("Authentication failed. Please try logging in again.")
        setIsLoading(false)
        return false
      }
    }

    checkAuth().then(authenticated => {
      if (authenticated) {
        // Proceed with data fetching only if authentication was successful
        fetchData()
      }
    })
  }, [router])

  // Fetch categories, candidates, and voting status
  const fetchData = async () => {
    try {
      // Set a timeout to avoid hanging
      const dataTimeout = setTimeout(() => {
        console.error("Data fetch timed out")
        toast({
          title: "Timeout Error",
          description: "Failed to load voting data. Please try refreshing the page.",
          variant: "destructive",
        })
        setIsLoading(false)
      }, 10000) // 10 second timeout
      
      if (!user) {
        clearTimeout(dataTimeout)
        return // Don't fetch data if user is not available
      }
      
      // Get general voting status from settings table
      const { data: votingSettings, error: settingsError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "voting_active")
        .single()
      
      if (settingsError) {
        console.warn("Settings fetch error:", settingsError)
        // Continue with default values instead of failing
      }
        
      const globalVotingActive = votingSettings?.value?.status || false
      setVotingActive(globalVotingActive)
      setVotingMessage(votingSettings?.value?.message || "")

      // Get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })

      if (categoriesError) {
        throw categoriesError
      }

      // Filter active categories and create status map
      const activeCategories = categoriesData || []
      const statusMap: Record<string, boolean> = {}
      activeCategories.forEach(category => {
        // A category is only truly active if both global voting is active AND the category itself is active
        statusMap[category.id] = globalVotingActive && category.is_active
      })
      
      setCategoryStatuses(statusMap)
      setCategories(activeCategories)

      // Only set active category to first active category
      const firstActiveCategory = activeCategories.find(c => statusMap[c.id])
      if (firstActiveCategory) {
        setActiveCategory(firstActiveCategory.id)
      } else if (activeCategories.length > 0) {
        setActiveCategory(activeCategories[0].id)
      }

      // Get candidates for each category
      const candidatesRecord: Record<string, Candidate[]> = {}

      // Use Promise.all with a reasonable limit to avoid too many parallel requests
      const chunkSize = 5
      for (let i = 0; i < activeCategories.length; i += chunkSize) {
        const chunk = activeCategories.slice(i, i + chunkSize)
        
        await Promise.all(
          chunk.map(async (category) => {
            const { data: categoryData, error: candidatesError } = await supabase
              .from("candidates")
              .select("*")
              .eq("category_id", category.id)

            if (candidatesError) {
              console.error(`Error fetching candidates for category ${category.id}:`, candidatesError)
              candidatesRecord[category.id] = [] // Use empty array instead of failing
            } else {
              candidatesRecord[category.id] = categoryData || []
            }
          }),
        )
      }

      setCandidates(candidatesRecord)

      // Get user's votes
      const { data: userVotes, error: votesError } = await supabase
        .from("votes")
        .select("category_id, candidate_id")
        .eq("user_id", user.id)

      if (votesError) {
        console.error("Error fetching user votes:", votesError)
        // Continue with empty votes instead of failing
      } else {
        const votedRecord: Record<string, string> = {}
        userVotes?.forEach((vote) => {
          votedRecord[vote.category_id] = vote.candidate_id
        })
        setVotedCandidates(votedRecord)
      }
      
      // Clear the timeout since we completed successfully
      clearTimeout(dataTimeout)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load voting data. Please try refreshing the page.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleVote = async (categoryId: string, candidateId: string) => {
    if (votedCandidates[categoryId]) {
      return // Already voted in this category
    }

    if (!categoryStatuses[categoryId]) {
      toast({
        title: "Voting Closed",
        description: "Voting is currently not active for this category",
        variant: "destructive",
      })
      return
    }

    try {
      // Set a timeout for the vote operation
      const votePromise = castVote(categoryId, candidateId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Vote operation timed out")), 5000)
      )
      
      // Race between the vote and the timeout
      const result = await Promise.race([votePromise, timeoutPromise]) as any

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
        description: error instanceof Error ? error.message : "Failed to cast your vote",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      // Set timeout for logout operation
      const logoutTimeout = setTimeout(() => {
        console.warn("Logout timed out, forcing navigation")
        router.push("/login")
      }, 3000)
      
      // Sign out from Supabase Auth
      await supabase.auth.signOut()
      
      // Also call our server logout action to clear cookies
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
      } catch (fetchError) {
        console.warn("Custom logout error (continuing anyway):", fetchError)
      }
      
      clearTimeout(logoutTimeout)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  if (authError) {
    return (
      <div className="container mx-auto flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to authenticate</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
            <button
              onClick={() => router.push("/login")}
              className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Return to Login
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout user={{ name: "Loading...", matricNumber: "" }} onLogout={handleLogout}>
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <span className="ml-3">Loading your dashboard...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Find the active category object
  const currentCategory = categories.find(c => c.id === activeCategory)
  const isCategoryActive = currentCategory ? categoryStatuses[currentCategory.id] : false
  const canVoteInCurrentCategory = isCategoryActive

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

        {!votingActive && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Voting Closed</AlertTitle>
            <AlertDescription>
              {votingMessage || "Voting is currently not active. Please check back later."}
            </AlertDescription>
          </Alert>
        )}

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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      {!categoryStatuses[category.id] && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                          Inactive
                        </Badge>
                      )}
                    </div>
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
                          {candidates[category.id]?.find((c) => c.id === votedCandidates[category.id])?.name || "Selected candidate"}
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
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Cast Your Vote</h2>
                <p className="text-muted-foreground">Select a category to vote</p>
              </div>
              <div className="w-full sm:w-64">
                <Select
                  value={activeCategory || undefined}
                  onValueChange={(value) => setActiveCategory(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} {!categoryStatuses[category.id] && "(Inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeCategory && !isCategoryActive && (
              <Alert variant="default" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Category Voting Closed</AlertTitle>
                <AlertDescription>
                  Voting for this category is currently not active. Please check back later or select another category.
                </AlertDescription>
              </Alert>
            )}

            {activeCategory && votedCandidates[activeCategory] && (
              <Alert className="mb-4 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Already Voted</AlertTitle>
                <AlertDescription>
                  You have already cast your vote in this category. You can view other categories or logout.
                </AlertDescription>
              </Alert>
            )}

            {activeCategory && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {candidates[activeCategory]?.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isVoted={votedCandidates[activeCategory] === candidate.id}
                    isVotingActive={canVoteInCurrentCategory}
                    hasVotedInCategory={!!votedCandidates[activeCategory]}
                    onVote={() => handleVote(activeCategory, candidate.id)}
                    voteCount={votingActive ? (votes?.[candidate.id] || 0) : 0}
                    showVotes={votingActive}
                  />
                ))}

                {(!candidates[activeCategory] || candidates[activeCategory].length === 0) && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No candidates available in this category
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}