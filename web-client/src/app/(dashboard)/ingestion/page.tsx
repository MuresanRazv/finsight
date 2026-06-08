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
    Globe
} from 'lucide-react'
import { ingestArticle, bulkIngestArticles, getMyIngestions, IngestionRequestItem } from '@/app/actions/ingestion'
import { toast } from 'sonner'
import Link from 'next/link'

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
    const fetchHistory = useCallback(async (showToast = false, targetPage = currentPage) => {
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
    }, [currentPage])

    // Fetch on page change or mount
    useEffect(() => {
        fetchHistory(false, currentPage)
    }, [currentPage, fetchHistory])

    // Auto-polling when there are PENDING items in history
    useEffect(() => {
        const hasPending = history.some(item => item.status === 'PENDING')
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
                    text: text.trim() || undefined
                })

                if (res.success) {
                    toast.success('Article submitted! Processing has started.', { id: toastId })
                    setUrl('')
                    setTitle('')
                    setSource('')
                    setText('')
                    setShowAdvanced(false)
                    setCurrentPage(0) // Go to first page to see the new request
                    fetchHistory(false, 0)
                } else {
                    toast.error(res.message || 'Failed to submit article.', { id: toastId })
                }
            } else {
                // Bulk Mode
                const urlsList = bulkUrls
                    .split('\n')
                    .map(u => u.trim())
                    .filter(u => u.length > 0)

                if (urlsList.length === 0) {
                    toast.error('Please enter at least one URL.', { id: toastId })
                    setIsSubmitting(false)
                    return
                }

                const res = await bulkIngestArticles(urlsList)

                if (res.success) {
                    toast.success(`Bulk processing initiated for ${urlsList.length} articles!`, { id: toastId })
                    setBulkUrls('')
                    setCurrentPage(0) // Go to first page to see the new requests
                    fetchHistory(false, 0)
                } else {
                    toast.error(res.message || 'Failed to submit bulk processing request.', { id: toastId })
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

    return (
        <div className='min-h-screen p-8 text-foreground pb-20'>
            <header className='mb-8 flex items-center justify-between'>
                <div>
                    <h1 className='text-4xl font-bold tracking-tight'>Article Ingestion</h1>
                    <p className='text-muted-foreground mt-2 text-sm max-w-2xl'>
                        Manually trigger natural language processing and sentiment analysis for articles not captured by the scraper.
                    </p>
                </div>
                <button 
                    onClick={() => fetchHistory(true, currentPage)}
                    className='flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent transition-colors'
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </header>

            <div className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
                {/* Manual Ingestion Form */}
                <div className='lg:col-span-5'>
                    <div className='rounded-xl border border-border bg-card p-6 shadow-md'>
                        <h2 className='text-lg font-bold flex items-center gap-2 mb-4'>
                            <PlusCircle className='h-5 w-5 text-primary' />
                            Process New Articles
                        </h2>

                        {/* Mode Select Tabs */}
                        <div className="flex rounded-lg bg-background p-1 mb-5 border border-border/40">
                            <button
                                type="button"
                                onClick={() => setMode('single')}
                                className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${mode === 'single' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Single Mode
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('bulk')}
                                className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${mode === 'bulk' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Bulk Mode
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-4'>
                            {mode === 'single' ? (
                                <>
                                    <div className='space-y-1.5'>
                                        <label htmlFor='url' className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
                                            Article URL
                                        </label>
                                        <input
                                            id='url'
                                            type='url'
                                            required
                                            placeholder='https://news-site.com/article-path'
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className='w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary'
                                        />
                                    </div>

                                    {/* Advanced Fields Toggle */}
                                    <button
                                        type='button'
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className='flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-2'
                                    >
                                        {showAdvanced ? (
                                            <>
                                                <ChevronUp className='h-3.5 w-3.5' /> Hide overrides (auto-scrape)
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className='h-3.5 w-3.5' /> Show overrides (manual text)
                                            </>
                                        )}
                                    </button>

                                    {showAdvanced && (
                                        <div className='space-y-4 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-1 duration-255'>
                                            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                                <div className='space-y-1.5'>
                                                    <label htmlFor='title' className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
                                                        Title Override
                                                    </label>
                                                    <input
                                                        id='title'
                                                        type='text'
                                                        placeholder='Article headline'
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        className='w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary'
                                                    />
                                                </div>
                                                <div className='space-y-1.5'>
                                                    <label htmlFor='source' className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
                                                        Source Override
                                                    </label>
                                                    <input
                                                        id='source'
                                                        type='text'
                                                        placeholder='CNBC, Bloomberg, etc.'
                                                        value={source}
                                                        onChange={(e) => setSource(e.target.value)}
                                                        className='w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary'
                                                    />
                                                </div>
                                            </div>
                                            <div className='space-y-1.5'>
                                                <label htmlFor='text' className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
                                                    Article Text Content
                                                </label>
                                                <textarea
                                                    id='text'
                                                    rows={6}
                                                    placeholder='Paste the article text here. If empty, our service will attempt to fetch and parse it automatically.'
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    className='w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none'
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Bulk Mode Form */
                                <div className='space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200'>
                                    <label htmlFor='bulkUrls' className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
                                        Paste URLs (one per line)
                                    </label>
                                    <textarea
                                        id='bulkUrls'
                                        rows={8}
                                        required
                                        placeholder="https://news-site1.com/path&#10;https://news-site2.com/path"
                                        value={bulkUrls}
                                        onChange={(e) => setBulkUrls(e.target.value)}
                                        className='w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary resize-none font-mono text-xs'
                                    />
                                    <p className='text-[10px] text-muted-foreground leading-normal mt-1'>
                                        * Note: URLs will be scraped automatically. Background analysis tasks will be staggered and delayed to ensure system stability.
                                    </p>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={isSubmitting}
                                className='w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-lg hover:opacity-90 active:scale-98 transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-6'
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
                    <div className='rounded-xl border border-border bg-card p-6 shadow-md min-h-[400px] flex flex-col justify-between'>
                        <div>
                            <h2 className='text-lg font-bold flex items-center gap-2 mb-4'>
                                <FileText className='h-5 w-5 text-primary' />
                                My Processing Requests
                            </h2>

                            {isLoadingHistory && history.length === 0 ? (
                                <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                                    <Loader2 className='h-8 w-8 animate-spin text-primary mb-2' />
                                    Loading history...
                                </div>
                            ) : history.length === 0 ? (
                                <div className='flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl text-muted-foreground'>
                                    <Globe className='h-12 w-12 opacity-30 mb-3' />
                                    <p className='text-sm font-semibold'>No manual ingestions yet</p>
                                    <p className='text-xs mt-1'>Use the form to submit your first article.</p>
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='overflow-x-auto rounded-lg border border-border/50'>
                                        <table className='w-full text-left text-sm border-collapse'>
                                            <thead>
                                                <tr className='border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                                                    <th className='p-4'>Article Details</th>
                                                    <th className='p-4'>Status</th>
                                                    <th className='p-4'>Submitted</th>
                                                    <th className='p-4 text-right'>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-border/50'>
                                                {history.map((item) => (
                                                    <tr key={item.id} className='hover:bg-accent/20 transition-colors'>
                                                        {/* Details */}
                                                        <td className='p-4 max-w-[280px]'>
                                                            <div className='font-semibold truncate text-foreground text-xs' title={item.articleTitle || item.url}>
                                                                {item.articleTitle || 'Fetching Details...'}
                                                            </div>
                                                            <div className='text-[10px] text-muted-foreground truncate flex items-center gap-1.5 mt-1'>
                                                                <a 
                                                                    href={item.url} 
                                                                    target='_blank' 
                                                                    rel='noopener noreferrer'
                                                                    className='hover:text-primary transition-colors flex items-center gap-0.5'
                                                                >
                                                                    <span className="max-w-[150px] truncate">{item.url}</span>
                                                                    <ExternalLink className='h-2.5 w-2.5 shrink-0' />
                                                                </a>
                                                                {item.status === 'COMPLETED' && item.articleSentimentLabel && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium capitalize ${getSentimentStyles(item.articleSentimentLabel)}`}>
                                                                            {item.articleSentimentLabel} ({item.articleSentimentScore?.toFixed(2)})
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        
                                                        {/* Status Badge */}
                                                        <td className='p-4'>
                                                            {item.status === 'PENDING' && (
                                                                <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 text-[10px] font-semibold'>
                                                                    <Loader2 className='h-3 w-3 animate-spin' />
                                                                    Analyzing
                                                                </span>
                                                            )}
                                                            {item.status === 'COMPLETED' && (
                                                                <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold'>
                                                                    <CheckCircle2 className='h-3 w-3' />
                                                                    Completed
                                                                </span>
                                                            )}
                                                            {item.status === 'FAILED' && (
                                                                <span 
                                                                    className='inline-flex items-center gap-1.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 text-[10px] font-semibold relative group cursor-help'
                                                                    title={item.errorMessage || 'Unknown extraction error'}
                                                                >
                                                                    <XCircle className='h-3 w-3' />
                                                                    Failed
                                                                    
                                                                    {/* Floating tooltip */}
                                                                    <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-popover text-popover-foreground text-[10px] p-2 rounded border border-border shadow-lg z-50 whitespace-normal text-center'>
                                                                        {item.errorMessage || 'Unknown extraction error'}
                                                                    </div>
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Submitted Date */}
                                                        <td className='p-4 text-muted-foreground text-xs'>
                                                            {new Date(item.createdAt).toLocaleString()}
                                                        </td>

                                                        {/* Deep Dive Action */}
                                                        <td className='p-4 text-right'>
                                                            {item.status === 'COMPLETED' ? (
                                                            <Link 
                                                                    href={{
                                                                        pathname: '/articles/deep-dive',
                                                                        query: {
                                                                            title: item.articleTitle || '',
                                                                            url: item.url,
                                                                            sentiment_label: item.articleSentimentLabel || 'neutral',
                                                                            sentiment_score: item.articleSentimentScore !== null ? String(item.articleSentimentScore) : '0',
                                                                            published_at: item.completedAt || item.createdAt,
                                                                            entities: '[]'
                                                                        }
                                                                    }}
                                                                    className='inline-flex items-center text-xs font-bold text-primary hover:underline'
                                                                >
                                                                    Deep Dive
                                                                </Link>
                                                            ) : (
                                                                <span className='text-xs text-muted-foreground/45 select-none'>
                                                                    Unavailable
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination controls */}
                                    {totalPages > 1 && (
                                        <div className='flex items-center justify-between border-t border-border/50 pt-4 mt-2'>
                                            <button
                                                type='button'
                                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                                disabled={currentPage === 0}
                                                className='px-3 py-1.5 text-xs font-semibold rounded bg-muted border border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors'
                                            >
                                                Previous
                                            </button>
                                            <span className='text-xs text-muted-foreground'>
                                                Page {currentPage + 1} of {totalPages}
                                            </span>
                                            <button
                                                type='button'
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                                disabled={currentPage === totalPages - 1}
                                                className='px-3 py-1.5 text-xs font-semibold rounded bg-muted border border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors'
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Optional Info Footer */}
                        {history.some(item => item.status === 'PENDING') && (
                            <div className='mt-4 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3 text-xs text-primary/80'>
                                <AlertCircle className='h-4 w-4 shrink-0 animate-pulse' />
                                <span>Status checks are running automatically. New data will appear in real-time.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
