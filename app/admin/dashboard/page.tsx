"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminCandidateCard } from "@/components/admin-candidate-card"
import { AddCandidateForm } from "@/components/add-candidate-form"
import { AddCategoryForm } from "@/components/add-category-form"

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

// Mock data for voters
const voters = [
  { id: 1, matricNumber: "20/52HA085", name: "John Student", hasVoted: true, timestamp: "2023-05-10 14:30:22" },
  { id: 2, matricNumber: "21/52HA102", name: "Jane Student", hasVoted: true, timestamp: "2023-05-10 15:45:10" },
  { id: 3, matricNumber: "19/52HA045", name: "Bob Student", hasVoted: false, timestamp: null },
  { id: 4, matricNumber: "22/52HA073", name: "Alice Student", hasVoted: true, timestamp: "2023-05-10 16:20:05" },
  { id: 5, matricNumber: "20/52HA091", name: "Charlie Student", hasVoted: false, timestamp: null },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [categories, setCategories] = useState(initialCategories)
  const [candidates, setCandidates] = useState(initialCandidates)
  const [votingActive, setVotingActive] = useState(true)
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("president")

  const totalVoters = voters.length
  const totalVoted = voters.filter((voter) => voter.hasVoted).length
  const votingPercentage = Math.round((totalVoted / totalVoters) * 100)

  const handleToggleVoting = () => {
    setVotingActive(!votingActive)
  }

  const handleToggleCategoryActive = (categoryId: string) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId ? { ...category, isActive: !category.isActive } : category,
      ),
    )
  }

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

  const handleAddCategory = (category: any) => {
    const newCategoryId = category.name.toLowerCase().replace(/\s+/g, "-")
    setCategories([...categories, { id: newCategoryId, name: category.name, isActive: true }])
    setCandidates({
      ...candidates,
      [newCategoryId]: [],
    })
    setShowAddCategory(false)
  }

  const handleLogout = () => {
    router.push("/admin/login")
  }

  return (
    <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the voting system</p>
        </div>

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
                  <div className="text-2xl font-bold">{totalVoters}</div>
                  <p className="text-xs text-muted-foreground">Registered in the system</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVoted}</div>
                  <p className="text-xs text-muted-foreground">{votingPercentage}% participation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.filter((c) => c.isActive).length}</div>
                  <p className="text-xs text-muted-foreground">Out of {categories.length} total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.values(candidates).flat().length}</div>
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
                        {totalVoted} out of {totalVoters} voters
                      </p>
                    </div>
                    <div className="text-sm font-medium">{votingPercentage}%</div>
                  </div>
                  <Progress value={votingPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {categories.slice(0, 2).map((category) => {
                const categoryCandidates = candidates[category.id as keyof typeof candidates]
                const totalVotes = categoryCandidates.reduce((sum, candidate) => sum + candidate.votes, 0)

                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{category.name}</CardTitle>
                        <Badge variant={category.isActive ? "default" : "outline"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {categoryCandidates.length} candidates, {totalVotes} votes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryCandidates.map((candidate) => {
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {candidates[category.id as keyof typeof candidates].map((candidate) => (
                        <AdminCandidateCard key={candidate.id} candidate={candidate} categoryId={category.id} />
                      ))}
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
                {categories.map((category) => {
                  const categoryCandidates = candidates[category.id as keyof typeof candidates]

                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{category.name}</CardTitle>
                          <Badge variant={category.isActive ? "default" : "outline"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription>{categoryCandidates.length} candidates</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`category-${category.id}`}
                            checked={category.isActive}
                            onCheckedChange={() => handleToggleCategoryActive(category.id)}
                          />
                          <Label htmlFor={`category-${category.id}`}>{category.isActive ? "Active" : "Inactive"}</Label>
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
                      {voters.map((voter) => (
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
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
