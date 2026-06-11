'use server'

import { getSession } from '@/lib/session'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export type IngestionRequestItem = {
    id: number
    url: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
    created_at: string
    completed_at: string | null
    article_title: string | null
    article_sentiment_label: string | null
    article_sentiment_score: number | null
    article_processed_at: string | null
    article_uuid: string | null
    error_message: string | null
    source: string | null
}

export type IngestResponse = {
    success: boolean
    message?: string
    data?: IngestionRequestItem
}

export type PaginatedResponse<T> = {
    content: T[]
    total_pages: number
    total_elements: number
    number: number
    size: number
    first: boolean
    last: boolean
    empty: boolean
}

export type GetIngestionsResponse = {
    success: boolean
    message?: string
    data?: PaginatedResponse<IngestionRequestItem>
}

export async function ingestArticle(data: {
    url: string
    title?: string
    text?: string
    source?: string
}): Promise<IngestResponse> {
    try {
        const session = await getSession()

        if (!session.token) {
            return { success: false, message: 'Unauthorized' }
        }

        const response = await fetch(`${API_URL}/articles/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            try {
                const errorData = await response.json()
                return {
                    success: false,
                    message: errorData.message || 'Failed to submit article for processing.',
                }
            } catch {
                const errorText = await response.text()
                return {
                    success: false,
                    message: errorText || 'Failed to submit article for processing.',
                }
            }
        }

        const result: IngestionRequestItem = await response.json()
        return { success: true, data: result }
    } catch (error) {
        console.error('Ingest article error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}

export async function getMyIngestions(
    page = 0,
    size = 10,
): Promise<GetIngestionsResponse> {
    try {
        const session = await getSession()

        if (!session.token) {
            return { success: false, message: 'Unauthorized' }
        }

        const response = await fetch(
            `${API_URL}/articles/my-processing?page=${page}&size=${size}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.token}`,
                },
                cache: 'no-store',
            },
        )

        if (!response.ok) {
            return { success: false, message: 'Failed to retrieve ingestions.' }
        }

        const result: PaginatedResponse<IngestionRequestItem> =
            await response.json()
        return { success: true, data: result }
    } catch (error) {
        console.error('Get my ingestions error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}

export async function bulkIngestArticles(
    urls: string[],
): Promise<IngestResponse> {
    try {
        const session = await getSession()

        if (!session.token) {
            return { success: false, message: 'Unauthorized' }
        }

        const response = await fetch(`${API_URL}/articles/process/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({ urls }),
        })

        if (!response.ok) {
            try {
                const errorData = await response.json()
                return {
                    success: false,
                    message: errorData.message || 'Failed to submit articles for bulk processing.',
                }
            } catch {
                const errorText = await response.text()
                return {
                    success: false,
                    message: errorText || 'Failed to submit articles for bulk processing.',
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error('Bulk ingest articles error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}
