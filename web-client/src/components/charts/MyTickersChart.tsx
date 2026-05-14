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

const CustomDot = (props: any) => {
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

const CustomActiveDot = (props: any) => {
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
                                acc[filter.key] = filter.default_value
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

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            if (filters.range === '24h') {
                return date.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                })
            }
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
            })
        } catch (e) {
            return dateStr
        }
    }

    if (loading && !data) {
        return (
            <Card className='flex h-[500px] w-full items-center justify-center'>
                <div className='text-muted-foreground'>Loading...</div>
            </Card>
        )
    }

    const chartData = Array.isArray(data?.data) ? data.data : []

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
    const lines = Array.from(linesSet)

    const getGradientStops = (ticker: string) => {
        const values = chartData
            .map((d: any) => d[ticker] as number)
            .filter((v: any) => typeof v === 'number')
        if (values.length === 0) return null

        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min

        // Now positive is > 0.3, neutral is -0.3 to 0.3, negative is < -0.3
        const getColor = (val: number) =>
            val > 0.3 ? '#22c55e' : val < -0.3 ? '#ef4444' : '#eab308'

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
            stops.push(<stop key='pos-1' offset={off} stopColor='#22c55e' />)
            stops.push(<stop key='pos-2' offset={off} stopColor='#eab308' />)
        }

        if (min < -0.3 && max > -0.3) {
            const off = (max - -0.3) / range
            stops.push(<stop key='neg-1' offset={off} stopColor='#eab308' />)
            stops.push(<stop key='neg-2' offset={off} stopColor='#ef4444' />)
        }

        stops.push(<stop key='end' offset='100%' stopColor={getColor(min)} />)
        return stops
    }

    return (
        <Card className='dark flex h-[500px] w-full flex-col'>
            <CardHeader>
                <CardTitle>My Tickers</CardTitle>
            </CardHeader>
            <CardContent className='flex min-h-0 flex-1 flex-col pb-4'>
                <div className='mb-2 flex items-start justify-between'>
                    <ChartFilters
                        filters={data?.available_filters || []}
                        activeFilters={filters}
                        onFilterChange={handleFilterChange}
                    />
                </div>
                <SentimentLegend />
                {chartData.length === 0 ? (
                    <div className='text-muted-foreground flex flex-1 items-center justify-center'>
                        No data found
                    </div>
                ) : (
                    <div className='min-h-0 flex-1'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
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
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis
                                    dataKey='date'
                                    tickFormatter={formatDate}
                                />
                                <YAxis
                                    domain={[-1, 1]}
                                    tickFormatter={(val) =>
                                        val === 0 ? '0' : val.toFixed(1)
                                    }
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
                                                                    : val > 0.3
                                                                      ? 'positive'
                                                                      : val <
                                                                          -0.3
                                                                        ? 'negative'
                                                                        : 'neutral'

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    style={{
                                                                        color: entry.color,
                                                                    }}
                                                                    className='mb-1'
                                                                >
                                                                    <span className='font-bold'>
                                                                        {ticker}
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
            </CardContent>
        </Card>
    )
}
