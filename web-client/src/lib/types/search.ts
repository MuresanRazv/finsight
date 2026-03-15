export interface EntitySentiment {
    name: string
    ticker: string | null
    sentiment_score: number
    sentiment_label: string
}

export interface SearchResultItem {
    url: string
    title: string
    source: string
    published_at: string
    sentiment_label: string
    sentiment_score: number
    relevance_score: number
    entities: EntitySentiment[]
}

export type SearchResponseData = SearchResultItem[]
