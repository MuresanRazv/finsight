'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLatestArticles } from '@/app/actions/charts'
import { ChartDataResponse } from '@/lib/types/charts'
import { ArticleDto } from '@/lib/types/article'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChartSkeleton } from './ChartSkeleton'
import { TickerBadge } from '@/components/ui/ticker-badge'
import Link from 'next/link'
import { cleanArticleTitle } from '@/lib/utils'

export function LatestArticlesChart() {
    const [data, setData] = useState<ChartDataResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const result = await getLatestArticles()
                setData(result)
            } catch (error) {
                console.error('Failed to fetch latest articles:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading && !data) {
        return <ChartSkeleton type='list' title='Latest Fetched Articles' />
    }

    const chartData = Array.isArray(data?.data)
        ? (data.data as ArticleDto[]).slice().map((article) => ({
              ...article,
              formattedDate: new Date(article.processed_at).toLocaleString(
                  undefined,
                  {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                  },
              ),
              title:
                  article.title ||
                  article.url
                      .split('/')
                      .pop()
                      ?.replace('.html', '')
                      .replace(/-/g, ' ') ||
                  'Unknown Article',
          }))
        : []

    const getSentimentColor = (label: string) => {
        switch (label?.toLowerCase()) {
            case 'positive':
                return 'bg-sentiment-positive/10 text-sentiment-positive border-sentiment-positive/20'
            case 'negative':
                return 'bg-sentiment-negative/10 text-sentiment-negative border-sentiment-negative/20'
            default:
                return 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]/20'
        }
    }

    return (
        <Card className='dark flex h-[450px] md:h-[500px] w-full min-w-0 flex-col'>
            <CardHeader className='py-4'>
                <CardTitle className='text-lg md:text-xl'>
                    {data?.title || 'Latest Fetched Articles'}
                </CardTitle>
            </CardHeader>
            <CardContent className='min-h-0 flex-1 p-0'>
                {chartData.length === 0 ? (
                    <div className='text-muted-foreground flex h-full flex-1 items-center justify-center'>
                        No data found
                    </div>
                ) : (
                    <ScrollArea className='h-full'>
                        <div className='divide-border divide-y'>
                            {chartData.map((article, idx) => {
                                const cleanedTitle = cleanArticleTitle(
                                    article.title,
                                    article.source,
                                    article.url,
                                )

                                return (
                                    <div
                                        key={idx}
                                        className='hover:bg-muted/50 flex flex-col gap-2 p-4 transition-colors'
                                    >
                                        <div className='flex items-start justify-between gap-4'>
                                            <Link
                                                href={`/articles/deep-dive/${article.uuid}`}
                                                className='hover:text-primary cursor-pointer text-sm leading-tight font-medium transition-colors'
                                                title={article.url}
                                            >
                                                <span className='capitalize'>
                                                    {cleanedTitle}
                                                </span>
                                            </Link>
                                        </div>

                                        {/* Row 2: Date and Source */}
                                        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                                            <span className='font-mono whitespace-nowrap'>
                                                {article.formattedDate}
                                            </span>
                                            {article.source && (
                                                <span className='text-primary bg-primary/10 border-primary/20 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium max-w-[120px] truncate'>
                                                    {article.source}
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 3: Sentiment and Confidence */}
                                        <div className='flex items-center gap-4 text-xs mt-0.5'>
                                            <Badge
                                                variant='outline'
                                                className={`capitalize shrink-0 ${getSentimentColor(
                                                    article.overall_sentiment_label,
                                                )}`}
                                                style={
                                                    article.overall_sentiment_label?.toLowerCase() !==
                                                        'positive' &&
                                                    article.overall_sentiment_label?.toLowerCase() !==
                                                        'negative'
                                                        ? {
                                                              backgroundColor:
                                                                  'rgba(234, 179, 8, 0.1)',
                                                              color: '#eab308',
                                                              borderColor:
                                                                  'rgba(234, 179, 8, 0.2)',
                                                          }
                                                        : undefined
                                                }
                                            >
                                                {
                                                    article.overall_sentiment_label
                                                }
                                            </Badge>

                                            <div className='text-muted-foreground flex items-center gap-2'>
                                                <span className='font-medium text-[10px] sm:text-xs'>Confidence</span>
                                                <div className='bg-secondary h-1.5 w-16 sm:w-24 overflow-hidden rounded-full'>
                                                    <div
                                                        className='bg-primary/60 h-full transition-all duration-500'
                                                        style={{
                                                            width: `${Math.max(0, Math.min(100, article.overall_sentiment_score * 100))}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className='w-8 text-right font-mono text-[10px] sm:text-xs font-semibold'>
                                                    {(
                                                        article.overall_sentiment_score *
                                                        100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                        </div>

                                        {article.entities &&
                                            article.entities.length > 0 && (
                                                <div className='mt-1 flex flex-wrap gap-1'>
                                                    {article.entities
                                                        .slice(0, 3)
                                                        .filter(
                                                            (e) =>
                                                                !!e.ticker ||
                                                                !!e.name,
                                                        )
                                                        .map((entity, eIdx) => {
                                                            const displayName =
                                                                entity.ticker &&
                                                                entity.ticker
                                                                    .length > 0
                                                                    ? entity.ticker
                                                                    : entity.name

                                                            if (
                                                                entity.ticker &&
                                                                entity.ticker
                                                                    .length > 0
                                                            ) {
                                                                return (
                                                                    <TickerBadge
                                                                        key={
                                                                            eIdx
                                                                        }
                                                                        ticker={
                                                                            entity.ticker
                                                                        }
                                                                        className='bg-secondary text-secondary-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]'
                                                                    >
                                                                        <span>
                                                                            {
                                                                                displayName
                                                                            }
                                                                        </span>
                                                                    </TickerBadge>
                                                                )
                                                            }

                                                            return (
                                                                <span
                                                                    key={eIdx}
                                                                    className='bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]'
                                                                >
                                                                    {
                                                                        displayName
                                                                    }
                                                                </span>
                                                            )
                                                        })}
                                                    {article.entities.length >
                                                        3 && (
                                                        <span className='text-muted-foreground px-1 py-0.5 text-[10px]'>
                                                            +
                                                            {article.entities
                                                                .length -
                                                                3}{' '}
                                                            more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
