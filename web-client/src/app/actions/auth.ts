'use server'

import { LoginInput, RegisterInput } from '@/lib/validations/auth'
import { getSession } from '@/lib/session'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export type AuthResponse = {
    success: boolean
    message?: string
    token?: string
}

export async function loginUser(data: LoginInput): Promise<AuthResponse> {
    try {
        const response = await fetch(`${API_URL}/auth/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            try {
                const errorData = await response.json()
                return {
                    success: false,
                    message: errorData.message || 'Invalid credentials',
                }
            } catch {
                return { success: false, message: 'Invalid credentials' }
            }
        }

        const result = await response.json()

        if (result.access_token) {
            const session = await getSession()
            session.token = result.access_token
            session.refreshToken = result.refresh_token
            session.tokenExpiry = result.access_token_expiry
            session.refreshTokenExpiry = result.refresh_token_expiry
            await session.save()

            return { success: true, token: result.access_token }
        }

        return {
            success: false,
            message: 'Authentication failed: No token received',
        }
    } catch (error) {
        console.error('Login error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}

export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            try {
                const errorData = await response.json()
                return {
                    success: false,
                    message: errorData.message || 'Registration failed',
                }
            } catch {
                return { success: false, message: 'Registration failed' }
            }
        }

        const result = await response.json()

        if (result.access_token) {
            const session = await getSession()
            session.token = result.access_token
            session.refreshToken = result.refresh_token
            session.tokenExpiry = result.access_token_expiry
            session.refreshTokenExpiry = result.refresh_token_expiry
            await session.save()

            return { success: true, token: result.access_token }
        }

        return {
            success: false,
            message: 'Registration successful but login failed',
        }
    } catch (error) {
        console.error('Registration error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}

export async function logoutUser() {
    const session = await getSession()
    session.destroy()
}

export async function refreshToken() {
    const session = await getSession()

    if (!session.refreshToken) {
        return { success: false }
    }

    try {
        const response = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session.refreshToken}`,
            },
        })

        if (response.ok) {
            const text = await response.text()
            if (!text) {
                return {
                    success: false,
                    message: 'Empty response from refresh token endpoint',
                }
            }

            const result = JSON.parse(text)
            if (result.access_token) {
                session.token = result.access_token
                session.tokenExpiry = result.access_token_expiry
                if (result.refresh_token) {
                    session.refreshToken = result.refresh_token
                    session.refreshTokenExpiry = result.refresh_token_expiry
                }
                await session.save()
                return { success: true, token: result.access_token }
            }
        }
    } catch (error) {
        console.error('Refresh token error:', error)
    }

    return { success: false }
}

export async function updateUserSession(): Promise<AuthResponse> {
    const session = await getSession()
    const now = Date.now()

    if (!session.token || session.tokenExpiry - now <= 0) {
        const refreshResult = await refreshToken()
        if (!refreshResult.success) {
            return {
                success: false,
                message: 'Session expired. Please log in again.',
            }
        }
    }

    try {
        const response = await fetch(`${API_URL}/user/me`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
        })

        if (response.ok) {
            const result = await response.json()
            session.user = { ...result }
            await session.save()
            await getSession()
            return { success: true }
        } else {
            const errorData = await response.json().catch(() => null)
            return {
                success: false,
                message: errorData?.message || 'Failed to fetch user data.',
            }
        }
    } catch (error) {
        console.error('Update user session error:', error)
        return {
            success: false,
            message: 'An error occurred while updating the session.',
        }
    }
}
