'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getGeneralMarketSentiment } from '@/app/actions/charts'
import { ChartDataResponse } from '@/lib/types/charts'
import { SentimentLegend } from './SentimentLegend'
import { ChartFilters } from './ChartFilters'
import { ChartSkeleton } from './ChartSkeleton'

export function GeneralMarketSentimentChart() {
    const [data, setData] = useState<ChartDataResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<Record<string, string>>({})
    const isInitialLoad = useRef(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const result = await getGeneralMarketSentiment(filters)
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
                console.error(
                    'Failed to fetch general market sentiment:',
                    error,
                )
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [filters])

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
        return <ChartSkeleton type='area' title='General Market Sentiment' />
    }

    const chartData = Array.isArray(data?.data) ? data.data : []

    const getGradientStops = () => {
        const values = chartData
            .map((d: { sentiment?: number }) => d.sentiment as number)
            .filter((v: number) => typeof v === 'number')
        if (values.length === 0) return null

        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min

        const getColor = (val: number) =>
            val > 0.3 ? '#10B981' : val < -0.3 ? '#EF4444' : '#eab308'

        if (range === 0) {
            const color = getColor(max)
            return (
                <>
                    <stop offset='0%' stopColor={color} stopOpacity={0.8} />
                    <stop offset='100%' stopColor={color} stopOpacity={0.2} />
                </>
            )
        }

        const stops = []
        stops.push(
            <stop
                key='start'
                offset='0%'
                stopColor={getColor(max)}
                stopOpacity={0.8}
            />,
        )

        if (min < 0.3 && max > 0.3) {
            const off = (max - 0.3) / range
            stops.push(
                <stop
                    key='pos-1'
                    offset={off}
                    stopColor='#10B981'
                    stopOpacity={0.5}
                />,
            )
            stops.push(
                <stop
                    key='pos-2'
                    offset={off}
                    stopColor='#eab308'
                    stopOpacity={0.5}
                />,
            )
        }

        if (min < -0.3 && max > -0.3) {
            const off = (max - -0.3) / range
            stops.push(
                <stop
                    key='neg-1'
                    offset={off}
                    stopColor='#eab308'
                    stopOpacity={0.5}
                />,
            )
            stops.push(
                <stop
                    key='neg-2'
                    offset={off}
                    stopColor='#EF4444'
                    stopOpacity={0.5}
                />,
            )
        }

        stops.push(
            <stop
                key='end'
                offset='100%'
                stopColor={getColor(min)}
                stopOpacity={0.2}
            />,
        )
        return stops
    }

    return (
        <Card className='dark flex h-auto md:h-[500px] w-full min-w-0 flex-col pb-2'>
            <CardHeader className='py-4'>
                <CardTitle className='text-lg md:text-xl'>
                    {data?.title || 'General Market Sentiment'}
                </CardTitle>
            </CardHeader>
            <CardContent className='flex min-h-0 flex-1 flex-col pb-4'>
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
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: -25,
                                    bottom: 5,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id='splitColorSentimentArea'
                                        x1='0'
                                        y1='0'
                                        x2='0'
                                        y2='1'
                                    >
                                        {getGradientStops()}
                                    </linearGradient>
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
                                    content={({ active, payload, label }) => {
                                        if (
                                            active &&
                                            payload &&
                                            payload.length
                                        ) {
                                            const val = payload[0]
                                                .value as number
                                            const displayConf = Math.abs(val)
                                            const displayLbl =
                                                val > 0.3
                                                    ? 'positive'
                                                    : val < -0.3
                                                      ? 'negative'
                                                      : 'neutral'

                                            return (
                                                <div className='bg-background rounded border p-2 text-sm shadow-sm'>
                                                    <p className='mb-1 font-semibold'>
                                                        {formatDate(
                                                            label as string,
                                                        )}
                                                    </p>
                                                    <div
                                                        style={{
                                                            color: payload[0]
                                                                .color,
                                                        }}
                                                        className='mb-1'
                                                    >
                                                        <span className='font-bold'>
                                                            Market:
                                                        </span>{' '}
                                                        <span className='capitalize'>
                                                            {displayLbl}
                                                        </span>{' '}
                                                        (
                                                        {(
                                                            displayConf * 100
                                                        ).toFixed(0)}
                                                        % aggregated confidence)
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Legend />
                                <Area
                                    type='monotone'
                                    dataKey='sentiment'
                                    name='Aggregated Sentiment'
                                    stroke='url(#splitColorSentimentArea)'
                                    fill='url(#splitColorSentimentArea)'
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
