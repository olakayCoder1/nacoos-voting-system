"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddCandidateFormProps {
  categories: Array<{ id: string; name: string; isActive: boolean }>
  onSubmit: (candidate: { name: string; bio: string; image: string }) => void
  onCancel: () => void
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function AddCandidateForm({
  categories,
  onSubmit,
  onCancel,
  selectedCategory,
  onCategoryChange,
}: AddCandidateFormProps) {
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState("/placeholder.svg?height=100&width=100")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, bio, image })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
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

      <div className="space-y-2">
        <Label htmlFor="name">Candidate Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter candidate name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Enter candidate bio"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Enter image URL" />
        <p className="text-xs text-muted-foreground">Leave as default for a placeholder image</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Candidate</Button>
      </div>
    </form>
  )
}
