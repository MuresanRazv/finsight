'use server'

import { getSession } from '@/lib/session'

const API_URL = process.env.INTERNAL_API_URL || 'http://core-api:8080/api'

export interface MetricRun {
    timestamp: string
    duration: number
    status: 'success' | 'failed'
    article_count: number
    error?: string | null
    metadata?: Record<string, any>
}

export interface MetricDetail {
    action: string
    total_executions: number
    total_time_seconds: number
    success_count: number
    error_count: number
    failure_rate: number
    avg_execution_time_seconds: number
    total_articles_processed: number
    avg_time_per_article_seconds: number
    recent_history: MetricRun[]
}

export type ObservabilityMetricsResponse = Record<string, MetricDetail>

export async function getObservabilityMetrics(): Promise<ObservabilityMetricsResponse | null> {
    const session = await getSession()
    if (!session.token) {
        return null
    }

    try {
        const response = await fetch(`${API_URL}/observability/metrics`, {
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            console.error('Failed to get observability metrics: Status', response.status)
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Failed to fetch observability metrics:', error)
        return null
    }
}

export async function clearObservabilityMetrics(action?: string): Promise<{ success: boolean; message: string }> {
    const session = await getSession()
    if (!session.token) {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        const url = action 
            ? `${API_URL}/observability/metrics/clear?action=${action}`
            : `${API_URL}/observability/metrics/clear`
            
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
        })

        if (!response.ok) {
            console.error('Failed to clear observability metrics: Status', response.status)
            return { success: false, message: 'Failed to clear metrics from server.' }
        }

        return await response.json()
    } catch (error) {
        console.error('Failed to clear observability metrics:', error)
        return { success: false, message: 'Failed to clear metrics due to an error.' }
    }
}
