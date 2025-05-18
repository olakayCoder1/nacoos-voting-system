"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import AdminCandidateCard from "@/components/admin-candidate-card"
import AddCandidateForm from "@/components/add-candidate-form"
import { Search, Plus, Loader2, ChevronDown } from "lucide-react"
import { createClient, PostgrestError } from "@supabase/supabase-js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Category {
  id: string
  name: string
  isActive: boolean
}

interface Candidate {
  id: string
  name: string
  bio: string
  image: string
  votes: number
  isActive: boolean
}

interface Vote {
  candidate_id: string
  count: number
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function AdminCandidates() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({})
  const [showAddCandidate, setShowAddCandidate] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories and candidates from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        
        if (categoriesError) throw categoriesError

        // Fetch candidates
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select(`
            id, 
            name, 
            bio, 
            photo_url,
            category_id,
            is_active,
            categories(name)
          `)
          .order('name')
        
        if (candidatesError) throw candidatesError

        // Get vote counts for each candidate
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('candidate_id')
        
        if (votesError) throw votesError

        // Aggregate votes by candidate_id
        const voteCountMap: Record<string, number> = {}
        votesData.forEach((vote: any) => {
          if (vote.candidate_id in voteCountMap) {
            voteCountMap[vote.candidate_id] += 1
          } else {
            voteCountMap[vote.candidate_id] = 1
          }
        })

        // Set categories
        const formattedCategories = categoriesData.map(category => ({
          id: category.id,
          name: category.name,
          isActive: category.is_active
        }))
        
        setCategories(formattedCategories)
        
        // Set default selected category if available
        if (formattedCategories.length > 0) {
          setSelectedCategory(formattedCategories[0].id)
        }

        // Group candidates by category
        const candidatesByCategory: Record<string, Candidate[]> = {}
        formattedCategories.forEach(category => {
          candidatesByCategory[category.id] = []
        })

        candidatesData.forEach(candidate => {
          if (candidatesByCategory[candidate.category_id]) {
            candidatesByCategory[candidate.category_id].push({
              id: candidate.id,
              name: candidate.name,
              bio: candidate.bio || "",
              image: candidate.photo_url || "/placeholder.svg?height=100&width=100",
              votes: voteCountMap[candidate.id] || 0,
              isActive: candidate.is_active
            })
          }
        })

        setCandidates(candidatesByCategory)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError((error as Error).message)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddCandidate = async (candidate: { name: string; bio: string; image: string }) => {
    try {
      // Insert new candidate into Supabase
      const { data: newCandidate, error } = await supabase
        .from('candidates')
        .insert({
          name: candidate.name,
          bio: candidate.bio,
          photo_url: candidate.image,
          category_id: selectedCategory,
          is_active: true
        })
        .select()
      
      if (error) throw error

      setCandidates({
        ...candidates,
        [selectedCategory]: [
          ...candidates[selectedCategory],
          {
            id: newCandidate[0].id,
            name: candidate.name,
            bio: candidate.bio || "",
            image: candidate.image || "/placeholder.svg?height=100&width=100",
            votes: 0,
            isActive: true
          }
        ]
      })
      
      setShowAddCandidate(false)
    } catch (error) {
      console.error("Error adding candidate:", error)
      alert("Failed to add candidate: " + (error as PostgrestError).message)
    }
  }

  const handleDeleteCandidate = async (categoryId: string, candidateId: string) => {
    try {
      // Delete candidate from Supabase
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)
      
      if (error) throw error

      // Update local state
      setCandidates({
        ...candidates,
        [categoryId]: candidates[categoryId].filter(c => c.id !== candidateId)
      })
    } catch (error) {
      console.error("Error deleting candidate:", error)
      alert("Failed to delete candidate: " + (error as PostgrestError).message)
    }
  }

  const toggleCandidateActive = async (categoryId: string, candidateId: string, isActive: boolean) => {
    try {
      // Update candidate in Supabase
      const { error } = await supabase
        .from('candidates')
        .update({ is_active: !isActive })
        .eq('id', candidateId)
      
      if (error) throw error

      // Update local state
      setCandidates({
        ...candidates,
        [categoryId]: candidates[categoryId].map(c => 
          c.id === candidateId ? { ...c, isActive: !isActive } : c
        )
      })
    } catch (error) {
      console.error("Error updating candidate status:", error)
      alert("Failed to update candidate status: " + (error as PostgrestError).message)
    }
  }

  const filteredCandidates = (categoryId: string): Candidate[] => {
    if (!candidates[categoryId]) return []
    if (!searchQuery) return candidates[categoryId]

    return candidates[categoryId].filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.bio && candidate.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const handleLogout = () => {
    router.push("/admin/login")
  }

  // Find the current category name
  const getCurrentCategoryName = (): string => {
    const category = categories.find(c => c.id === selectedCategory)
    return category ? category.name : "Select Category"
  }

  if (isLoading) {
    return (
      <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
        <div className="container mx-auto p-4 md:p-6 flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg">Loading candidates and categories...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
        <div className="container mx-auto p-4 md:p-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Candidates</h1>
            <p className="text-muted-foreground">Add, edit, or remove candidates for the election</p>
          </div>
          <Button onClick={() => setShowAddCandidate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-span-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
          <div className="space-y-4">
            {selectedCategory && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  {getCurrentCategoryName()} Candidates
                </h2>
                
                {filteredCandidates(selectedCategory).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <p className="mb-4 text-center text-muted-foreground">
                        {searchQuery
                          ? "No candidates match your search criteria"
                          : "No candidates found for this category"}
                      </p>
                      <Button
                        onClick={() => setShowAddCandidate(true)}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Candidate to {getCurrentCategoryName()}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCandidates(selectedCategory).map((candidate) => (
                      <AdminCandidateCard 
                        key={candidate.id}
                        candidate={candidate}
                        categoryId={selectedCategory}
                        onDelete={() => handleDeleteCandidate(selectedCategory, candidate.id)}
                        onToggleActive={() => toggleCandidateActive(selectedCategory, candidate.id, candidate.isActive)}
                      />
                    ))}
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