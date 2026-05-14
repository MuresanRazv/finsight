'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLatestArticles } from '@/app/actions/charts'
import { ChartDataResponse } from '@/lib/types/charts'
import { ArticleDto } from '@/lib/types/article'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

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
        return (
            <Card className='flex h-[500px] w-full items-center justify-center'>
                <div className='text-muted-foreground'>Loading...</div>
            </Card>
        )
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
                  article.title || article.url
                      .split('/')
                      .pop()
                      ?.replace('.html', '')
                      .replace(/-/g, ' ') || 'Unknown Article',
          }))
        : []

    const getSentimentColor = (label: string) => {
        switch (label?.toLowerCase()) {
            case 'positive':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
            case 'negative':
                return 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
            default:
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
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
                                        <a
                                            href={article.url}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='text-sm leading-tight font-medium hover:underline'
                                            title={article.url}
                                        >
                                            <span className='capitalize'>
                                                {article.title}
                                            </span>
                                        </a>
                                        <Badge
                                            variant='outline'
                                            className={getSentimentColor(
                                                article.overall_sentiment_label,
                                            )}
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
                                                    .map((entity, eIdx) => (
                                                        <span
                                                            key={eIdx}
                                                            className='bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]'
                                                        >
                                                            {!!entity.ticker &&
                                                            entity.ticker
                                                                .length > 0
                                                                ? entity.ticker
                                                                : entity.name}
                                                        </span>
                                                    ))}
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
