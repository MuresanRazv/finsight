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
    Zap, 
    Network, 
    BarChart2, 
    ChevronRight, 
    Check,
    ArrowLeft
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

function seedRandom(seedStr: string) {
    let hash = 0
    for (let i = 0; i < seedStr.length; i++) {
        hash = seedStr.charCodeAt(i) + ((hash << 5) - hash)
    }
    return () => {
        const x = Math.sin(hash++) * 10000
        return x - Math.floor(x)
    }
}

const TickerCatalogs: Record<string, {
    name: string
    price: number
    change: number
    changePercent: number
    marketCap: string
    peRatio: string
    high52w: string
    low52w: string
    dividend: string
    consensus: number
    consensusText: string
    consensusDesc: string
    insights: {
        catalyst: { title: string; desc: string }
        market: { title: string; desc: string }
    }
    news: Array<{
        title: string
        source: string
        time: string
        sentiment: 'positive' | 'neutral' | 'negative'
        relevance: number
        url: string
    }>
}> = {
    NVDA: {
        name: 'NVIDIA Corp',
        price: 940.20,
        change: 18.50,
        changePercent: 2.01,
        marketCap: '$2.35T',
        peRatio: '74.52',
        high52w: '$974.00',
        low52w: '$392.30',
        dividend: '0.02%',
        consensus: 92,
        consensusText: 'Strong Buy',
        consensusDesc: 'Consensus indicates extreme structural tailwinds in hyperscale CapEx spending through FY25.',
        insights: {
            catalyst: { title: 'H200 Chip Demand', desc: 'Early cycle indicators suggest H200 pre-orders exceed previous gen by 42%. Data center backlog extends into 2025.' },
            market: { title: 'Data Center Growth', desc: 'NVIDIA maintains 98% market share in AI accelerators despite new entrant pressure from domestic competitors.' }
        },
        news: [
            { title: 'NVIDIA Expands sovereign AI Cloud Partnerships in EMEA', source: 'BLOOMBERG', time: '2H AGO', sentiment: 'positive', relevance: 98, url: 'https://www.bloomberg.com/news/articles/nvidia-sovereign-ai-emea' },
            { title: 'Supply Chain Check: HBM3 Memory Allocation Stabilizes', source: 'REUTERS', time: '5H AGO', sentiment: 'neutral', relevance: 84, url: 'https://www.reuters.com/business/cop-supply-chain-hbm3-nvidia' },
            { title: 'FTC Probes Potential AI Chip Antitrust Concerns', source: 'CNBC', time: '1D AGO', sentiment: 'negative', relevance: 72, url: 'https://www.cnbc.com/news/articles/ftc-investigation-ai-chips-nvidia' }
        ]
    },
    AAPL: {
        name: 'Apple Inc.',
        price: 189.84,
        change: 1.25,
        changePercent: 0.66,
        marketCap: '$2.91T',
        peRatio: '28.24',
        high52w: '$199.62',
        low52w: '$164.08',
        dividend: '0.52%',
        consensus: 84,
        consensusText: 'Buy',
        consensusDesc: 'Wall Street aligns on high expectation for Apple Intelligence driving a massive consumer upgrade supercycle.',
        insights: {
            catalyst: { title: 'Apple Intelligence', desc: 'On-device LLMs driving a massive upgrade supercycle starting with iPhone 16/17.' },
            market: { title: 'Services Growth', desc: 'High-margin services revenue represents 25% of total sales, stabilizing hardware cyclicality.' }
        },
        news: [
            { title: 'Apple Signs Landmark Deal with OpenAI for Cloud AI Services', source: 'BLOOMBERG', time: '1H AGO', sentiment: 'positive', relevance: 96, url: 'https://www.bloomberg.com/news/articles/apple-openai-agreement' },
            { title: 'iPhone Supply Chains Shift to India and Vietnam', source: 'REUTERS', time: '6H AGO', sentiment: 'neutral', relevance: 80, url: 'https://www.reuters.com/business/apple-supply-chain-india-vietnam' },
            { title: 'European Regulators Launch Investigation into App Store Fees', source: 'CNBC', time: '1D AGO', sentiment: 'negative', relevance: 85, url: 'https://www.cnbc.com/news/articles/eu-regulators-apple-app-store-investigation' }
        ]
    },
    MSFT: {
        name: 'Microsoft Corp',
        price: 421.90,
        change: 3.12,
        changePercent: 0.74,
        marketCap: '$3.14T',
        peRatio: '36.85',
        high52w: '$430.82',
        low52w: '$315.18',
        dividend: '0.71%',
        consensus: 90,
        consensusText: 'Strong Buy',
        consensusDesc: 'Data center capacity expansion remains the only bottleneck to massive enterprise Azure Cloud demand.',
        insights: {
            catalyst: { title: 'Copilot Integration', desc: 'ARR from Office 365 Copilot extensions growing at 35% quarter-over-quarter.' },
            market: { title: 'Azure AI Scaling', desc: 'Azure AI services now account for 29% of Azure total revenue growth index.' }
        },
        news: [
            { title: 'Microsoft Announces $3.2B Data Center Expansion in Germany', source: 'BLOOMBERG', time: '4H AGO', sentiment: 'positive', relevance: 94, url: 'https://www.bloomberg.com/news/articles/microsoft-germany-datacenter-expansion' },
            { title: 'Azure Core Services Experience Brief EMEA Outage', source: 'REUTERS', time: '12H AGO', sentiment: 'neutral', relevance: 78, url: 'https://www.reuters.com/business/azure-emea-outage-report' },
            { title: 'Antitrust Review Initiated for Inflection AI Acquisition', source: 'CNBC', time: '2D AGO', sentiment: 'negative', relevance: 82, url: 'https://www.cnbc.com/news/articles/ftc-microsoft-inflection-ai-acquisition' }
        ]
    },
    TSLA: {
        name: 'Tesla Inc',
        price: 179.24,
        change: -2.45,
        changePercent: -1.35,
        marketCap: '$568B',
        peRatio: '58.40',
        high52w: '$299.29',
        low52w: '$138.80',
        dividend: 'N/A',
        consensus: 48,
        consensusText: 'Hold',
        consensusDesc: 'Analysts remain cautious on short term automotive margins while long term autonomy gains traction.',
        insights: {
            catalyst: { title: 'FSD V12 Release', desc: 'End-to-end neural network driving increased consumer take-rates and licensing interest.' },
            market: { title: 'Next-Gen Platform', desc: 'Unboxed manufacturing process aims to cut unit costs by 50% for the mass market vehicle.' }
        },
        news: [
            { title: 'Tesla Obtains Local Government Autopilot Approval in China', source: 'REUTERS', time: '3H AGO', sentiment: 'positive', relevance: 92, url: 'https://www.reuters.com/business/tesla-china-autopilot-milestone' },
            { title: 'Q1 Delivery Figures Align with Lowered Wall Street Expectations', source: 'BLOOMBERG', time: '8H AGO', sentiment: 'neutral', relevance: 85, url: 'https://www.bloomberg.com/news/articles/tesla-q1-deliveries' },
            { title: 'Global Price Cuts Pressure Operating Profit Margins', source: 'CNBC', time: '1D AGO', sentiment: 'negative', relevance: 88, url: 'https://www.cnbc.com/news/articles/tesla-price-cuts-margin-pressure' }
        ]
    }
}

