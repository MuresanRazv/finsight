"use server"

import { cookies } from "next/headers"
import { LoginInput, RegisterInput } from "@/lib/validations/auth"

const API_URL = process.env.INTERNAL_API_URL || "http://core-api:8080/api"

export type AuthResponse = {
  success: boolean
  message?: string
  token?: string
}

export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log(response)

    if (!response.ok) {
      // Try to parse error message if available, otherwise default
      try {
        const errorData = await response.json()
        return { success: false, message: errorData.message || "Invalid credentials" }
      } catch {
        return { success: false, message: "Invalid credentials" }
      }
    }

    const result = await response.json()
    
    if (result.token) {
      (await cookies()).set("finsight_session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })
      return { success: true, token: result.token }
    }

    return { success: false, message: "Authentication failed: No token received" }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}

export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      try {
        const errorData = await response.json()
        return { success: false, message: errorData.message || "Registration failed" }
      } catch {
        return { success: false, message: "Registration failed" }
      }
    }

    const result = await response.json()

    if (result.token) {
      (await cookies()).set("finsight_session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      })
      return { success: true, token: result.token }
    }

    return { success: false, message: "Registration successful but login failed" }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}
