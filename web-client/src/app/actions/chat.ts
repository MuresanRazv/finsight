'use server'

import { getSession } from '@/lib/session'
import { SearchInput } from '@/lib/validations/search'
import { ChatResponse } from '@/lib/types/chat'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export type ChatActionResponse = {
    success: boolean
    message?: string
    data?: ChatResponse
}

export async function chatQuery(
    data: SearchInput,
): Promise<ChatActionResponse> {
    try {
        const session = await getSession()

        if (!session.token) {
            return { success: false, message: 'Unauthorized' }
        }

        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({ query: data.query }),
        })

        if (!response.ok) {
            try {
                const errorData = await response.json()
                return {
                    success: false,
                    message: errorData.message || 'Chat failed',
                }
            } catch {
                return { success: false, message: 'Chat failed' }
            }
        }

        const result: ChatResponse = await response.json()
        return { success: true, data: result }
    } catch (error) {
        console.error('Chat error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}
