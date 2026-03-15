'use client'

import { ChatResponse, ArticleStats } from '@/lib/types/chat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Minus,
    Bot,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatResultProps {
    result: ChatResponse
}

export function ChatResult({ result }: ChatResultProps) {
    if (!result) {
        return null
    }

    return (
        <div className='space-y-6'>
            <Card className='border-slate-800 bg-slate-900'>
                <CardHeader className='border-b border-slate-800 pb-4'>
                    <div className='flex items-center gap-3'>
                        <Bot className='h-6 w-6 text-blue-400' />
                        <CardTitle className='text-lg font-semibold text-white'>
                            AI Analysis
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className='pt-6'>
                    <div className='prose prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:text-slate-300 max-w-none text-slate-300'>
                        <ReactMarkdown>{result.answer}</ReactMarkdown>
                    </div>
                </CardContent>
            </Card>

            {result.sources && result.sources.length > 0 && (
                <div className='mt-8 space-y-4'>
                    <h3 className='px-1 text-lg font-semibold text-white'>
                        Sources Analyzed
                    </h3>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        {result.sources.map((source, index) => (
                            <SourceCard key={index} source={source} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function SourceCard({ source }: { source: ArticleStats }) {
    let sentimentColor = 'text-yellow-500'
    let SentimentIcon = Minus

    if (source.overall_sentiment_label === 'positive') {
        sentimentColor = 'text-emerald-500'
        SentimentIcon = TrendingUp
    } else if (source.overall_sentiment_label === 'negative') {
        sentimentColor = 'text-red-500'
        SentimentIcon = TrendingDown
    }

    return (
        <Card className='flex flex-col border-slate-800 bg-slate-900/50 transition-colors hover:border-slate-700'>
            <CardHeader className='px-4 py-3'>
                <div className='flex items-start justify-between gap-2'>
                    <a
                        href={source.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-emerald-400'
                    >
                        <ExternalLink className='h-4 w-4 flex-shrink-0 opacity-70' />
                        <span className='truncate'>
                            {new URL(source.url).hostname}
                        </span>
                    </a>
                    <div
                        className={`flex shrink-0 items-center gap-1 text-xs font-medium ${sentimentColor}`}
                    >
                        <SentimentIcon className='h-4 w-4' />
                        <span className='capitalize'>
                            {source.overall_sentiment_label}
                        </span>
                    </div>
                </div>
            </CardHeader>
            {source.entities && source.entities.length > 0 && (
                <CardContent className='flex-grow border-t border-slate-800/50 px-4 py-3'>
                    <div className='flex flex-wrap gap-2'>
                        {source.entities.map((entity, i) => {
                            let eColor = 'text-slate-400'
                            if (entity.sentiment_label === 'positive')
                                eColor = 'text-emerald-400'
                            if (entity.sentiment_label === 'negative')
                                eColor = 'text-red-400'

                            return (
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
                                    {entity.sentiment_score !== undefined &&
                                        entity.sentiment_score !== null && (
                                            <span
                                                className={`ml-1.5 font-mono text-xs ${eColor}`}
                                            >
                                                {entity.sentiment_score.toFixed(
                                                    2,
                                                )}
                                            </span>
                                        )}
                                </Badge>
                            )
                        })}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
