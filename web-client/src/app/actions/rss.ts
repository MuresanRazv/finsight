'use server'

import { getSession } from '@/lib/session'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export type RssSourceItem = {
    id: number
    name: string
    url: string
    is_enabled: boolean
    is_default?: boolean
    item_selector: string
    title_selector: string
    link_selector: string
    link_attribute: string | null
    description_selector: string
    pub_date_selector: string
    pub_date_format: string | null
    created_at: string
}

export type PreviewArticle = {
    title: string
    url: string
    text: string
    published_at: string
}

export type TestRssResponse = {
    success: boolean
    message: string
    articles: PreviewArticle[]
}

export async function getRssSources() {
    try {
        const session = await getSession()
        if (!session.token) return null

        const response = await fetch(`${API_URL}/rss-sources`, {
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) return null
        return (await response.json()) as RssSourceItem[]
    } catch (error) {
        console.error('Failed to get RSS sources:', error)
        return null
    }
}

export async function createRssSource(data: Partial<RssSourceItem>) {
    try {
        const session = await getSession()
        if (!session.token) throw new Error('Unauthorized')

        const response = await fetch(`${API_URL}/rss-sources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(err || 'Failed to create RSS source')
        }

        return (await response.json()) as RssSourceItem
    } catch (error) {
        console.error('Failed to create RSS source:', error)
        throw error
    }
}

export async function updateRssSource(
    id: number,
    data: Partial<RssSourceItem>,
) {
    try {
        const session = await getSession()
        if (!session.token) throw new Error('Unauthorized')

        const response = await fetch(`${API_URL}/rss-sources/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(err || 'Failed to update RSS source')
        }

        return (await response.json()) as RssSourceItem
    } catch (error) {
        console.error('Failed to update RSS source:', error)
        throw error
    }
}

export async function deleteRssSource(id: number) {
    try {
        const session = await getSession()
        if (!session.token) throw new Error('Unauthorized')

        const response = await fetch(`${API_URL}/rss-sources/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
        })

        if (!response.ok) throw new Error('Failed to delete RSS source')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete RSS source:', error)
        throw error
    }
}

export async function testRssSource(
    data: Partial<RssSourceItem>,
): Promise<TestRssResponse> {
    try {
        const session = await getSession()
        if (!session.token)
            return { success: false, message: 'Unauthorized', articles: [] }

        const response = await fetch(`${API_URL}/rss-sources/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            try {
                const errJson = await response.json()
                return {
                    success: false,
                    message: errJson.message || 'Parser test failed.',
                    articles: [],
                }
            } catch {
                return {
                    success: false,
                    message: 'Failed to connect to testing service.',
                    articles: [],
                }
            }
        }

        return (await response.json()) as TestRssResponse
    } catch (error) {
        console.error('Failed to test RSS source:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
        return {
            success: false,
            message: errorMessage,
            articles: [],
        }
    }
}