function getProceduralTickerData(ticker: string) {
    const symbol = ticker.toUpperCase()
    if (TickerCatalogs[symbol]) return TickerCatalogs[symbol]

    const rand = seedRandom(symbol)
    const code = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    const price = 50 + (code % 300) + (code % 10) / 100
    const isPositive = code % 2 === 0
    const change = (isPositive ? 1 : -1) * (1 + (code % 15) + (code % 7) / 100)
    const changePercent = (change / price) * 100

    const industries = ['Technology', 'Semiconductors', 'Automotive', 'Retail', 'Financial Services', 'Healthcare', 'Energy']
    const industry = industries[code % industries.length]
    
    const marketCapVal = (code % 800) + 10
    const marketCap = marketCapVal >= 100 ? `$${(marketCapVal / 100).toFixed(2)}T` : `$${marketCapVal}B`
    const peRatio = (code % 45) + 15
    const high52w = (price * 1.3).toFixed(2)
    const low52w = (price * 0.75).toFixed(2)
    const dividend = code % 4 === 0 ? `${(rand() * 2 + 0.5).toFixed(2)}%` : 'N/A'
    
    const consensus = 40 + Math.floor(rand() * 55)
    let consensusText = 'Hold'
    let consensusDesc = 'Analysts suggest maintaining positions pending further product lifecycle clarity.'
    if (consensus >= 85) {
        consensusText = 'Strong Buy'
        consensusDesc = 'Key catalysts in product distribution and margin growth indicate structural upside.'
    } else if (consensus >= 70) {
        consensusText = 'Buy'
        consensusDesc = 'Enterprise market share expansion makes this asset highly attractive at current ranges.'
    } else if (consensus < 50) {
        consensusText = 'Underperform'
        consensusDesc = 'Margin compression and near term macro headwinds warrant a conservative approach.'
    }

    return {
        name: `${symbol} Corp.`,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        marketCap,
        peRatio: String(peRatio),
        high52w: `$${high52w}`,
        low52w: `$${low52w}`,
        dividend,
        consensus,
        consensusText,
        consensusDesc,
        insights: {
            catalyst: { title: 'Enterprise Adoption', desc: `Accelerated adoption of ${symbol}'s new enterprise solutions driving double-digit software subscription expansions.` },
            market: { title: 'Structural Moat', desc: `Leverages a highly optimized global supply structure and patented logistics frameworks to sustain market leadership.` }
        },
        news: [
            { title: `${symbol} Unveils Next-Gen Institutional Platform`, source: 'BLOOMBERG', time: '3H AGO', sentiment: 'positive' as const, relevance: 91, url: `https://www.bloomberg.com/news/articles/${symbol.toLowerCase()}-next-gen` },
            { title: `${symbol} Exec Team Presents Strategic Alignment Plan`, source: 'REUTERS', time: '10H AGO', sentiment: 'neutral' as const, relevance: 78, url: `https://www.reuters.com/business/${symbol.toLowerCase()}-strategic-plan` },
            { title: `Macro Indexes Pressure Operating Cashflows for Sector Players`, source: 'CNBC', time: '1D AGO', sentiment: 'negative' as const, relevance: 68, url: `https://www.cnbc.com/news/articles/macro-pressures-operating-cashflow` }
        ]
    }
}

