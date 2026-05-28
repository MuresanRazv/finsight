'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Popover, PopoverAnchor, PopoverContent } from './popover'
import { TrendingUp, TrendingDown, HelpCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TickerBadgeProps {
    ticker: string
    className?: string
    showParentheses?: boolean
    children?: React.ReactNode
    style?: React.CSSProperties
}

export function TickerBadge({
    ticker,
    className,
    showParentheses = false,
    children,
    style,
}: TickerBadgeProps) {
    const cleanTicker = ticker.trim().replace(/[()]/g, '').toUpperCase()
    const [isOpen, setIsOpen] = useState(false)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const fetchStockData = async () => {
        if (data || loading) return
        setLoading(true)
        setError(false)
        try {
            const res = await fetch(`/api/stocks/${cleanTicker}`)
            if (res.ok) {
                const json = await res.json()
                setData(json)
            } else {
                setError(true)
            }
        } catch (e) {
            console.error(e)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            setIsOpen(true)
            fetchStockData()
        }, 200)
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false)
        }, 150)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverAnchor asChild>
                <span
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                        setIsOpen(!isOpen)
                        fetchStockData()
                    }}
                    className={cn(
                        'bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex cursor-pointer items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors select-none',
                        className,
                    )}
                    style={style}
                >
                    {children ||
                        (showParentheses ? `(${cleanTicker})` : cleanTicker)}
                </span>
            </PopoverAnchor>
            <PopoverContent
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                align='start'
                side='top'
                sideOffset={6}
                className='border-border bg-card dark pointer-events-auto w-72 !scale-100 rounded-xl border p-4 !opacity-100 shadow-xl'
            >
                {loading && (
                    <div className='text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm'>
                        <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
                        <span>Fetching live quote...</span>
                    </div>
                )}

                {error && (
                    <div className='text-muted-foreground flex items-center justify-center gap-1 py-6 text-sm'>
                        <HelpCircle className='h-4 w-4 text-red-500' />
                        <span>Failed to fetch stock info</span>
                    </div>
                )}

                {!loading && !error && data && (
                    <div className='space-y-3'>
                        {/* Header Profile Section */}
                        <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0 flex-1'>
                                <h4 className='text-foreground truncate text-sm font-bold'>
                                    {data.name}
                                </h4>
                                <p className='text-muted-foreground font-mono text-[10px] tracking-wider uppercase'>
                                    {data.exchange} • {data.industry}
                                </p>
                            </div>
                            {data.logo ? (
                                <img
                                    src={data.logo}
                                    alt={data.name}
                                    className='border-border/80 h-8 w-8 rounded-lg border bg-white object-contain p-1'
                                    onError={(e) => {
                                        ;(
                                            e.target as HTMLElement
                                        ).style.display = 'none'
                                    }}
                                />
                            ) : (
                                <div className='flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 font-mono text-xs font-bold text-blue-400'>
                                    {cleanTicker.substring(0, 2)}
                                </div>
                            )}
                        </div>

                        {/* Price Details */}
                        <div className='flex items-baseline justify-between pt-1'>
                            <div className='text-foreground font-mono text-xl font-bold'>
                                {data.price !== null
                                    ? `$${data.price.toFixed(2)}`
                                    : 'N/A'}
                            </div>
                            {data.changePercent !== null &&
                                data.changePercent !== undefined && (
                                    <div
                                        className={cn(
                                            'flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-bold',
                                            data.changePercent >= 0
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-red-500/10 text-red-400',
                                        )}
                                    >
                                        {data.changePercent >= 0 ? (
                                            <TrendingUp className='h-3 w-3' />
                                        ) : (
                                            <TrendingDown className='h-3 w-3' />
                                        )}
                                        {data.changePercent >= 0 ? '+' : ''}
                                        {data.changePercent.toFixed(2)}%
                                    </div>
                                )}
                        </div>

                        {/* Extra Price Info */}
                        {data.change !== null && data.price !== null && (
                            <div className='text-muted-foreground border-border/40 flex justify-between border-t pt-2 font-mono text-[10px]'>
                                <span>24h Change:</span>
                                <span
                                    className={cn(
                                        data.change >= 0
                                            ? 'text-emerald-400'
                                            : 'text-red-400',
                                    )}
                                >
                                    {data.change >= 0 ? '+' : ''}
                                    {data.change.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
