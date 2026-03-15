'use client'

import { SearchResultItem } from '@/lib/types/search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SearchResultProps {
    results: SearchResultItem[]
}

export function SearchResult({ results }: SearchResultProps) {
    if (!results || results.length === 0) {
        return <div className='text-gray-400'>No results found.</div>
    }

    return (
        <div className='space-y-4'>
            {results.map((result, index) => (
                <SearchResultCard key={index} result={result} />
            ))}
        </div>
    )
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
    let sentimentColor = 'text-yellow-500'
    let SentimentIcon = Minus

    if (result.sentiment_label === 'positive') {
        sentimentColor = 'text-emerald-500'
        SentimentIcon = TrendingUp
    } else if (result.sentiment_label === 'negative') {
        sentimentColor = 'text-red-500'
        SentimentIcon = TrendingDown
    }

    return (
        <Card className='border-slate-800 bg-slate-900 transition-colors hover:border-slate-700'>
            <CardHeader className='pb-2'>
                <div className='flex items-start justify-between gap-4'>
                    <div className='space-y-1'>
                        <CardTitle className='text-lg leading-tight font-semibold text-white'>
                            <a
                                href={result.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center gap-2 transition-colors hover:text-emerald-400'
                            >
                                {result.title}
                                <ExternalLink className='h-4 w-4 opacity-50' />
                            </a>
                        </CardTitle>
                        <div className='flex items-center gap-2 text-sm text-slate-400'>
                            <span className='font-medium text-slate-300'>
                                {result.source}
                            </span>
                            <span>•</span>
                            <span>
                                {new Date(
                                    result.published_at,
                                ).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div
                        className={`flex flex-col items-end ${sentimentColor}`}
                    >
                        <div className='flex items-center gap-1 font-medium'>
                            <SentimentIcon className='h-4 w-4' />
                            <span className='capitalize'>
                                {result.sentiment_label}
                            </span>
                        </div>
                        <span className='text-xs opacity-80'>
                            Confidence Score:{' '}
                            {result.sentiment_score.toFixed(2)}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className='mt-2 flex flex-wrap gap-2'>
                    {result.entities.map((entity, i) => (
                        <Badge
                            key={i}
                            variant='secondary'
                            className='border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                        >
                            {entity.name}
                            {entity.ticker && (
                                <span className='ml-1 text-slate-500'>
                                    ({entity.ticker})
                                </span>
                            )}
                        </Badge>
                    ))}
                </div>
                <div className='mt-4 flex items-center justify-between text-xs text-slate-500'>
                    <span>
                        Relevance: {(result.relevance_score * 100).toFixed(0)}%
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