const CustomDot = (props: any) => {
    const { cx, cy, value } = props
    if (value === undefined || value === null) return null
    let color = '#eab308' // yellow
    if (value > 0.3) color = '#10B981' // green
    else if (value < -0.3) color = '#ef4444' // red
    return <circle cx={cx} cy={cy} r={4} fill={color} strokeWidth={0} />
}

const CustomActiveDot = (props: any) => {
    const { cx, cy, value } = props
    if (value === undefined || value === null) return null
    let color = '#eab308'
    if (value > 0.3) color = '#10B981'
    else if (value < -0.3) color = '#ef4444'
    return <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2} />
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

function generateSentimentHistoryData(symbol: string) {
    const rand = seedRandom(symbol)
    const data = []
    
    // Generate 12 points, e.g. bi-weekly over the last 6 months
    for (let i = 0; i < 12; i++) {
        const val = (rand() - 0.45) * 2 // values between -0.9 and +1.1, clamped between -1 and 1
        const sentimentVal = Math.max(-1, Math.min(1, val))
        
        let label = 'neutral'
        if (sentimentVal > 0.3) label = 'positive'
        else if (sentimentVal < -0.3) label = 'negative'
        
        const confidence = 0.5 + rand() * 0.45
        
        const date = new Date()
        date.setDate(date.getDate() - (11 - i) * 15)
        
        data.push({
            date: date.toISOString().split('T')[0],
            [symbol]: parseFloat(sentimentVal.toFixed(2)),
            [`${symbol}_label`]: label,
            [`${symbol}_confidence`]: parseFloat(confidence.toFixed(2))
        })
    }
    return data
}

