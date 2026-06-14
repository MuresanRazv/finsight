'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMyTickers } from '@/app/actions/charts'
import { ChartDataResponse } from '@/lib/types/charts'
import { ChartFilters } from './ChartFilters'
import { SentimentLegend } from './SentimentLegend'
import { ChartSkeleton } from './ChartSkeleton'
import { TickerBadge } from '@/components/ui/ticker-badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings, TrendingUp } from 'lucide-react'


interface CustomDotProps {
    cx?: number
    cy?: number
    value?: number
}

const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, value } = props

    if (value === undefined || value === null) return null

    let color = '#eab308' // yellow-500
    if (value > 0.3) {
        color = '#22c55e' // green-500
    } else if (value < -0.3) {
        color = '#ef4444' // red-500
    }

    return <circle cx={cx} cy={cy} r={4} fill={color} strokeWidth={0} />
}

const CustomActiveDot = (props: CustomDotProps) => {
    const { cx, cy, value } = props

    if (value === undefined || value === null) return null

    let color = '#eab308' // yellow-500
    if (value > 0.3) {
        color = '#22c55e' // green-500
    } else if (value < -0.3) {
        color = '#ef4444' // red-500
    }

    return (
        <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={color}
            stroke='white'
            strokeWidth={2}
        />
    )
}

