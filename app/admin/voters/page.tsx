"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Plus, Download, Upload, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function AdminVoters() {
  const router = useRouter()
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddVoter, setShowAddVoter] = useState(false)
  const [newVoter, setNewVoter] = useState({ matric_number: "", name: "", email: "", level: "" }) // Added email and level
  const [error, setError] = useState("")
  const [selectedVoters, setSelectedVoters] = useState([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Fetch voters on component mount
  useEffect(() => {
    fetchVoters()
  }, [])

  const fetchVoters = async () => {
    try {
      setLoading(true)
      
      // Fetch users from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('id, matric_number, name, email, inserted_at, level, is_active')
      
      if (error) throw error
      
      // Transform the data to match our component's expected format
      const formattedData = data.map(user => ({
        id: user.id,
        matric_number: user.matric_number,
        name: user.name,
        email: user.email, // Fixed typo from 'enail' to 'email'
        level: user.level || "",
        is_active: user.is_active || false,
        inserted_at: user.inserted_at ? new Date(user.inserted_at).toLocaleString() : null
      }))
      
      setVoters(formattedData)
    } catch (error) {
      console.error("Error fetching voters:", error.message)
      toast({
        title: "Error",
        description: "Failed to load voters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredVoters = voters.filter(
    (voter) =>
      voter.matric_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddVoter = async () => {
    try {
      if (!newVoter.matric_number || !newVoter.name || !newVoter.email) {
        setError("Matric number, name, and email are required")
        return
      }
      
      // Validate matric number format
      const matricRegex = /^\d{2}\/\d{2}HA\d{3}$/
      if (!matricRegex.test(newVoter.matric_number)) {
        setError("Invalid matric number format. Example: 20/52HA085")
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newVoter.email)) {
        setError("Invalid email format")
        return
      }

      setLoading(true)
      
      // Check if voter with same matric number already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('matric_number', newVoter.matric_number)
        .single()
      
      if (existingUser) {
        setError("A voter with this matric number already exists")
        setLoading(false)
        return
      }

      const { data: existingUserEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', newVoter.email)
        .single()
      
      if (existingUserEmail) {
        setError("A voter with this email already exists")
        setLoading(false)
        return
      }
      
      // Insert new voter into Supabase
      const { data, error } = await supabase
        .from('users')
        .insert([{
          matric_number: newVoter.matric_number,
          name: newVoter.name,
          email: newVoter.email,
          level: newVoter.level || "",
          is_active: false,
        }])
        .select()
      
      if (error) throw error
      
      // Add the new voter to state
      setVoters([
        ...voters, 
        {
          id: data[0].id,
          matric_number: data[0].matric_number,
          name: data[0].name,
          email: data[0].email,
          level: data[0].level || "",
          is_active: data[0].is_active || false,
          inserted_at: data[0].inserted_at ? new Date(data[0].inserted_at).toLocaleString() : null
        }
      ])
      
      setNewVoter({ matric_number: "", name: "", email: "", level: "" })
      setShowAddVoter(false)
      setError("")
      toast({
        title: "Success",
        description: "Voter added successfully",
      })
    } catch (err) {
      console.error("Error adding voter:", err.message)
      setError("Failed to add voter. Please check the information.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSelected = async () => {
    try {
      setLoading(true)
      
      // Delete selected voters from Supabase
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', selectedVoters)
      
      if (error) throw error
      
      // Update local state by filtering out deleted voters
      setVoters(voters.filter(voter => !selectedVoters.includes(voter.id)))
      setSelectedVoters([])
      setShowDeleteDialog(false)
      
      toast({
        title: "Success",
        description: `${selectedVoters.length} voter(s) deleted successfully`,
      })
    } catch (error) {
      console.error("Error deleting voters:", error.message)
      toast({
        title: "Error",
        description: "Failed to delete voters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVoter = async (id) => {
    try {
      setLoading(true)
      
      // Delete voter from Supabase
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Update local state
      setVoters(voters.filter(voter => voter.id !== id))
      
      toast({
        title: "Success",
        description: "Voter deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting voter:", error.message)
      toast({
        title: "Error",
        description: "Failed to delete voter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectVoter = (id) => {
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

  const handleImportVoters = async (e) => {
    try {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const csvData = event.target.result
          const rows = csvData.split('\n')
          
          // Skip header row and filter out empty rows
          const votersToImport = rows.slice(1)
            .filter(row => row.trim())
            .map(row => {
              const [matric_number, name, email, level] = row.split(',').map(item => item.trim())
              return { 
                matric_number, 
                name, 
                email: email || "", 
                level: level || "",
                is_active: false 
              }
            })
            .filter(voter => voter.matric_number && voter.name)
          
          if (votersToImport.length === 0) {
            toast({
              title: "Error",
              description: "No valid voters found in the CSV file",
              variant: "destructive",
            })
            return
          }
          
          setLoading(true)
          
          // Insert voters in batches to avoid hitting limits
          const { data, error } = await supabase
            .from('users')
            .insert(votersToImport)
            .select()
          
          if (error) throw error
          
          // Update local state with new voters
          const newVoters = data.map(user => ({
            id: user.id,
            matric_number: user.matric_number,
            name: user.name,
            email: user.email || "",
            level: user.level || "",
            is_active: user.is_active || false,
            inserted_at: user.inserted_at ? new Date(user.inserted_at).toLocaleString() : null
          }))
          
          setVoters([...voters, ...newVoters])
          
          toast({
            title: "Success",
            description: `${newVoters.length} voters imported successfully`,
          })
        } catch (error) {
          console.error("Error importing voters:", error.message)
          toast({
            title: "Error",
            description: "Failed to import voters. Please check the file format.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
      
      reader.readAsText(file)
    } catch (error) {
      console.error("Error reading file:", error.message)
    }
  }

  const handleExportVoters = async () => {
    try {
      // Create CSV header
      const csvRows = ["Matric Number,Name,Email,Level,Status,Timestamp"]
      
      // Add data rows
      voters.forEach(voter => {
        csvRows.push(`${voter.matric_number},${voter.name},${voter.email || ""},${voter.level || ""},${voter.is_active ? "Active" : "Inactive"},${voter.inserted_at || ""}`)
      })
      
      // Create download link
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `voters_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting voters:", error.message)
      toast({
        title: "Error",
        description: "Failed to export voters",
        variant: "destructive",
      })
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
            <Button variant="outline" onClick={handleExportVoters}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
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
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                      <th className="py-3 px-4 text-left">Email</th>
                      <th className="py-3 px-4 text-left">Level</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Timestamp</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVoters.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-muted-foreground">
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
                          <td className="py-3 px-4">{voter.matric_number}</td>
                          <td className="py-3 px-4">{voter.name}</td>
                          <td className="py-3 px-4">{voter.email || "N/A"}</td>
                          <td className="py-3 px-4">{voter.level || "N/A"}</td>
                          <td className="py-3 px-4">
                            <Badge variant={voter.is_active ? "default" : "outline"}>
                              {voter.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{voter.inserted_at || "N/A"}</td>
                          <td className="py-3 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleDeleteVoter(voter.id)}
                            >
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
            )}
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
              <Label htmlFor="matric_number">Matric Number</Label>
              <Input
                id="matric_number"
                placeholder="e.g., 20/52HA085"
                value={newVoter.matric_number}
                onChange={(e) => setNewVoter({ ...newVoter, matric_number: e.target.value })}
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newVoter.email}
                onChange={(e) => setNewVoter({ ...newVoter, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                placeholder="e.g., 100, 200, 300, 400"
                value={newVoter.level}
                onChange={(e) => setNewVoter({ ...newVoter, level: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddVoter(false)
                setError("")
                setNewVoter({ matric_number: "", name: "", email: "", level: "" })
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddVoter}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Voter'
              )}
            </Button>
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
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}