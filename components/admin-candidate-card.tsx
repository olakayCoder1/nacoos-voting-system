"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"

interface AdminCandidateCardProps {
  candidate: {
    id: number
    name: string
    bio: string
    image: string
    votes: number
  }
  categoryId: string
  onDelete?: () => void
}

export function AdminCandidateCard({ candidate, categoryId, onDelete }: AdminCandidateCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
    setShowDeleteDialog(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="relative pb-0">
          <div className="absolute right-4 top-4">
            <Badge variant="outline">{candidate.votes} votes</Badge>
          </div>
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={candidate.image || "/placeholder.svg"} alt={candidate.name} />
              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4 text-center">{candidate.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-center text-sm text-muted-foreground">{candidate.bio}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove {candidate.name} from the {categoryId.replace("-", " ")} category?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
