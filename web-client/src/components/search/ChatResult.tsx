'use client'

import { ChatResponse, ArticleStats } from '@/lib/types/chat'
import { ExternalLink, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatResultProps {
    result: ChatResponse
}

export function ChatResult({ result }: ChatResultProps) {
    if (!result) {
        return null
    }

    return (
        <div className='space-y-10 dark'>
            {/* AI Analysis Container */}
            <div className='bg-card border border-border rounded-2xl p-6 shadow-[0_0_20px_rgba(56,189,248,0.1)] dark:border-blue-500/30'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20'>
                        <Brain className='w-5 h-5' />
                    </div>
                    <h2 className='text-xl font-semibold text-foreground'>
                        AI Analysis
                    </h2>
                </div>
                <div className='prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-p:leading-relaxed'>
                    <ReactMarkdown>{result.answer}</ReactMarkdown>
                </div>
            </div>

            {/* Sources Section */}
            {result.sources && result.sources.length > 0 && (
                <section>
                    <h3 className='text-xl font-semibold text-foreground mb-6'>
                        Sources Analyzed
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {result.sources.map((source, index) => (
                            <SourceCard key={index} source={source} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function SourceCard({ source }: { source: ArticleStats }) {
    let sentimentBadgeClasses =
        'bg-yellow-500/20 text-yellow-400'

    if (source.overall_sentiment_label === 'positive') {
        sentimentBadgeClasses =
            'bg-emerald-500/20 text-emerald-400'
    } else if (source.overall_sentiment_label === 'negative') {
        sentimentBadgeClasses = 'bg-red-500/20 text-red-400'
    }

    const domain = new URL(source.url).hostname.replace('www.', '')

    return (
        <div className='bg-card border border-border rounded-xl p-4 flex flex-col justify-between h-32 hover:border-muted-foreground/50 transition-colors'>
            <div className='flex justify-between items-start'>
                <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 bg-secondary rounded flex items-center justify-center text-[10px] font-bold text-secondary-foreground uppercase overflow-hidden shrink-0'>
                        {domain.substring(0, 2)}
                    </div>
                    <a
                        href={source.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm font-medium text-muted-foreground hover:text-foreground truncate flex items-center gap-1'
                        title={domain}
                    >
                        <span className='truncate max-w-[120px]'>{domain}</span>
                        <ExternalLink className='w-3 h-3 opacity-50 shrink-0' />
                    </a>
                </div>
                <span
                    className={`px-2 py-1 rounded text-xs font-medium capitalize ${sentimentBadgeClasses}`}
                >
                    {source.overall_sentiment_label}
                </span>
            </div>

            {source.entities && source.entities.length > 0 && (
                <div className='flex gap-2 mt-4 text-xs font-medium overflow-x-auto pb-1 scrollbar-hide'>
                    {source.entities.slice(0, 3).map((entity, i) => {
                        let eClasses =
                            'bg-yellow-500/10 text-yellow-400'
                        if (entity.sentiment_label === 'positive')
                            eClasses =
                                'bg-emerald-500/10 text-emerald-400'
                        if (entity.sentiment_label === 'negative')
                            eClasses = 'bg-red-500/10 text-red-400'

                        return (
                            <span
                                key={i}
                                className={`px-2 py-1 rounded shrink-0 whitespace-nowrap ${eClasses}`}
                            >
                                {entity.ticker || entity.name}{' '}
                                {!!entity.sentiment_score
                                    ? (entity.sentiment_score > 0 ? '+' : '') +
                                      (entity.sentiment_score * 100).toFixed(0) +
                                      '%'
                                    : ''}
                            </span>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
