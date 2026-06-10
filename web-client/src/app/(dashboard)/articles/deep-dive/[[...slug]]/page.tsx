'use client'

import { Suspense, useState, useEffect, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getUserSettings, updateUserSettings } from '@/app/actions/settings'
import { getArticleDetail, getTickerRelatedNews, TickerRelatedNewsItem } from '@/app/actions/articles'
import { cleanArticleTitle } from '@/lib/utils'
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Zap,
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
    ChevronDown,
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
        {
            name: 'NVIDIA Corp',
            ticker: 'NVDA',
            sentiment_score: 0.92,
            sentiment_label: 'positive',
        },
        {
            name: 'Taiwan Semi',
            ticker: 'TSM',
            sentiment_score: 0.75,
            sentiment_label: 'positive',
        },
        {
            name: 'AMD Inc',
            ticker: 'AMD',
            sentiment_score: 0.45,
            sentiment_label: 'negative',
        },
    ],
}

const getSourceFromUrl = (urlStr: string | null) => {
    if (!urlStr) return 'FinSight'
    try {
        const domain = new URL(urlStr).hostname.replace('www.', '')
        const parts = domain.split('.')
        const mainPart = parts[0]
        if (mainPart === 'theverge') return 'The Verge'
        if (mainPart === 'nytimes') return 'NY Times'
        if (mainPart === 'bloomberg') return 'Bloomberg'
        if (mainPart === 'ft') return 'Financial Times'
        if (mainPart === 'reuters') return 'Reuters'
        if (mainPart === 'cnbc') return 'CNBC'
        return mainPart.charAt(0).toUpperCase() + mainPart.slice(1)
    } catch {
        return 'FinSight'
    }
}

const groupTickers = (entities: any[]) => {
    if (!entities || !Array.isArray(entities)) return []

    const filtered = entities.filter(
        (e: any) => e && e.ticker && typeof e.ticker === 'string' && e.ticker.trim() !== ''
    )

    const groups: Record<string, any> = {}

    filtered.forEach((e: any) => {
        const symbol = e.ticker.toUpperCase().trim()
        const score = e.sentiment_score !== undefined ? e.sentiment_score : 0.5
        const label = e.sentiment_label || 'neutral'

        if (!groups[symbol]) {
            groups[symbol] = {
                ticker: symbol,
                name: e.name || symbol,
                occurrences: []
            }
        }

        groups[symbol].occurrences.push({
            name: e.name || symbol,
            sentimentScore: score,
            sentimentLabel: label
        })
    })

    return Object.values(groups)
}

