'use client'

import { SearchResultItem } from '@/lib/types/search'
import { ExternalLink } from 'lucide-react'

interface SearchResultProps {
    results: SearchResultItem[]
}

export function SearchResult({ results }: SearchResultProps) {
    if (!results || results.length === 0) {
        return <div className='text-muted-foreground'>No results found.</div>
    }

    return (
        <div className='space-y-4 dark'>
            {results.map((result, index) => (
                <SearchResultCard key={index} result={result} />
            ))}
        </div>
    )
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
    let sentimentClasses = 'bg-yellow-500/20 text-yellow-400'

    if (result.sentiment_label === 'positive') {
        sentimentClasses = 'bg-emerald-500/20 text-emerald-400'
    } else if (result.sentiment_label === 'negative') {
        sentimentClasses = 'bg-red-500/20 text-red-400'
    }

    return (
        <div className='bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-4 hover:border-muted-foreground/50 transition-colors'>
            <div className='space-y-3 flex-1'>
                <div className='flex items-start gap-2'>
                    <h3 className='text-xl font-semibold text-foreground leading-tight'>
                        {result.title}
                    </h3>
                    <a
                        href={result.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-muted-foreground hover:text-foreground mt-1 shrink-0'
                    >
                        <ExternalLink className='w-4 h-4' />
                    </a>
                </div>
                
                <div className='text-sm text-muted-foreground'>
                    {result.source} • {new Date(result.published_at).toLocaleDateString()}
                </div>
                
                <div className='flex items-center flex-wrap gap-3 pt-1'>
                    {result.entities.map((entity, i) => (
                        <span
                            key={i}
                            className='px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium'
                        >
                            {entity.name}
                            {entity.ticker && ` (${entity.ticker})`}
                        </span>
                    ))}
                    <span className='text-xs text-muted-foreground'>
                        Relevance:{' '}
                        <span className='text-foreground font-medium'>
                            {(result.relevance_score * 100).toFixed(0)}%
                        </span>
                    </span>
                </div>
            </div>
            
            <div className='flex flex-col items-end shrink-0 space-y-2'>
                <span
                    className={`px-4 py-1 rounded-full text-xs font-semibold tracking-wide capitalize ${sentimentClasses}`}
                >
                    {result.sentiment_label}
                </span>
                <span className='text-xs text-muted-foreground'>
                    Confidence Score:{' '}
                    <span className='text-foreground font-medium'>
                        {result.sentiment_score.toFixed(2)}
                    </span>
                </span>
            </div>
        </div>
    )
}
