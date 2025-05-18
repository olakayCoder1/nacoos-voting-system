"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface AddCategoryFormProps {
  onSubmit: (category: { name: string; isActive: boolean }) => void
  onCancel: () => void
}

export default function AddCategoryForm({ onSubmit, onCancel }: AddCategoryFormProps) {
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, isActive })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="active">{isActive ? "Active" : "Inactive"}</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Category</Button>
      </div>
    </form>
  )
}
