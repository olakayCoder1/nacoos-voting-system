"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import AdminCandidateCard from "@/components/admin-candidate-card"
import AddCandidateForm from "@/components/add-candidate-form"
import AddCategoryForm from "@/components/add-category-form"
import { toast } from "@/components/ui/use-toast"


// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [categories, setCategories] = useState([])
  const [candidates, setCandidates] = useState({})
  const [votingActive, setVotingActive] = useState(true)
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [voteStats, setVoteStats] = useState({ totalVoters: 0, totalVoted: 0 })

  // Fetch data on initial load
  useEffect(() => {
    fetchData()
  }, [])

  // Refetch data when active tab changes
  useEffect(() => {
    if (activeTab === "overview") {
      fetchStats()
    } else if (activeTab === "voters") {
      fetchVoters()
    }
  }, [activeTab])

  // Main data fetching function
  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCategories(),
        fetchCandidates(),
        fetchVoters(),
        fetchStats()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    
    setCategories(data)
    
    // Set first category as selected if none is selected
    if (data.length > 0 && !selectedCategory) {
      setSelectedCategory(data[0].id)
    }
  }

  // Fetch candidates grouped by category
  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        votes(count)
      `)
      .order('name')
    
    if (error) throw error
    
    // Group candidates by category
    const candidatesByCategory = {}
    
    // Get all categories first
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id')
    
    // Initialize empty arrays for each category
    categoriesData.forEach(category => {
      candidatesByCategory[category.id] = []
    })
    
    // Populate candidates into their categories
    data.forEach(candidate => {
      // Calculate votes for each candidate
      const voteCount = candidate.votes.length
      
      // Process candidate data
      candidatesByCategory[candidate.category_id] = [
        ...candidatesByCategory[candidate.category_id] || [],
        {
          id: candidate.id,
          name: candidate.name,
          bio: candidate.bio || "",
          image: candidate.photo_url || "/placeholder.svg?height=100&width=100",
          isActive: candidate.is_active,
          votes: voteCount
        }
      ]
    })
    
    setCandidates(candidatesByCategory)
  }

  // Fetch voters data
  const fetchVoters = async () => {
    // This assumes you have a 'users' or 'voters' table in your database
    // Adjust according to your actual schema
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('inserted_at', { ascending: false })
    
    if (usersError) throw usersError
    
    // Get vote data to determine who has voted
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('user_id, created_at')
      .order('created_at', { ascending: false })
    
    if (votesError) throw votesError
    
    // Map users to include voting status
    const votedUserIds = new Set()
    const votingTimestamps = {}
    
    votesData.forEach(vote => {
      votedUserIds.add(vote.user_id)
      if (!votingTimestamps[vote.user_id] || new Date(vote.created_at) > new Date(votingTimestamps[vote.user_id])) {
        votingTimestamps[vote.user_id] = vote.created_at
      }
    })
    
    const processedVoters = usersData.map(user => ({
      id: user.id,
      matricNumber: user.matric_number || "N/A",
      name: user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      hasVoted: votedUserIds.has(user.id),
      timestamp: votingTimestamps[user.id] || null
    }))
    
    setVoters(processedVoters)
    
    // Update voting stats
    setVoteStats(prev => ({
      ...prev,
      totalVoters: processedVoters.length,
      totalVoted: votedUserIds.size
    }))
  }

  // Fetch overall statistics
  const fetchStats = async () => {
    try {
      // Get total voters count
      const { count: totalVoters, error: votersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      if (votersError) throw votersError
      
      // Get unique voters count (users who have cast at least one vote)
      const { data: uniqueVoters, error: uniqueError } = await supabase
        .from('votes')
        .select('user_id')
        .order('user_id')
      
      if (uniqueError) throw uniqueError
      
      // Count unique user IDs
      const uniqueVoterCount = new Set(uniqueVoters.map(vote => vote.user_id)).size
      
      setVoteStats({
        totalVoters,
        totalVoted: uniqueVoterCount
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

const handleToggleVoting = async () => {
  try {
    // Step 1: Fetch all categories
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('id, is_active');

    if (fetchError) throw fetchError;
    if (!categories || categories.length === 0) {
      throw new Error('No categories found');
    }

    // Step 2: Iterate over categories and toggle is_active for each
    for (const category of categories) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ is_active: !votingActive }) // Toggle based on global state
        .eq('id', category.id); // Update specific category by ID

      if (updateError) throw updateError;
    }

    // Step 3: Update state and show success message
    setVotingActive(!votingActive);
    toast({
      title: 'Success',
      description: `Voting is now ${!votingActive ? 'active' : 'inactive'}`,
    });

    // Step 4: Refresh categories after update
    fetchCategories();
  } catch (error) {
    console.error('Error toggling voting:', error);
    toast({
      title: 'Error',
      description: 'Failed to toggle voting status',
      variant: 'destructive',
    });
  }
};


  const handleToggleCategoryActive = async (categoryId:any) => {
    // Find the category to toggle
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return
    
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', categoryId)
      
      if (error) throw error
      
      // Update local state
      setCategories(
        categories.map((cat) =>
          cat.id === categoryId ? { ...cat, is_active: !cat.is_active } : cat
        )
      )
      
      toast({
        title: "Success",
        description: `${category.name} is now ${!category.is_active ? 'active' : 'inactive'}`,
      })
    } catch (error) {
      console.error("Error toggling category:", error)
      toast({
        title: "Error",
        description: "Failed to update category status",
        variant: "destructive"
      })
    }
  }

  const handleAddCandidate = async (candidateData:any) => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([
          {
            name: candidateData.name,
            bio: candidateData.bio,
            category_id: selectedCategory,
            photo_url: candidateData.image,
            is_active: true
          }
        ])
        .select()
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Candidate added successfully",
      })
      
      // Refresh candidates data
      fetchCandidates()
      setShowAddCandidate(false)
    } catch (error) {
      console.error("Error adding candidate:", error)
      toast({
        title: "Error",
        description: "Failed to add candidate",
        variant: "destructive"
      })
    }
  }

  const handleAddCategory = async (categoryData:any) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: categoryData.name,
            description: categoryData.description || "",
            is_active: true
          }
        ])
        .select()
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Category added successfully",
      })
      
      // Refresh categories
      fetchCategories()
      setShowAddCategory(false)
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCandidate = async (candidateId:any) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Candidate deleted successfully",
      })
      
      // Refresh candidates
      fetchCandidates()
    } catch (error) {
      console.error("Error deleting candidate:", error)
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive"
      })
    }
  }

  const handleLogout = () => {
    supabase.auth.signOut().then(() => {
      router.push("/admin/login")
    })
  }

  // Calculate voting percentage
  const votingPercentage = voteStats.totalVoters > 0 
    ? Math.round((voteStats.totalVoted / voteStats.totalVoters) * 100) 
    : 0

  return (
    <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the voting system</p>
        </div>

        {loading && <div className="py-10 text-center">Loading dashboard data...</div>}

        {!loading && (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Switch id="voting-active" checked={votingActive} onCheckedChange={handleToggleVoting} />
                <Label htmlFor="voting-active">Voting is {votingActive ? "active" : "inactive"}</Label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setShowAddCategory(true)
                    setActiveTab("categories")
                  }}
                >
                  Add Category
                </Button>
                <Button
                  onClick={() => {
                    setShowAddCandidate(true)
                    setActiveTab("candidates")
                  }}
                >
                  Add Candidate
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="candidates">Candidates</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="voters">Voters</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{voteStats.totalVoters}</div>
                      <p className="text-xs text-muted-foreground">Registered in the system</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{voteStats.totalVoted}</div>
                      <p className="text-xs text-muted-foreground">{votingPercentage}% participation</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{categories.filter((c:any) => c.is_active).length}</div>
                      <p className="text-xs text-muted-foreground">Out of {categories.length} total</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Object.values(candidates).reduce((total, categoryList) => total + categoryList.length, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Across all categories</p>
                    </CardContent>
                  </Card>
                </div>

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
                            {voteStats.totalVoted} out of {voteStats.totalVoters} voters
                          </p>
                        </div>
                        <div className="text-sm font-medium">{votingPercentage}%</div>
                      </div>
                      <Progress value={votingPercentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  {categories.slice(0, 2).map((category:any) => {
                    const categoryCandidates = candidates[category.id] || []
                    const totalVotes = categoryCandidates.reduce((sum, candidate) => sum + candidate.votes, 0)

                    return (
                      <Card key={category.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>{category.name}</CardTitle>
                            <Badge variant={category.is_active ? "default" : "outline"}>
                              {category.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <CardDescription>
                            {categoryCandidates.length} candidates, {totalVotes} votes
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {categoryCandidates.map((candidate:any) => {
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

              <TabsContent value="candidates" className="space-y-4">
                {showAddCandidate ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Candidate</CardTitle>
                      <CardDescription>Enter the details for the new candidate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AddCandidateForm
                        categories={categories}
                        onSubmit={handleAddCandidate}
                        onCancel={() => setShowAddCandidate(false)}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs defaultValue={categories.length > 0 ? categories[0].id : ""} className="space-y-4">
                    <TabsList className="flex flex-wrap">
                      {categories.map((category:any) => (
                        <TabsTrigger key={category.id} value={category.id}>
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {categories.map((category:any) => (
                      <TabsContent key={category.id} value={category.id} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {(candidates[category.id] || []).map((candidate) => (
                            <AdminCandidateCard 
                              key={candidate.id} 
                              candidate={candidate} 
                              categoryId={category.id} 
                              onDelete={() => handleDeleteCandidate(candidate.id)}
                            />
                          ))}
                          
                          {(candidates[category.id] || []).length === 0 && (
                            <div className="col-span-full py-10 text-center text-muted-foreground">
                              No candidates in this category yet
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedCategory(category.id)
                            setShowAddCandidate(true)
                          }}
                        >
                          Add Candidate to {category.name}
                        </Button>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                {showAddCategory ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Category</CardTitle>
                      <CardDescription>Enter the details for the new voting category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AddCategoryForm onSubmit={handleAddCategory} onCancel={() => setShowAddCategory(false)} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category:any) => {
                      const categoryCandidates = candidates[category.id] || []

                      return (
                        <Card key={category.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{category.name}</CardTitle>
                              <Badge variant={category.is_active ? "default" : "outline"}>
                                {category.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <CardDescription>{categoryCandidates.length} candidates</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`category-${category.id}`}
                                checked={category.is_active}
                                onCheckedChange={() => handleToggleCategoryActive(category.id)}
                              />
                              <Label htmlFor={`category-${category.id}`}>
                                {category.is_active ? "Active" : "Inactive"}
                              </Label>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCategory(category.id)
                                setShowAddCandidate(true)
                                setActiveTab("candidates")
                              }}
                            >
                              Add Candidate
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })}
                    
                    {categories.length === 0 && (
                      <div className="col-span-full py-10 text-center text-muted-foreground">
                        No categories created yet. Click "Add Category" to create one.
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="voters" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Voters</CardTitle>
                    <CardDescription>List of all registered voters and their voting status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50 font-medium">
                            <th className="py-3 px-4 text-left">Matric Number</th>
                            <th className="py-3 px-4 text-left">Name</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voters.map((voter:any) => (
                            <tr key={voter.id} className="border-b">
                              <td className="py-3 px-4">{voter.matricNumber}</td>
                              <td className="py-3 px-4">{voter.name}</td>
                              <td className="py-3 px-4">
                                <Badge variant={voter.hasVoted ? "default" : "outline"}>
                                  {voter.hasVoted ? "Voted" : "Not Voted"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">{voter.timestamp || "N/A"}</td>
                            </tr>
                          ))}
                          
                          {voters.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-muted-foreground">
                                No voters registered yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}