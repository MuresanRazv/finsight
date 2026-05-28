'use client'

import { ChatResponse, ArticleStats } from '@/lib/types/chat'
import { ExternalLink, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { TickerBadge } from '@/components/ui/ticker-badge'

interface ChatResultProps {
    result: ChatResponse
}

export function ChatResult({ result }: ChatResultProps) {
    if (!result) {
        return null
    }

    return (
        <div className='dark space-y-10'>
            {/* AI Analysis Container */}
            <div className='bg-card border-border rounded-2xl border p-6 shadow-[0_0_20px_rgba(56,189,248,0.1)] dark:border-blue-500/30'>
                <div className='mb-4 flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-500'>
                        <Brain className='h-5 w-5' />
                    </div>
                    <h2 className='text-foreground text-xl font-semibold'>
                        AI Analysis
                    </h2>
                </div>
                <div className='prose prose-sm dark:prose-invert text-muted-foreground prose-p:leading-relaxed max-w-none'>
                    <ReactMarkdown>{result.answer}</ReactMarkdown>
                </div>
            </div>

            {/* Sources Section */}
            {result.sources && result.sources.length > 0 && (
                <section>
                    <h3 className='text-foreground mb-6 text-xl font-semibold'>
                        Sources Analyzed
                    </h3>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
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
    let sentimentBadgeClasses = 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20'

    if (source.overall_sentiment_label === 'positive') {
        sentimentBadgeClasses = 'bg-sentiment-positive/10 text-sentiment-positive border border-sentiment-positive/20'
    } else if (source.overall_sentiment_label === 'negative') {
        sentimentBadgeClasses = 'bg-sentiment-negative/10 text-sentiment-negative border border-sentiment-negative/20'
    }

    const domain = new URL(source.url).hostname.replace('www.', '')

    return (
        <div className='bg-card border-border hover:border-muted-foreground/50 flex h-32 flex-col justify-between rounded-xl border p-4 transition-colors'>
            <div className='flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                    <div className='bg-secondary text-secondary-foreground flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded text-[10px] font-bold uppercase'>
                        {domain.substring(0, 2)}
                    </div>
                    <a
                        href={source.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-muted-foreground hover:text-foreground flex items-center gap-1 truncate text-sm font-medium'
                        title={domain}
                    >
                        <span className='max-w-[120px] truncate'>{domain}</span>
                        <ExternalLink className='h-3 w-3 shrink-0 opacity-50' />
                    </a>
                </div>
                <span
                    className={`rounded px-2 py-1 text-xs font-medium capitalize ${sentimentBadgeClasses}`}
                    style={
                        source.overall_sentiment_label?.toLowerCase() !== 'positive' &&
                        source.overall_sentiment_label?.toLowerCase() !== 'negative'
                            ? {
                                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                  color: '#eab308',
                                  borderColor: 'rgba(234, 179, 8, 0.2)',
                              }
                            : undefined
                    }
                >
                    {source.overall_sentiment_label}
                </span>
            </div>

            {source.entities && source.entities.length > 0 && (
                <div className='scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1 text-xs font-medium'>
                    {source.entities.slice(0, 3).map((entity, i) => {
                        let eClasses = 'bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/20'
                        if (entity.sentiment_label === 'positive')
                            eClasses = 'bg-sentiment-positive/15 text-sentiment-positive border border-sentiment-positive/20'
                        if (entity.sentiment_label === 'negative')
                            eClasses = 'bg-sentiment-negative/15 text-sentiment-negative border border-sentiment-negative/20'

                        const displayName = entity.ticker || entity.name
                        const content = (
                            <>
                                {displayName}
                                {!!entity.sentiment_score && (
                                    <span className='ml-1 text-[10px] font-semibold opacity-90'>
                                        (
                                        {Math.round(
                                            entity.sentiment_score * 100,
                                        )}
                                        %{' '}
                                        {entity.sentiment_label === 'positive'
                                            ? 'Pos'
                                            : entity.sentiment_label ===
                                                'negative'
                                              ? 'Neg'
                                              : 'Neu'}
                                        )
                                    </span>
                                )}
                            </>
                        )

                        if (entity.ticker && entity.ticker.length > 0) {
                            return (
                                <TickerBadge
                                    key={i}
                                    ticker={entity.ticker}
                                    className={`shrink-0 rounded px-2 py-1 whitespace-nowrap ${eClasses}`}
                                    style={
                                        entity.sentiment_label?.toLowerCase() !== 'positive' &&
                                        entity.sentiment_label?.toLowerCase() !== 'negative'
                                            ? {
                                                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                                  color: '#eab308',
                                                  borderColor: 'rgba(234, 179, 8, 0.2)',
                                              }
                                            : undefined
                                    }
                                >
                                    {content}
                                </TickerBadge>
                            )
                        }

                        return (
                            <span
                                key={i}
                                className={`shrink-0 rounded px-2 py-1 whitespace-nowrap ${eClasses}`}
                                style={
                                    entity.sentiment_label?.toLowerCase() !== 'positive' &&
                                    entity.sentiment_label?.toLowerCase() !== 'negative'
                                        ? {
                                              backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                              color: '#eab308',
                                              borderColor: 'rgba(234, 179, 8, 0.2)',
                                          }
                                        : undefined
                                }
                            >
                                {content}
                            </span>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
