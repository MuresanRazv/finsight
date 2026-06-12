'use client'

import React, { useState, useEffect } from 'react'
import {
    Activity,
    RefreshCw,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    Database,
    Cpu,
    Search,
    MessageSquare,
    Rss,
    BarChart3,
    FileText,
    LucideIcon,
} from 'lucide-react'
import {
    getObservabilityMetrics,
    clearObservabilityMetrics,
    ObservabilityMetricsResponse,
    MetricRun,
} from '@/app/actions/observability'
import { toast } from 'sonner'
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

const ACTION_LABELS: Record<string, string> = {
    rss_scrape: 'RSS Scrape',
    automatic_ingest_cron: 'Cron News Fetch',
    celery_task_process: 'Celery Pipeline',
    ml_sentiment_inference: 'FinBERT Sentiment',
    ml_entity_inference: 'NER Extraction',
    ml_embedding_inference: 'Embedding Gen',
    chromadb_insert: 'ChromaDB Upsert',
    manual_single_ingest: 'Single Ingest API',
    manual_bulk_ingest: 'Bulk Ingest API',
    semantic_search: 'Semantic Search',
    rag_chat: 'RAG LLM Chat',
}

const ACTION_ICONS: Record<string, LucideIcon> = {
    rss_scrape: Rss,
    automatic_ingest_cron: Clock,
    celery_task_process: Cpu,
    ml_sentiment_inference: Cpu,
    ml_entity_inference: Cpu,
    ml_embedding_inference: Cpu,
    chromadb_insert: Database,
    manual_single_ingest: FileText,
    manual_bulk_ingest: FileText,
    semantic_search: Search,
    rag_chat: MessageSquare,
}

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<ObservabilityMetricsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all')

    const fetchMetrics = async (showLoading = true) => {
        if (showLoading) setIsLoading(true)
        else setIsRefreshing(true)
        try {
            const data = await getObservabilityMetrics()
            if (data) {
                setMetrics(data)
            } else {
                toast.error('Failed to retrieve system metrics.')
            }
        } catch (error) {
            console.error('Error fetching observability metrics:', error)
            toast.error('Failed to contact the metrics microservice.')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchMetrics()
    }, [])

    const handleClearMetrics = async () => {
        if (!confirm('Are you sure you want to clear all gathered observability metrics? This will reset all counts to 0.')) {
            return
        }
        setIsRefreshing(true)
        try {
            const res = await clearObservabilityMetrics()
            if (res.success) {
                toast.success('System metrics have been reset successfully!')
                fetchMetrics(false)
            } else {
                toast.error(res.message || 'Failed to clear metrics.')
            }
        } catch (error) {
            console.error('Error clearing metrics:', error)
            toast.error('Failed to clear metrics.')
        } finally {
            setIsRefreshing(false)
        }
    }

    if (isLoading) {
        return (
            <div className='flex min-h-screen flex-col items-center justify-center text-slate-400'>
                <RefreshCw className='text-primary mb-3 h-10 w-10 animate-spin' />
                <p className='text-sm font-semibold'>Analyzing observability pipeline...</p>
                <p className='mt-1 text-xs text-slate-500'>Querying Redis metrics store.</p>
            </div>
        )
    }

    // Prepare chart data
    const chartActions = [
        'rss_scrape',
        'celery_task_process',
        'manual_single_ingest',
        'manual_bulk_ingest',
        'semantic_search',
        'rag_chat',
    ]

    const chartData = chartActions
        .map((key) => {
            const detail = metrics?.[key]
            return {
                name: ACTION_LABELS[key] || key,
                latency: detail && detail.total_executions > 0 ? parseFloat(detail.avg_execution_time_seconds.toFixed(3)) : 0,
                count: detail ? detail.total_executions : 0,
                color: key === 'rag_chat' ? '#8b5cf6' : key === 'celery_task_process' ? '#3b82f6' : '#10b981',
            }
        })
        .filter((item) => item.count > 0 || true) // Keep all to show baseline 0

    // Combine history for all or filter
    const combinedHistory: Array<MetricRun & { action: string }> = []
    if (metrics) {
        Object.entries(metrics).forEach(([actionKey, detail]) => {
            if (selectedActionFilter === 'all' || selectedActionFilter === actionKey) {
                const historyItems = detail.recent_history || []
                historyItems.forEach((item) => {
                    combinedHistory.push({
                        ...item,
                        action: actionKey,
                    })
                })
            }
        })
    }

    // Sort by timestamp desc
    combinedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    // Cap history
    const recentHistory = combinedHistory.slice(0, 30)

    // ML sub-operations table
    const mlActions = [
        'ml_sentiment_inference',
        'ml_entity_inference',
        'ml_embedding_inference',
        'chromadb_insert',
    ]

    // Summary Stats
    const totalExecs = metrics ? Object.values(metrics).reduce((acc, curr) => acc + curr.total_executions, 0) : 0
    const avgCeleryTime = metrics?.celery_task_process?.avg_execution_time_seconds || 0
    const avgRagTime = metrics?.rag_chat?.avg_execution_time_seconds || 0
    const totalArticles = metrics?.celery_task_process?.total_articles_processed || 0

    return (
        <div data-tour='observability-metrics' className='mx-auto min-h-screen max-w-6xl p-6 text-slate-100 dark'>
            {/* Header */}
            <div className='mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center'>
                <div>
                    <h1 className='flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white'>
                        <Activity className='text-primary h-6 w-6' />
                        System Observability & Benchmarks
                    </h1>
                    <p className='mt-1 text-sm text-slate-400'>
                        Live metrics on scraping latencies, deep NLP pipelines, vector operations, and RAG execution times.
                    </p>
                </div>
                <div className='flex items-center gap-2.5'>
                    <button
                        onClick={() => fetchMetrics(false)}
                        disabled={isRefreshing}
                        className='bg-card hover:bg-slate-800 text-slate-200 border-border/80 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-md transition-all disabled:opacity-50'
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleClearMetrics}
                        disabled={isRefreshing}
                        className='bg-red-950/40 border-red-500/20 text-red-400 hover:bg-red-900/60 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-md transition-all'
                    >
                        <Trash2 className='h-4 w-4' />
                        Clear Metrics
                    </button>
                </div>
            </div>

            {/* Quick stats cards */}
            <div className='mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                {/* Total Actions Card */}
                <div className='border-border bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-lg backdrop-blur-md'>
                    <div className='flex items-start justify-between'>
                        <div>
                            <p className='text-xs font-bold tracking-wider text-slate-400 uppercase'>Total Actions</p>
                            <h3 className='mt-2 text-3xl font-extrabold text-white'>{totalExecs}</h3>
                        </div>
                        <div className='bg-primary/10 border-primary/20 text-primary flex h-10 w-10 items-center justify-center rounded-xl border'>
                            <Activity className='h-5 w-5' />
                        </div>
                    </div>
                    <p className='mt-4 text-[10px] text-slate-400 font-semibold uppercase'>Cumulative benchmarked runs</p>
                </div>

                {/* Avg Celery Processing Card */}
                <div className='border-border bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-lg backdrop-blur-md'>
                    <div className='flex items-start justify-between'>
                        <div>
                            <p className='text-xs font-bold tracking-wider text-slate-400 uppercase'>Avg Pipeline Latency</p>
                            <h3 className='mt-2 text-3xl font-extrabold text-white'>{avgCeleryTime.toFixed(2)}s</h3>
                        </div>
                        <div className='bg-blue-500/10 border-blue-500/20 text-blue-400 flex h-10 w-10 items-center justify-center rounded-xl border'>
                            <Clock className='h-5 w-5' />
                        </div>
                    </div>
                    <p className='mt-4 text-[10px] text-slate-400 font-semibold uppercase'>Avg processing time per article</p>
                </div>

                {/* Avg RAG Prompt Card */}
                <div className='border-border bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-lg backdrop-blur-md'>
                    <div className='flex items-start justify-between'>
                        <div>
                            <p className='text-xs font-bold tracking-wider text-slate-400 uppercase'>RAG Prompt Latency</p>
                            <h3 className='mt-2 text-3xl font-extrabold text-white'>{avgRagTime.toFixed(2)}s</h3>
                        </div>
                        <div className='bg-purple-500/10 border-purple-500/20 text-purple-400 flex h-10 w-10 items-center justify-center rounded-xl border'>
                            <MessageSquare className='h-5 w-5' />
                        </div>
                    </div>
                    <p className='mt-4 text-[10px] text-slate-400 font-semibold uppercase'>Avg LLM response generation time</p>
                </div>

                {/* Total Articles Processed Card */}
                <div className='border-border bg-card/40 flex flex-col justify-between rounded-xl border p-5 shadow-lg backdrop-blur-md'>
                    <div className='flex items-start justify-between'>
                        <div>
                            <p className='text-xs font-bold tracking-wider text-slate-400 uppercase'>Total Articles</p>
                            <h3 className='mt-2 text-3xl font-extrabold text-white'>{totalArticles}</h3>
                        </div>
                        <div className='bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex h-10 w-10 items-center justify-center rounded-xl border'>
                            <FileText className='h-5 w-5' />
                        </div>
                    </div>
                    <p className='mt-4 text-[10px] text-slate-400 font-semibold uppercase'>Total articles indexed in ChromaDB</p>
                </div>
            </div>

            {/* Main Section: Chart & ML pipeline details */}
            <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12'>
                {/* Latency Comparison Chart */}
                <div className='border-border bg-card/40 flex flex-col justify-between rounded-xl border p-6 shadow-md lg:col-span-8'>
                    <div>
                        <h3 className='flex items-center gap-1.5 text-base font-bold text-white'>
                            <BarChart3 className='text-primary h-5 w-5' />
                            Average Latency per Core Action
                        </h3>
                        <p className='mt-1 text-xs text-slate-400'>
                            Execution timing comparisons across core ingest and user search/chat components.
                        </p>
                    </div>

                    <div className='mt-6 h-64 w-full'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' vertical={false} />
                                <XAxis dataKey='name' stroke='#94a3b8' fontSize={10} tickLine={false} />
                                <YAxis stroke='#94a3b8' fontSize={10} unit='s' tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#334155',
                                        color: '#f8fafc',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                />
                                <Bar dataKey='latency' name='Latency (s)'>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sub-pipelines Breakdown */}
                <div className='border-border bg-card/40 flex flex-col justify-between rounded-xl border p-6 shadow-md lg:col-span-4'>
                    <div>
                        <h3 className='flex items-center gap-1.5 text-base font-bold text-white'>
                            <Cpu className='text-primary h-5 w-5' />
                            ML & DB Operations
                        </h3>
                        <p className='mt-1 text-xs text-slate-400'>
                            Fine-grained timing for sub-steps inside the processing loop.
                        </p>
                    </div>

                    <div className='mt-4 flex-1 space-y-4'>
                        {mlActions.map((key) => {
                            const detail = metrics?.[key]
                            const avgTime = detail && detail.total_executions > 0 ? detail.avg_execution_time_seconds : 0
                            const totalTime = detail ? detail.total_time_seconds : 0
                            const count = detail ? detail.total_executions : 0

                            return (
                                <div key={key} className='border-b border-slate-800 pb-3 last:border-0 last:pb-0'>
                                    <div className='flex items-center justify-between text-sm'>
                                        <span className='font-semibold text-slate-200'>{ACTION_LABELS[key] || key}</span>
                                        <span className='font-mono font-bold text-blue-400'>{avgTime.toFixed(3)}s</span>
                                    </div>
                                    <div className='mt-1 flex items-center justify-between text-[11px] text-slate-400'>
                                        <span>Runs: {count}</span>
                                        <span>Total: {totalTime.toFixed(1)}s</span>
                                    </div>
                                    <div className='bg-slate-800 mt-2 h-1.5 w-full rounded-full overflow-hidden'>
                                        <div
                                            className='bg-primary h-full'
                                            style={{
                                                width: `${Math.min((avgTime / 2.0) * 100, 100)}%`, // Scale relative to 2 seconds max baseline
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Section: History List and Filters */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-1'>
                <div className='border-border bg-card/40 rounded-xl border p-6 shadow-md'>
                    <div className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                        <div>
                            <h3 className='flex items-center gap-1.5 text-base font-bold text-white'>
                                <Clock className='text-primary h-5 w-5' />
                                Recent Execution History
                            </h3>
                            <p className='mt-1 text-xs text-slate-400'>
                                Logging and timing details of individual runs across the platform.
                            </p>
                        </div>

                        {/* Filter control */}
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-semibold text-slate-400 uppercase'>Filter:</span>
                            <select
                                value={selectedActionFilter}
                                onChange={(e) => setSelectedActionFilter(e.target.value)}
                                className='border-border/80 bg-slate-900 focus:border-primary text-xs rounded-lg border px-3 py-1.5 outline-none text-slate-300'
                            >
                                <option value='all'>All Actions</option>
                                {Object.keys(metrics || {}).map((key) => (
                                    <option key={key} value={key}>
                                        {ACTION_LABELS[key] || key}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* History table */}
                    <div className='overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/10'>
                        <table className='w-full border-collapse text-left text-xs'>
                            <thead>
                                <tr className='bg-[#1e293b]/55 border-b border-slate-800 text-slate-300 font-bold uppercase'>
                                    <th className='p-3.5'>Action</th>
                                    <th className='p-3.5'>Timestamp (UTC)</th>
                                    <th className='p-3.5'>Duration</th>
                                    <th className='p-3.5'>Status</th>
                                    <th className='p-3.5'>Details</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-800/50'>
                                {recentHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className='text-muted-foreground p-10 text-center'>
                                            No run history found. Run semantic searches, chats, or trigger scraper tasks to populate data.
                                        </td>
                                    </tr>
                                ) : (
                                    recentHistory.map((run, index) => {
                                        const Icon = ACTION_ICONS[run.action] || Clock
                                        const label = ACTION_LABELS[run.action] || run.action
                                        const dateStr = new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                        const fullDate = new Date(run.timestamp).toLocaleDateString()

                                        return (
                                            <tr key={index} className='hover:bg-slate-800/20 text-slate-300'>
                                                <td className='p-3.5 font-semibold text-white'>
                                                    <span className='flex items-center gap-2'>
                                                        <Icon className='text-primary h-4 w-4 shrink-0' />
                                                        {label}
                                                    </span>
                                                </td>
                                                <td className='p-3.5 text-slate-400 font-mono'>
                                                    {fullDate} {dateStr}
                                                </td>
                                                <td className='p-3.5 font-mono font-semibold text-blue-400'>
                                                    {run.duration.toFixed(3)}s
                                                </td>
                                                <td className='p-3.5'>
                                                    {run.status === 'success' ? (
                                                        <span className='inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/10'>
                                                            <CheckCircle className='h-3 w-3' />
                                                            OK
                                                        </span>
                                                    ) : (
                                                        <span className='inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 font-bold text-red-400 border border-red-500/10'>
                                                            <XCircle className='h-3 w-3' />
                                                            FAIL
                                                        </span>
                                                    )}
                                                </td>
                                                <td className='p-3.5 max-w-[220px] truncate text-[11px] text-slate-400'>
                                                    {run.error ? (
                                                        <span className='text-red-400' title={run.error}>Err: {run.error}</span>
                                                    ) : run.article_count > 0 ? (
                                                        <span>Articles: {run.article_count}</span>
                                                    ) : run.metadata?.query ? (
                                                        <span className='italic'>Query: &quot;{run.metadata.query}&quot;</span>
                                                    ) : run.metadata?.url ? (
                                                        <span className='truncate'>{run.metadata.url}</span>
                                                    ) : (
                                                        <span className='opacity-40'>-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
