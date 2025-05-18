"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

/**
 * Custom hook for fetching and organizing election data in real-time
 * @param interval Polling interval in milliseconds
 * @returns Object containing formatted results, statistics, loading state, and any error
 */
export function useRealTimeVotes(interval = 15000) {
  const [results, setResults] = useState([])
  const [stats, setStats] = useState({
    totalVoters: 0,
    totalVoted: 0,
    participationRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false) // New state for refresh operations
  const [error, setError] = useState(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false) // Track initial load

  useEffect(() => {
    let mounted = true
    
    const fetchElectionData = async () => {
      if (!mounted) return
      
      try {
        // Only set loading on initial load, not during refreshes
        if (!initialLoadComplete) {
          setIsLoading(true)
        } else {
          setIsRefreshing(true) // Use separate state for refreshes
        }

        // 1. Fetch all categories
        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name")
        
        if (categoriesError) throw categoriesError

        // 2. Fetch all candidates with their categories
        const { data: candidates, error: candidatesError } = await supabase
          .from("candidates")
          .select("*, category:category_id(id, name)")
          .eq("is_active", true)
        
        if (candidatesError) throw candidatesError

        // 3. Count total unique voters in the system
        const { count: totalVotersCount, error: votersCountError } = await supabase
          .from("votes")
          .select("user_id", { count: "exact", head: true })
          .not("user_id", "is", null)
        
        if (votersCountError) throw votersCountError

        // 4. Count distinct users who have voted
        const { data: distinctVoters, error: distinctVotersError } = await supabase
          .from("votes")
          .select("user_id")
          .not("user_id", "is", null)
        
        if (distinctVotersError) throw distinctVotersError
        
        // Get unique voter count using Set
        const uniqueVoters = new Set(distinctVoters.map(vote => vote.user_id))
        const totalVoted = uniqueVoters.size

        // 5. Fetch all votes to count per candidate (optimized query)
        const { data: votes, error: votesError } = await supabase
          .from("votes")
          .select("candidate_id, category_id")
        
        if (votesError) throw votesError

        // Aggregate votes per candidate
        const voteCounts = votes.reduce((acc, vote) => {
          acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1
          return acc
        }, {})

        // Process the data into the required format
        const processedResults = categories.map(category => {
          // Get candidates for this category
          const categoryCandidates = candidates
            .filter(candidate => candidate.category_id === category.id)
            .map(candidate => {
              // Get vote count for this candidate
              const candidateVotes = voteCounts[candidate.id] || 0
              
              return {
                id: candidate.id,
                name: candidate.name,
                votes: candidateVotes,
                image_url: candidate.photo_url || null,
              }
            })

          // Calculate total votes for this category
          const totalCategoryVotes = categoryCandidates.reduce((sum, candidate) => sum + candidate.votes, 0)

          return {
            category: {
              id: category.id,
              name: category.name,
              description: category.description,
              is_active: category.is_active
            },
            candidates: categoryCandidates,
            totalVotes: totalCategoryVotes
          }
        })

        // Calculate participation rate
        const participationRate = totalVotersCount > 0 
          ? Math.round((totalVoted / totalVotersCount) * 100) 
          : 0

        if (mounted) {
          setResults(processedResults)
          setStats({
            totalVoters: totalVotersCount || 0,
            totalVoted: totalVoted || 0,
            participationRate
          })
          setError(null)
          setIsLoading(false)
          setIsRefreshing(false)
          
          // Mark initial load as complete after first successful data fetch
          if (!initialLoadComplete) {
            setInitialLoadComplete(true)
          }
        }
      } catch (err) {
        console.error("Error fetching election data:", err)
        if (mounted) {
          setError("Failed to fetch election data")
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    // Fetch data immediately on mount
    fetchElectionData()
    
    // Set up polling interval
    const intervalId = setInterval(fetchElectionData, 15000)
    
    // Clean up function
    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [interval, initialLoadComplete])

  return { 
    results, 
    stats, 
    isLoading, 
    isRefreshing, // Export the refreshing state
    error 
  }
}