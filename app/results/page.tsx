// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Progress } from "@/components/ui/progress"
// import { useRouter } from "next/navigation"
// import { DashboardLayout } from "@/components/dashboard-layout"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { AlertCircle } from "lucide-react"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { supabase } from "@/lib/supabase/client"
// import { getResultsVisibility } from "@/app/actions/voting"
// import { useRealTimeVotes } from "@/hooks/use-real-time-votes"
// import { useToast } from "@/hooks/use-toast"
// import type { Category, Candidate } from "@/lib/types"

// export default function Results() {
//   const router = useRouter()
//   const { toast } = useToast()
//   const [activeTab, setActiveTab] = useState<string | null>(null)
//   const [categories, setCategories] = useState<Category[]>([])
//   const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({})
//   const [showResults, setShowResults] = useState(false)
//   const [resultsMessage, setResultsMessage] = useState("")
//   const [isLoading, setIsLoading] = useState(true)
//   const [user, setUser] = useState<{ id: string; name: string; matricNumber: string } | null>(null)

//   // Use real-time votes hook
//   const { votes, loading: votesLoading } = useRealTimeVotes()

//   // Fetch user data, categories, candidates, an  loading: votesLoading } = useRealTimeVotes()

//   // Fetch user data, categories, candidates, and results visibility
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoading(true)

//         // Get current user
//         const {
//           data: { session },
//         } = await supabase.auth.getSession()

//         if (!session) {
//           router.push("/login")
//           return
//         }

//         const { data: userData, error: userError } = await supabase
//           .from("users")
//           .select("id, name, matric_number")
//           .eq("id", session.user.id)
//           .single()

//         if (userError || !userData) {
//           throw new Error("Failed to fetch user data")
//         }

//         setUser({
//           id: userData.id,
//           name: userData.name,
//           matricNumber: userData.matric_number,
//         })

//         // Check if results are visible
//         const resultsVisibility = await getResultsVisibility()
//         setShowResults(resultsVisibility.visible)
//         setResultsMessage(resultsVisibility.message)

//         if (resultsVisibility.visible) {
//           // Get categories
//           const { data: categoriesData, error: categoriesError } = await supabase
//             .from("categories")
//             .select("*")
//             .eq("is_active", true)
//             .order("display_order", { ascending: true })

//           if (categoriesError) {
//             throw categoriesError
//           }

//           setCategories(categoriesData || [])

//           if (categoriesData && categoriesData.length > 0) {
//             setActiveTab(categoriesData[0].id)

//             // Get candidates for each category
//             const candidatesRecord: Record<string, Candidate[]> = {}

//             await Promise.all(
//               categoriesData.map(async (category) => {
//                 const { data: categoryData, error: candidatesError } = await supabase
//                   .from("candidates")
//                   .select("*")
//                   .eq("category_id", category.id)

//                 if (candidatesError) {
//                   throw candidatesError
//                 }

//                 candidatesRecord[category.id] = categoryData || []
//               }),
//             )

//             setCandidates(candidatesRecord)
//           }
//         }

//         setIsLoading(false)
//       } catch (error) {
//         console.error("Error fetching data:", error)
//         toast({
//           title: "Error",
//           description: "Failed to load results data",
//           variant: "destructive",
//         })
//         setIsLoading(false)
//       }
//     }

//     fetchData()
//   }, [router, toast])

//   const handleLogout = async () => {
//     await supabase.auth.signOut()
//     router.push("/login")
//   }

//   if (isLoading) {
//     return (
//       <DashboardLayout
//         user={{ name: user?.name || "Student", matricNumber: user?.matricNumber || "" }}
//         onLogout={handleLogout}
//       >
//         <div className="container mx-auto p-4 md:p-6">
//           <div className="flex items-center justify-center py-20">
//             <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
//           </div>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   return (
//     <DashboardLayout
//       user={{ name: user?.name || "Student", matricNumber: user?.matricNumber || "" }}
//       onLogout={handleLogout}
//     >
//       <div className="container mx-auto p-4 md:p-6">
//         <div className="mb-6">
//           <h1 className="text-3xl font-bold">Election Results</h1>
//           <p className="text-muted-foreground">View the current election results</p>
//         </div>

//         {!showResults ? (
//           <Alert>
//             <AlertCircle className="h-4 w-4" />
//             <AlertTitle>Results Not Available</AlertTitle>
//             <AlertDescription>
//               {resultsMessage || "The election results have not been made public yet. Please check back later."}
//             </AlertDescription>
//           </Alert>
//         ) : (
//           <Tabs value={activeTab || ""} onValueChange={setActiveTab} className="space-y-4">
//             <TabsList className="flex flex-wrap">
//               {categories.map((category) => (
//                 <TabsTrigger key={category.id} value={category.id}>
//                   {category.name}
//                 </TabsTrigger>
//               ))}
//             </TabsList>

//             {categories.map((category) => {
//               const categoryCandidates = candidates[category.id] || []
//               const totalVotes = categoryCandidates.reduce((sum, candidate) => sum + (votes[candidate.id] || 0), 0)

