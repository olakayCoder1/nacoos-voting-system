"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function castVote(categoryId: string, candidateId: string) {
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return { error: "You must be logged in to vote" }
  }

  try {
    const supabase = createServerClient()

    // Check if voting is active
    const { data: votingSettings } = await supabase.from("settings").select("value").eq("key", "voting_active").single()

    if (!votingSettings?.value.status) {
      return { error: "Voting is currently not active" }
    }

    // Check if user has already voted in this category
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .single()

    if (existingVote) {
      return { error: "You have already voted in this category" }
    }

    // Cast vote
    const { error: voteError } = await supabase.from("votes").insert({
      user_id: userId,
      candidate_id: candidateId,
      category_id: categoryId,
    })

    if (voteError) {
      return { error: "Failed to cast vote" }
    }

    revalidatePath("/dashboard")
    revalidatePath("/results")

    return { success: true, message: "Your vote has been recorded" }
  } catch (error) {
    console.error("Voting error:", error)
    return { error: "An error occurred while casting your vote" }
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
