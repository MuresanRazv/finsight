'use server'

import { getSession } from '@/lib/session'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export async function getNotifications() {
    const session = await getSession()
    if (!session.token) {
        return null
    }

    try {
        const response = await fetch(`${API_URL}/notifications`, {
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
        })

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Failed to fetch notifications', error)
        return null
    }
}

export async function markAsRead(id: number) {
    const session = await getSession()
    if (!session.token) {
        throw new Error('Unauthorized')
    }

    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to mark notification as read')
    }

    return { success: true }
}

export async function markAllAsRead() {
    const session = await getSession()
    if (!session.token) {
        throw new Error('Unauthorized')
    }

    const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${session.token}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
    }

    return { success: true }
}
