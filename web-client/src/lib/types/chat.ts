export interface EntitySentiment {
    name: string
    ticker: string | null
    sentiment_score: number | null
    sentiment_label: string
}

export interface ArticleStats {
    url: string
    overall_sentiment_label: string
    entities: EntitySentiment[]
}

export interface ChatResponse {
    answer: string
    sources: ArticleStats[]
}
