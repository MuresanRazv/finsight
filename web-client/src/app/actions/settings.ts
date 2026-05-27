'use server'

import { getSession } from '@/lib/session'
import {
    UserProfileValues,
    ChangePasswordValues,
    UserSettingsValues,
} from '@/lib/validations'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export async function getUserProfile() {
    const session = await getSession()
    if (!session.token) {
        return null
    }

    try {
        const response = await fetch(`${API_URL}/user/me`, {
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
        })

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Failed to fetch user profile', error)
        return null
    }
}

export async function getUserSettings() {
    const session = await getSession()
    if (!session.token) {
        return null
    }

    try {
        const response = await fetch(`${API_URL}/user/settings`, {
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
        })

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Failed to fetch user settings', error)
        return null
    }
}

export async function updateUserProfile(data: UserProfileValues) {
    const session = await getSession()
    if (!session.token) {
        throw new Error('Unauthorized')
    }

    const response = await fetch(`${API_URL}/user/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        throw new Error('Failed to update profile')
    }

    return { success: true }
}

export async function changePassword(data: ChangePasswordValues) {
    const session = await getSession()
    if (!session.token) {
        throw new Error('Unauthorized')
    }

    const response = await fetch(`${API_URL}/user/change-password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        throw new Error('Failed to change password')
    }

    return { success: true }
}

export async function updateUserSettings(data: UserSettingsValues) {
    const session = await getSession()
    if (!session.token) {
        throw new Error('Unauthorized')
    }

    const tickersArray = data.tickers
        ? data.tickers.map((t) => t.trim()).filter((t) => t.length > 0)
        : []

    const response = await fetch(`${API_URL}/user/settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ tickers: tickersArray }),
    })

    if (!response.ok) {
        throw new Error('Failed to update settings')
    }

    return { success: true }
}
