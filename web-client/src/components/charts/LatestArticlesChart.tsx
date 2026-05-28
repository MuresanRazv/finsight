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
        <Card className='dark flex h-[500px] w-full flex-col'>
            <CardHeader>
                <CardTitle>
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
                            {chartData.map((article, idx) => (
                                <div
                                    key={idx}
                                    className='hover:bg-muted/50 flex flex-col gap-2 p-4 transition-colors'
                                >
                                    <div className='flex items-start justify-between gap-4'>
                                        <Link
                                            href={{
                                                pathname: '/articles/deep-dive',
                                                query: {
                                                    title: article.title,
                                                    url: article.url,
                                                    source: 'Global Feed',
                                                    published_at: article.processed_at,
                                                    sentiment_label: article.overall_sentiment_label,
                                                    sentiment_score: article.overall_sentiment_score,
                                                    entities: JSON.stringify(article.entities),
                                                }
                                            }}
                                            className='text-sm leading-tight font-medium hover:text-primary transition-colors cursor-pointer'
                                            title={article.url}
                                        >
                                            <span className='capitalize'>
                                                {article.title}
                                            </span>
                                        </Link>
                                        <Badge
                                            variant='outline'
                                            className={getSentimentColor(
                                                article.overall_sentiment_label,
                                            )}
                                            style={
                                                article.overall_sentiment_label?.toLowerCase() !== 'positive' &&
                                                article.overall_sentiment_label?.toLowerCase() !== 'negative'
                                                    ? {
                                                          backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                                          color: '#eab308',
                                                          borderColor: 'rgba(234, 179, 8, 0.2)',
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {article.overall_sentiment_label}
                                        </Badge>
                                    </div>

                                    <div className='text-muted-foreground flex items-center justify-between text-xs'>
                                        <span className='font-mono'>
                                            {article.formattedDate}
                                        </span>

                                        <div className='flex items-center gap-2'>
                                            <span>Confidence</span>
                                            <div className='bg-secondary h-2 w-24 overflow-hidden rounded-full'>
                                                <div
                                                    className='bg-primary/60 h-full transition-all duration-500'
                                                    style={{
                                                        width: `${Math.max(0, Math.min(100, article.overall_sentiment_score * 100))}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className='w-8 text-right'>
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
                                                                    key={eIdx}
                                                                    ticker={
                                                                        entity.ticker
                                                                    }
                                                                    className='bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]'
                                                                >
                                                                    {
                                                                        displayName
                                                                    }
                                                                </TickerBadge>
                                                            )
                                                        }

                                                        return (
                                                            <span
                                                                key={eIdx}
                                                                className='bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]'
                                                            >
                                                                {displayName}
                                                            </span>
                                                        )
                                                    })}
                                                {article.entities.length >
                                                    3 && (
                                                    <span className='text-muted-foreground px-1 py-0.5 text-[10px]'>
                                                        +
                                                        {article.entities
                                                            .length - 3}{' '}
                                                        more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
