"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'


export async function castVote(categoryId: string, candidateId: string) {
  try {
    const cookieStore = cookies()
    const userId = (await cookieStore).get("user_id")?.value

    if (!userId) {
      return { error: "You must be logged in to vote" }
    }

    const supabase = createServerClient()

    // Validate voting is active
    const { data: votingSettings } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "voting_active")
      .single()

    if (!votingSettings?.value?.status) {
      return { error: "Voting is currently not active" }
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .maybeSingle()

    if (existingVote) {
      return { error: "You have already voted in this category" }
    }

    // Insert vote
    const { error: voteError } = await supabase.from("votes").insert({
      user_id: userId,
      candidate_id: candidateId,
      category_id: categoryId,
    })

    if (voteError) {
      console.error("Vote insert error:", voteError)
      return { error: "Failed to cast vote: " + voteError.message }
    }

    // Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/results")

    return { success: true, message: "Your vote has been recorded" }
  } catch (error) {
    console.error("Voting error:", error)
    return { error: "An unexpected error occurred while casting your vote" }
  }
}


export async function getVotingStatus() {
  try {
    const supabase = createServerClient()

    const { data: votingSettings } = await supabase.from("settings").select("value").eq("key", "voting_active").single()

    return {
      active: votingSettings?.value.status || false,
      message: votingSettings?.value.message || "Voting is not active",
    }
  } catch (error) {
    console.error("Error getting voting status:", error)
    return { active: false, message: "Could not determine voting status" }
  }
}

export async function getResultsVisibility() {
  try {
    const supabase = createServerClient()

    const { data: resultsSettings } = await supabase.from("settings").select("value").eq("key", "show_results").single()

    return {
      visible: resultsSettings?.value.status || false,
      message: resultsSettings?.value.message || "Results are not yet available",
    }
  } catch (error) {
    console.error("Error getting results visibility:", error)
    return { visible: false, message: "Could not determine results visibility" }
  }
}




/**
 * Server action to fetch voting results
 * Gets real-time data from Supabase
 */
export async function getVotingResults() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    // Verify admin authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return { error: "Unauthorized" }
    }
    
    // Check if user has admin role (implement your own admin check)
    // const isAdmin = await checkIsAdmin(session.user.id);
    // if (!isAdmin) return { error: "Unauthorized" };
    
    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return { error: categoriesError.message }
    }
    
    // Get all candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
    
    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
      return { error: candidatesError.message }
    }
    
    // Get vote counts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('candidate_id, category_id')
    
    if (votesError) {
      console.error('Error fetching votes:', votesError)
      return { error: votesError.message }
    }
    
    // Count unique voters
    const uniqueVoters = new Set(votes.map(vote => vote.user_id))
    const totalVoted = uniqueVoters.size
    
    // Get total registered voters
    const { count: totalVoters, error: countError } = await supabase
      .from('users')  // Adjust if your users table has a different name
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error counting users:', countError)
      return { error: countError.message }
    }
    
    // Calculate participation rate
    const participationRate = totalVoters > 0 
      ? Math.round((totalVoted / totalVoters) * 100) 
      : 0
    
    // Process results by category
    const results = categories.map(category => {
      const categoryCandidates = candidates.filter(c => c.category_id === category.id)
      
      // Count votes for each candidate
      const candidatesWithVotes = categoryCandidates.map(candidate => {
        const voteCount = votes.filter(v => v.candidate_id === candidate.id).length
        
        return {
          ...candidate,
          votes: voteCount,
        }
      })
      
      // Calculate total votes in this category
      const totalVotes = candidatesWithVotes.reduce((sum, c) => sum + c.votes, 0)
      
      return {
        category,
        candidates: candidatesWithVotes,
        totalVotes,
      }
    })
    
    return {
      results,
      stats: {
        totalVoters,
        totalVoted,
        participationRate,
      },
    }
    
  } catch (error) {
    console.error('Error in getVotingResults:', error)
    return { error: "Failed to fetch voting results" }
  }
}