export default function TickerPage({ params }: { params: Promise<{ ticker: string }> }) {
    const { ticker } = use(params)
    const symbol = ticker.toUpperCase()
    const router = useRouter()
    const meta = getProceduralTickerData(symbol)

    const [activeInterval, setActiveInterval] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M')
    const [chartDataClose, setChartDataClose] = useState<number[]>([])
    const [chartLoading, setChartLoading] = useState(true)
    const [watchlistTickers, setWatchlistTickers] = useState<string[]>([])
    const [loadingWatchlist, setLoadingWatchlist] = useState(true)

    // Sync watchlist with database settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getUserSettings()
                if (settings && Array.isArray(settings.tickers)) {
                    setWatchlistTickers(settings.tickers.map((t: string) => t.toUpperCase()))
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
            newTickers = watchlistTickers.filter(t => t !== symbol)
        } else {
            newTickers = [...watchlistTickers, symbol]
        }

        try {
            await updateUserSettings({ tickers: newTickers })
            setWatchlistTickers(newTickers)
            toast.success(
                isAdded 
                    ? `${symbol} removed from watchlist` 
                    : `${symbol} added to watchlist`
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
                else if (activeInterval === '1D') from = now - 2 * 86400 // Intraday mock trigger
                
                const res = await fetch(`/api/stocks/${symbol.toLowerCase()}/candles?from=${from}&to=${now}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data && Array.isArray(data.close) && data.close.length > 0) {
                        setChartDataClose(data.close)
                        return
                    }
                }
            } catch (err) {
                console.error('Failed to fetch candles', err)
            } finally {
                setChartLoading(false)
            }
            // Fallback mock values
            setChartDataClose([150, 155, 142, 148, 160, 158, 165])
        }
        fetchCandles()
    }, [symbol, activeInterval])

    // Generate Candlestick items (Open, High, Low, Close) from the close price list
    const candles = chartDataClose.map((closePrice, idx) => {
        const prevClose = idx > 0 ? chartDataClose[idx - 1] : closePrice * 0.98
        const openPrice = prevClose
        const isBullish = closePrice >= openPrice
        const variance = Math.abs(closePrice - openPrice) * 0.2
        const highPrice = Math.max(openPrice, closePrice) + variance + (closePrice * 0.005)
        const lowPrice = Math.min(openPrice, closePrice) - variance - (closePrice * 0.005)
        return {
            open: openPrice,
            high: highPrice,
            low: lowPrice,
            close: closePrice,
            isBullish
        }
    })

    const minPrice = candles.length > 0 ? Math.min(...candles.map(c => c.low)) : 0
    const maxPrice = candles.length > 0 ? Math.max(...candles.map(c => c.high)) : 100
    const priceRange = maxPrice - minPrice

    const sentimentData = generateSentimentHistoryData(symbol)

    const isPositive = meta.change >= 0
    const isAddedToWatchlist = watchlistTickers.includes(symbol)

    // Related News Redirection Helper
    const navigateToArticleAnalysis = (newsArticle: any) => {
        const queryParams = new URLSearchParams({
            title: newsArticle.title,
            url: newsArticle.url,
            source: newsArticle.source,
            published_at: new Date().toISOString(),
            sentiment_score: newsArticle.sentiment === 'positive' ? '0.85' : newsArticle.sentiment === 'negative' ? '0.15' : '0.50',
            sentiment_label: newsArticle.sentiment,
            entities: JSON.stringify([{ ticker: symbol, name: meta.name, price: meta.price, change: meta.changePercent }])
        })
        router.push(`/articles/deep-dive?${queryParams.toString()}`)
    }

    return (
        <div className="space-y-8 pb-16">
            {/* Navigation back and header banner */}
            <div className="flex justify-between items-start gap-4">
                <div>
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Go Back</span>
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-border">
                            <span className="text-xl font-bold text-primary">{symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
                                <span className="text-sm text-muted-foreground font-medium">{meta.name}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-2xl font-bold font-mono text-foreground">${meta.price.toFixed(2)}</span>
                                <span className={`flex items-center gap-0.5 text-sm font-bold ${
                                    isPositive ? 'text-sentiment-positive' : 'text-sentiment-negative'
                                }`}>
                                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {isPositive ? '+' : ''}{meta.changePercent.toFixed(2)}%
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground tracking-widest bg-surface-container-high px-2.5 py-0.5 rounded-full uppercase">
                                    MARKET OPEN
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleWatchlist}
                        disabled={loadingWatchlist}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                            isAddedToWatchlist
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'border-border text-muted-foreground hover:text-foreground hover:bg-surface-container-high'
                        }`}
                    >
                        <Star className={`h-4 w-4 ${isAddedToWatchlist ? 'fill-primary' : ''}`} />
                        <span>{isAddedToWatchlist ? 'Watched' : 'Watchlist'}</span>
                    </button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-12 gap-8 items-start">
                
                {/* Left Area: Charts & Insights */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    
                    {/* SVG Candlestick Chart */}
                    <div className="bg-surface-container border border-border rounded-xl shadow-md overflow-hidden">
                        <div className="p-5 flex items-center justify-between border-b border-border bg-surface-container-low/40">
                            <div className="flex gap-2">
                                {(['1D', '1W', '1M', '3M', '1Y'] as const).map((interval) => (
                                    <button
                                        key={interval}
                                        onClick={() => setActiveInterval(interval)}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                            activeInterval === interval
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-surface-container-high/60'
                                        }`}
                                    >
                                        {interval}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-sentiment-positive"></span>
                                    <span>High: ${(maxPrice || meta.price).toFixed(2)}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-sentiment-negative"></span>
                                    <span>Low: ${(minPrice || meta.price).toFixed(2)}</span>
                                </span>
                            </div>
                        </div>

                        <div className="h-80 w-full relative p-6 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.02),transparent)]">
                            {chartLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                                    Loading historical data...
                                </div>
                            ) : (
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240">
                                    {/* Grid Lines */}
                                    <line x1="0" y1="200" x2="800" y2="200" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.3"></line>
                                    <line x1="0" y1="140" x2="800" y2="140" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.3"></line>
                                    <line x1="0" y1="80" x2="800" y2="80" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.3"></line>
                                    <line x1="0" y1="20" x2="800" y2="20" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.3"></line>

                                    {/* Close Price Line Overlay */}
                                    <path 
                                        d={candles.map((c, idx) => {
                                            const x = candles.length > 1 ? (idx / (candles.length - 1)) * 800 : 0
                                            const y = 200 - ((c.close - minPrice) / (priceRange || 1)) * 160
                                            return `${idx === 0 ? 'M' : 'L'}${x},${y}`
                                        }).join(' ')}
                                        fill="none"
                                        stroke="var(--primary)"
                                        strokeWidth="2"
                                        strokeOpacity="0.3"
                                        strokeDasharray="4"
                                    />

                                    {/* Candlesticks */}
                                    {candles.map((c, idx) => {
                                        const totalCandles = candles.length
                                        const width = Math.min(20, Math.max(4, 700 / totalCandles))
                                        const x = totalCandles > 1 ? (idx / (totalCandles - 1)) * 800 : 400
                                        
                                        const highY = 200 - ((c.high - minPrice) / (priceRange || 1)) * 160
                                        const lowY = 200 - ((c.low - minPrice) / (priceRange || 1)) * 160
                                        const openY = 200 - ((c.open - minPrice) / (priceRange || 1)) * 160
                                        const closeY = 200 - ((c.close - minPrice) / (priceRange || 1)) * 160
                                        
                                        const rectY = Math.min(openY, closeY)
                                        const rectH = Math.max(2, Math.abs(openY - closeY))
                                        
                                        return (
                                            <g key={idx}>
                                                {/* Wick */}
                                                <line 
                                                    x1={x} 
                                                    y1={highY} 
                                                    x2={x} 
                                                    y2={lowY} 
                                                    stroke={c.isBullish ? 'var(--sentiment-positive)' : 'var(--sentiment-negative)'} 
                                                    strokeWidth="1.5"
                                                />
                                                {/* Body */}
                                                <rect 
                                                    x={x - width / 2} 
                                                    y={rectY} 
                                                    width={width} 
                                                    height={rectH} 
                                                    fill={c.isBullish ? 'var(--sentiment-positive)' : 'var(--sentiment-negative)'} 
                                                    rx="1"
                                                />
                                            </g>
                                        )
                                    })}
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* AI Sentiment Trend Line Chart */}
                    <div className="relative overflow-hidden bg-surface-container border border-border p-6 rounded-xl shadow-md">
                        {/* Glow decorative block */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-ai-glow/5 blur-3xl rounded-full"></div>
                        
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="h-5 w-5 text-ai-glow fill-ai-glow/10" />
                            <h3 className="text-base font-bold text-foreground">AI Sentiment Trend</h3>
                        </div>

                        <div className="h-44 w-full relative mt-4">
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
                                            {getGradientStops(sentimentData, symbol)}
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray='3 3' stroke="var(--border)" strokeOpacity="0.3" />
                                    <XAxis
                                        dataKey='date'
                                        tickFormatter={formatChartDate}
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={[-1, 1]}
                                        tickFormatter={(val) =>
                                            val === 0 ? '0' : val.toFixed(1)
                                        }
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        tickLine={false}
                                    />
                                    <ReferenceLine
                                        y={0}
                                        stroke="var(--border)"
                                        strokeDasharray='3 3'
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const entry = payload[0]
                                                const data = entry.payload
                                                const conf = data[`${symbol}_confidence`]
                                                const lbl = data[`${symbol}_label`]
                                                const val = entry.value as number
                                                
                                                let colorClass = 'text-sentiment-neutral'
                                                if (val > 0.3) colorClass = 'text-sentiment-positive'
                                                else if (val < -0.3) colorClass = 'text-sentiment-negative'

                                                return (
                                                    <div className='bg-surface-container-high border border-border rounded-lg p-3 text-xs shadow-md'>
                                                        <p className='mb-1.5 font-bold text-foreground'>
                                                            {formatChartDate(label as string)}
                                                        </p>
                                                        <div className="space-y-1">
                                                            <div>
                                                                <span className="font-bold text-primary">{symbol}:</span>{' '}
                                                                <span className={`capitalize font-bold ${colorClass}`}>
                                                                    {lbl || (val > 0.3 ? 'positive' : val < -0.3 ? 'negative' : 'neutral')}
                                                                </span>
                                                            </div>
                                                            <div className="text-muted-foreground font-semibold">
                                                                Score: <span className="font-mono text-foreground font-bold">{val > 0 ? '+' : ''}{val.toFixed(2)}</span>
                                                            </div>
                                                            <div className="text-muted-foreground font-semibold">
                                                                Confidence: <span className="font-mono text-foreground font-bold">{Math.round((conf || 0.8) * 100)}%</span>
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
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 italic">
                            Aggregated consensus analysis compiled from earning transcripts, financial reporting indexes, and institutional vectors.
                        </p>
                    </div>

                    {/* Catalysts cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface-container border border-border p-5 rounded-xl hover:border-primary/40 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                                    TECH CATALYST
                                </span>
                                <Zap className="h-5 w-5 text-sentiment-positive fill-sentiment-positive/10" />
                            </div>
                            <h4 className="font-bold text-foreground mb-2">{meta.insights.catalyst.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{meta.insights.catalyst.desc}</p>
                        </div>

                        <div className="bg-surface-container border border-border p-5 rounded-xl hover:border-primary/40 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-secondary/15 text-muted-foreground px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                                    MARKET SHARE
                                </span>
                                <Network className="h-5 w-5 text-primary" />
                            </div>
                            <h4 className="font-bold text-foreground mb-2">{meta.insights.market.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{meta.insights.market.desc}</p>
                        </div>
                    </div>
                </div>

                {/* Right Area: Stats & AI Consensus & News */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    
                    {/* Stats Card */}
                    <div className="bg-surface-container border border-border p-6 rounded-xl shadow-md">
                        <h3 className="text-base font-bold text-foreground mb-4">Ticker Stats</h3>
                        
                        <div className="space-y-3.5 text-sm">
                            <div className="flex justify-between items-center py-2.5 border-b border-border/60">
                                <span className="text-muted-foreground">Market Cap</span>
                                <span className="font-bold font-mono text-foreground">{meta.marketCap}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-border/60">
                                <span className="text-muted-foreground">P/E Ratio</span>
                                <span className="font-bold font-mono text-foreground">{meta.peRatio}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-border/60">
                                <span className="text-muted-foreground">52W High</span>
                                <span className="font-bold font-mono text-sentiment-positive">{meta.high52w}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-border/60">
                                <span className="text-muted-foreground">52W Low</span>
                                <span className="font-bold font-mono text-sentiment-negative">{meta.low52w}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-muted-foreground">Dividend Yield</span>
                                <span className="font-bold font-mono text-foreground">{meta.dividend}</span>
                            </div>
                        </div>
                    </div>


                    {/* Related news cards */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-foreground px-1">Related News</h3>
                        
                        {meta.news.map((item, index) => {
                            const borderClass = item.sentiment === 'positive'
                                ? 'border-l-sentiment-positive'
                                : item.sentiment === 'negative'
                                    ? 'border-l-sentiment-negative'
                                    : 'border-l-sentiment-neutral'
                                    
                            const labelBg = item.sentiment === 'positive'
                                ? 'bg-sentiment-positive/10 text-sentiment-positive'
                                : item.sentiment === 'negative'
                                    ? 'bg-sentiment-negative/10 text-sentiment-negative'
                                    : 'bg-sentiment-neutral/15 text-muted-foreground'

                            return (
                                <div 
                                    key={index}
                                    onClick={() => navigateToArticleAnalysis(item)}
                                    className={`bg-surface-container border-l-4 ${borderClass} p-4 rounded-r-xl border-y border-r border-border hover:bg-surface-container-high transition-colors cursor-pointer group`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-bold tracking-wider text-muted-foreground">
                                            {item.source} • {item.time}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${labelBg}`}>
                                            {item.sentiment.slice(0, 3)}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                                        <span className="flex items-center gap-1">
                                            <BarChart2 className="h-3.5 w-3.5" />
                                            <span>AI Relevance: {item.relevance}%</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
