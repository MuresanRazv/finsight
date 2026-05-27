'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartSkeletonProps {
    title?: string
    type: 'area' | 'bar' | 'list'
}

export function ChartSkeleton({
    title = 'Loading...',
    type,
}: ChartSkeletonProps) {
    return (
        <Card className='dark bg-card border-border flex h-[500px] w-full flex-col shadow-xs'>
            <CardHeader className='pb-2'>
                <CardTitle className='text-foreground flex items-center justify-between text-base font-semibold'>
                    {title === 'Loading...' ? (
                        <span className='h-5 w-48 animate-pulse rounded bg-slate-700/50' />
                    ) : (
                        <span>{title}</span>
                    )}
                    {/* Header filters placeholder */}
                    <span className='h-7 w-20 animate-pulse rounded bg-slate-800/80' />
                </CardTitle>
            </CardHeader>
            <CardContent className='flex min-h-0 flex-1 flex-col justify-between p-6 pt-2'>
                {type === 'area' && (
                    <div className='relative flex h-full w-full flex-1 flex-col justify-between'>
                        {/* Area Chart Skeleton */}
                        <div className='relative mb-4 h-full w-full flex-1'>
                            <svg
                                className='h-full w-full text-slate-800'
                                viewBox='0 0 400 200'
                                preserveAspectRatio='none'
                            >
                                <defs>
                                    <linearGradient
                                        id='areaGradient'
                                        x1='0'
                                        y1='0'
                                        x2='0'
                                        y2='1'
                                    >
                                        <stop
                                            offset='0%'
                                            stopColor='#3b82f6'
                                            stopOpacity='0.12'
                                        />
                                        <stop
                                            offset='100%'
                                            stopColor='#3b82f6'
                                            stopOpacity='0'
                                        />
                                    </linearGradient>
                                </defs>
                                {/* Grid lines */}
                                <line
                                    x1='0'
                                    y1='50'
                                    x2='400'
                                    y2='50'
                                    stroke='#334155'
                                    strokeWidth='0.5'
                                    strokeDasharray='4 4'
                                    opacity='0.4'
                                />
                                <line
                                    x1='0'
                                    y1='100'
                                    x2='400'
                                    y2='100'
                                    stroke='#334155'
                                    strokeWidth='0.5'
                                    strokeDasharray='4 4'
                                    opacity='0.4'
                                />
                                <line
                                    x1='0'
                                    y1='150'
                                    x2='400'
                                    y2='150'
                                    stroke='#334155'
                                    strokeWidth='0.5'
                                    strokeDasharray='4 4'
                                    opacity='0.4'
                                />
                                {/* Area path */}
                                <path
                                    d='M0,200 L0,130 Q50,70 100,150 T200,90 T300,160 T400,70 L400,200 Z'
                                    fill='url(#areaGradient)'
                                    className='animate-pulse'
                                />
                                {/* Line path */}
                                <path
                                    d='M0,130 Q50,70 100,150 T200,90 T300,160 T400,70'
                                    fill='none'
                                    stroke='#3b82f6'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    className='animate-pulse opacity-40'
                                />
                            </svg>
                        </div>
                        {/* X-Axis labels placeholder */}
                        <div className='flex items-center justify-between px-2 font-mono text-[10px] text-slate-500'>
                            <span className='h-3 w-8 animate-pulse rounded bg-slate-800/80' />
                            <span className='h-3 w-8 animate-pulse rounded bg-slate-800/80' />
                            <span className='h-3 w-8 animate-pulse rounded bg-slate-800/80' />
                            <span className='h-3 w-8 animate-pulse rounded bg-slate-800/80' />
                            <span className='h-3 w-8 animate-pulse rounded bg-slate-800/80' />
                        </div>
                    </div>
                )}

                {type === 'bar' && (
                    <div className='flex h-full w-full flex-1 flex-col justify-between'>
                        {/* Bar Chart Skeleton */}
                        <div className='border-border/40 relative flex w-full flex-1 items-end justify-between border-b px-2 pt-8 pb-4'>
                            {[65, 45, 80, 55, 75, 40, 90, 50, 70, 45].map(
                                (height, i) => (
                                    <div
                                        key={i}
                                        style={{ height: `${height}%` }}
                                        className='w-[8%] animate-pulse rounded-t-md border border-blue-500/20 bg-blue-500/10'
                                    />
                                ),
                            )}
                        </div>
                        {/* X-Axis labels placeholder */}
                        <div className='mt-3 flex items-center justify-between px-1'>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <span
                                    key={i}
                                    className='h-3 w-6 animate-pulse rounded bg-slate-800/80'
                                />
                            ))}
                        </div>
                    </div>
                )}

                {type === 'list' && (
                    <div className='divide-border/60 flex min-h-0 flex-1 flex-col divide-y overflow-hidden'>
                        {/* List Feed Skeleton */}
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className='space-y-2.5 py-4.5 first:pt-0 last:pb-0'
                            >
                                <div className='h-4.5 w-11/12 animate-pulse rounded bg-slate-700/50' />
                                <div className='h-3.5 w-1/4 animate-pulse rounded bg-slate-800/80' />
                                <div className='flex items-center gap-2 pt-1'>
                                    <span className='h-5 w-20 animate-pulse rounded bg-slate-800/50' />
                                    <span className='h-5 w-24 animate-pulse rounded bg-slate-800/50' />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
