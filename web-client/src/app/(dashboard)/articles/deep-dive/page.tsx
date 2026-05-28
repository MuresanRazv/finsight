'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getUserSettings, updateUserSettings } from '@/app/actions/settings'
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Zap,
    Network,
    Activity,
    ArrowRight,
    Globe,
    Calendar,
    User,
    Clock,
    FileText,
    Share2,
    Check,
    Plus,
    ExternalLink,
} from 'lucide-react'

// Default Fallback Article Data (Blackwell GPU GTC Keynote)
const defaultArticle = {
    title: 'NVIDIA GTC: The Next Chapter for Generative AI and the Blackwell Architecture',
    url: 'https://www.ft.com/content/nvidia-gtc-blackwell',
    source: 'Financial Times',
    published_at: '2024-03-20T08:00:00Z',
    sentiment_score: 0.92,
    sentiment_label: 'positive',
    category: 'SEMICONDUCTORS',
    readTime: '7 MIN READ',
    author: 'James Ratcliffe',
    entities: [
        { name: 'NVIDIA Corp', ticker: 'NVDA', price: 894.52, change: 4.22, relevance: 5 },
        { name: 'Taiwan Semi', ticker: 'TSM', price: 142.10, change: 1.85, relevance: 3 },
        { name: 'AMD Inc', ticker: 'AMD', price: 178.65, change: -0.45, relevance: 2 },
    ],
    themes: [
        'Blackwell Architecture',
        'LLM Efficiency',
        'AI Sovereignty',
        'Hyperscale Cloud',
        'Humanoid Robotics',
    ],
    summary: [
        'Blackwell GPU architecture offers 2.5x higher performance for LLM training compared to Hopper, significantly reducing TCO for hyperscalers.',
        'The new GB200 NVL72 liquid-cooled rack-scale system marks a shift from chip sales to full integrated AI factory infrastructure.',
        'Project GR00T for humanoid robotics expands NVIDIA\'s TAM, signaling long-term diversification beyond data center compute.',
    ],
    excerpts: [
        {
            title: 'ARCHITECTURAL LEAP',
            sentiment: 'positive',
            relevance: '98% Relevance',
            time: 'Just published',
            text: 'The Blackwell GPU architecture is not merely an incremental update; it represents a fundamental re-engineering of how data moves between compute nodes. With the second-generation Transformer Engine and new 4-bit floating point AI inference capabilities, NVIDIA is effectively doubling down on the specific mathematical operations that power GPT-4 and its successors.',
        },
        {
            title: 'SUPPLY CHAIN LOGISTICS',
            sentiment: 'neutral',
            relevance: '84% Relevance',
            time: '2h ago',
            text: 'While the demand for Blackwell is expected to be unprecedented, the industry\'s focus remains on Taiwan Semiconductor Manufacturing Company (TSMC) and its CoWoS packaging capacity. Any bottlenecks at the foundry level could temper the immediate revenue impact despite the stellar technical specifications.',
        },
        {
            title: 'ECOSYSTEM LOCK-IN',
            sentiment: 'positive',
            relevance: '92% Relevance',
            time: '4h ago',
            text: 'NVIDIA\'s software stack—CUDA—remains the formidable moat. By integrating Blackwell so tightly with the new NVLink Switch and InfiniBand networking, Huang is creating a systems-level lock-in that makes it increasingly difficult for hyperscalers to swap in alternative silicon from competitors like AMD or Intel.',
        },
    ],
}

function ArticleDeepDiveContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'excerpts' | 'raw' | 'citations'>('excerpts')
    const [watchlistTickers, setWatchlistTickers] = useState<string[]>([])
    const [loadingWatchlist, setLoadingWatchlist] = useState(true)
    const [selectedChartTicker, setSelectedChartTicker] = useState<string>('')

    // Load watchlist on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getUserSettings()
                if (settings && Array.isArray(settings.tickers)) {
                    setWatchlistTickers(settings.tickers.map((t: string) => t.toUpperCase()))
                }
            } catch (err) {
                console.error('Failed to load user settings', err)
            } finally {
                setLoadingWatchlist(false)
            }
        }
        fetchSettings()
    }, [])

    // Read query params and build the article data dynamically
    const qTitle = searchParams.get('title')
    const qUrl = searchParams.get('url')
    const qSource = searchParams.get('source')
    const qPublishedAt = searchParams.get('published_at')
    const qSentimentScore = searchParams.get('sentiment_score')
    const qSentimentLabel = searchParams.get('sentiment_label')
    const qEntitiesRaw = searchParams.get('entities')

    let article = defaultArticle

    if (qTitle || qUrl) {
        let parsedEntities = []
        try {
            if (qEntitiesRaw) {
                const parsed = JSON.parse(qEntitiesRaw)
                parsedEntities = parsed.map((e: any) => ({
                    name: e.name || e.ticker || 'Unknown',
                    ticker: e.ticker || null,
                    price: e.price || (Math.random() * 200 + 50),
                    change: e.sentiment_score ? e.sentiment_score * 5 : (Math.random() * 6 - 3),
                    relevance: Math.floor(Math.random() * 3) + 3,
                }))
            }
        } catch (e) {
            console.error('Failed to parse entities from query', e)
        }

        // Use entities from query if available, otherwise mock some
        const finalEntities = parsedEntities.length > 0 ? parsedEntities : [
            { name: 'NVIDIA Corp', ticker: 'NVDA', price: 894.52, change: 4.22, relevance: 5 },
            { name: 'Microsoft Corp', ticker: 'MSFT', price: 421.90, change: 1.15, relevance: 4 },
        ]

        // Custom sentence generation for dynamically loaded articles
        const sentimentLabel = qSentimentLabel || 'neutral'
        const sentimentScoreNum = qSentimentScore ? parseFloat(qSentimentScore) : 0.5
        const overallScore = Math.round(sentimentScoreNum * 100)

        // Dynamically build themes from entities
        const dynamicThemes = finalEntities.map((e: any) => e.ticker ? `${e.ticker} Sentiment` : e.name).concat(['Market Integration', 'Institutional flow'])

        article = {
            title: qTitle || 'Analyzed Article Details',
            url: qUrl || 'https://www.finsight.ai',
            source: qSource || 'AI Crawler',
            published_at: qPublishedAt || new Date().toISOString(),
            sentiment_score: sentimentScoreNum,
            sentiment_label: sentimentLabel,
            category: 'MARKET TREND',
            readTime: '5 MIN READ',
            author: 'FinSight Research',
            entities: finalEntities,
            themes: dynamicThemes,
            summary: [
                `This article primarily focuses on structural indicators of ${finalEntities.map((e: any) => e.name).join(', ')}.`,
                `The sentiment signature is classified as ${sentimentLabel.toUpperCase()} with an index confidence score of ${overallScore}%.`,
                `Underlying text vectors reveal key strategic positioning within global macroeconomic frameworks.`,
            ],
            excerpts: [
                {
                    title: 'CORE INSIGHT',
                    sentiment: sentimentLabel,
                    relevance: '95% Relevance',
                    time: 'Extracted',
                    text: `Analyzing the source vectors, the sentiment surrounding key corporate nodes appears ${sentimentLabel}. Financial institutions are adjusting models to incorporate these signals into long-term target valuations.`,
                },
                {
                    title: 'MACRO OUTLOOK',
                    sentiment: 'neutral',
                    relevance: '78% Relevance',
                    time: 'Extracted',
                    text: `Broader supply structures and market indexes remain stabilized despite micro fluctuations. The overall baseline remains supportive of existing capital allocation ranges.`,
                },
            ],
        }
    }

    const primaryTicker = article.entities.find((e: any) => e.ticker)?.ticker || 'NVDA'
    const activeChartTicker = selectedChartTicker || primaryTicker

    const [chartDataClose, setChartDataClose] = useState<number[]>([])
    const [chartLoading, setChartLoading] = useState(true)

    useEffect(() => {
        const fetchChartData = async () => {
            setChartLoading(true)
            try {
                const publishedTime = Math.floor(new Date(article.published_at).getTime() / 1000)
                const from = publishedTime - 3 * 86400
                const to = publishedTime + 4 * 86400
                
                const res = await fetch(`/api/stocks/${activeChartTicker.toLowerCase()}/candles?from=${from}&to=${to}`)
                if (res.ok) {
                    const parsed = await res.json()
                    if (parsed && Array.isArray(parsed.close) && parsed.close.length > 0) {
                        setChartDataClose(parsed.close)
                        return
                    }
                }
            } catch (err) {
                console.error('Failed to load chart candles', err)
            } finally {
                setChartLoading(false)
            }
            // Fallback mock if call failed
            setChartDataClose([150, 155, 140, 142, 148, 160, 158, 165])
        }
        fetchChartData()
    }, [activeChartTicker, article.published_at])

    const minPrice = chartDataClose.length > 0 ? Math.min(...chartDataClose) : 0
    const maxPrice = chartDataClose.length > 0 ? Math.max(...chartDataClose) : 100
    const priceRange = maxPrice - minPrice

    const pathD = chartDataClose.map((price, idx) => {
        const x = chartDataClose.length > 1 ? (idx / (chartDataClose.length - 1)) * 800 : 0
        const y = 185 - ((price - minPrice) / (priceRange || 1)) * 150
        return `${idx === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')

    const areaD = pathD ? `${pathD} V220 H0 Z` : ''

    const baselineD = chartDataClose.map((_, idx) => {
        const x = chartDataClose.length > 1 ? (idx / (chartDataClose.length - 1)) * 800 : 0
        const y = 140 + Math.sin(idx) * 5 + (idx * 2)
        return `${idx === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')

    const eventIndex = chartDataClose.length > 3 ? 3 : Math.floor(chartDataClose.length / 2)
    const eventX = chartDataClose.length > 1 ? (eventIndex / (chartDataClose.length - 1)) * 800 : 400
    const eventPriceVal = chartDataClose[eventIndex] || (maxPrice + minPrice) / 2
    const eventY = 185 - ((eventPriceVal - minPrice) / (priceRange || 1)) * 150

    const finalPrice = chartDataClose[chartDataClose.length - 1] || 0
    const eventPrice = chartDataClose[eventIndex] || 0
    const priceDiffPercent = eventPrice > 0 ? ((finalPrice - eventPrice) / eventPrice) * 100 : 0

    const chartStrokeColor = priceDiffPercent > 0.1 
        ? '#10B981' 
        : priceDiffPercent < -0.1 
            ? '#EF4444' 
            : 'var(--primary)'

    const chartFillUrl = priceDiffPercent > 0.1 
        ? 'url(#chartAreaGradientGreen)' 
        : priceDiffPercent < -0.1 
            ? 'url(#chartAreaGradientRed)' 
            : 'url(#chartAreaGradientBlue)'

    const toggleWatchlist = async (ticker: string) => {
        const uppercaseTicker = ticker.toUpperCase()
        const isAdded = watchlistTickers.includes(uppercaseTicker)
        
        let newTickers: string[] = []
        if (isAdded) {
            newTickers = watchlistTickers.filter(t => t !== uppercaseTicker)
        } else {
            newTickers = [...watchlistTickers, uppercaseTicker]
        }

        try {
            await updateUserSettings({ tickers: newTickers })
            setWatchlistTickers(newTickers)
            toast.success(
                isAdded 
                    ? `${uppercaseTicker} removed from watchlist` 
                    : `${uppercaseTicker} added to watchlist`
            )
        } catch (err) {
            console.error('Failed to update watchlist', err)
            toast.error('Failed to update watchlist')
        }
    }

    const isPositive = article.sentiment_label === 'positive'
    const isNegative = article.sentiment_label === 'negative'
    const sentimentColor = isPositive 
        ? 'text-sentiment-positive' 
        : isNegative 
            ? 'text-sentiment-negative' 
            : 'text-sentiment-neutral'

    const sentimentBg = isPositive 
        ? 'bg-sentiment-positive/10 border-sentiment-positive/30' 
        : isNegative 
            ? 'bg-sentiment-negative/10 border-sentiment-negative/30' 
            : 'bg-sentiment-neutral/10 border-sentiment-neutral/30'

    return (
        <div className="space-y-8 pb-16">
            {/* Back Button */}
            <div>
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span>Back to Search</span>
                </button>
            </div>

            {/* Article Header & Sentiment Hero */}
            <section className="flex flex-col lg:flex-row justify-between items-start gap-8 border-b border-border pb-8">
                <div className="flex-1 space-y-4 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-[10px] tracking-widest uppercase rounded-full">
                            {article.category}
                        </span>
                        <span className="px-3 py-1 bg-surface-container-high text-muted-foreground font-semibold text-[10px] tracking-wider rounded-full">
                            {article.readTime}
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <a 
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                        >
                            <Globe className="h-4 w-4" />
                            <span>{article.source}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(article.published_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{article.author}</span>
                        </div>
                    </div>
                </div>

                {/* Sentiment Hero Card */}
                <div className="w-full lg:w-64 p-6 bg-surface-container-low border border-border rounded-xl relative overflow-hidden group shadow-lg">
                    <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 transition-all duration-500 group-hover:opacity-30 ${
                        isPositive ? 'bg-sentiment-positive' : isNegative ? 'bg-sentiment-negative' : 'bg-sentiment-neutral'
                    }`}></div>
                    
                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-4">
                        OVERALL SENTIMENT
                    </p>
                    
                    <div className="flex items-end gap-1 mb-3">
                        <span className={`text-4xl font-bold tracking-tight ${sentimentColor}`}>
                            {Math.round(article.sentiment_score * 100)}
                        </span>
                        <span className="text-muted-foreground text-sm mb-1.5 font-medium">/100</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${
                                isPositive 
                                    ? 'bg-sentiment-positive shadow-[0_0_8px_#10B981]' 
                                    : isNegative 
                                        ? 'bg-sentiment-negative shadow-[0_0_8px_#EF4444]' 
                                        : 'bg-sentiment-neutral shadow-[0_0_8px_#eab308]'
                            }`}
                            style={{ width: `${Math.round(article.sentiment_score * 100)}%` }}
                        ></div>
                    </div>

                    <p className={`mt-4 text-xs font-semibold flex items-center gap-1.5 capitalize ${sentimentColor}`}>
                        {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : isNegative ? (
                            <TrendingDown className="h-4 w-4" />
                        ) : (
                            <Activity className="h-4 w-4" />
                        )}
                        {article.sentiment_label} Consensus
                    </p>
                </div>
            </section>

            {/* Bento Grid Content */}
            <div className="grid grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Summary & Price Chart */}
                <div className="col-span-12 lg:col-span-7 space-y-8">
                    
                    {/* AI Summary Panel */}
                    <div className="bg-surface-container border border-border p-6 rounded-xl relative shadow-md overflow-hidden">
                        {/* Subtle AI sparkle background decoration */}
                        <div className="absolute top-6 right-6 text-primary/10">
                            <Zap className="h-10 w-10 fill-current" />
                        </div>
                        
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary fill-primary/15" />
                            <span>AI-Powered Executive Summary</span>
                        </h3>
                        
                        <ul className="space-y-4">
                            {article.summary.map((point, index) => (
                                <li key={index} className="flex gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed">
                                        {point}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SVG Chart: Price Correlation */}
                    <div className="bg-surface-container border border-border p-6 rounded-xl shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h3 className="text-base font-bold text-foreground">Post-Article Price Correlation</h3>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center transition-all ${
                                        chartLoading 
                                            ? 'bg-surface-container-highest/60 text-muted-foreground/60 animate-pulse'
                                            : priceDiffPercent > 0.1 
                                                ? 'bg-sentiment-positive/10 text-sentiment-positive' 
                                                : priceDiffPercent < -0.1 
                                                    ? 'bg-sentiment-negative/10 text-sentiment-negative' 
                                                    : 'bg-sentiment-neutral/10 text-sentiment-neutral'
                                    }`}>
                                        {chartLoading ? 'Calculating...' : `${priceDiffPercent > 0.1 ? '+' : ''}${priceDiffPercent.toFixed(2)}% Reaction`}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Historical {activeChartTicker} reaction relative to article publication date (T-0)
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                                <div className="flex items-center gap-1.5">
                                    {article.entities.map((e: any) => e.ticker).filter(Boolean).length > 0 ? (
                                        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border">
                                            {article.entities
                                                .map((e: any) => e.ticker)
                                                .filter(Boolean)
                                                .map((t: string) => {
                                                    const isActive = t.toUpperCase() === activeChartTicker.toUpperCase()
                                                    return (
                                                        <button
                                                            key={t}
                                                            onClick={() => setSelectedChartTicker(t.toUpperCase())}
                                                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                                                isActive
                                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-container-high/60'
                                                            }`}
                                                        >
                                                            {t}
                                                        </button>
                                                    )
                                                })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                                            <span>{activeChartTicker}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                                    <span className="w-6 h-0 border-t border-dashed border-muted-foreground/60"></span>
                                    <span>Index Baseline</span>
                                </div>
                            </div>
                        </div>

                        {/* Line Chart */}
                        <div className="relative h-60 w-full mt-4">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 220">
                                {/* Grid Lines */}
                                <line x1="0" y1="180" x2="800" y2="180" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.4"></line>
                                <line x1="0" y1="120" x2="800" y2="120" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.4"></line>
                                <line x1="0" y1="60" x2="800" y2="60" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.4"></line>
                                
                                {/* Area Gradient definitions */}
                                <defs>
                                    <linearGradient id="chartAreaGradientGreen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25"></stop>
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0"></stop>
                                    </linearGradient>
                                    <linearGradient id="chartAreaGradientRed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25"></stop>
                                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0"></stop>
                                    </linearGradient>
                                    <linearGradient id="chartAreaGradientBlue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25"></stop>
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"></stop>
                                    </linearGradient>
                                </defs>

                                {chartLoading ? (
                                    <text x="400" y="110" fill="var(--foreground)" fontSize="14" textAnchor="middle" opacity="0.6">
                                        Loading historical candles...
                                    </text>
                                ) : (
                                    <>
                                        {/* Primary Asset Line */}
                                        <path 
                                            d={pathD} 
                                            fill="none" 
                                            stroke={chartStrokeColor} 
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                        />
                                        
                                        <path 
                                            d={areaD} 
                                            fill={chartFillUrl}
                                        />

                                        {/* Index Baseline Line */}
                                        <path 
                                            d={baselineD} 
                                            fill="none" 
                                            stroke="var(--foreground)" 
                                            strokeWidth="2" 
                                            strokeDasharray="5"
                                            strokeOpacity="0.4"
                                        />

                                        {/* Event Dot Marker */}
                                        <g transform={`translate(${eventX}, ${eventY})`}>
                                            <circle r="6" fill="var(--primary)" stroke="var(--background)" strokeWidth="2.5"></circle>
                                            <rect x="-55" y="-35" width="110" height="24" rx="4" fill="var(--surface-container-highest)" stroke="var(--border)" strokeWidth="1"></rect>
                                            <text x="0" y="-20" fill="var(--foreground)" fontSize="9" fontWeight="bold" textAnchor="middle">Article Published</text>
                                        </g>
                                    </>
                                )}
                            </svg>
                        </div>
                        
                        <div className="flex justify-between mt-4 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                                            <span>T-3 Days</span>
                                                            <span>T-1 Day</span>
                                                            <span>Published</span>
                                                            <span>T+2 Days</span>
                                                            <span>T+4 Days</span>
                                                        </div>
                    </div>
                </div>

                {/* Right Side: Mentioned Tickers & Key Themes */}
                <div className="col-span-12 lg:col-span-5 space-y-8">
                    
                    {/* Mentioned Tickers */}
                    <div className="bg-surface-container border border-border p-6 rounded-xl shadow-md">
                        <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">
                            MENTIONED TICKERS
                        </h3>
                        
                        <div className="space-y-4">
                            {article.entities.map((ticker, index) => {
                                const tickerAdded = ticker.ticker ? watchlistTickers.includes(ticker.ticker.toUpperCase()) : false
                                const tickerPositive = ticker.change >= 0
                                const isActive = ticker.ticker && ticker.ticker.toUpperCase() === activeChartTicker.toUpperCase()
                                return (
                                    <div 
                                        key={index}
                                        onClick={() => ticker.ticker && setSelectedChartTicker(ticker.ticker.toUpperCase())}
                                        className={`p-4 bg-surface-container-low border rounded-lg hover:border-primary/40 transition-colors group flex justify-between items-center cursor-pointer ${
                                            isActive ? 'border-primary shadow-sm' : 'border-border'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-primary truncate max-w-[80px]">
                                                    {ticker.ticker || 'N/A'}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                    {ticker.name}
                                                </span>
                                            </div>
                                            
                                            {/* Relevance indicators */}
                                            <div className="flex items-center gap-1.5 pt-1.5">
                                                <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                    RELEVANCE
                                                </span>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <span 
                                                            key={i} 
                                                            className={`w-2.5 h-1 rounded-full ${
                                                                i <= (ticker.relevance || 3) ? 'bg-primary' : 'bg-surface-container-highest'
                                                            }`}
                                                        ></span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className="text-sm font-semibold font-mono text-foreground">
                                                    ${ticker.price.toFixed(2)}
                                                </p>
                                                <p className={`text-xs font-bold font-mono ${
                                                    tickerPositive ? 'text-sentiment-positive' : 'text-sentiment-negative'
                                                }`}>
                                                    {tickerPositive ? '+' : ''}{ticker.change.toFixed(2)}%
                                                </p>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    ticker.ticker && toggleWatchlist(ticker.ticker)
                                                }}
                                                className={`p-2 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                                                    tickerAdded 
                                                        ? 'bg-primary/10 border-primary text-primary' 
                                                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-surface-container-high'
                                                }`}
                                                title={tickerAdded ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                            >
                                                {tickerAdded ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Key Themes */}
                    <div className="bg-surface-container border border-border p-6 rounded-xl shadow-md">
                        <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">
                            KEY THEMES
                        </h3>
                        
                        <div className="flex flex-wrap gap-2">
                            {article.themes.map((theme, index) => (
                                <span 
                                    key={index} 
                                    className="px-3.5 py-1.5 bg-surface-container-high border border-border text-foreground hover:border-primary/40 hover:bg-primary/5 text-xs font-medium rounded-lg transition-colors cursor-default"
                                >
                                    {theme}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Detailed Tabs */}
            <div className="bg-surface-container border border-border rounded-xl shadow-md overflow-hidden">
                {/* Tab buttons */}
                <div className="flex border-b border-border bg-surface-container-low">
                    <button 
                        onClick={() => setActiveTab('excerpts')}
                        className={`px-6 py-4 text-xs font-bold tracking-widest uppercase border-b-2 transition-all cursor-pointer ${
                            activeTab === 'excerpts'
                                ? 'border-primary text-primary bg-surface-container'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-container-high/40'
                        }`}
                    >
                        ARTICLE EXCERPTS
                    </button>
                    <button 
                        onClick={() => setActiveTab('raw')}
                        className={`px-6 py-4 text-xs font-bold tracking-widest uppercase border-b-2 transition-all cursor-pointer ${
                            activeTab === 'raw'
                                ? 'border-primary text-primary bg-surface-container'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-container-high/40'
                        }`}
                    >
                        RAW SOURCE DATA
                    </button>
                    <button 
                        onClick={() => setActiveTab('citations')}
                        className={`px-6 py-4 text-xs font-bold tracking-widest uppercase border-b-2 transition-all cursor-pointer ${
                            activeTab === 'citations'
                                ? 'border-primary text-primary bg-surface-container'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-container-high/40'
                        }`}
                    >
                        CITATION MAP
                    </button>
                </div>

                {/* Tab panels */}
                <div className="p-6">
                    {activeTab === 'excerpts' && (
                        <div className="space-y-8 max-w-4xl">
                            {article.excerpts.map((excerpt, index) => {
                                const excerptPositive = excerpt.sentiment === 'positive'
                                const excerptNegative = excerpt.sentiment === 'negative'
                                const borderClass = excerptPositive 
                                    ? 'bg-sentiment-positive' 
                                    : excerptNegative 
                                        ? 'bg-sentiment-negative' 
                                        : 'bg-sentiment-neutral'
                                
                                return (
                                    <div key={index} className="relative pl-6 group">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderClass} rounded-full group-hover:w-1.5 transition-all`}></div>
                                        
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className={`text-xs font-bold tracking-wider ${
                                                excerptPositive 
                                                    ? 'text-sentiment-positive' 
                                                    : excerptNegative 
                                                        ? 'text-sentiment-negative' 
                                                        : 'text-muted-foreground'
                                            }`}>
                                                {excerpt.title}
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground">• {excerpt.relevance}</span>
                                            <span className="text-[10px] text-muted-foreground">• {excerpt.time}</span>
                                        </div>

                                        <p className="text-sm leading-relaxed text-foreground italic bg-surface-container-low/40 p-3 rounded-lg border border-border/40">
                                            "{excerpt.text}"
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {activeTab === 'raw' && (
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground mb-2">Metadata payload extracted from index node</p>
                            <pre className="p-4 bg-surface-container-low rounded-lg border border-border font-mono text-xs text-primary overflow-x-auto max-h-96">
                                {JSON.stringify({
                                    meta: {
                                        title: article.title,
                                        url: article.url,
                                        publisher: article.source,
                                        processed_timestamp: article.published_at,
                                        analyst_confidence: article.sentiment_score,
                                        label: article.sentiment_label
                                    },
                                    entities: article.entities.map(e => ({
                                        symbol: e.ticker,
                                        name: e.name,
                                        weight: e.relevance
                                    })),
                                    key_themes: article.themes,
                                    semantic_vector_dimensions: 1536
                                }, null, 4)}
                            </pre>
                        </div>
                    )}

                    {activeTab === 'citations' && (
                        <div className="p-6 border border-dashed border-border rounded-lg text-center flex flex-col items-center justify-center min-h-60 bg-surface-container-low/30">
                            <Network className="h-10 w-10 text-muted-foreground/60 mb-3" />
                            <h4 className="text-sm font-semibold text-foreground mb-1">Semantic Citation Web</h4>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                Nodes representing similar publications referencing {article.entities.map(e => e.ticker).filter(Boolean).join(', ')} within a 14-day window. Interactive graphs require core-api vector index matching.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ArticleDeepDivePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading deep dive context...</div>}>
            <ArticleDeepDiveContent />
        </Suspense>
    )
}
