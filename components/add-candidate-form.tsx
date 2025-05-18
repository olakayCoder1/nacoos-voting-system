import { useState, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@supabase/supabase-js"

interface Category {
  id: string
  name: string
}

interface AddCandidateFormProps {
  categories: Category[]
  onSubmit: (candidate: { name: string; bio: string; image: string }) => void
  onCancel: () => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
}

export default function AddCandidateForm({
  categories,
  onSubmit,
  onCancel,
  selectedCategory,
  onCategoryChange,
}: AddCandidateFormProps) {
  const [name, setName] = useState<string>("")
  const [bio, setBio] = useState<string>("")
  const [image, setImage] = useState<string>("/placeholder.svg?height=100&width=100")
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string>("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert("Please enter a name for the candidate")
      return
    }
    
    if (!selectedCategory) {
      alert("Please select a category")
      return
    }
    
    onSubmit({ name, bio, image })
    
    // Reset form
    setName("")
    setBio("")
    setImage("/placeholder.svg?height=100&width=100")
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError("Please upload an image file")
      return
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB")
      return
    }
    
    try {
      setIsUploading(true)
      setUploadError("")
      
      // Create a Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('candidate-photos')
        .upload(`public/${fileName}`, file)
      
      if (error) throw error
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('candidate-photos')
        .getPublicUrl(`public/${fileName}`)
      
      setImage(publicUrlData.publicUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      setUploadError("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={onCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
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
        
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter candidate name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Enter candidate bio"
            rows={4}
          />
        </div>
        
        <div>
          <Label htmlFor="image">Profile Image</Label>
          <div className="mt-2 flex items-center gap-4">
            <img
              src={image}
              alt="Candidate preview"
              className="h-20 w-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              {uploadError && <p className="mt-1 text-sm text-destructive">{uploadError}</p>}
              {isUploading && <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isUploading}>
          Add Candidate
        </Button>
      </div>
    </form>
  )
}
