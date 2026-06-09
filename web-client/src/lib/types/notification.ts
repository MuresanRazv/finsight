import { EntitySentiment } from './article'

export interface NotificationDto {
    id: number
    ticker: string
    article_url: string
    article_processed_at: string
    sentiment_score: number
    sentiment_label: string
    is_read: boolean
    created_at: string
    source?: string | null
    article_title?: string | null
    article_overall_sentiment_score?: number | null
    article_overall_sentiment_label?: string | null
    article_entities?: EntitySentiment[] | null
}

