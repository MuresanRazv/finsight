"use server"

import { getSession } from "@/lib/session"
import { SearchInput } from "@/lib/validations/search"
import { SearchResultItem } from "@/lib/types/search"

const API_URL = process.env.INTERNAL_API_URL || "http://core-api:8080/api"

export type SearchResponse = {
  success: boolean
  message?: string
  data?: SearchResultItem[]
}

export async function semanticSearch(data: SearchInput): Promise<SearchResponse> {
  try {
    const session = await getSession();

    if (!session.token) {
      return { success: false, message: "Unauthorized" }
    }

    const queryString = new URLSearchParams({
      query: data.query,
      limit: "10"
    }).toString()

    const response = await fetch(`${API_URL}/search/semantic?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.token}`
      },
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        return { success: false, message: errorData.message || "Search failed" }
      } catch {
        return { success: false, message: "Search failed" }
      }
    }

    const result: SearchResultItem[] = await response.json()
    return { success: true, data: result }
  } catch (error) {
    console.error("Search error:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}