//               return (
//                 <TabsContent key={category.id} value={category.id} className="space-y-4">
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>{category.name} Results</CardTitle>
//                       <CardDescription>Total votes: {totalVotes}</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-6">
//                         {categoryCandidates
//                           .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))
//                           .map((candidate, index) => {
//                             const candidateVotes = votes[candidate.id] || 0
//                             const percentage = totalVotes ? Math.round((candidateVotes / totalVotes) * 100) : 0

//                             return (
//                               <div key={candidate.id} className="space-y-2">
//                                 <div className="flex items-center gap-4">
//                                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
//                                     {index === 0 && <span className="text-lg font-bold">🏆</span>}
//                                     {index !== 0 && <span className="font-medium">{index + 1}</span>}
//                                   </div>
//                                   <div className="flex flex-1 items-center gap-2">
//                                     <Avatar className="h-10 w-10">
//                                       <AvatarImage
//                                         src={candidate.image_url || "/placeholder.svg"}
//                                         alt={candidate.name}
//                                       />
//                                       <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
//                                     </Avatar>
//                                     <div>
//                                       <p className="font-medium">{candidate.name}</p>
//                                       <p className="text-sm text-muted-foreground">{candidateVotes} votes</p>
//                                     </div>
//                                   </div>
//                                   <div className="text-right">
//                                     <p className="text-lg font-bold">{percentage}%</p>
//                                   </div>
//                                 </div>
//                                 <Progress value={percentage} className="h-2" />
//                               </div>
//                             )
//                           })}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </TabsContent>
//               )
//             })}
//           </Tabs>
//         )}
//       </div>
//     </DashboardLayout>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase/client"
import { getResultsVisibility } from "@/app/actions/voting"
import { useRealTimeVotes } from "@/hooks/use-real-time-votes"
import { useToast } from "@/hooks/use-toast"
import type { Category, Candidate } from "@/lib/types"

export default function Results() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({})
  const [showResults, setShowResults] = useState(false)
  const [resultsMessage, setResultsMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string; matricNumber: string } | null>(null)

  // Use real-time votes hook
  const { votes, loading: votesLoading } = useRealTimeVotes()

  // First check authentication separately to prevent redirect flashes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          router.push("/login")
          return
        }

        // If no session, redirect to login
        if (!sessionData.session) {
          console.log("No active session found, redirecting to login")
          router.push("/login")
          return
        }

        // Session exists, now get user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, matric_number")
          .eq("id", sessionData.session.user.id)
          .single()

        if (userError) {
          console.error("User data error:", userError)
          toast({
            title: "Authentication Error",
            description: "Unable to retrieve user data. Please login again.",
            variant: "destructive",
          })
          await supabase.auth.signOut()
          router.push("/login")
          return
        }

        if (!userData) {
          console.error("No user data found")
          toast({
            title: "Authentication Error",
            description: "User profile not found. Please login again.",
            variant: "destructive",
          })
          await supabase.auth.signOut()
          router.push("/login")
          return
        }

        // Set user data and mark auth as checked
        setUser({
          id: userData.id,
          name: userData.name,
          matricNumber: userData.matric_number,
        })
        setAuthChecked(true)
      } catch (error) {
        console.error("Authentication check error:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, toast])

  // Only fetch data after authentication is confirmed
  useEffect(() => {
    if (!authChecked || !user) return

    const fetchData = async () => {
      try {
        // Check if results are visible
        const resultsVisibility = await getResultsVisibility()
        setShowResults(resultsVisibility.visible)
        setResultsMessage(resultsVisibility.message)

        if (resultsVisibility.visible) {
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
            setActiveTab(categoriesData[0].id)

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
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load results data",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchData()
  }, [authChecked, user, toast])

  // Set up auth state change listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event)
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Show loading state while checking auth or loading data
  if (!authChecked || isLoading) {
    return (
      <DashboardLayout
        user={{ name: user?.name || "Student", matricNumber: user?.matricNumber || "" }}
        onLogout={handleLogout}
      >
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
          <h1 className="text-3xl font-bold">Election Results</h1>
          <p className="text-muted-foreground">View the current election results</p>
        </div>

        {!showResults ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Results Not Available</AlertTitle>
            <AlertDescription>
              {resultsMessage || "The election results have not been made public yet. Please check back later."}
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab || ""} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex flex-wrap">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => {
              const categoryCandidates = candidates[category.id] || []
              const totalVotes = categoryCandidates.reduce((sum, candidate) => sum + (votes[candidate.id] || 0), 0)

              return (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{category.name} Results</CardTitle>
                      <CardDescription>Total votes: {totalVotes}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {categoryCandidates
                          .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))
                          .map((candidate, index) => {
                            const candidateVotes = votes[candidate.id] || 0
                            const percentage = totalVotes ? Math.round((candidateVotes / totalVotes) * 100) : 0

                            return (
                              <div key={candidate.id} className="space-y-2">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                    {index === 0 && <span className="text-lg font-bold">🏆</span>}
                                    {index !== 0 && <span className="font-medium">{index + 1}</span>}
                                  </div>
                                  <div className="flex flex-1 items-center gap-2">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage
                                        src={candidate.image_url || "/placeholder.svg"}
                                        alt={candidate.name}
                                      />
                                      <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{candidate.name}</p>
                                      <p className="text-sm text-muted-foreground">{candidateVotes} votes</p>
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
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}