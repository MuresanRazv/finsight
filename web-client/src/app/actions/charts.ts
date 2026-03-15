'use server'

import { getSession } from '@/lib/session'
import { ChartDataResponse } from '@/lib/types/charts'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

async function fetchWithAuth<T>(
    endpoint: string,
    params?: Record<string, string>,
): Promise<T> {
    const session = await getSession()

    const url = new URL(`${API_URL}${endpoint}`)
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value)
            }
        })
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`
    }

    const response = await fetch(url.toString(), {
        headers,
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export async function getPopularTickers(filters: Record<string, string> = {}) {
    return fetchWithAuth<ChartDataResponse>('/charts/popular-tickers', filters)
}

export async function getMyTickers(filters: Record<string, string> = {}) {
    return fetchWithAuth<ChartDataResponse>('/charts/my-tickers', filters)
}

export async function getLatestArticles(filters: Record<string, string> = {}) {
    return fetchWithAuth<ChartDataResponse>('/charts/latest-articles', filters)
}

export async function getGeneralMarketSentiment(
    filters: Record<string, string> = {},
) {
    return fetchWithAuth<ChartDataResponse>(
        '/charts/general-market-sentiment',
        filters,
    )
}
