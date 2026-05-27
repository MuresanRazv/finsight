'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPopularTickers } from '@/app/actions/charts'
import { ChartDataResponse } from '@/lib/types/charts'
import { ChartFilters } from './ChartFilters'
import { ChartSkeleton } from './ChartSkeleton'

const COLORS = [
    '#2563eb', // blue-600
    '#db2777', // pink-600
    '#16a34a', // green-600
    '#ea580c', // orange-600
    '#9333ea', // purple-600
    '#0891b2', // cyan-600
    '#ca8a04', // yellow-600
    '#dc2626', // red-600
    '#4f46e5', // indigo-600
    '#059669', // emerald-600
]

export function PopularTickersChart() {
    const [data, setData] = useState<ChartDataResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<Record<string, string>>({})
    const isInitialLoad = useRef(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const result = await getPopularTickers(filters)
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
                console.error('Failed to fetch popular tickers:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [filters])

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    if (loading && !data) {
        return <ChartSkeleton type='bar' title='Popular Tickers' />
    }

    const chartData = Array.isArray(data?.data) ? data.data : []

    return (
        <Card className='dark flex h-[500px] w-full flex-col'>
            <CardHeader>
                <CardTitle>Popular Tickers</CardTitle>
            </CardHeader>
            <CardContent className='flex min-h-0 flex-1 flex-col pb-4'>
                <ChartFilters
                    filters={data?.available_filters || []}
                    activeFilters={filters}
                    onFilterChange={handleFilterChange}
                />
                {chartData.length === 0 ? (
                    <div className='text-muted-foreground flex flex-1 items-center justify-center'>
                        No data found
                    </div>
                ) : (
                    <div className='min-h-0 flex-1'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <BarChart
                                data={chartData}
                                layout='vertical'
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis type='number' />
                                <YAxis
                                    dataKey='ticker'
                                    type='category'
                                    width={80}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (
                                            active &&
                                            payload &&
                                            payload.length
                                        ) {
                                            const data = payload[0].payload
                                            return (
                                                <div className='bg-background rounded border p-2 text-sm shadow-sm'>
                                                    <p className='font-semibold'>
                                                        {label}
                                                    </p>
                                                    <p>Count: {data.count}</p>
                                                    <p>
                                                        Avg Sentiment:{' '}
                                                        {typeof data.average_sentiment ===
                                                        'number'
                                                            ? data.average_sentiment.toFixed(
                                                                  2,
                                                              )
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Bar dataKey='count'>
                                    {chartData.map(
                                        (entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ),
                                    )}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
