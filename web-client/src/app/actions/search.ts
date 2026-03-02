"use server"

import { getSession } from "@/lib/session"
import { SearchInput } from "@/lib/validations/search"

const API_URL = process.env.INTERNAL_API_URL || "http://core-api:8080/api"

export type SearchResponse = {
  success: boolean
  message?: string
  data?: string
}

export async function semanticSearch(data: SearchInput): Promise<SearchResponse> {
  try {
    const session = await getSession();

    if (!session.token) {
      return { success: false, message: "Unauthorized" }
    }

    const response = await fetch(`${API_URL}/search/semantic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.token}`
      },
      body: JSON.stringify({
        query: data.query
      }),
    })

    console.log(response)

    if (!response.ok) {
      try {
        const errorData = await response.json()
        return { success: false, message: errorData.message || "Search failed" }
      } catch {
        return { success: false, message: "Search failed" }
      }
    }

    const result = await response.text()
    return { success: true, data: result }
  } catch (error) {
    console.error("Search error:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}
