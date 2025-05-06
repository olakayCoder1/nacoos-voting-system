"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Plus, Download, Upload, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { z } from "zod"

// Mock data for voters
const initialVoters = [
  { id: 1, matricNumber: "20/52HA085", name: "John Student", hasVoted: true, timestamp: "2023-05-10 14:30:22" },
  { id: 2, matricNumber: "21/52HA102", name: "Jane Student", hasVoted: true, timestamp: "2023-05-10 15:45:10" },
  { id: 3, matricNumber: "19/52HA045", name: "Bob Student", hasVoted: false, timestamp: null },
  { id: 4, matricNumber: "22/52HA073", name: "Alice Student", hasVoted: true, timestamp: "2023-05-10 16:20:05" },
  { id: 5, matricNumber: "20/52HA091", name: "Charlie Student", hasVoted: false, timestamp: null },
  { id: 6, matricNumber: "21/52HA056", name: "David Student", hasVoted: true, timestamp: "2023-05-10 17:10:45" },
  { id: 7, matricNumber: "22/52HA128", name: "Emma Student", hasVoted: false, timestamp: null },
  { id: 8, matricNumber: "19/52HA033", name: "Frank Student", hasVoted: true, timestamp: "2023-05-10 13:25:18" },
  { id: 9, matricNumber: "20/52HA077", name: "Grace Student", hasVoted: false, timestamp: null },
  { id: 10, matricNumber: "21/52HA099", name: "Henry Student", hasVoted: true, timestamp: "2023-05-10 14:55:32" },
]

// Matric number validation schema
const matricSchema = z.string().regex(/^\d{2}\/\d{2}HA\d{3}$/, {
  message: "Invalid matric number format. Example: 20/52HA085",
})

export default function AdminVoters() {
  const router = useRouter()
  const [voters, setVoters] = useState(initialVoters)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddVoter, setShowAddVoter] = useState(false)
  const [newVoter, setNewVoter] = useState({ matricNumber: "", name: "" })
  const [error, setError] = useState("")
  const [selectedVoters, setSelectedVoters] = useState<number[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const filteredVoters = voters.filter(
    (voter) =>
      voter.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddVoter = () => {
    try {
      // Validate matric number format
      matricSchema.parse(newVoter.matricNumber)

      // Check if matric number already exists
      if (voters.some((voter) => voter.matricNumber === newVoter.matricNumber)) {
        setError("A voter with this matric number already exists")
        return
      }

      setVoters([
        ...voters,
        {
          id: Math.max(...voters.map((v) => v.id)) + 1,
          matricNumber: newVoter.matricNumber,
          name: newVoter.name,
          hasVoted: false,
          timestamp: null,
        },
      ])
      setNewVoter({ matricNumber: "", name: "" })
      setShowAddVoter(false)
      setError("")
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        setError("Failed to add voter. Please check the information.")
      }
    }
  }

  const handleDeleteSelected = () => {
    setVoters(voters.filter((voter) => !selectedVoters.includes(voter.id)))
    setSelectedVoters([])
    setShowDeleteDialog(false)
  }

  const toggleSelectVoter = (id: number) => {
    if (selectedVoters.includes(id)) {
      setSelectedVoters(selectedVoters.filter((voterId) => voterId !== id))
    } else {
      setSelectedVoters([...selectedVoters, id])
    }
  }

  const selectAllVoters = () => {
    if (selectedVoters.length === filteredVoters.length) {
      setSelectedVoters([])
    } else {
      setSelectedVoters(filteredVoters.map((voter) => voter.id))
    }
  }

  const handleLogout = () => {
    router.push("/admin/login")
  }

  return (
    <DashboardLayout user={{ name: "Admin", role: "Administrator" }} onLogout={handleLogout} isAdmin>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Voters</h1>
            <p className="text-muted-foreground">Add, edit, or remove voters for the election</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowAddVoter(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Voter
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search voters..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {selectedVoters.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedVoters.length} selected</span>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

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
                    <th className="w-12 py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedVoters.length === filteredVoters.length && filteredVoters.length > 0}
                        onChange={selectAllVoters}
                      />
                    </th>
                    <th className="py-3 px-4 text-left">Matric Number</th>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Timestamp</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        {searchQuery ? "No voters match your search criteria" : "No voters found"}
                      </td>
                    </tr>
                  ) : (
                    filteredVoters.map((voter) => (
                      <tr key={voter.id} className="border-b">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedVoters.includes(voter.id)}
                            onChange={() => toggleSelectVoter(voter.id)}
                          />
                        </td>
                        <td className="py-3 px-4">{voter.matricNumber}</td>
                        <td className="py-3 px-4">{voter.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={voter.hasVoted ? "default" : "outline"}>
                            {voter.hasVoted ? "Voted" : "Not Voted"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{voter.timestamp || "N/A"}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Voter Dialog */}
      <Dialog open={showAddVoter} onOpenChange={setShowAddVoter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Voter</DialogTitle>
            <DialogDescription>Enter the details for the new voter</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="matricNumber">Matric Number</Label>
              <Input
                id="matricNumber"
                placeholder="e.g., 20/52HA085"
                value={newVoter.matricNumber}
                onChange={(e) => setNewVoter({ ...newVoter, matricNumber: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Format: 20/52HA085</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={newVoter.name}
                onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddVoter(false)
                setError("")
                setNewVoter({ matricNumber: "", name: "" })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddVoter}>Add Voter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedVoters.length} selected voter
              {selectedVoters.length !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
