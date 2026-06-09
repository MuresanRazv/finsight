'use client'

import { SearchResultItem } from '@/lib/types/search'
import { ExternalLink } from 'lucide-react'
import { TickerBadge } from '@/components/ui/ticker-badge'
import Link from 'next/link'
import { cleanArticleTitle } from '@/lib/utils'

interface SearchResultProps {
    results: SearchResultItem[]
}

export function SearchResult({ results }: SearchResultProps) {
    if (!results || results.length === 0) {
        return <div className='text-muted-foreground'>No results found.</div>
    }

    return (
        <div className='dark space-y-4'>
            {results.map((result, index) => (
                <SearchResultCard key={index} result={result} />
            ))}
        </div>
    )
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
    let sentimentClasses =
        'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20'

    if (result.sentiment_label === 'positive') {
        sentimentClasses =
            'bg-sentiment-positive/10 text-sentiment-positive border border-sentiment-positive/20'
    } else if (result.sentiment_label === 'negative') {
        sentimentClasses =
            'bg-sentiment-negative/10 text-sentiment-negative border border-sentiment-negative/20'
    }

    const cleanedTitle = cleanArticleTitle(
        result.title,
        result.source,
        result.url,
    )

    return (
        <div className='bg-card border-border hover:border-muted-foreground/50 flex flex-col justify-between gap-4 rounded-xl border p-5 transition-colors sm:flex-row'>
            <div className='flex-1 space-y-3'>
                <div className='flex items-start gap-2'>
                    <h3 className='text-foreground hover:text-primary cursor-pointer text-xl leading-tight font-semibold transition-colors'>
                        <Link
                            href={{
                                pathname: '/articles/deep-dive',
                                query: {
                                    url: result.url,
                                    processed_at: result.published_at,
                                },
                            }}
                        >
                            {cleanedTitle}
                        </Link>
                    </h3>
                    <a
                        href={result.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-muted-foreground hover:text-foreground mt-1 shrink-0'
                    >
                        <ExternalLink className='h-4 w-4' />
                    </a>
                </div>

                <div className='text-muted-foreground text-sm'>
                    {result.source} •{' '}
                    {new Date(result.published_at).toLocaleDateString()}
                </div>

                <div className='flex flex-wrap items-center gap-3 pt-1'>
                    {result.entities.map((entity, i) => {
                        if (entity.ticker && entity.ticker.length > 0) {
                            return (
                                <TickerBadge
                                    key={i}
                                    ticker={entity.ticker}
                                    className='bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-medium'
                                >
                                    {entity.name} ({entity.ticker})
                                </TickerBadge>
                            )
                        }

                        return (
                            <span
                                key={i}
                                className='bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-medium'
                            >
                                {entity.name}
                            </span>
                        )
                    })}
                    <span className='text-muted-foreground text-xs'>
                        Relevance:{' '}
                        <span className='text-foreground font-medium'>
                            {(result.relevance_score * 100).toFixed(0)}%
                        </span>
                    </span>
                </div>
            </div>

            <div className='flex shrink-0 flex-col items-end space-y-2'>
                <span
                    className={`rounded-full px-4 py-1 text-xs font-semibold tracking-wide capitalize ${sentimentClasses}`}
                    style={
                        result.sentiment_label?.toLowerCase() !== 'positive' &&
                        result.sentiment_label?.toLowerCase() !== 'negative'
                            ? {
                                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                  color: '#eab308',
                                  borderColor: 'rgba(234, 179, 8, 0.2)',
                              }
                            : undefined
                    }
                >
                    {result.sentiment_label}
                </span>
                <span className='text-muted-foreground text-xs'>
                    Confidence Score:{' '}
                    <span className='text-foreground font-medium'>
                        {result.sentiment_score.toFixed(2)}
                    </span>
                </span>
            </div>
        </div>
    )
}
