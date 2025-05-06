"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

export function useRealTimeVotes(categoryId?: string) {
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch of vote counts
    const fetchVoteCounts = async () => {
      try {
        setLoading(true)

        let query = supabase.from("candidates").select("id")

        if (categoryId) {
          query = query.eq("category_id", categoryId)
        }

        const { data: candidates, error: candidatesError } = await query

        if (candidatesError) {
          throw candidatesError
        }

        const voteCounts: Record<string, number> = {}

        // Get vote count for each candidate
        await Promise.all(
          candidates.map(async (candidate) => {
            const { count, error: countError } = await supabase
              .from("votes")
              .select("id", { count: "exact", head: true })
              .eq("candidate_id", candidate.id)

            if (countError) {
              throw countError
            }

            voteCounts[candidate.id] = count || 0
          }),
        )

        setVotes(voteCounts)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching vote counts:", err)
        setError("Failed to fetch vote counts")
        setLoading(false)
      }
    }

    fetchVoteCounts()

    // Subscribe to vote changes
    const subscription = supabase
      .channel("votes-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          ...(categoryId ? { filter: `category_id=eq.${categoryId}` } : {}),
        },
        async (payload) => {
          // Refresh vote counts when votes change
          fetchVoteCounts()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [categoryId])

  return { votes, loading, error }
}