function ArticleDeepDiveContent({
    params,
}: {
    params: Promise<{ slug?: string[] }>
}) {
    const { slug } = use(params)
    const searchParams = useSearchParams()
    const router = useRouter()
    const [watchlistTickers, setWatchlistTickers] = useState<string[]>([])
    const [loadingWatchlist, setLoadingWatchlist] = useState(true)
    const [selectedChartTicker, setSelectedChartTicker] = useState<string>('')
    const [expandedTickers, setExpandedTickers] = useState<Record<string, boolean>>({})

    // Load watchlist on mount
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
                console.error('Failed to load user settings', err)
            } finally {
                setLoadingWatchlist(false)
            }
        }
        fetchSettings()
    }, [])

    // Resolve parameter inputs: route parameters (slug) take priority over query parameters (fallback)
    let uuidParam = searchParams.get('id') || searchParams.get('uuid')

    if (slug && slug.length > 0) {
        uuidParam = slug[0]
    }

    const [dbArticle, setDbArticle] = useState<any>(null)
    const [articleLoading, setArticleLoading] = useState(true)

    // Load article from database if uuid is present
    useEffect(() => {
        const loadArticle = async () => {
            if (!uuidParam) {
                setArticleLoading(false)
                return
            }

            setArticleLoading(true)
            try {
                const data = await getArticleDetail(uuidParam)
                if (data) {
                    const parsedEntities = (data.entities || []).map((e: any) => ({
                        name: e.name || e.ticker || 'Unknown',
                        ticker: e.ticker || null,
                        sentiment_score: e.sentiment_score !== undefined ? e.sentiment_score : 0.5,
                        sentiment_label: e.sentiment_label || 'neutral',
                    }))

                    const sentimentLabel = data.overall_sentiment_label || 'neutral'
                    const sentimentScoreNum = data.overall_sentiment_score || 0.5

                    const sourceVal = data.source || getSourceFromUrl(data.url) || 'FinSight'
                    setDbArticle({
                        title: cleanArticleTitle(data.title, sourceVal, data.url),
                        url: data.url,
                        source: sourceVal,
                        published_at: data.processed_at,
                        sentiment_score: sentimentScoreNum,
                        sentiment_label: sentimentLabel,
                        category: 'MARKET TREND',
                        readTime: '5 MIN READ',
                        author: 'FinSight Research',
                        entities: parsedEntities,
                    })
                }
            } catch (err) {
                console.error('Failed to load article detail', err)
            } finally {
                setArticleLoading(false)
            }
        }

        loadArticle()
    }, [uuidParam])

    const article = dbArticle || defaultArticle

    const primaryTicker =
        article.entities.find(
            (e: any) => e.ticker && typeof e.ticker === 'string' && e.ticker.trim() !== ''
        )?.ticker || 'NVDA'
    const activeChartTicker = selectedChartTicker || primaryTicker

    const [sentimentTimeline, setSentimentTimeline] = useState<TickerRelatedNewsItem[]>([])
    const [chartLoading, setChartLoading] = useState(true)
    const [hoveredPoint, setHoveredPoint] = useState<{
        index: number
        x: number
        y: number
        title: string
        source: string
        sentiment: string
        score: number
        date: string
    } | null>(null)

    useEffect(() => {
        const fetchSentimentData = async () => {
            setChartLoading(true)
            try {
                // Fetch up to 15 related news sentiments from TimescaleDB
                const data = await getTickerRelatedNews(activeChartTicker, 15)
                let timeline: TickerRelatedNewsItem[] = data ? [...data] : []

                // Check if the current article is in the fetched list (matching by url)
                const hasCurrent = timeline.some(item => item.url === article.url)
                if (!hasCurrent && article.published_at) {
                    // If not, add the current article's sentiment to the timeline
                    timeline.push({
                        title: article.title,
                        source: article.source,
                        url: article.url,
                        processed_at: article.published_at,
                        sentiment: article.sentiment_label as 'positive' | 'neutral' | 'negative',
                        sentiment_score: article.sentiment_score
                    })
                }

                // Sort timeline chronologically (ascending) and clean titles
                timeline.sort((a, b) => new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime())
                setSentimentTimeline(
                    timeline.map((item) => ({
                        ...item,
                        title: cleanArticleTitle(item.title, item.source, item.url),
                    }))
                )
            } catch (err) {
                console.error('Failed to load sentiment correlation data', err)
                // Fallback mock data if the call fails
                const mockTimeline: TickerRelatedNewsItem[] = [
                    { title: 'NVDA reports record revenue', source: 'Reuters', url: '1', processed_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), sentiment: 'positive', sentiment_score: 0.95 },
                    { title: 'Analysts warn of NVDA valuation', source: 'Bloomberg', url: '2', processed_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), sentiment: 'neutral', sentiment_score: 0.5 },
                    { title: article.title, source: article.source, url: article.url, processed_at: article.published_at, sentiment: article.sentiment_label as 'positive' | 'neutral' | 'negative', sentiment_score: article.sentiment_score },
                    { title: 'NVDA launches next-gen Blackwell chips', source: 'TechCrunch', url: '4', processed_at: new Date(Date.now() + 1 * 86400 * 1000).toISOString(), sentiment: 'positive', sentiment_score: 0.88 },
                    { title: 'Global chip demand remains strong', source: 'WSJ', url: '5', processed_at: new Date(Date.now() + 2 * 86400 * 1000).toISOString(), sentiment: 'positive', sentiment_score: 0.72 }
                ].map((item) => ({
                    ...item,
                    sentiment: item.sentiment as 'positive' | 'neutral' | 'negative',
                    title: cleanArticleTitle(item.title, item.source, item.url),
                }))
                setSentimentTimeline(mockTimeline)
            } finally {
                setChartLoading(false)
            }
        }
        if (activeChartTicker) {
            fetchSentimentData()
        }
    }, [
        activeChartTicker,
        article.url,
        article.title,
        article.source,
        article.published_at,
        article.sentiment_label,
        article.sentiment_score
    ])

    const getSentimentValue = (item: TickerRelatedNewsItem) => {
        if (!item) return 0
        const score = item.sentiment_score ?? 0
        if (item.sentiment === 'positive') return score
        if (item.sentiment === 'negative') return -score
        return 0
    }

    const eventIndex = sentimentTimeline.findIndex(item => item.url === article.url)
    const eventItem = eventIndex !== -1 ? sentimentTimeline[eventIndex] : null
    const eventValue = eventItem ? getSentimentValue(eventItem) : (
        article.sentiment_label === 'positive'
            ? article.sentiment_score
            : article.sentiment_label === 'negative'
                ? -article.sentiment_score
                : 0
    )

    const pathD = sentimentTimeline.length > 1
        ? sentimentTimeline.map((item, idx) => {
            const x = (idx / (sentimentTimeline.length - 1)) * 800
            const y = 110 - getSentimentValue(item) * 80
            return `${idx === 0 ? 'M' : 'L'}${x},${y}`
        }).join(' ')
        : ''

    const areaD = pathD ? `${pathD} V220 H0 Z` : ''

    const eventX = sentimentTimeline.length > 1
        ? (eventIndex !== -1 ? (eventIndex / (sentimentTimeline.length - 1)) * 800 : 400)
        : 400
    const eventY = 110 - eventValue * 80

    const finalItem = sentimentTimeline[sentimentTimeline.length - 1]
    const finalValue = finalItem ? getSentimentValue(finalItem) : eventValue
    const sentimentShift = finalValue - eventValue // Range: -2.0 to 2.0
    const sentimentShiftPercent = sentimentShift * 100 // Shift on a percentage scale, e.g. +60% Shift

    const chartStrokeColor =
        sentimentShift > 0.05
            ? '#10B981'
            : sentimentShift < -0.05
              ? '#EF4444'
              : 'var(--primary)'

    const chartFillUrl =
        sentimentShift > 0.05
            ? 'url(#chartAreaGradientGreen)'
            : sentimentShift < -0.05
              ? 'url(#chartAreaGradientRed)'
              : 'url(#chartAreaGradientBlue)'

    const toggleWatchlist = async (ticker: string) => {
        const uppercaseTicker = ticker.toUpperCase()
        const isAdded = watchlistTickers.includes(uppercaseTicker)

        let newTickers: string[] = []
        if (isAdded) {
            newTickers = watchlistTickers.filter((t) => t !== uppercaseTicker)
        } else {
            newTickers = [...watchlistTickers, uppercaseTicker]
        }

        try {
            await updateUserSettings({ tickers: newTickers })
            setWatchlistTickers(newTickers)
            toast.success(
                isAdded
                    ? `${uppercaseTicker} removed from watchlist`
                    : `${uppercaseTicker} added to watchlist`,
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

    if (articleLoading && !dbArticle && uuidParam) {
        return (
            <div className='flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-slate-100'>
                <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent'></div>
                <p className='text-sm text-slate-400 font-medium'>Loading analysis from database...</p>
            </div>
        )
    }

    return (
        <div className='space-y-8 pb-16'>
            {/* Back Button */}
            <div>
                <button
                    onClick={() => router.back()}
                    className='text-muted-foreground hover:text-foreground group flex cursor-pointer items-center gap-2 text-sm transition-colors'
                >
                    <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
                    <span>Back to Search</span>
                </button>
            </div>

            {/* Article Header & Sentiment Hero */}
            <section className='border-border flex flex-col items-start justify-between gap-8 border-b pb-8 lg:flex-row'>
                <div className='max-w-4xl flex-1 space-y-4'>
                    <div className='flex items-center gap-3'>
                        <span className='bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase'>
                            {article.category}
                        </span>
                        <span className='bg-surface-container-high text-muted-foreground rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider'>
                            {article.readTime}
                        </span>
                        {primaryTicker && (
                            <span className='flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-blue-400 uppercase'>
                                <span>{primaryTicker}</span>
                                {article.source && (
                                    <>
                                        <span className='opacity-40'>•</span>
                                        <span className='font-medium opacity-90'>
                                            {article.source}
                                        </span>
                                    </>
                                )}
                            </span>
                        )}
                    </div>

                    <h1 className='text-foreground text-3xl leading-tight font-bold tracking-tight'>
                        {article.title}
                    </h1>

                    <div className='text-muted-foreground flex flex-wrap items-center gap-6 text-sm'>
                        <a
                            href={article.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='hover:text-primary flex cursor-pointer items-center gap-2 transition-colors'
                        >
                            <Globe className='h-4 w-4' />
                            <span>{article.source}</span>
                            <ExternalLink className='h-3 w-3 opacity-60' />
                        </a>
                        <div className='flex items-center gap-2'>
                            <Calendar className='h-4 w-4' />
                            <span>
                                {new Date(
                                    article.published_at,
                                ).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <User className='h-4 w-4' />
                            <span>{article.author}</span>
                        </div>
                    </div>
                </div>

                {/* Sentiment Hero Card */}
                <div className='bg-surface-container-low border-border group relative w-full overflow-hidden rounded-xl border p-6 shadow-lg lg:w-64'>
                    <div
                        className={`absolute -top-10 -right-10 h-32 w-32 opacity-20 blur-3xl transition-all duration-500 group-hover:opacity-30 ${
                            isPositive
                                ? 'bg-sentiment-positive'
                                : isNegative
                                  ? 'bg-sentiment-negative'
                                  : 'bg-sentiment-neutral'
                        }`}
                    ></div>

                    <p className='text-muted-foreground mb-4 text-[10px] font-bold tracking-widest uppercase'>
                        OVERALL SENTIMENT
                    </p>

                    <div className='mb-3 flex items-end gap-1'>
                        <span
                            className={`text-4xl font-bold tracking-tight ${sentimentColor}`}
                        >
                            {Math.round(article.sentiment_score * 100)}
                        </span>
                        <span className='text-muted-foreground mb-1.5 text-sm font-medium'>
                            /100
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className='bg-surface-container-highest h-2 w-full overflow-hidden rounded-full'>
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                isPositive
                                    ? 'bg-sentiment-positive shadow-[0_0_8px_#10B981]'
                                    : isNegative
                                      ? 'bg-sentiment-negative shadow-[0_0_8px_#EF4444]'
                                      : 'bg-sentiment-neutral shadow-[0_0_8px_#eab308]'
                            }`}
                            style={{
                                width: `${Math.round(article.sentiment_score * 100)}%`,
                            }}
                        ></div>
                    </div>

                    <p
                        className={`mt-4 flex items-center gap-1.5 text-xs font-semibold capitalize ${sentimentColor}`}
                    >
                        {isPositive ? (
                            <TrendingUp className='h-4 w-4' />
                        ) : isNegative ? (
                            <TrendingDown className='h-4 w-4' />
                        ) : (
                            <Activity className='h-4 w-4' />
                        )}
                        {article.sentiment_label} Consensus
                    </p>
                </div>
            </section>

            {/* Bento Grid Content */}
            <div className='grid grid-cols-12 items-start gap-8'>
                {/* Left Side: Summary & Price Chart */}
                <div className='col-span-12 space-y-8 lg:col-span-7'>
                    {/* Article Analytics Profile */}
                    <div className='bg-surface-container border-border relative overflow-hidden rounded-xl border p-6 shadow-md'>
                        <h3 className='text-foreground mb-4 flex items-center gap-2 text-lg font-bold'>
                            <FileText className='text-primary fill-primary/15 h-5 w-5' />
                            <span>Article Analytics Profile</span>
                        </h3>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                            <div className='border-border/60 border-b pb-2.5 sm:border-none sm:pb-0'>
                                <span className='text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1'>Publisher Source</span>
                                <span className='text-foreground font-semibold'>{article.source}</span>
                            </div>
                            <div className='border-border/60 border-b pb-2.5 sm:border-none sm:pb-0'>
                                <span className='text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1'>Ingestion Timestamp</span>
                                <span className='text-foreground font-semibold font-mono'>{new Date(article.published_at).toLocaleString()}</span>
                            </div>
                            <div className='border-border/60 border-b pb-2.5 sm:border-none sm:pb-0'>
                                <span className='text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1'>Overall Classification</span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                                    article.sentiment_label === 'positive'
                                        ? 'bg-sentiment-positive/10 text-sentiment-positive'
                                        : article.sentiment_label === 'negative'
                                          ? 'bg-sentiment-negative/10 text-sentiment-negative'
                                          : 'bg-sentiment-neutral/15 text-muted-foreground'
                                }`}>
                                    {article.sentiment_label}
                                </span>
                            </div>
                            <div>
                                <span className='text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1'>Sentiment Confidence</span>
                                <span className='text-foreground font-semibold font-mono'>{Math.round((article.sentiment_score || 0) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* SVG Chart: Sentiment Correlation */}
                    <div className='bg-surface-container border-border rounded-xl border p-6 shadow-md relative'>
                        <div className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                            <div>
                                <div className='flex flex-wrap items-center gap-2.5'>
                                    <h3 className='text-foreground text-base font-bold'>
                                        Post-Article Sentiment Correlation
                                    </h3>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap transition-all ${
                                            chartLoading
                                                ? 'bg-surface-container-highest/60 text-muted-foreground/60 animate-pulse'
                                                : sentimentShift > 0.05
                                                  ? 'bg-sentiment-positive/10 text-sentiment-positive'
                                                  : sentimentShift < -0.05
                                                    ? 'bg-sentiment-negative/10 text-sentiment-negative'
                                                    : 'bg-sentiment-neutral/10 text-sentiment-neutral'
                                        }`}
                                    >
                                        {chartLoading
                                            ? 'Calculating...'
                                            : `${sentimentShift > 0.05 ? '+' : ''}${sentimentShiftPercent.toFixed(0)}% Sentiment Shift`}
                                    </span>
                                </div>
                                <p className='text-muted-foreground mt-1 text-xs'>
                                    Sentiment timeline of {activeChartTicker} over time, highlighting the current article (T-0)
                                </p>
                            </div>
                            <div className='flex items-center gap-4 text-xs font-semibold'>
                                <div className='flex items-center gap-1.5'>
                                    {(Array.from(
                                        new Set(
                                            (article.entities || [])
                                                .map((e: any) => e.ticker)
                                                .filter(Boolean)
                                                .map((t: any) => String(t).toUpperCase())
                                        )
                                    ) as string[]).length > 0 ? (
                                        <div className='bg-surface-container-low border-border flex items-center gap-1 rounded-lg border p-1'>
                                            {(Array.from(
                                                new Set(
                                                    (article.entities || [])
                                                        .map((e: any) => e.ticker)
                                                        .filter(Boolean)
                                                        .map((t: any) => String(t).toUpperCase())
                                                )
                                            ) as string[]).map((t: string) => {
                                                const isActive =
                                                    t.toUpperCase() ===
                                                    activeChartTicker.toUpperCase()
                                                return (
                                                    <button
                                                        key={t}
                                                        onClick={() =>
                                                            setSelectedChartTicker(
                                                                t.toUpperCase(),
                                                            )
                                                        }
                                                        className={`cursor-pointer rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
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
                                        <div className='flex items-center gap-1.5'>
                                            <span className='bg-primary h-2.5 w-2.5 rounded-full'></span>
                                            <span>{activeChartTicker}</span>
                                        </div>
                                    )}
                                </div>
                                <div className='text-muted-foreground flex items-center gap-1.5 whitespace-nowrap'>
                                    <span className='border-muted-foreground/60 h-0 w-6 border-t border-dashed'></span>
                                    <span>Neutral Baseline</span>
                                </div>
                            </div>
                        </div>

                        {/* Line Chart */}
                        <div className='relative mt-4 h-60 w-full'>
                            <svg
                                className='h-full w-full overflow-visible'
                                viewBox='0 0 800 220'
                            >
                                {/* Grid Lines with Labels */}
                                <g opacity='0.45'>
                                    {/* Positive Grid */}
                                    <line x1='85' y1='30' x2='800' y2='30' stroke='var(--border)' strokeWidth='1' />
                                    <text x='5' y='34' fill='var(--foreground)' fontSize='12' className='font-bold uppercase tracking-wider opacity-90'>Positive</text>

                                    {/* Neutral Grid */}
                                    <line x1='85' y1='110' x2='800' y2='110' stroke='var(--border)' strokeWidth='1' strokeDasharray='4' />
                                    <text x='5' y='114' fill='var(--foreground)' fontSize='12' className='font-bold uppercase tracking-wider opacity-90'>Neutral</text>

                                    {/* Negative Grid */}
                                    <line x1='85' y1='190' x2='800' y2='190' stroke='var(--border)' strokeWidth='1' />
                                    <text x='5' y='194' fill='var(--foreground)' fontSize='12' className='font-bold uppercase tracking-wider opacity-90'>Negative</text>
                                </g>

                                {/* Area Gradient definitions */}
                                <defs>
                                    <linearGradient
                                        id='chartAreaGradientGreen'
                                        x1='0'
                                        y1='0'
                                        x2='0'
                                        y2='1'
                                    >
                                        <stop
                                            offset='0%'
                                            stopColor='#10B981'
                                            stopOpacity='0.25'
                                        ></stop>
                                        <stop
                                            offset='100%'
                                            stopColor='#10B981'
                                            stopOpacity='0'
                                        ></stop>
                                    </linearGradient>
                                    <linearGradient
                                        id='chartAreaGradientRed'
                                        x1='0'
                                        y1='0'
                                        x2='0'
                                        y2='1'
                                    >
                                        <stop
                                            offset='0%'
                                            stopColor='#EF4444'
                                            stopOpacity='0.25'
                                        ></stop>
                                        <stop
                                            offset='100%'
                                            stopColor='#EF4444'
                                            stopOpacity='0'
                                        ></stop>
                                    </linearGradient>
                                    <linearGradient
                                        id='chartAreaGradientBlue'
                                        x1='0'
                                        y1='0'
                                        x2='0'
                                        y2='1'
                                    >
                                        <stop
                                            offset='0%'
                                            stopColor='var(--primary)'
                                            stopOpacity='0.25'
                                        ></stop>
                                        <stop
                                            offset='100%'
                                            stopColor='var(--primary)'
                                            stopOpacity='0'
                                        ></stop>
                                    </linearGradient>
                                </defs>

                                {chartLoading ? (
                                    <text
                                        x='400'
                                        y='110'
                                        fill='var(--foreground)'
                                        fontSize='14'
                                        textAnchor='middle'
                                        opacity='0.6'
                                    >
                                        Loading historical sentiments...
                                    </text>
                                ) : sentimentTimeline.length === 0 ? (
                                    <text
                                        x='400'
                                        y='110'
                                        fill='var(--foreground)'
                                        fontSize='12'
                                        textAnchor='middle'
                                        opacity='0.6'
                                    >
                                        Sentiment data is currently unavailable.
                                    </text>
                                ) : (
                                    <>
                                        {/* Primary Sentiment Line */}
                                        {pathD && (
                                            <>
                                                <path
                                                    d={pathD}
                                                    fill='none'
                                                    stroke={chartStrokeColor}
                                                    strokeWidth='3.5'
                                                    strokeLinecap='round'
                                                />
                                                <path d={areaD} fill={chartFillUrl} />
                                            </>
                                        )}

                                        {/* Event Vertical Marker Line */}
                                        {sentimentTimeline.length > 1 && (
                                            <line
                                                x1={eventX}
                                                y1='30'
                                                x2={eventX}
                                                y2='190'
                                                stroke='var(--primary)'
                                                strokeWidth='1.5'
                                                strokeDasharray='4 4'
                                                strokeOpacity='0.7'
                                                className='pointer-events-none'
                                            />
                                        )}

                                        {/* Sentiment Dots */}
                                        {sentimentTimeline.map((item, idx) => {
                                            const x = sentimentTimeline.length > 1
                                                ? (idx / (sentimentTimeline.length - 1)) * 800
                                                : 400
                                            const y = 110 - getSentimentValue(item) * 80
                                            const isEvent = idx === eventIndex
                                            return (
                                                <g key={item.url + '-' + idx}>
                                                    {/* Hover active region */}
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r='16'
                                                        fill='transparent'
                                                        className='cursor-pointer'
                                                        onMouseEnter={() => setHoveredPoint({
                                                            index: idx,
                                                            x,
                                                            y,
                                                            title: item.title,
                                                            source: item.source,
                                                            sentiment: item.sentiment,
                                                            score: item.sentiment_score,
                                                            date: new Date(item.processed_at).toLocaleString()
                                                        })}
                                                        onMouseLeave={() => setHoveredPoint(null)}
                                                    />
                                                    {/* Visible dot */}
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r={isEvent ? '7' : '4.5'}
                                                        fill={isEvent ? 'var(--primary)' : (
                                                            item.sentiment === 'positive'
                                                                ? '#10B981'
                                                                : item.sentiment === 'negative'
                                                                    ? '#EF4444'
                                                                    : 'var(--muted-foreground)'
                                                        )}
                                                        stroke={isEvent ? 'var(--background)' : 'var(--surface-container)'}
                                                        strokeWidth={isEvent ? '3' : '1.5'}
                                                        className='pointer-events-none transition-all duration-150'
                                                    />
                                                </g>
                                            )
                                        })}

                                        {/* SVG Tooltip using foreignObject */}
                                        {hoveredPoint && (
                                            <foreignObject
                                                x={Math.max(10, Math.min(800 - 300 - 10, hoveredPoint.x - 150))}
                                                y={Math.max(5, hoveredPoint.y - 125)}
                                                width='300'
                                                height='120'
                                                className='pointer-events-none overflow-visible'
                                            >
                                                <div className='bg-surface-container-highest/95 backdrop-blur-md border border-border p-3.5 rounded-lg shadow-2xl text-[13px] leading-snug'>
                                                    <div className='flex items-center justify-between gap-2.5 mb-2'>
                                                        <span className='text-muted-foreground font-mono text-[11px]'>{hoveredPoint.date.split(',')[0]}</span>
                                                        <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${
                                                            hoveredPoint.sentiment === 'positive'
                                                                ? 'bg-sentiment-positive/10 text-sentiment-positive'
                                                                : hoveredPoint.sentiment === 'negative'
                                                                  ? 'bg-sentiment-negative/10 text-sentiment-negative'
                                                                  : 'bg-sentiment-neutral/15 text-muted-foreground'
                                                        }`}>
                                                            {hoveredPoint.sentiment} ({Math.round(hoveredPoint.score * 100)}%)
                                                        </span>
                                                    </div>
                                                    <div className='font-extrabold text-foreground line-clamp-2 mb-1 text-[13px]'>{hoveredPoint.title}</div>
                                                    <div className='text-[11px] text-muted-foreground font-semibold'>{hoveredPoint.source}</div>
                                                </div>
                                            </foreignObject>
                                        )}
                                    </>
                                )}
                            </svg>
                        </div>

                        {/* Bottom date labels */}
                        <div className='text-muted-foreground mt-4 flex justify-between px-2 text-[12px] font-bold tracking-wider uppercase'>
                            {sentimentTimeline.length > 1 ? (
                                <>
                                    <span>First: {new Date(sentimentTimeline[0].processed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    <span className='text-primary font-extrabold'>Current Article ({new Date(article.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</span>
                                    <span>Latest: {new Date(sentimentTimeline[sentimentTimeline.length - 1].processed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </>
                            ) : (
                                <span className='w-full text-center text-primary font-extrabold'>
                                    Current Article ({new Date(article.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                                </span>
                            )}
                        </div>

                        {/* Helper banner for low data points */}
                        {sentimentTimeline.length < 3 && !chartLoading && (
                            <div className='mt-4 p-3 bg-surface-container-low border border-border/50 rounded-lg flex items-center gap-2.5 text-xs text-muted-foreground animate-fadeIn'>
                                <Activity className='h-4 w-4 text-primary animate-pulse shrink-0' />
                                <span>
                                    Sentiment trend mapping requires 3 or more articles to show historical shifts. Ingest more news for <strong>{activeChartTicker}</strong> to expand the correlation. (Currently {sentimentTimeline.length} stored)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Mentioned Tickers & Key Themes */}
                <div className='col-span-12 space-y-8 lg:col-span-5'>
                    {/* Mentioned Tickers */}
                    <div className='bg-surface-container border-border rounded-xl border p-6 shadow-md'>
                        <h3 className='text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase'>
                            MENTIONED TICKERS
                        </h3>

                        <div className='space-y-4'>
                            {(() => {
                                const grouped = groupTickers(article.entities)
                                if (grouped.length === 0) {
                                    return (
                                        <div className='bg-surface-container-low border-border rounded-lg border p-6 text-center text-xs text-muted-foreground'>
                                            No recognized tickers mentioned in this article.
                                        </div>
                                    )
                                }
                                return grouped.map((ticker, index) => {
                                    const tickerAdded = watchlistTickers.includes(
                                        ticker.ticker.toUpperCase()
                                    )
                                    const isActive =
                                        ticker.ticker.toUpperCase() ===
                                        activeChartTicker.toUpperCase()
                                    const isExpanded = !!expandedTickers[ticker.ticker.toUpperCase()]
                                    const hasDuplicates = ticker.occurrences.length > 1

                                    return (
                                        <div
                                            key={index}
                                            onClick={() =>
                                                setSelectedChartTicker(
                                                    ticker.ticker.toUpperCase()
                                                )
                                            }
                                            className={`bg-surface-container-low hover:border-primary/40 group flex flex-col cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                                                isActive
                                                    ? 'border-primary shadow-sm'
                                                    : 'border-border'
                                            }`}
                                        >
                                            <div className='flex items-center justify-between w-full'>
                                                <div className='space-y-1'>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='text-primary max-w-[80px] truncate text-base font-bold'>
                                                            {ticker.ticker}
                                                        </span>
                                                        <span className='text-muted-foreground max-w-[120px] truncate text-xs'>
                                                            {ticker.name}
                                                        </span>
                                                        {article.source && (
                                                            <span className='text-primary bg-primary/10 border-primary/20 flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium'>
                                                                <span>{article.source}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className='flex items-center gap-4 text-right'>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleWatchlist(ticker.ticker)
                                                        }}
                                                        className={`cursor-pointer rounded-lg border p-2 transition-all active:scale-95 ${
                                                            tickerAdded
                                                                ? 'bg-primary/10 border-primary text-primary'
                                                                : 'border-border text-muted-foreground hover:text-foreground hover:bg-surface-container-high'
                                                        }`}
                                                        title={
                                                            tickerAdded
                                                                ? 'Remove from Watchlist'
                                                                : 'Add to Watchlist'
                                                        }
                                                    >
                                                        {tickerAdded ? (
                                                            <Check className='h-4 w-4' />
                                                        ) : (
                                                            <Plus className='h-4 w-4' />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sub-item Expandable Occurrences */}
                                            {hasDuplicates && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setExpandedTickers((prev) => ({
                                                            ...prev,
                                                            [ticker.ticker]: !prev[ticker.ticker],
                                                        }))
                                                    }}
                                                    className='mt-2.5 self-start text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer select-none transition-colors'
                                                >
                                                    <span>{isExpanded ? 'Hide' : 'Show'} captured sentiments ({ticker.occurrences.length})</span>
                                                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}

                                            {hasDuplicates && isExpanded && (
                                                <div
                                                    className="mt-3 pt-3 border-t border-border/30 space-y-2.5 w-full cursor-default"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                                                        Captured Occurrences
                                                    </p>
                                                    {ticker.occurrences.map((occ: any, oIdx: number) => {
                                                        const occLabelBg = occ.sentimentLabel === 'positive'
                                                            ? 'bg-sentiment-positive/10 text-sentiment-positive'
                                                            : occ.sentimentLabel === 'negative'
                                                              ? 'bg-sentiment-negative/10 text-sentiment-negative'
                                                              : 'bg-sentiment-neutral/15 text-muted-foreground'
                                                        return (
                                                            <div key={oIdx} className="bg-surface-container-high/40 rounded-lg p-2.5 border border-border/20 text-xs">
                                                                <div className="flex justify-between items-center gap-2">
                                                                    <span className="font-semibold text-foreground truncate max-w-[155px]" title={occ.name}>
                                                                        &ldquo;{occ.name}&rdquo;
                                                                    </span>
                                                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase shrink-0 ${occLabelBg}`}>
                                                                        {occ.sentimentLabel.slice(0, 3)} ({Math.round(occ.sentimentScore * 100)}%)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    </div>

                    {/* Unidentified Keywords */}
                    {(() => {
                        const unidentified = (article.entities || []).filter(
                            (e: any) => e && (!e.ticker || typeof e.ticker !== 'string' || e.ticker.trim() === '')
                        )
                        if (unidentified.length === 0) return null

                        return (
                            <div className='bg-surface-container border-border rounded-xl border p-6 shadow-md'>
                                <h3 className='text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase'>
                                    KEYWORDS
                                </h3>
                                <div className='flex flex-wrap gap-2'>
                                    {unidentified.map((entity: any, index: number) => {
                                        const labelBg = entity.sentiment_label === 'positive'
                                            ? 'bg-sentiment-positive/10 text-sentiment-positive border-sentiment-positive/30'
                                            : entity.sentiment_label === 'negative'
                                              ? 'bg-sentiment-negative/10 text-sentiment-negative border-sentiment-negative/30'
                                              : 'bg-sentiment-neutral/10 text-sentiment-neutral border-sentiment-neutral/30'
                                        
                                        return (
                                            <div
                                                key={index}
                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${labelBg}`}
                                                title={`Sentiment: ${entity.sentiment_label} (${Math.round(entity.sentiment_score * 100)}%)`}
                                            >
                                                <span>{entity.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })()}

                </div>
            </div>

            {/* Bottom Row: Raw Source Data */}
            <div className='bg-surface-container border-border overflow-hidden rounded-xl border p-6 shadow-md'>
                <div className='space-y-4'>
                    <h3 className='text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase'>
                        RAW SOURCE DATA
                    </h3>
                    <p className='text-muted-foreground mb-2 text-xs'>
                        Metadata payload extracted from index node
                    </p>
                    <pre className='bg-surface-container-low border-border text-primary max-h-96 overflow-x-auto rounded-lg border p-4 font-mono text-xs'>
                        {JSON.stringify(
                            {
                                meta: {
                                    title: article.title,
                                    url: article.url,
                                    publisher: article.source,
                                    processed_timestamp: article.published_at,
                                    analyst_confidence: article.sentiment_score,
                                    label: article.sentiment_label,
                                },
                                entities: (article.entities || []).map((e: any) => ({
                                    symbol: e.ticker,
                                    name: e.name,
                                    sentiment: e.sentiment_label,
                                    confidence: e.sentiment_score,
                                })),
                                semantic_vector_dimensions: 1536,
                            },
                            null,
                            4,
                        )}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default function ArticleDeepDivePage({
    params,
}: {
    params: Promise<{ slug?: string[] }>
}) {
    return (
        <Suspense
            fallback={
                <div className='text-muted-foreground p-8 text-center text-sm'>
                    Loading deep dive context...
                </div>
            }
        >
            <ArticleDeepDiveContent params={params} />
        </Suspense>
    )
}
