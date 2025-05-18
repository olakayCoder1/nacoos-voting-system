"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Helper function to check if user is admin
async function checkAdminAuth() {
  const adminId = cookies().get("admin_id")?.value

  if (!adminId) {
    redirect("/admin/login")
  }

  return adminId
}

// Categories
export async function getCategories() {
  await checkAdminAuth()

  try {
    const supabase = createServerClient()

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      throw error
    }

    return { categories }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return { error: "Failed to fetch categories" }
  }
}

export async function addCategory(formData: FormData) {
  await checkAdminAuth()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const isActive = formData.get("isActive") === "on"

  if (!name) {
    return { error: "Category name is required" }
  }

  try {
    const supabase = createServerClient()

    // Get max display order
    const { data: maxOrder } = await supabase
      .from("categories")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const displayOrder = maxOrder ? (maxOrder.display_order || 0) + 1 : 1

    const { data: newCategory, error } = await supabase
      .from("categories")
      .insert({
        name,
        description,
        is_active: isActive,
        display_order: displayOrder,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/categories")

    return { success: true, category: newCategory }
  } catch (error) {
    console.error("Error adding category:", error)
    return { error: "Failed to add category" }
  }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await checkAdminAuth()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const isActive = formData.get("isActive") === "on"

  if (!name) {
    return { error: "Category name is required" }
  }

  try {
    const supabase = createServerClient()

    const { data: updatedCategory, error } = await supabase
      .from("categories")
      .update({
        name,
        description,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/categories")

    return { success: true, category: updatedCategory }
  } catch (error) {
    console.error("Error updating category:", error)
    return { error: "Failed to update category" }
  }
}

export async function deleteCategory(categoryId: string) {
  await checkAdminAuth()

  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("categories").delete().eq("id", categoryId)

    if (error) {
      throw error
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/categories")

    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { error: "Failed to delete category" }
  }
}

// Candidates
export async function getCandidates(categoryId?: string) {
  await checkAdminAuth()

  try {
    const supabase = createServerClient()

    let query = supabase.from("candidates").select("*, categories(name)")

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    const { data: candidates, error } = await query

    if (error) {
      throw error
    }

    return { candidates }
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return { error: "Failed to fetch candidates" }
  }
}

export async function addCandidate(formData: FormData) {
  await checkAdminAuth()

  const categoryId = formData.get("categoryId") as string
  const name = formData.get("name") as string
  const bio = formData.get("bio") as string
  const imageUrl = formData.get("imageUrl") as string

  if (!categoryId || !name) {
    return { error: "Category and name are required" }
  }

  try {
    const supabase = createServerClient()

    const { data: newCandidate, error } = await supabase
      .from("candidates")
      .insert({
        category_id: categoryId,
        name,
        bio,
        image_url: imageUrl || "/placeholder.svg?height=100&width=100",
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/candidates")

    return { success: true, candidate: newCandidate }
  } catch (error) {
    console.error("Error adding candidate:", error)
    return { error: "Failed to add candidate" }
  }
}

export async function updateCandidate(candidateId: string, formData: FormData) {
  await checkAdminAuth()

  const categoryId = formData.get("categoryId") as string
  const name = formData.get("name") as string
  const bio = formData.get("bio") as string
  const imageUrl = formData.get("imageUrl") as string

  if (!categoryId || !name) {
    return { error: "Category and name are required" }
  }

  try {
    const supabase = createServerClient()

    const { data: updatedCandidate, error } = await supabase
      .from("candidates")
      .update({
        category_id: categoryId,
        name,
        bio,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/candidates")

    return { success: true, candidate: updatedCandidate }
  } catch (error) {
    console.error("Error updating candidate:", error)
    return { error: "Failed to update candidate" }
  }
}

export async function deleteCandidate(candidateId: string) {
  await checkAdminAuth()

  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("candidates").delete().eq("id", candidateId)

    if (error) {
      throw error
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/candidates")

    return { success: true }
  } catch (error) {
    console.error("Error deleting candidate:", error)
    return { error: "Failed to delete candidate" }
  }
}


export async function updateSettings(key: string, value: Record<string, any>) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from("settings")
      .update({ value, updated_at: new Date().toISOString() }) 
      .eq("key", key)

    if (error) {
      console.error("Supabase update error:", error)
      return { error: "Failed to update setting" }
    }

    return { success: true }
  } catch (err) {
    console.error("Unexpected error in updateSettings:", err)
    return { error: "Unexpected error occurred" }
  }
}

// Results and Stats
export async function getVotingResults() {
  await checkAdminAuth()

  try {
    const supabase = createServerClient()

    // Get categories
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })

    if (!categories) {
      return { error: "No categories found" }
    }

    // Get results for each category
    const results = await Promise.all(
      categories.map(async (category) => {
        // Get candidates with vote counts
        const { data: candidates } = await supabase
          .from("candidates")
          .select("id, name, bio, image_url")
          .eq("category_id", category.id)

        if (!candidates) {
          return {
            category,
            candidates: [],
            totalVotes: 0,
          }
        }

        // Get vote counts for each candidate
        const candidatesWithVotes = await Promise.all(
          candidates.map(async (candidate) => {
            const { count } = await supabase
              .from("votes")
              .select("id", { count: "exact", head: true })
              .eq("candidate_id", candidate.id)

            return {
              ...candidate,
              votes: count || 0,
            }
          }),
        )

        const totalVotes = candidatesWithVotes.reduce((sum, candidate) => sum + (candidate.votes || 0), 0)

        return {
          category,
          candidates: candidatesWithVotes,
          totalVotes,
        }
      }),
    )

    // Get overall stats
    const { count: totalVoters } = await supabase.from("users").select("id", { count: "exact", head: true })

    const { count: totalVoted } = await supabase
      .from("votes")
      .select("user_id", { count: "exact", head: true, distinct: true })

    return {
      results,
      stats: {
        totalVoters: totalVoters || 0,
        totalVoted: totalVoted || 0,
        participationRate: totalVoters ? Math.round(((totalVoted || 0) / totalVoters) * 100) : 0,
      },
    }
  } catch (error) {
    console.error("Error fetching voting results:", error)
    return { error: "Failed to fetch voting results" }
  }
}

// Export data
export async function exportVotingData(format: "csv" | "json") {
  await checkAdminAuth()

  try {
    const { results, stats } = (await getVotingResults()) as any

    if (!results) {
      return { error: "No results to export" }
    }

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify({ results, stats }, null, 2),
        filename: `voting-results-${new Date().toISOString().split("T")[0]}.json`,
        contentType: "application/json",
      }
    } else {
      // CSV format
      let csv = "Category,Candidate,Votes,Percentage\n"

      results.forEach((result: any) => {
        const { category, candidates, totalVotes } = result

        candidates.forEach((candidate: any) => {
          const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0
          csv += `"${category.name}","${candidate.name}",${candidate.votes},${percentage}%\n`
        })
      })

      return {
        success: true,
        data: csv,
        filename: `voting-results-${new Date().toISOString().split("T")[0]}.csv`,
        contentType: "text/csv",
      }
    }
  } catch (error) {
    console.error("Error exporting voting data:", error)
    return { error: "Failed to export voting data" }
  }
}
