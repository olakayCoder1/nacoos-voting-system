"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

interface CandidateCardProps {
  candidate: {
    photo_url: string
    id: string
    name: string
    bio?: string
    image_url?: string
  }
  isVoted: boolean
  isVotingActive: boolean
  hasVotedInCategory: boolean
  onVote: () => void
  voteCount?: number
  showVotes?: boolean
}

export function CandidateCard({
  candidate,
  isVoted,
  isVotingActive,
  hasVotedInCategory,
  onVote,
  voteCount = 0,
  showVotes = false,
}: CandidateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className={`h-full ${isVoted ? "border-primary" : ""}`}>
        <CardHeader className="relative pb-0">
          {isVoted && (
            <div className="absolute right-4 top-4">
              <Badge className="bg-primary">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Voted
              </Badge>
            </div>
          )}
          {showVotes && (
            <div className="absolute right-4 top-4">
              <Badge variant="outline">{voteCount} votes</Badge>
            </div>
          )}
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={candidate.photo_url || "/placeholder.svg"} alt={candidate.name} />
              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4 text-center">{candidate.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-center text-sm text-muted-foreground">{candidate.bio}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={onVote}
            disabled={!isVotingActive || hasVotedInCategory}
            variant={isVoted ? "outline" : "default"}
            className={isVoted ? "border-primary text-primary" : ""}
          >
            {isVoted ? "Voted" : hasVotedInCategory ? "Already Voted" : "Vote"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
