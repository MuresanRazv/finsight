'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    PlusCircle,
    FileText,
    Globe,
} from 'lucide-react'
import {
    ingestArticle,
    bulkIngestArticles,
    getMyIngestions,
    IngestionRequestItem,
} from '@/app/actions/ingestion'
import { toast } from 'sonner'
import Link from 'next/link'

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

export default function IngestionPage() {
    const [mode, setMode] = useState<'single' | 'bulk'>('single')

    // Single Mode fields
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [source, setSource] = useState('')
    const [text, setText] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Bulk Mode fields
    const [bulkUrls, setBulkUrls] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [history, setHistory] = useState<IngestionRequestItem[]>([])

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    // Fetch history from database
    const fetchHistory = useCallback(
        async (showToast = false, targetPage = currentPage) => {
            const res = await getMyIngestions(targetPage, 10)
            if (res.success && res.data) {
                setHistory(res.data.content)
                setTotalPages(res.data.total_pages)
                if (showToast) {
                    toast.success('History updated successfully')
                }
            } else {
                console.error('Failed to load history:', res.message)
                if (showToast) {
                    toast.error(res.message || 'Failed to update history')
                }
            }
            setIsLoadingHistory(false)
        },
        [currentPage],
    )

    // Fetch on page change or mount
    useEffect(() => {
        fetchHistory(false, currentPage)
    }, [currentPage, fetchHistory])

    // Auto-polling when there are PENDING items in history
    useEffect(() => {
        const hasPending = history.some((item) => item.status === 'PENDING')
        if (!hasPending) return

        const interval = setInterval(() => {
            fetchHistory(false, currentPage)
        }, 4000) // check every 4 seconds

        return () => clearInterval(interval)
    }, [history, currentPage, fetchHistory])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setIsSubmitting(true)
        const toastId = toast.loading('Sending articles to processing queue...')

        try {
            if (mode === 'single') {
                if (!url.trim()) {
                    toast.error('Please enter a valid URL', { id: toastId })
                    setIsSubmitting(false)
                    return
                }

                const res = await ingestArticle({
                    url: url.trim(),
                    title: title.trim() || undefined,
                    source: source.trim() || undefined,
                    text: text.trim() || undefined,
                })

                if (res.success) {
                    toast.success(
                        'Article submitted! Processing has started.',
                        { id: toastId },
                    )
                    setUrl('')
                    setTitle('')
                    setSource('')
                    setText('')
                    setShowAdvanced(false)
                    setCurrentPage(0) // Go to first page to see the new request
                    fetchHistory(false, 0)
                } else {
                    toast.error(res.message || 'Failed to submit article.', {
                        id: toastId,
                    })
                }
            } else {
                // Bulk Mode
                const urlsList = bulkUrls
                    .split('\n')
                    .map((u) => u.trim())
                    .filter((u) => u.length > 0)

                if (urlsList.length === 0) {
                    toast.error('Please enter at least one URL.', {
                        id: toastId,
                    })
                    setIsSubmitting(false)
                    return
                }

                const res = await bulkIngestArticles(urlsList)

                if (res.success) {
                    toast.success(
                        `Bulk processing initiated for ${urlsList.length} articles!`,
                        { id: toastId },
                    )
                    setBulkUrls('')
                    setCurrentPage(0) // Go to first page to see the new requests
                    fetchHistory(false, 0)
                } else {
                    toast.error(
                        res.message ||
                            'Failed to submit bulk processing request.',
                        { id: toastId },
                    )
                }
            }
        } catch (err) {
            console.error(err)
            toast.error('An unexpected error occurred.', { id: toastId })
        } finally {
            setIsSubmitting(false)
        }
    }

    const getSentimentStyles = (label: string | null) => {
        if (!label) return 'bg-muted/30 text-muted-foreground'
        const cleanLabel = label.toLowerCase()
        if (cleanLabel === 'positive') {
            return 'bg-sentiment-positive/10 text-sentiment-positive border border-sentiment-positive/20'
        }
        if (cleanLabel === 'negative') {
            return 'bg-sentiment-negative/10 text-sentiment-negative border border-sentiment-negative/20'
        }
        return 'bg-sentiment-neutral/10 text-sentiment-neutral border border-sentiment-neutral/20'
    }

    const formatHistoryDate = (dateInput: any): string => {
        if (!dateInput) return 'N/A'
        try {
            if (Array.isArray(dateInput)) {
                const [year, month, day, hour, minute, second] = dateInput
                const date = new Date(
                    year,
                    month - 1,
                    day,
                    hour || 0,
                    minute || 0,
                    second || 0,
                )
                return date.toLocaleString()
            }
            const date = new Date(dateInput)
            if (isNaN(date.getTime())) return 'Invalid Date'
            return date.toLocaleString()
        } catch (error) {
            return 'Invalid Date'
        }
    }

    const getISOOrStringDate = (dateInput: any): string => {
        if (!dateInput) return ''
        try {
            if (Array.isArray(dateInput)) {
                const [year, month, day, hour, minute, second] = dateInput
                const date = new Date(
                    year,
                    month - 1,
                    day,
                    hour || 0,
                    minute || 0,
                    second || 0,
                )
                return date.toISOString()
            }
            if (typeof dateInput === 'string') {
                return dateInput
            }
            const date = new Date(dateInput)
            if (isNaN(date.getTime())) return ''
            return date.toISOString()
        } catch (error) {
            return ''
        }
    }

    return (
        <div className='text-foreground min-h-screen p-8 pb-20'>
            <header className='mb-8 flex items-center justify-between'>
                <div>
                    <h1 className='text-4xl font-bold tracking-tight'>
                        Article Ingestion
                    </h1>
                    <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
                        Manually trigger natural language processing and
                        sentiment analysis for articles not captured by the
                        scraper.
                    </p>
                </div>
                <button
                    onClick={() => fetchHistory(true, currentPage)}
                    className='border-border bg-card hover:bg-accent flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors'
                >
                    <RefreshCw
                        className={`h-3.5 w-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`}
                    />
                    Refresh
                </button>
            </header>

            <div className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
                {/* Manual Ingestion Form */}
                <div className='lg:col-span-5'>
                    <div className='border-border bg-card rounded-xl border p-6 shadow-md'>
                        <h2 className='mb-4 flex items-center gap-2 text-lg font-bold'>
                            <PlusCircle className='text-primary h-5 w-5' />
                            Process New Articles
                        </h2>

                        {/* Mode Select Tabs */}
                        <div className='bg-background border-border/40 mb-5 flex rounded-lg border p-1'>
                            <button
                                type='button'
                                onClick={() => setMode('single')}
                                className={`flex-1 cursor-pointer rounded-md py-2 text-center text-xs font-semibold transition-all ${mode === 'single' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Single Mode
                            </button>
                            <button
                                type='button'
                                onClick={() => setMode('bulk')}
                                className={`flex-1 cursor-pointer rounded-md py-2 text-center text-xs font-semibold transition-all ${mode === 'bulk' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Bulk Mode
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-4'>
                            {mode === 'single' ? (
                                <>
                                    <div className='space-y-1.5'>
                                        <label
                                            htmlFor='url'
                                            className='text-muted-foreground text-xs font-bold tracking-wide uppercase'
                                        >
                                            Article URL
                                        </label>
                                        <input
                                            id='url'
                                            type='url'
                                            required
                                            placeholder='https://news-site.com/article-path'
                                            value={url}
                                            onChange={(e) =>
                                                setUrl(e.target.value)
                                            }
                                            className='border-border bg-background focus:ring-primary w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1'
                                        />
                                    </div>

                                    {/* Advanced Fields Toggle */}
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowAdvanced(!showAdvanced)
                                        }
                                        className='text-primary mt-2 flex items-center gap-1.5 text-xs font-semibold hover:underline'
                                    >
                                        {showAdvanced ? (
                                            <>
                                                <ChevronUp className='h-3.5 w-3.5' />{' '}
                                                Hide overrides (auto-scrape)
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className='h-3.5 w-3.5' />{' '}
                                                Show overrides (manual text)
                                            </>
                                        )}
                                    </button>

                                    {showAdvanced && (
                                        <div className='border-border/50 animate-in fade-in slide-in-from-top-1 space-y-4 border-t pt-2 duration-255'>
                                            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                                <div className='space-y-1.5'>
                                                    <label
                                                        htmlFor='title'
                                                        className='text-muted-foreground text-xs font-bold tracking-wide uppercase'
                                                    >
                                                        Title Override
                                                    </label>
                                                    <input
                                                        id='title'
                                                        type='text'
                                                        placeholder='Article headline'
                                                        value={title}
                                                        onChange={(e) =>
                                                            setTitle(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='border-border bg-background focus:ring-primary w-full rounded-lg border px-3.5 py-2 text-sm outline-none focus:ring-1'
                                                    />
                                                </div>
                                                <div className='space-y-1.5'>
                                                    <label
                                                        htmlFor='source'
                                                        className='text-muted-foreground text-xs font-bold tracking-wide uppercase'
                                                    >
                                                        Source Override
                                                    </label>
                                                    <input
                                                        id='source'
                                                        type='text'
                                                        placeholder='CNBC, Bloomberg, etc.'
                                                        value={source}
                                                        onChange={(e) =>
                                                            setSource(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='border-border bg-background focus:ring-primary w-full rounded-lg border px-3.5 py-2 text-sm outline-none focus:ring-1'
                                                    />
                                                </div>
                                            </div>
                                            <div className='space-y-1.5'>
                                                <label
                                                    htmlFor='text'
                                                    className='text-muted-foreground text-xs font-bold tracking-wide uppercase'
                                                >
                                                    Article Text Content
                                                </label>
                                                <textarea
                                                    id='text'
                                                    rows={6}
                                                    placeholder='Paste the article text here. If empty, our service will attempt to fetch and parse it automatically.'
                                                    value={text}
                                                    onChange={(e) =>
                                                        setText(e.target.value)
                                                    }
                                                    className='border-border bg-background focus:ring-primary w-full resize-none rounded-lg border px-3.5 py-2 text-sm outline-none focus:ring-1'
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Bulk Mode Form */
                                <div className='animate-in fade-in slide-in-from-top-1 space-y-1.5 duration-200'>
                                    <label
                                        htmlFor='bulkUrls'
                                        className='text-muted-foreground text-xs font-bold tracking-wide uppercase'
                                    >
                                        Paste URLs (one per line)
                                    </label>
                                    <textarea
                                        id='bulkUrls'
                                        rows={8}
                                        required
                                        placeholder='https://news-site1.com/path&#10;https://news-site2.com/path'
                                        value={bulkUrls}
                                        onChange={(e) =>
                                            setBulkUrls(e.target.value)
                                        }
                                        className='border-border bg-background focus:ring-primary w-full resize-none rounded-lg border px-3.5 py-2.5 font-mono text-sm text-xs outline-none focus:ring-1'
                                    />
                                    <p className='text-muted-foreground mt-1 text-[10px] leading-normal'>
                                        * Note: URLs will be scraped
                                        automatically. Background analysis tasks
                                        will be staggered and delayed to ensure
                                        system stability.
                                    </p>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className='bg-primary text-primary-foreground mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md transition-all duration-150 hover:opacity-90 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <span>Trigger NLP Processing</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History list */}
                <div className='lg:col-span-7'>
                    <div className='border-border bg-card flex min-h-[400px] flex-col justify-between rounded-xl border p-6 shadow-md'>
                        <div>
                            <h2 className='mb-4 flex items-center gap-2 text-lg font-bold'>
                                <FileText className='text-primary h-5 w-5' />
                                My Processing Requests
                            </h2>

                            {isLoadingHistory && history.length === 0 ? (
                                <div className='text-muted-foreground flex flex-col items-center justify-center py-20'>
                                    <Loader2 className='text-primary mb-2 h-8 w-8 animate-spin' />
                                    Loading history...
                                </div>
                            ) : history.length === 0 ? (
                                <div className='border-border text-muted-foreground flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20'>
                                    <Globe className='mb-3 h-12 w-12 opacity-30' />
                                    <p className='text-sm font-semibold'>
                                        No manual ingestions yet
                                    </p>
                                    <p className='mt-1 text-xs'>
                                        Use the form to submit your first
                                        article.
                                    </p>
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='border-border/50 overflow-x-auto rounded-lg border'>
                                        <table className='w-full border-collapse text-left text-sm'>
                                            <thead>
                                                <tr className='border-border bg-muted/40 text-muted-foreground border-b text-xs font-bold tracking-wider uppercase'>
                                                    <th className='p-4'>
                                                        Article Details
                                                    </th>
                                                    <th className='p-4'>
                                                        Status
                                                    </th>
                                                    <th className='p-4'>
                                                        Submitted
                                                    </th>
                                                    <th className='p-4 text-right'>
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-border/50 divide-y'>
                                                {history.map((item) => {
                                                    const articleTitle =
                                                        item.article_title ||
                                                        (item as any)
                                                            .articleTitle
                                                    const sentimentLabel =
                                                        item.article_sentiment_label ||
                                                        (item as any)
                                                            .articleSentimentLabel
                                                    const sentimentScore =
                                                        item.article_sentiment_score ??
                                                        (item as any)
                                                            .articleSentimentScore
                                                    const errorMessage =
                                                        item.error_message ||
                                                        (item as any)
                                                            .errorMessage
                                                    const createdAt =
                                                        item.created_at ||
                                                        (item as any).createdAt
                                                    const completedAt =
                                                        item.completed_at ||
                                                        (item as any)
                                                            .completedAt
                                                    const articleProcessedAt =
                                                        item.article_processed_at ||
                                                        (item as any)
                                                            .articleProcessedAt

                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className='hover:bg-accent/20 transition-colors'
                                                        >
                                                            {/* Details */}
                                                            <td className='max-w-[280px] p-4'>
                                                                <div
                                                                    className='text-foreground truncate text-xs font-semibold'
                                                                    title={
                                                                        articleTitle ||
                                                                        item.url
                                                                    }
                                                                >
                                                                    {articleTitle ||
                                                                        (item.status ===
                                                                        'PENDING'
                                                                            ? 'Fetching Details...'
                                                                            : item.url)}
                                                                </div>
                                                                <div className='text-muted-foreground mt-1 flex items-center gap-1.5 truncate text-[10px]'>
                                                                    <a
                                                                        href={
                                                                            item.url
                                                                        }
                                                                        target='_blank'
                                                                        rel='noopener noreferrer'
                                                                        className='hover:text-primary flex items-center gap-0.5 transition-colors'
                                                                    >
                                                                        <span className='max-w-[150px] truncate'>
                                                                            {
                                                                                item.url
                                                                            }
                                                                        </span>
                                                                        <ExternalLink className='h-2.5 w-2.5 shrink-0' />
                                                                    </a>
                                                                    {item.status ===
                                                                        'COMPLETED' &&
                                                                        sentimentLabel && (
                                                                            <>
                                                                                <span>
                                                                                    •
                                                                                </span>
                                                                                <span
                                                                                    className={`rounded-full px-2 py-0.5 text-[9px] font-medium capitalize ${getSentimentStyles(sentimentLabel)}`}
                                                                                >
                                                                                    {
                                                                                        sentimentLabel
                                                                                    }{' '}
                                                                                    (
                                                                                    {sentimentScore?.toFixed(
                                                                                        2,
                                                                                    )}
                                                                                    )
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    {item.source && (
                                                                        <>
                                                                            <span>
                                                                                •
                                                                            </span>
                                                                            <span className='text-primary bg-primary/10 border-primary/20 shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide'>
                                                                                {
                                                                                    item.source
                                                                                }
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Status Badge */}
                                                            <td className='p-4'>
                                                                {item.status ===
                                                                    'PENDING' && (
                                                                    <span className='inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-500'>
                                                                        <Loader2 className='h-3 w-3 animate-spin' />
                                                                        Analyzing
                                                                    </span>
                                                                )}
                                                                {item.status ===
                                                                    'COMPLETED' && (
                                                                    <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-500'>
                                                                        <CheckCircle2 className='h-3 w-3' />
                                                                        Completed
                                                                    </span>
                                                                )}
                                                                {item.status ===
                                                                    'FAILED' && (
                                                                    <span
                                                                        className='group relative inline-flex cursor-help items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-500'
                                                                        title={
                                                                            errorMessage ||
                                                                            'Unknown extraction error'
                                                                        }
                                                                    >
                                                                        <XCircle className='h-3 w-3' />
                                                                        Failed
                                                                        {/* Floating tooltip */}
                                                                        <div className='bg-popover text-popover-foreground border-border absolute bottom-full left-1/2 z-50 mb-2 hidden w-48 -translate-x-1/2 transform rounded border p-2 text-center text-[10px] whitespace-normal shadow-lg group-hover:block'>
                                                                            {errorMessage ||
                                                                                'Unknown extraction error'}
                                                                        </div>
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Submitted Date */}
                                                            <td className='text-muted-foreground p-4 text-xs'>
                                                                {formatHistoryDate(
                                                                    createdAt,
                                                                )}
                                                            </td>

                                                            {/* Deep Dive Action */}
                                                            <td className='p-4 text-right'>
                                                                {item.status ===
                                                                'COMPLETED' ? (
                                                                    <Link
                                                                        href={`/articles/deep-dive/${item.article_uuid}`}
                                                                        className='text-primary inline-flex items-center text-xs font-bold hover:underline'
                                                                    >
                                                                        Deep
                                                                        Dive
                                                                    </Link>
                                                                ) : (
                                                                    <span className='text-muted-foreground/45 text-xs select-none'>
                                                                        Unavailable
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination controls */}
                                    {totalPages > 1 && (
                                        <div className='border-border/50 mt-2 flex items-center justify-between border-t pt-4'>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setCurrentPage((prev) =>
                                                        Math.max(0, prev - 1),
                                                    )
                                                }
                                                disabled={currentPage === 0}
                                                className='bg-muted border-border text-foreground hover:bg-accent rounded border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'
                                            >
                                                Previous
                                            </button>
                                            <span className='text-muted-foreground text-xs'>
                                                Page {currentPage + 1} of{' '}
                                                {totalPages}
                                            </span>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setCurrentPage((prev) =>
                                                        Math.min(
                                                            totalPages - 1,
                                                            prev + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    totalPages - 1
                                                }
                                                className='bg-muted border-border text-foreground hover:bg-accent rounded border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Optional Info Footer */}
                        {history.some((item) => item.status === 'PENDING') && (
                            <div className='bg-primary/5 border-primary/10 text-primary/80 mt-4 flex items-center gap-2 rounded-lg border p-3 text-xs'>
                                <AlertCircle className='h-4 w-4 shrink-0 animate-pulse' />
                                <span>
                                    Status checks are running automatically. New
                                    data will appear in real-time.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
