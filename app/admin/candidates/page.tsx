"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminCandidateCard } from "@/components/admin-candidate-card"
import { AddCandidateForm } from "@/components/add-candidate-form"
import { Search, Plus } from "lucide-react"

// Mock data for categories and candidates
const initialCategories = [
  { id: "president", name: "President", isActive: true },
  { id: "vice-president", name: "Vice President", isActive: true },
  { id: "secretary", name: "Secretary", isActive: true },
  { id: "treasurer", name: "Treasurer", isActive: true },
]

const initialCandidates = {
  president: [
    {
      id: 1,
      name: "John Doe",
      bio: "Final year Computer Science student with leadership experience.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 24,
    },
    {
      id: 2,
      name: "Jane Smith",
      bio: "Third year Engineering student and current class representative.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 18,
    },
    {
      id: 3,
      name: "Alex Johnson",
      bio: "Second year Business Administration student with fresh ideas.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 12,
    },
  ],
  "vice-president": [
    {
      id: 4,
      name: "Sarah Williams",
      bio: "Third year Law student with organizational skills.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 30,
    },
    {
      id: 5,
      name: "Michael Brown",
      bio: "Final year Economics student with previous leadership roles.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 25,
    },
  ],
  secretary: [
    {
      id: 6,
      name: "Emily Davis",
      bio: "Second year English Literature student with excellent writing skills.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 22,
    },
    {
      id: 7,
      name: "David Wilson",
      bio: "Third year History student with attention to detail.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 19,
    },
  ],
  treasurer: [
    {
      id: 8,
      name: "Lisa Taylor",
      bio: "Final year Accounting student with financial management experience.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 28,
    },
    {
      id: 9,
      name: "Robert Martin",
      bio: "Third year Mathematics student with analytical skills.",
      image: "/placeholder.svg?height=100&width=100",
      votes: 15,
    },
  ],
}

export default function AdminCandidates() {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [candidates, setCandidates] = useState(initialCandidates)
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("president")
  const [searchQuery, setSearchQuery] = useState("")

  const handleAddCandidate = (candidate: any) => {
    setCandidates({
      ...candidates,
      [selectedCategory]: [
        ...candidates[selectedCategory as keyof typeof candidates],
        {
          id: Math.max(...candidates[selectedCategory as keyof typeof candidates].map((c) => c.id)) + 1,
          ...candidate,
          votes: 0,
        },
      ],
    })
    setShowAddCandidate(false)
  }

  const handleDeleteCandidate = (categoryId: string, candidateId: number) => {
    setCandidates({
      ...candidates,
      [categoryId]: candidates[categoryId as keyof typeof candidates].filter((c) => c.id !== candidateId),
    })
  }

  const filteredCandidates = (categoryId: string) => {
    if (!searchQuery) return candidates[categoryId as keyof typeof candidates]

    return candidates[categoryId as keyof typeof candidates].filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.bio.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const handleLogout = () => {
    router.push("/admin/login")
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

        <div className="mb-6">
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
          <Tabs defaultValue={categories[0].id} className="space-y-4">
            <TabsList className="flex flex-wrap">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                {filteredCandidates(category.id).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <p className="mb-4 text-center text-muted-foreground">
                        {searchQuery
                          ? "No candidates match your search criteria"
                          : "No candidates found for this category"}
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setShowAddCandidate(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Candidate
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCandidates(category.id).map((candidate) => (
                      <AdminCandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        categoryId={category.id}
                        onDelete={() => handleDeleteCandidate(category.id, candidate.id)}
                      />
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setShowAddCandidate(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Candidate to {category.name}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
