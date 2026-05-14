export interface EntitySentiment {
    name?: string
    ticker?: string
    sentiment_score: number
    sentiment_label: string
}

export interface ArticleDto {
    url: string
    title: string
    overall_sentiment_score: number
    overall_sentiment_label: string
    entities: EntitySentiment[]
    semantic_vector_id: string
    processed_at: string
}

export interface FilterDefinition {
    key?: string
    label?: string
    type?: 'DATE_RANGE' | 'SELECT' | 'MULTI_SELECT'
    options?: string[]
    default_value?: any
}
