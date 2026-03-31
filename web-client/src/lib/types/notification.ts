export interface NotificationDto {
    id: number
    ticker: string
    article_url: string
    article_processed_at: string
    sentiment_score: number
    sentiment_label: string
    is_read: boolean
    created_at: string
}