export function MyTickersChart() {
    const [data, setData] = useState<ChartDataResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<Record<string, string>>({})
    const isInitialLoad = useRef(true)
    interface StockQuote {
        name?: string
        exchange?: string
        industry?: string
        logo?: string
        price?: number | null
        changePercent?: number | null
        change?: number | null
    }
    const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
    const [quotesLoading, setQuotesLoading] = useState(false)

    const chartData = React.useMemo(
        () => (Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : []),
        [data],
    )

    const lines = React.useMemo(() => {
        const linesSet = new Set<string>()
        chartData.forEach((item) => {
            Object.keys(item).forEach((k) => {
                if (
                    k !== 'date' &&
                    !k.endsWith('_label') &&
                    !k.endsWith('_confidence')
                ) {
                    linesSet.add(k)
                }
            })
        })
        return Array.from(linesSet)
    }, [chartData])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const result = await getMyTickers(filters)
                setData(result)

                if (isInitialLoad.current && result.available_filters) {
                    isInitialLoad.current = false
                    const defaultFilters = result.available_filters.reduce(
                        (acc, filter) => {
                            if (filter.key && filter.default_value) {
                                acc[filter.key] = filter.default_value as string
                            }
                            return acc
                        },
                        {} as Record<string, string>,
                    )

                    if (Object.keys(defaultFilters).length > 0) {
                        setFilters(defaultFilters)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch my tickers:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [filters])

    const watchlistTickers = React.useMemo(() => {
        const tickerFilter = data?.available_filters?.find((f) => f.key === 'ticker')
        return (tickerFilter?.options as string[]) || []
    }, [data])

    // Fetch quotes for all active watchlist tickers
    const watchlistTickersKey = watchlistTickers.join(',')
    useEffect(() => {
        if (watchlistTickers.length === 0) return

        const fetchQuotes = async () => {
            setQuotesLoading(true)
            try {
                const quotesData: Record<string, StockQuote> = {}
                await Promise.all(
                    watchlistTickers.map(async (ticker) => {
                        try {
                            const res = await fetch(`/api/stocks/${ticker}`)
                            if (res.ok) {
                                quotesData[ticker] = await res.json()
                            }
                        } catch {
                            // ignore
                        }
                    }),
                )
                setQuotes(quotesData)
            } catch {
                console.error('Failed to fetch watchlist quotes')
            } finally {
                setQuotesLoading(false)
            }
        }

        fetchQuotes()
    }, [watchlistTickers, watchlistTickersKey])

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const formatDate = (dateStr: string, index?: number) => {
        try {
            const date = new Date(dateStr)
            if (filters.range === '24h') {
                return date.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                })
            }

            // Deduplicate calendar date ticks on the axis to prevent collisions
            if (typeof index === 'number' && index > 0 && chartData[index - 1]) {
                const prevVal = chartData[index - 1] as Record<string, unknown>
                if (prevVal && prevVal.date) {
                    const prevDate = new Date(prevVal.date as string)
                    if (prevDate.toDateString() === date.toDateString()) {
                        return ''
                    }
                }
            }

            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
            })
        } catch {
            return dateStr
        }
    }

    if (loading && !data) {
        return <ChartSkeleton type='area' title='My Tickers' />
    }

    const getGradientStops = (ticker: string) => {
        const values = chartData
            .map((d: Record<string, unknown>) => d[ticker] as number)
            .filter((v: number) => typeof v === 'number')
        if (values.length === 0) return null

        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min

        // Now positive is > 0.3, neutral is -0.3 to 0.3, negative is < -0.3
        const getColor = (val: number) =>
            val > 0.3 ? '#10B981' : val < -0.3 ? '#EF4444' : '#eab308'

        if (range === 0) {
            const color = getColor(max)
            return (
                <>
                    <stop offset='0%' stopColor={color} />
                    <stop offset='100%' stopColor={color} />
                </>
            )
        }

        const stops = []
        stops.push(<stop key='start' offset='0%' stopColor={getColor(max)} />)

        if (min < 0.3 && max > 0.3) {
            const off = (max - 0.3) / range
            stops.push(<stop key='pos-1' offset={off} stopColor='#10B981' />)
            stops.push(<stop key='pos-2' offset={off} stopColor='#eab308' />)
        }

        if (min < -0.3 && max > -0.3) {
            const off = (max - -0.3) / range
            stops.push(<stop key='neg-1' offset={off} stopColor='#eab308' />)
            stops.push(<stop key='neg-2' offset={off} stopColor='#EF4444' />)
        }

        stops.push(<stop key='end' offset='100%' stopColor={getColor(min)} />)
        return stops
    }

    return (
        <div className='grid w-full grid-cols-1 gap-8 lg:grid-cols-4 min-w-0'>
            <Card className='dark flex h-auto md:h-[500px] w-full min-w-0 flex-col lg:col-span-3 pb-2'>
                <CardHeader className='pb-2'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 min-w-0'>
                        <CardTitle className='text-lg md:text-xl shrink-0'>My Tickers</CardTitle>
                        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 w-full scrollbar-none whitespace-nowrap min-w-0'>
                            {lines.map((ticker) => (
                                <TickerBadge key={ticker} ticker={ticker} />
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className={cn('flex min-h-0 flex-1 flex-col pb-4', watchlistTickers.length === 0 && 'justify-center items-center py-12')}>
                    {watchlistTickers.length === 0 ? (
                        <div className='flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6 py-6'>
                            <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary'>
                                <TrendingUp className='h-8 w-8' />
                            </div>
                            <div className='space-y-2'>
                                <h3 className='text-lg font-semibold tracking-tight text-foreground'>
                                    No Tickers Configured
                                </h3>
                                <p className='text-sm text-muted-foreground leading-relaxed max-w-sm'>
                                    Add tickers to your watchlist to monitor real-time sentiment trends, news, and market quotes.
                                </p>
                            </div>
                            <Button asChild size='sm' className='font-medium transition-all shadow-md'>
                                <Link href='/settings#watchlist' className='flex items-center gap-2'>
                                    <Settings className='h-4 w-4' />
                                    Configure Watchlist
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className='mb-2 w-full min-w-0'>
                                <ChartFilters
                                    filters={data?.available_filters || []}
                                    activeFilters={filters}
                                    onFilterChange={handleFilterChange}
                                />
                            </div>
                            <SentimentLegend />
                            {chartData.length === 0 ? (
                                <div className='text-muted-foreground flex h-[280px] md:h-[350px] items-center justify-center'>
                                    No data found
                                </div>
                            ) : (
                                <div className='h-[280px] md:h-[350px] w-full'>
                                    <ResponsiveContainer width='100%' height='100%'>
                                        <LineChart
                                            data={chartData}
                                            margin={{
                                                top: 5,
                                                right: 10,
                                                left: -25,
                                                bottom: 5,
                                            }}
                                        >
                                            <defs>
                                                {lines.map((line) => (
                                                    <linearGradient
                                                        key={line}
                                                        id={`splitColor-${line}`}
                                                        x1='0'
                                                        y1='0'
                                                        x2='0'
                                                        y2='1'
                                                    >
                                                        {getGradientStops(line)}
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray='3 3' stroke='#1c2b3c' vertical={false} />
                                            <XAxis
                                                dataKey='date'
                                                tickFormatter={formatDate}
                                                tickLine={false}
                                                axisLine={false}
                                                minTickGap={20}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            />
                                            <YAxis
                                                domain={[-1, 1]}
                                                tickFormatter={(val) =>
                                                    val === 0 ? '0' : val.toFixed(1)
                                                }
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            />
                                            <ReferenceLine
                                                y={0}
                                                stroke='#444'
                                                strokeDasharray='3 3'
                                            />
                                            <Tooltip
                                                labelFormatter={(label) =>
                                                    formatDate(label as string)
                                                }
                                                content={({
                                                    active,
                                                    payload,
                                                    label,
                                                }) => {
                                                    if (
                                                        active &&
                                                        payload &&
                                                        payload.length
                                                    ) {
                                                        return (
                                                            <div className='bg-background rounded border p-2 text-sm shadow-sm'>
                                                                <p className='mb-1 font-semibold'>
                                                                    {formatDate(
                                                                        label as string,
                                                                    )}
                                                                </p>
                                                                {payload.map(
                                                                    (entry, index) => {
                                                                        const data =
                                                                            entry.payload
                                                                        const ticker =
                                                                            entry.dataKey as string
                                                                        const conf =
                                                                            data[
                                                                                `${ticker}_confidence`
                                                                            ]
                                                                        const lbl =
                                                                            data[
                                                                                `${ticker}_label`
                                                                            ]
                                                                        const val =
                                                                            entry.value as number

                                                                        // fallback if backend doesn't send the extra keys
                                                                        const displayConf =
                                                                            conf !==
                                                                            undefined
                                                                                ? conf
                                                                                : Math.abs(
                                                                                      val,
                                                                                  )
                                                                        const displayLbl =
                                                                            lbl !==
                                                                            undefined
                                                                                ? lbl
                                                                                : val >
                                                                                    0.3
                                                                                  ? 'positive'
                                                                                  : val <
                                                                                      -0.3
                                                                                    ? 'negative'
                                                                                    : 'neutral'

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                style={{
                                                                                    color: entry.color,
                                                                                }}
                                                                                className='mb-1'
                                                                            >
                                                                                <span className='font-bold'>
                                                                                    {
                                                                                        ticker
                                                                                    }
                                                                                    :
                                                                                </span>{' '}
                                                                                <span className='capitalize'>
                                                                                    {
                                                                                        displayLbl
                                                                                    }
                                                                                </span>{' '}
                                                                                (
                                                                                {(
                                                                                    displayConf *
                                                                                    100
                                                                                ).toFixed(
                                                                                    0,
                                                                                )}
                                                                                %
                                                                                confidence)
                                                                            </div>
                                                                        )
                                                                    },
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Legend />
                                            {lines.map((line) => (
                                                <Line
                                                    key={line}
                                                    type='monotone'
                                                    dataKey={line}
                                                    name={line}
                                                    stroke={`url(#splitColor-${line})`}
                                                    strokeWidth={2}
                                                    dot={<CustomDot />}
                                                    activeDot={<CustomActiveDot />}
                                                    connectNulls={true}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className='dark bg-card border-border flex h-[300px] md:h-[500px] w-full flex-col shadow-xs lg:col-span-1'>
                <CardHeader className='border-border/40 shrink-0 border-b pb-2'>
                    <CardTitle className='text-foreground text-base font-semibold'>
                        Watchlist Quotes
                    </CardTitle>
                </CardHeader>
                <CardContent className='scrollbar-thin scrollbar-thumb-border min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4'>
                    {watchlistTickers.length === 0 ? (
                        <div className='text-muted-foreground flex h-full flex-1 items-center justify-center text-xs'>
                            No active tickers
                        </div>
                    ) : (
                        watchlistTickers.map((ticker) => {
                            const qData = quotes[ticker]
                            if (quotesLoading && !qData) {
                                return (
                                    <div
                                        key={ticker}
                                        className='flex animate-pulse items-center gap-3 rounded-lg border border-transparent p-2.5'
                                    >
                                        <div className='h-8 w-8 shrink-0 rounded-lg bg-slate-700/50' />
                                        <div className='min-w-0 flex-1 space-y-1.5'>
                                            <div className='h-4 w-12 rounded bg-slate-700/50' />
                                            <div className='h-3 w-20 rounded bg-slate-800/50' />
                                        </div>
                                        <div className='shrink-0 items-end space-y-1.5'>
                                            <div className='h-4 w-16 rounded bg-slate-700/50' />
                                            <div className='h-3 w-10 rounded bg-slate-800/50' />
                                        </div>
                                    </div>
                                )
                            }

                            if (!qData) return null

                            return (
                                <a
                                    key={ticker}
                                    href={`/assets/${ticker.toLowerCase()}`}
                                    className='hover:bg-secondary/40 hover:border-border/40 group flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent p-2.5 transition-all'
                                >
                                    <div className='flex min-w-0 items-center gap-3'>
                                        {qData.logo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={qData.logo}
                                                alt={qData.name}
                                                className='border-border/80 h-8 w-8 shrink-0 rounded-lg border bg-white object-contain p-1'
                                                onError={(e) => {
                                                    ;(
                                                        e.target as HTMLElement
                                                    ).style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 font-mono text-xs font-bold text-blue-400'>
                                                {ticker.substring(0, 2)}
                                            </div>
                                        )}
                                        <div className='min-w-0'>
                                            <div className='flex items-baseline gap-1.5'>
                                                <span className='text-foreground text-sm font-bold transition-colors group-hover:text-blue-400'>
                                                    {ticker}
                                                </span>
                                                <span className='text-muted-foreground max-w-[80px] truncate text-[10px]'>
                                                    {qData.name}
                                                </span>
                                            </div>
                                            <div className='text-muted-foreground truncate font-mono text-[10px] uppercase'>
                                                {qData.industry}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='shrink-0 text-right'>
                                        <div className='text-foreground font-mono text-sm font-bold'>
                                            {qData.price !== null && qData.price !== undefined
                                                ? `$${qData.price.toFixed(2)}`
                                                : 'N/A'}
                                        </div>
                                        {qData.changePercent !== null && qData.changePercent !== undefined && (
                                            <div
                                                className={cn(
                                                    'font-mono text-[10px] font-bold',
                                                    qData.changePercent >= 0
                                                        ? 'text-sentiment-positive'
                                                        : 'text-sentiment-negative',
                                                )}
                                            >
                                                {qData.changePercent >= 0
                                                    ? '+'
                                                    : ''}
                                                {qData.changePercent.toFixed(2)}
                                                %
                                            </div>
                                        )}
                                    </div>
                                </a>
                            )
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
