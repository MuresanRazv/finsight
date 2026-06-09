'use server'

import { getSession } from '@/lib/session'
import { ArticleDto } from '@/lib/types/article'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export async function getArticleDetail(
    url: string,
    processedAt: string,
): Promise<ArticleDto | null> {
    const session = await getSession()
    if (!session.token) {
        return null
    }

    try {
        const queryString = new URLSearchParams({
            url: url,
            processed_at: processedAt,
        }).toString()

        const response = await fetch(
            `${API_URL}/articles/detail?${queryString}`,
            {
                headers: {
                    Authorization: `Bearer ${session.token}`,
                },
                cache: 'no-store',
            },
        )

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Failed to fetch article detail:', error)
        return null
    }
}

export interface TickerRelatedNewsItem {
    title: string
    source: string
    url: string
    processed_at: string
    sentiment: 'positive' | 'neutral' | 'negative'
    sentiment_score: number
}

export async function getTickerRelatedNews(
    ticker: string,
    limit: number = 3,
): Promise<TickerRelatedNewsItem[] | null> {
    const session = await getSession()
    if (!session.token) {
        return null
    }

    try {
        const response = await fetch(
            `${API_URL}/articles/ticker/${ticker}?limit=${limit}`,
            {
                headers: {
                    Authorization: `Bearer ${session.token}`,
                },
                cache: 'no-store',
            },
        )

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error(`Failed to fetch related news for ${ticker}:`, error)
        return null
    }
}
