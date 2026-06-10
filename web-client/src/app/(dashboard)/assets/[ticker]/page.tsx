'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Star,
    TrendingUp,
    TrendingDown,
    Activity,
    Sparkles,
    BarChart2,
    ChevronRight,
    ArrowLeft,
} from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'
import { getUserSettings, updateUserSettings } from '@/app/actions/settings'
import { getTickerRelatedNews, TickerRelatedNewsItem } from '@/app/actions/articles'
import { formatDistanceToNow } from 'date-fns'

import { getMyTickers } from '@/app/actions/charts'

const CustomDot = (props: any) => {
    const { cx, cy, value } = props
    if (value === undefined || value === null) return null
    let color = '#eab308' // yellow
    if (value > 0.3)
        color = '#10B981' // green
    else if (value < -0.3) color = '#ef4444' // red
    return <circle cx={cx} cy={cy} r={4} fill={color} strokeWidth={0} />
}

const CustomActiveDot = (props: any) => {
    const { cx, cy, value } = props
    if (value === undefined || value === null) return null
    let color = '#eab308'
    if (value > 0.3) color = '#10B981'
    else if (value < -0.3) color = '#ef4444'
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

const getGradientStops = (chartData: any[], ticker: string) => {
    const values = chartData
        .map((d: any) => d[ticker] as number)
        .filter((v: any) => typeof v === 'number')
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

const formatChartDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        })
    } catch (e) {
        return dateStr
    }
}
export default function TickerPage({
    params,
}: {
    params: Promise<{ ticker: string }>
}) {
    const { ticker } = use(params)
    const symbol = ticker.toUpperCase()
    const router = useRouter()

    const [activeInterval, setActiveInterval] = useState<
        '1D' | '1W' | '1M' | '3M' | '1Y'
    >('1M')
    const [chartDataClose, setChartDataClose] = useState<number[]>([])
    const [chartLoading, setChartLoading] = useState(true)
    const [chartStatus, setChartStatus] = useState<'ok' | 'mocked' | 'no_data'>('ok')
    const [watchlistTickers, setWatchlistTickers] = useState<string[]>([])
    const [loadingWatchlist, setLoadingWatchlist] = useState(true)
    const [relatedNews, setRelatedNews] = useState<TickerRelatedNewsItem[]>([])
    const [loadingNews, setLoadingNews] = useState(true)

    // Dynamic states replacing getProceduralTickerData mock
    const [stockQuote, setStockQuote] = useState<any>(null)
    const [quoteLoading, setQuoteLoading] = useState(true)
    const [sentimentData, setSentimentData] = useState<any[]>([])
    const [loadingSentiment, setLoadingSentiment] = useState(true)

    // Fetch live stock quote from API
    useEffect(() => {
        const fetchQuote = async () => {
            setQuoteLoading(true)
            try {
                const res = await fetch(`/api/stocks/${symbol.toLowerCase()}`)
                if (res.ok) {
                    const data = await res.json()
                    setStockQuote(data)
                }
            } catch (err) {
                console.error('Failed to fetch stock quote', err)
            } finally {
                setQuoteLoading(false)
            }
        }
        fetchQuote()
    }, [symbol])

    // Fetch real sentiment trend data from TimescaleDB via server action
    useEffect(() => {
        const fetchSentiment = async () => {
            setLoadingSentiment(true)
            try {
                const res = await getMyTickers({ ticker: symbol, range: '30d' })
                if (res && Array.isArray(res.data)) {
                    setSentimentData(res.data)
                }
            } catch (err) {
                console.error('Failed to load sentiment trend data', err)
            } finally {
                setLoadingSentiment(false)
            }
        }
        fetchSentiment()
    }, [symbol])

    // Load real related news on mount / symbol change
    useEffect(() => {
        const fetchNews = async () => {
            setLoadingNews(true)
            try {
                const newsData = await getTickerRelatedNews(symbol, 4)
                if (newsData) {
                    setRelatedNews(newsData)
                }
            } catch (error) {
                console.error(`Failed to fetch related news for ticker ${symbol}`, error)
            } finally {
                setLoadingNews(false)
            }
        }
        fetchNews()
    }, [symbol])

    // Sync watchlist with database settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getUserSettings()
                if (settings && Array.isArray(settings.tickers)) {
                    setWatchlistTickers(
                        settings.tickers.map((t: string) => t.toUpperCase()),
                    )
                }
            } catch (err) {
                console.error('Failed to load user watchlist', err)
            } finally {
                setLoadingWatchlist(false)
            }
        }
        fetchSettings()
    }, [])

    const toggleWatchlist = async () => {
        const isAdded = watchlistTickers.includes(symbol)
        let newTickers: string[] = []
        if (isAdded) {
            newTickers = watchlistTickers.filter((t) => t !== symbol)
        } else {
            newTickers = [...watchlistTickers, symbol]
        }

        try {
            await updateUserSettings({ tickers: newTickers })
            setWatchlistTickers(newTickers)
            toast.success(
                isAdded
                    ? `${symbol} removed from watchlist`
                    : `${symbol} added to watchlist`,
            )
        } catch (err) {
            console.error('Failed to update watchlist', err)
            toast.error('Failed to update watchlist')
        }
    }

    // Fetch dynamic Stock Candles
    useEffect(() => {
        const fetchCandles = async () => {
            setChartLoading(true)
            try {
                const now = Math.floor(Date.now() / 1000)
                let from = now - 30 * 86400
                if (activeInterval === '1W') from = now - 7 * 86400
                else if (activeInterval === '1M') from = now - 30 * 86400
                else if (activeInterval === '3M') from = now - 90 * 86400
                else if (activeInterval === '1Y') from = now - 365 * 86400
                else if (activeInterval === '1D') from = now - 2 * 86400

                const res = await fetch(
                    `/api/stocks/${symbol.toLowerCase()}/candles?from=${from}&to=${now}`,
                )
                if (res.ok) {
                    const data = await res.json()
                    if (
                        data &&
                        Array.isArray(data.close) &&
                        data.close.length > 0
                    ) {
                        setChartDataClose(data.close)
                        setChartStatus(data.status || 'ok')
                        return
                    }
                }
            } catch (err) {
                console.error('Failed to fetch candles', err)
            } finally {
                setChartLoading(false)
            }
            setChartDataClose([])
            setChartStatus('no_data')
        }
        fetchCandles()
    }, [symbol, activeInterval])

    // Generate Candlestick items (Open, High, Low, Close) from the close price list
    const candles = chartDataClose.map((closePrice, idx) => {
        const prevClose = idx > 0 ? chartDataClose[idx - 1] : closePrice * 0.98
        const openPrice = prevClose
        const isBullish = closePrice >= openPrice
        const variance = Math.abs(closePrice - openPrice) * 0.2
        const highPrice =
            Math.max(openPrice, closePrice) + variance + closePrice * 0.005
        const lowPrice =
            Math.min(openPrice, closePrice) - variance - closePrice * 0.005
        return {
            open: openPrice,
            high: highPrice,
            low: lowPrice,
            close: closePrice,
            isBullish,
        }
    })

    const minPrice =
        candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : 0
    const maxPrice =
        candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : 0
    const priceRange = maxPrice - minPrice

    const formatNewsDate = (dateInput: any) => {
        if (!dateInput) return 'unknown'
        try {
            const date = new Date(dateInput)
            if (isNaN(date.getTime())) return 'invalid date'
            return formatDistanceToNow(date, { addSuffix: true })
        } catch (error) {
            return 'invalid date'
        }
    }

    const isPositive = stockQuote?.change !== null ? stockQuote?.change >= 0 : false
    const isAddedToWatchlist = watchlistTickers.includes(symbol)

    const navigateToArticleAnalysis = (newsArticle: any) => {
        if (newsArticle.uuid) {
            router.push(`/articles/deep-dive/${newsArticle.uuid}`)
        } else {
            toast.error('Deep dive analysis is only available for fully processed database articles.')
        }
    }

    return (
        <div className='space-y-8 pb-16'>
            {/* Navigation back and header banner */}
            <div className='flex items-start justify-between gap-4'>
                <div>
                    <button
                        onClick={() => router.back()}
                        className='text-muted-foreground hover:text-foreground group mb-4 flex cursor-pointer items-center gap-2 text-sm transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
                        <span>Go Back</span>
                    </button>

                    <div className='flex items-center gap-4'>
                        <div className='bg-surface-container border-border flex h-12 w-12 items-center justify-center rounded-xl border'>
                            <span className='text-primary text-xl font-bold'>
                                {symbol.slice(0, 2)}
                            </span>
                        </div>
                        <div>
                            <div className='flex items-center gap-2.5'>
                                <h1 className='text-foreground text-2xl font-bold'>
                                    {symbol}
                                </h1>
                                {quoteLoading ? (
                                    <div className="h-4 w-24 bg-muted/20 animate-pulse rounded"></div>
                                ) : (
                                    <span className='text-muted-foreground text-sm font-medium'>
                                        {stockQuote?.name}
                                    </span>
                                )}
                            </div>
                            {quoteLoading ? (
                                <div className="mt-2 h-6 w-32 bg-muted/20 animate-pulse rounded"></div>
                            ) : stockQuote && stockQuote.price !== null ? (
                                <div className='mt-1 flex items-center gap-3'>
                                    <span className='text-foreground font-mono text-2xl font-bold'>
                                        ${stockQuote.price.toFixed(2)}
                                    </span>
                                    {stockQuote.changePercent !== null && (
                                        <span
                                            className={`flex items-center gap-0.5 text-sm font-bold ${
                                                isPositive
                                                    ? 'text-sentiment-positive'
                                                    : 'text-sentiment-negative'
                                            }`}
                                        >
                                            {isPositive ? (
                                                <TrendingUp className='h-4 w-4' />
                                            ) : (
                                                <TrendingDown className='h-4 w-4' />
                                            )}
                                            {isPositive ? '+' : ''}
                                            {stockQuote.changePercent.toFixed(2)}%
                                        </span>
                                    )}
                                    <span className='text-muted-foreground bg-surface-container-high rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase'>
                                        MARKET OPEN
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-2 text-xs font-semibold text-amber-500/90 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 w-fit">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Live stock quote requires a Finnhub API Key</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-3'>
                    <button
                        onClick={toggleWatchlist}
                        disabled={loadingWatchlist}
                        className={`flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                            isAddedToWatchlist
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'border-border text-muted-foreground hover:text-foreground hover:bg-surface-container-high'
                        }`}
                    >
                        <Star
                            className={`h-4 w-4 ${isAddedToWatchlist ? 'fill-primary' : ''}`}
                        />
                        <span>
                            {isAddedToWatchlist ? 'Watched' : 'Watchlist'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className='grid grid-cols-12 items-start gap-8'>
                {/* Left Area: Charts & Insights */}
                <div className='col-span-12 space-y-8 lg:col-span-8'>
                    {/* SVG Candlestick Chart */}
                    <div className='bg-surface-container border-border overflow-hidden rounded-xl border shadow-md'>
                        <div className='border-border bg-surface-container-low/40 flex items-center justify-between border-b p-5'>
                            <div className='flex gap-2'>
                                {(['1D', '1W', '1M', '3M', '1Y'] as const).map(
                                    (interval) => (
                                        <button
                                            key={interval}
                                            onClick={() =>
                                                setActiveInterval(interval)
                                            }
                                            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                                activeInterval === interval
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-container-high/60'
                                            }`}
                                        >
                                            {interval}
                                        </button>
                                    ),
                                )}
                            </div>
                            <div className='text-muted-foreground flex items-center gap-4 text-xs font-semibold'>
                                {chartStatus === 'mocked' && (
                                    <span className='bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5'>
                                        <Sparkles className="h-3 w-3" />
                                        Simulated Data
                                    </span>
                                )}
                                <span className='flex items-center gap-1.5'>
                                    <span className='bg-sentiment-positive h-2.5 w-2.5 rounded-full'></span>
                                    <span>
                                        High: $
                                        {(maxPrice || stockQuote?.price || 0).toFixed(2)}
                                    </span>
                                </span>
                                <span className='flex items-center gap-1.5'>
                                    <span className='bg-sentiment-negative h-2.5 w-2.5 rounded-full'></span>
                                    <span>
                                        Low: $
                                        {(minPrice || stockQuote?.price || 0).toFixed(2)}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className='relative h-80 w-full bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.02),transparent)] p-6'>
                            {chartLoading ? (
                                <div className='text-muted-foreground absolute inset-0 flex items-center justify-center text-sm'>
                                    Loading historical data...
                                </div>
                            ) : candles.length === 0 ? (
                                <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                                    <Sparkles className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
                                    <p className="text-sm font-semibold text-foreground/80">Price history chart is unavailable</p>
                                    <p className="text-xs text-muted-foreground max-w-md">Finnhub API Key is required for real-time stock price history.</p>
                                </div>
                            ) : (
                                <svg
                                    className='h-full w-full overflow-visible'
                                    viewBox='0 0 800 240'
                                >
                                    {/* Grid Lines */}
                                    <line
                                        x1='0'
                                        y1='200'
                                        x2='800'
                                        y2='200'
                                        stroke='var(--border)'
                                        strokeWidth='1'
                                        strokeOpacity='0.3'
                                    ></line>
                                    <line
                                        x1='0'
                                        y1='140'
                                        x2='800'
                                        y2='140'
                                        stroke='var(--border)'
                                        strokeWidth='1'
                                        strokeOpacity='0.3'
                                    ></line>
                                    <line
                                        x1='0'
                                        y1='80'
                                        x2='800'
                                        y2='80'
                                        stroke='var(--border)'
                                        strokeWidth='1'
                                        strokeOpacity='0.3'
                                    ></line>
                                    <line
                                        x1='0'
                                        y1='20'
                                        x2='800'
                                        y2='20'
                                        stroke='var(--border)'
                                        strokeWidth='1'
                                        strokeOpacity='0.3'
                                    ></line>

                                    {/* Close Price Line Overlay */}
                                    <path
                                        d={candles
                                            .map((c, idx) => {
                                                const x =
                                                    candles.length > 1
                                                        ? (idx /
                                                              (candles.length -
                                                                  1)) *
                                                          800
                                                        : 0
                                                const y =
                                                    200 -
                                                    ((c.close - minPrice) /
                                                        (priceRange || 1)) *
                                                        160
                                                return `${idx === 0 ? 'M' : 'L'}${x},${y}`
                                            })
                                            .join(' ')}
                                        fill='none'
                                        stroke='var(--primary)'
                                        strokeWidth='2'
                                        strokeOpacity='0.3'
                                        strokeDasharray='4'
                                    />

                                    {/* Candlesticks */}
                                    {candles.map((c, idx) => {
                                        const totalCandles = candles.length
                                        const width = Math.min(
                                            20,
                                            Math.max(4, 700 / totalCandles),
                                        )
                                        const x =
                                            totalCandles > 1
                                                ? (idx / (totalCandles - 1)) *
                                                  800
                                                : 400

                                        const highY =
                                            200 -
                                            ((c.high - minPrice) /
                                                (priceRange || 1)) *
                                                160
                                        const lowY =
                                            200 -
                                            ((c.low - minPrice) /
                                                (priceRange || 1)) *
                                                160
                                        const openY =
                                            200 -
                                            ((c.open - minPrice) /
                                                (priceRange || 1)) *
                                                160
                                        const closeY =
                                            200 -
                                            ((c.close - minPrice) /
                                                (priceRange || 1)) *
                                                160

                                        const rectY = Math.min(openY, closeY)
                                        const rectH = Math.max(
                                            2,
                                            Math.abs(openY - closeY),
                                        )

                                        return (
                                            <g key={idx}>
                                                {/* Wick */}
                                                <line
                                                    x1={x}
                                                    y1={highY}
                                                    x2={x}
                                                    y2={lowY}
                                                    stroke={
                                                        c.isBullish
                                                            ? 'var(--sentiment-positive)'
                                                            : 'var(--sentiment-negative)'
                                                    }
                                                    strokeWidth='1.5'
                                                />
                                                {/* Body */}
                                                <rect
                                                    x={x - width / 2}
                                                    y={rectY}
                                                    width={width}
                                                    height={rectH}
                                                    fill={
                                                        c.isBullish
                                                            ? 'var(--sentiment-positive)'
                                                            : 'var(--sentiment-negative)'
                                                    }
                                                    rx='1'
                                                />
                                            </g>
                                        )
                                    })}
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* AI Sentiment Trend Line Chart */}
                    <div className='bg-surface-container border-border relative overflow-hidden rounded-xl border p-6 shadow-md'>
                        {/* Glow decorative block */}
                        <div className='bg-ai-glow/5 absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl'></div>

                        <div className='mb-6 flex items-center gap-2'>
                            <Sparkles className='text-ai-glow fill-ai-glow/10 h-5 w-5' />
                            <h3 className='text-foreground text-base font-bold'>
                                AI Sentiment Trend
                            </h3>
                        </div>

                        <div className='relative mt-4 h-56 w-full'>
                            {loadingSentiment ? (
                                <div className='text-muted-foreground absolute inset-0 flex items-center justify-center text-sm'>
                                    Loading sentiment history...
                                </div>
                            ) : sentimentData.length === 0 ? (
                                <div className='text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4'>
                                    <Activity className='h-8 w-8 text-muted-foreground/40 animate-pulse' />
                                    <p className='text-sm font-semibold text-foreground/80'>No sentiment trend data available</p>
                                    <p className='text-xs text-muted-foreground max-w-md'>Articles must be processed to populate sentiment history for this asset.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width='100%' height='100%'>
                                    <LineChart
                                        data={sentimentData}
                                        margin={{
                                            top: 5,
                                            right: 10,
                                            left: -20,
                                            bottom: 5,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id={`splitColor-${symbol}`}
                                                x1='0'
                                                y1='0'
                                                x2='0'
                                                y2='1'
                                            >
                                                {getGradientStops(
                                                    sentimentData,
                                                    symbol,
                                                )}
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray='3 3'
                                            stroke='var(--border)'
                                            strokeOpacity='0.3'
                                        />
                                        <XAxis
                                            dataKey='date'
                                            tickFormatter={formatChartDate}
                                            stroke='var(--muted-foreground)'
                                            fontSize={10}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={[-1, 1]}
                                            tickFormatter={(val) =>
                                                val === 0 ? '0' : val.toFixed(1)
                                            }
                                            stroke='var(--muted-foreground)'
                                            fontSize={10}
                                            tickLine={false}
                                        />
                                        <ReferenceLine
                                            y={0}
                                            stroke='var(--border)'
                                            strokeDasharray='3 3'
                                        />
                                        <Tooltip
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
                                                    const entry = payload[0]
                                                    const data = entry.payload
                                                    const conf =
                                                        data[`${symbol}_confidence`]
                                                    const lbl =
                                                        data[`${symbol}_label`]
                                                    const val =
                                                        entry.value as number

                                                    let colorClass =
                                                        'text-sentiment-neutral'
                                                    if (val > 0.3)
                                                        colorClass =
                                                            'text-sentiment-positive'
                                                    else if (val < -0.3)
                                                        colorClass =
                                                            'text-sentiment-negative'

                                                    return (
                                                        <div className='bg-surface-container-high border-border rounded-lg border p-3 text-xs shadow-md'>
                                                            <p className='text-foreground mb-1.5 font-bold'>
                                                                {formatChartDate(
                                                                    label as string,
                                                                )}
                                                            </p>
                                                            <div className='space-y-1'>
                                                                <div>
                                                                    <span className='text-primary font-bold'>
                                                                        {symbol}:
                                                                    </span>{' '}
                                                                    <span
                                                                        className={`font-bold capitalize ${colorClass}`}
                                                                    >
                                                                        {lbl ||
                                                                            (val >
                                                                            0.3
                                                                                ? 'positive'
                                                                                : val <
                                                                                    -0.3
                                                                                  ? 'negative'
                                                                                  : 'neutral')}
                                                                    </span>
                                                                </div>
                                                                <div className='text-muted-foreground font-semibold'>
                                                                    Score:{' '}
                                                                    <span className='text-foreground font-mono font-bold'>
                                                                        {val > 0
                                                                            ? '+'
                                                                            : ''}
                                                                        {val.toFixed(
                                                                            2,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className='text-muted-foreground font-semibold'>
                                                                    Confidence:{' '}
                                                                    <span className='text-foreground font-mono font-bold'>
                                                                        {Math.round(
                                                                            (conf ||
                                                                                0.8) *
                                                                                100,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Line
                                            type='monotone'
                                            dataKey={symbol}
                                            name={symbol}
                                            stroke={`url(#splitColor-${symbol})`}
                                            strokeWidth={2.5}
                                            dot={<CustomDot />}
                                            activeDot={<CustomActiveDot />}
                                            connectNulls={true}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <p className='text-muted-foreground mt-4 text-xs italic'>
                            Aggregated consensus analysis compiled from earning
                            transcripts, financial reporting indexes, and
                            institutional vectors.
                        </p>
                    </div>
                </div>

                {/* Right Area: News */}
                <div className='col-span-12 space-y-8 lg:col-span-4'>
                    {/* Related news cards */}
                    <div className='space-y-4'>
                        <h3 className='text-foreground px-1 text-base font-bold'>
                            Related News
                        </h3>

                        {loadingNews ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((n) => (
                                    <div key={n} className="bg-surface-container border-l-4 border-l-muted/20 rounded-r-xl border p-4 animate-pulse">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="h-2 w-24 bg-muted/40 rounded"></div>
                                            <div className="h-3.5 w-10 bg-muted/40 rounded"></div>
                                        </div>
                                        <div className="h-4 w-5/6 bg-muted/40 rounded mb-2"></div>
                                        <div className="h-4 w-2/3 bg-muted/40 rounded mb-2"></div>
                                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/20">
                                            <div className="h-3 w-28 bg-muted/40 rounded"></div>
                                            <div className="h-4 w-4 bg-muted/40 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : relatedNews.length === 0 ? (
                            <div className="bg-surface-container/30 border border-border/50 rounded-xl p-6 text-center">
                                <Sparkles className="h-8 w-8 text-muted-foreground/45 mx-auto mb-2.5 animate-pulse" />
                                <p className="text-muted-foreground text-xs font-medium">
                                    No related news found for {symbol}
                                </p>
                            </div>
                        ) : (
                            relatedNews.map((item, index) => {
                                const borderClass =
                                    item.sentiment === 'positive'
                                        ? 'border-l-sentiment-positive'
                                        : item.sentiment === 'negative'
                                          ? 'border-l-sentiment-negative'
                                          : 'border-l-sentiment-neutral'

                                const labelBg =
                                    item.sentiment === 'positive'
                                        ? 'bg-sentiment-positive/10 text-sentiment-positive'
                                        : item.sentiment === 'negative'
                                          ? 'bg-sentiment-negative/10 text-sentiment-negative'
                                          : 'bg-sentiment-neutral/15 text-muted-foreground'

                                const relevancePercent = item.sentiment_score !== undefined
                                    ? Math.round(item.sentiment_score * 100)
                                    : 0

                                return (
                                    <div
                                        key={index}
                                        onClick={() =>
                                            navigateToArticleAnalysis(item)
                                        }
                                        className={`bg-surface-container border-l-4 ${borderClass} border-border hover:bg-surface-container-high group cursor-pointer rounded-r-xl border-y border-r p-4 transition-colors`}
                                    >
                                        <div className='mb-2 flex items-center justify-between'>
                                            <span className='text-muted-foreground text-[9px] font-bold tracking-wider'>
                                                {item.source} • {formatNewsDate(item.processed_at).toUpperCase()}
                                            </span>
                                            <span
                                                className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${labelBg}`}
                                            >
                                                {item.sentiment.slice(0, 3)}
                                            </span>
                                        </div>
                                        <h4 className='text-foreground group-hover:text-primary mb-2 text-sm leading-snug font-bold transition-colors line-clamp-2'>
                                            {item.title}
                                        </h4>
                                        <div className='text-muted-foreground flex items-center justify-between text-[10px] font-semibold'>
                                            <span className='flex items-center gap-1'>
                                                <BarChart2 className='h-3.5 w-3.5' />
                                                <span>
                                                    AI Relevance: {relevancePercent}%
                                                </span>
                                            </span>
                                            <ChevronRight className='text-muted-foreground/60 h-4 w-4 transition-transform group-hover:translate-x-0.5' />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
