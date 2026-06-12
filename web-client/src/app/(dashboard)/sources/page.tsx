'use client'

import React, { useState, useEffect } from 'react'
import {
    Rss,
    Plus,
    ChevronDown,
    ChevronUp,
    Trash2,
    Edit,
    Play,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ExternalLink,
    Loader2,
    Save,
    X,
    Settings,
} from 'lucide-react'
import {
    getRssSources,
    createRssSource,
    updateRssSource,
    deleteRssSource,
    testRssSource,
    RssSourceItem,
    PreviewArticle,
} from '@/app/actions/rss'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

export default function RssSourcesPage() {
    const [sources, setSources] = useState<RssSourceItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)

    // Editor Form State
    const [formId, setFormId] = useState<number | null>(null)
    const [formName, setFormName] = useState('')
    const [formUrl, setFormUrl] = useState('')
    const [formIsEnabled, setFormIsEnabled] = useState(true)

    // Selector Overrides State
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [itemSelector, setItemSelector] = useState('item')
    const [titleSelector, setTitleSelector] = useState('title')
    const [linkSelector, setLinkSelector] = useState('link')
    const [linkAttribute, setLinkAttribute] = useState('')
    const [descriptionSelector, setDescriptionSelector] =
        useState('description')
    const [pubDateSelector, setPubDateSelector] = useState('pubDate')
    const [pubDateFormat, setPubDateFormat] = useState('')

    // Testing Feed State
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{
        success: boolean
        message: string
        articles: PreviewArticle[]
    } | null>(null)

    // Fetch RSS sources on mount
    useEffect(() => {
        fetchSources()
    }, [])

    const fetchSources = async () => {
        setIsLoading(true)
        try {
            const data = await getRssSources()
            if (data) {
                setSources(data)
            } else {
                toast.error('Failed to load RSS feed configurations.')
            }
        } catch (error) {
            console.error('Error fetching RSS sources:', error)
            toast.error('An error occurred while loading configurations.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenNew = () => {
        setFormId(null)
        setFormName('')
        setFormUrl('')
        setFormIsEnabled(true)
        setItemSelector('item')
        setTitleSelector('title')
        setLinkSelector('link')
        setLinkAttribute('')
        setDescriptionSelector('description')
        setPubDateSelector('pubDate')
        setPubDateFormat('')
        setShowAdvanced(false)
        setTestResult(null)
        setIsEditing(true)
    }

    const handleOpenEdit = (source: RssSourceItem) => {
        setFormId(source.id)
        setFormName(source.name)
        setFormUrl(source.url)
        setFormIsEnabled(source.is_enabled)
        setItemSelector(source.item_selector || 'item')
        setTitleSelector(source.title_selector || 'title')
        setLinkSelector(source.link_selector || 'link')
        setLinkAttribute(source.link_attribute || '')
        setDescriptionSelector(source.description_selector || 'description')
        setPubDateSelector(source.pub_date_selector || 'pubDate')
        setPubDateFormat(source.pub_date_format || '')
        setShowAdvanced(true)
        setTestResult(null)
        setIsEditing(true)
    }

    const handleToggleActive = async (source: RssSourceItem) => {
        const newState = !source.is_enabled

        // Optimistic update
        setSources((prev) =>
            prev.map((s) =>
                s.id === source.id ? { ...s, is_enabled: newState } : s,
            ),
        )

        try {
            const result = await updateRssSource(source.id, {
                is_enabled: newState,
            })
            if (result) {
                toast.success(
                    `Feed "${source.name}" is now ${newState ? 'enabled' : 'disabled'}.`,
                )
            } else {
                throw new Error('Update failed')
            }
        } catch {
            // Revert state
            setSources((prev) =>
                prev.map((s) =>
                    s.id === source.id ? { ...s, is_enabled: !newState } : s,
                ),
            )
            toast.error(`Failed to update status for "${source.name}".`)
        }
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete the feed "${name}"?`)) {
            return
        }

        try {
            const res = await deleteRssSource(id)
            if (res.success) {
                setSources((prev) => prev.filter((s) => s.id !== id))
                toast.success(`Feed "${name}" deleted.`)
            }
        } catch {
            toast.error(`Failed to delete feed "${name}".`)
        }
    }

    const handleTestConfig = async () => {
        if (!formUrl.trim()) {
            toast.error('Please enter a valid feed URL to test.')
            return
        }

        setIsTesting(true)
        setTestResult(null)

        const payload: Partial<RssSourceItem> = {
            url: formUrl.trim(),
            item_selector: itemSelector.trim() || 'item',
            title_selector: titleSelector.trim() || 'title',
            link_selector: linkSelector.trim() || 'link',
            link_attribute: linkAttribute.trim() || null,
            description_selector: descriptionSelector.trim() || 'description',
            pub_date_selector: pubDateSelector.trim() || 'pubDate',
            pub_date_format: pubDateFormat.trim() || null,
        }

        try {
            const res = await testRssSource(payload)
            setTestResult(res)
            if (res.success) {
                toast.success('Feed test parsed successfully!')
            } else {
                toast.error('Feed parse test failed.')
            }
        } catch {
            setTestResult({
                success: false,
                message:
                    'Failed to test source due to network or connection errors.',
                articles: [],
            })
        } finally {
            setIsTesting(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formName.trim() || !formUrl.trim()) {
            toast.error('Feed Name and URL are required.')
            return
        }

        const payload: Partial<RssSourceItem> = {
            name: formName.trim(),
            url: formUrl.trim(),
            is_enabled: formIsEnabled,
            item_selector: itemSelector.trim() || 'item',
            title_selector: titleSelector.trim() || 'title',
            link_selector: linkSelector.trim() || 'link',
            link_attribute: linkAttribute.trim() || null,
            description_selector: descriptionSelector.trim() || 'description',
            pub_date_selector: pubDateSelector.trim() || 'pubDate',
            pub_date_format: pubDateFormat.trim() || null,
        }

        try {
            if (formId !== null) {
                // Edit mode
                const updated = await updateRssSource(formId, payload)
                if (updated) {
                    setSources((prev) =>
                        prev.map((s) => (s.id === formId ? updated : s)),
                    )
                    toast.success(
                        `Feed "${updated.name}" updated successfully.`,
                    )
                }
            } else {
                // New mode
                const created = await createRssSource(payload)
                if (created) {
                    setSources((prev) => [created, ...prev])
                    toast.success(
                        `Feed "${created.name}" created successfully.`,
                    )
                }
            }
            setIsEditing(false)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save feed configuration.'
            toast.error(errorMessage)
        }
    }

    return (
        <div data-tour='sources-content' className='dark mx-auto min-h-screen max-w-6xl p-6 text-slate-100'>
            {/* Header section */}
            <div className='border-border/50 mb-8 flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-center'>
                <div>
                    <h1 className='flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white'>
                        <Rss className='text-primary h-6 w-6' />
                        RSS Feeds Ingestion
                    </h1>
                    <p className='mt-1 text-sm text-slate-400'>
                        Configure custom scraper targets, adjust extraction
                        rules, and test feeds in a sandboxed preview
                        environment.
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={handleOpenNew}
                        className='bg-primary text-primary-foreground shadow-primary/10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all hover:opacity-90 active:scale-95'
                        id='new-feed-btn'
                    >
                        <Plus className='h-4 w-4' />
                        New Feed Source
                    </button>
                )}
            </div>

            {/* List / Grid state */}
            {!isEditing && (
                <>
                    {isLoading ? (
                        <div className='text-muted-foreground flex flex-col items-center justify-center py-20'>
                            <Loader2 className='text-primary mb-2 h-8 w-8 animate-spin' />
                            Loading RSS feed sources...
                        </div>
                    ) : sources.length === 0 ? (
                        <div className='border-border text-muted-foreground bg-card/20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20'>
                            <Rss className='mb-3 h-12 w-12 opacity-30' />
                            <p className='text-sm font-semibold'>
                                No configured RSS feeds
                            </p>
                            <p className='mt-1 mb-4 text-xs'>
                                Add your first custom RSS feed to index
                                automated market insights.
                            </p>
                            <button
                                onClick={handleOpenNew}
                                className='border-primary text-primary hover:bg-primary/10 inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors'
                            >
                                <Plus className='h-3.5 w-3.5' />
                                Add Feed
                            </button>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                            {sources.map((source) => (
                                <div
                                    key={source.id}
                                    className='border-border bg-card/45 group relative flex flex-col justify-between rounded-xl border p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-slate-500/50'
                                >
                                    <div>
                                        {/* Name and Toggle */}
                                        <div className='mb-2 flex items-start justify-between gap-4'>
                                            <h3 className='text-foreground max-w-[70%] truncate text-base font-bold tracking-tight'>
                                                {source.name}
                                            </h3>
                                            <div className='flex shrink-0 items-center gap-2'>
                                                <span
                                                    className={`text-[10px] font-bold tracking-wider uppercase ${source.is_enabled ? 'text-emerald-500' : 'text-slate-500'}`}
                                                >
                                                    {source.is_enabled
                                                        ? 'Active'
                                                        : 'Paused'}
                                                </span>
                                                <Switch
                                                    checked={source.is_enabled}
                                                    onCheckedChange={() =>
                                                        handleToggleActive(
                                                            source,
                                                        )
                                                    }
                                                    className='cursor-pointer'
                                                />
                                            </div>
                                        </div>

                                        {/* URL */}
                                        <a
                                            href={source.url}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-muted-foreground hover:text-primary mb-4 flex max-w-full items-center gap-1 truncate text-xs transition-colors'
                                        >
                                            <span className='truncate'>
                                                {source.url}
                                            </span>
                                            <ExternalLink className='h-3 w-3 shrink-0' />
                                        </a>

                                        {/* Config Details */}
                                        <div className='mb-4 space-y-1.5 rounded-lg border border-slate-800/40 bg-[#1e293b]/40 p-3 font-mono text-xs text-slate-300'>
                                            <div className='flex justify-between border-b border-slate-800/30 pb-1'>
                                                <span className='text-slate-400'>
                                                    item:
                                                </span>
                                                <span className='font-semibold text-slate-200'>
                                                    {source.item_selector ||
                                                        'item'}
                                                </span>
                                            </div>
                                            <div className='flex justify-between border-b border-slate-800/30 pb-1'>
                                                <span className='text-slate-400'>
                                                    title:
                                                </span>
                                                <span className='font-semibold text-slate-200'>
                                                    {source.title_selector ||
                                                        'title'}
                                                </span>
                                            </div>
                                            <div className='flex justify-between border-b border-slate-800/30 pb-1'>
                                                <span className='text-slate-400'>
                                                    link:
                                                </span>
                                                <span className='font-semibold text-slate-200'>
                                                    {source.link_selector ||
                                                        'link'}
                                                    {source.link_attribute
                                                        ? `[@${source.link_attribute}]`
                                                        : ''}
                                                </span>
                                            </div>
                                            <div className='flex justify-between border-b border-slate-800/30 pb-1'>
                                                <span className='text-slate-400'>
                                                    description:
                                                </span>
                                                <span className='font-semibold text-slate-200'>
                                                    {source.description_selector ||
                                                        'description'}
                                                </span>
                                            </div>
                                            <div className='flex justify-between'>
                                                <span className='text-slate-400'>
                                                    pubDate:
                                                </span>
                                                <span className='font-semibold text-slate-200'>
                                                    {source.pub_date_selector ||
                                                        'pubDate'}
                                                    {source.pub_date_format
                                                        ? ` (${source.pub_date_format})`
                                                        : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className='border-border/40 mt-auto flex items-center justify-between border-t pt-4'>
                                        <span className='text-muted-foreground text-[10px]'>
                                            Added:{' '}
                                            {new Date(
                                                source.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                        <div className='flex items-center gap-2'>
                                            {source.is_default ? (
                                                <span className='inline-flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none'>
                                                    System Default
                                                </span>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenEdit(
                                                                source,
                                                            )
                                                        }
                                                        className='inline-flex cursor-pointer items-center gap-1 rounded bg-[#334155]/60 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#475569]/80'
                                                    >
                                                        <Edit className='h-3 w-3' />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                source.id,
                                                                source.name,
                                                            )
                                                        }
                                                        className='inline-flex cursor-pointer items-center gap-1 rounded border border-red-500/20 bg-red-950/40 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/60'
                                                    >
                                                        <Trash2 className='h-3 w-3' />
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Editing / Creating panel */}
            {isEditing && (
                <div className='grid grid-cols-1 items-start gap-8 lg:grid-cols-12'>
                    {/* Config Form Panel */}
                    <div className='border-border bg-card rounded-xl border p-6 shadow-md lg:col-span-7'>
                        <div className='border-border/50 mb-6 flex items-center justify-between border-b pb-4'>
                            <h2 className='flex items-center gap-2 text-lg font-bold'>
                                <Settings className='text-primary h-5 w-5 animate-pulse' />
                                {formId
                                    ? `Edit Feed: ${formName}`
                                    : 'Add New RSS Source'}
                            </h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className='text-slate-400 transition-colors hover:text-white'
                            >
                                <X className='h-5 w-5' />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className='space-y-5'>
                            {/* Feed Name */}
                            <div className='space-y-1.5'>
                                <label
                                    className='text-xs font-bold tracking-wider text-slate-400 uppercase'
                                    htmlFor='feed-name'
                                >
                                    Feed Name
                                </label>
                                <input
                                    id='feed-name'
                                    type='text'
                                    value={formName}
                                    onChange={(e) =>
                                        setFormName(e.target.value)
                                    }
                                    placeholder='e.g. CNBC Market News'
                                    className='focus:border-primary focus:ring-primary w-full rounded-lg border border-[#334155] bg-[#1e293b] px-3.5 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-1'
                                    required
                                />
                            </div>

                            {/* Feed URL */}
                            <div className='space-y-1.5'>
                                <label
                                    className='text-xs font-bold tracking-wider text-slate-400 uppercase'
                                    htmlFor='feed-url'
                                >
                                    Feed XML/RSS URL
                                </label>
                                <input
                                    id='feed-url'
                                    type='url'
                                    value={formUrl}
                                    onChange={(e) => setFormUrl(e.target.value)}
                                    placeholder='e.g. https://www.cnbc.com/id/10000664/device/rss/rss.html'
                                    className='focus:border-primary focus:ring-primary w-full rounded-lg border border-[#334155] bg-[#1e293b] px-3.5 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-1'
                                    required
                                />
                            </div>

                            {/* Active Toggle in Form */}
                            <div className='border-border/40 flex items-center justify-between rounded-xl border bg-[#1e293b]/35 p-4'>
                                <div className='space-y-0.5'>
                                    <span className='text-sm font-semibold text-white'>
                                        Enable ingestion immediately
                                    </span>
                                    <p className='text-xs text-slate-400'>
                                        If active, the ingestion engine will
                                        fetch articles periodically.
                                    </p>
                                </div>
                                <Switch
                                    checked={formIsEnabled}
                                    onCheckedChange={setFormIsEnabled}
                                    className='cursor-pointer'
                                />
                            </div>

                            {/* Advanced Selector Overrides Toggler */}
                            <div className='border-border/50 overflow-hidden rounded-xl border'>
                                <button
                                    type='button'
                                    onClick={() =>
                                        setShowAdvanced(!showAdvanced)
                                    }
                                    className='flex w-full cursor-pointer items-center justify-between bg-[#1e293b]/55 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#293b5a]/45'
                                >
                                    <span className='flex items-center gap-1.5'>
                                        <Settings className='text-primary h-4 w-4' />
                                        Advanced Scraping Selector Overrides
                                    </span>
                                    {showAdvanced ? (
                                        <ChevronUp className='h-4 w-4' />
                                    ) : (
                                        <ChevronDown className='h-4 w-4' />
                                    )}
                                </button>

                                {showAdvanced && (
                                    <div className='border-border/40 space-y-4 border-t bg-[#1e2532] p-4'>
                                        <p className='text-xs text-slate-400 italic'>
                                            Defaults match standard RSS/Atom
                                            structures. Override only if the
                                            source feed uses custom tags or
                                            namespaces.
                                        </p>

                                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                                            {/* Item Tag */}
                                            <div className='space-y-1'>
                                                <label
                                                    className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                                    htmlFor='item-tag'
                                                >
                                                    Item Tag Selector
                                                </label>
                                                <input
                                                    id='item-tag'
                                                    type='text'
                                                    value={itemSelector}
                                                    onChange={(e) =>
                                                        setItemSelector(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='item'
                                                    className='focus:border-primary w-full rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 font-mono text-xs text-white outline-none'
                                                />
                                            </div>

                                            {/* Title Tag */}
                                            <div className='space-y-1'>
                                                <label
                                                    className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                                    htmlFor='title-tag'
                                                >
                                                    Title Tag Selector
                                                </label>
                                                <input
                                                    id='title-tag'
                                                    type='text'
                                                    value={titleSelector}
                                                    onChange={(e) =>
                                                        setTitleSelector(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='title'
                                                    className='focus:border-primary w-full rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 font-mono text-xs text-white outline-none'
                                                />
                                            </div>

                                            {/* Link Tag */}
                                            <div className='space-y-1'>
                                                <label
                                                    className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                                    htmlFor='link-tag'
                                                >
                                                    Link Tag Selector
                                                </label>
                                                <input
                                                    id='link-tag'
                                                    type='text'
                                                    value={linkSelector}
                                                    onChange={(e) =>
                                                        setLinkSelector(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='link'
                                                    className='focus:border-primary w-full rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 font-mono text-xs text-white outline-none'
                                                />
                                            </div>

                                            {/* Link Attribute */}
                                            <div className='space-y-1'>
                                                <label
                                                    className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                                    htmlFor='link-attr'
                                                >
                                                    Link Attribute Override
                                                </label>
                                                <input
                                                    id='link-attr'
                                                    type='text'
                                                    value={linkAttribute}
                                                    onChange={(e) =>
                                                        setLinkAttribute(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='e.g. href (optional)'
                                                    className='focus:border-primary w-full rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 font-mono text-xs text-white outline-none'
                                                />
                                            </div>

                                            {/* Description Tag */}
                                            <div className='space-y-1'>
                                                <label
                                                    className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                                    htmlFor='desc-tag'
                                                >
                                                    Description Selector
                                                </label>
                                                <input
                                                    id='desc-tag'
                                                    type='text'
                                                    value={descriptionSelector}
                                                    onChange={(e) =>
                                                        setDescriptionSelector(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='description'
                                                    className='focus:border-primary w-full rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 font-mono text-xs text-white outline-none'
                                                />
                                            </div>

                                            {/* Date Tag */}
                                            <div className='space-y-1'>
                                                <label
                                                    className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                                    htmlFor='pub-date-tag'
                                                >
                                                    Published Date Selector
                                                </label>
                                                <input
                                                    id='pub-date-tag'
                                                    type='text'
                                                    value={pubDateSelector}
                                                    onChange={(e) =>
                                                        setPubDateSelector(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='pubDate'
                                                    className='focus:border-primary w-full rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 font-mono text-xs text-white outline-none'
                                                />
                                            </div>

                                            {/* Date Format */}
                                            <div className='space-y-1 md:col-span-2'>
                                                <label
                                                    className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                                    htmlFor='date-fmt'
                                                >
                                                    strptime Date Format Pattern
                                                </label>
                                                <input
                                                    id='date-fmt'
                                                    type='text'
                                                    value={pubDateFormat}
                                                    onChange={(e) =>
                                                        setPubDateFormat(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='e.g. %a, %d %b %Y %H:%M:%S %z (leave blank for automatic parser)'
                                                    className='focus:border-primary w-full rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 font-mono text-xs text-white outline-none'
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Buttons footer */}
                            <div className='border-border/50 flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row'>
                                <button
                                    type='button'
                                    onClick={handleTestConfig}
                                    disabled={isTesting}
                                    className='inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#334155] bg-[#243046] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#293b5a] disabled:opacity-50 sm:w-auto'
                                    id='test-feed-btn'
                                >
                                    {isTesting ? (
                                        <>
                                            <Loader2 className='text-primary h-4 w-4 animate-spin' />
                                            Parsing Target Feed...
                                        </>
                                    ) : (
                                        <>
                                            <Play className='h-4 w-4 fill-emerald-500 text-emerald-500' />
                                            Test Ingestion Config
                                        </>
                                    )}
                                </button>

                                <div className='flex w-full items-center gap-3 sm:w-auto'>
                                    <button
                                        type='button'
                                        onClick={() => setIsEditing(false)}
                                        className='inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-[#334155] bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 sm:flex-initial'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='bg-primary text-primary-foreground shadow-primary/10 inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md transition-all hover:opacity-90 active:scale-95 sm:flex-initial'
                                        id='save-feed-btn'
                                    >
                                        <Save className='h-4 w-4' />
                                        Save Source
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Testing Sandbox Preview Panel */}
                    <div className='space-y-6 lg:col-span-5'>
                        <div className='border-border bg-card flex min-h-[440px] flex-col justify-between rounded-xl border p-6 shadow-md'>
                            <div>
                                <h3 className='border-border/40 mb-4 flex items-center gap-2 border-b pb-3 text-base font-bold text-white'>
                                    <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                                    Sandbox Test Preview
                                </h3>

                                {isTesting && (
                                    <div className='flex flex-col items-center justify-center py-20 text-slate-400'>
                                        <Loader2 className='text-primary mb-3 h-10 w-10 animate-spin' />
                                        <p className='text-sm font-semibold'>
                                            Contacting testing microservice...
                                        </p>
                                        <p className='mt-1 text-xs text-slate-500'>
                                            Retrieving feed payload and
                                            executing parsing strategy.
                                        </p>
                                    </div>
                                )}

                                {!isTesting && !testResult && (
                                    <div className='border-border/60 flex flex-col items-center justify-center rounded-xl border border-dashed bg-slate-900/10 py-20 text-slate-400'>
                                        <Play className='text-primary mb-2 h-8 w-8 opacity-25' />
                                        <p className='px-4 text-center text-xs'>
                                            Enter a URL above and click{' '}
                                            <strong>
                                                Test Ingestion Config
                                            </strong>{' '}
                                            to see parse results prior to saving
                                            database rules.
                                        </p>
                                    </div>
                                )}

                                {!isTesting && testResult && (
                                    <div className='space-y-4'>
                                        {/* Status Header */}
                                        <div
                                            className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                                                testResult.success
                                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                    : 'border-red-500/20 bg-red-500/10 text-red-400'
                                            }`}
                                        >
                                            {testResult.success ? (
                                                <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-emerald-500' />
                                            ) : (
                                                <XCircle className='mt-0.5 h-4 w-4 shrink-0 text-red-400' />
                                            )}
                                            <div>
                                                <div className='font-bold'>
                                                    {testResult.success
                                                        ? 'Success'
                                                        : 'Parsing Failed'}
                                                </div>
                                                <p className='mt-0.5 leading-relaxed'>
                                                    {testResult.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Article List Previews */}
                                        {testResult.success &&
                                            testResult.articles.length > 0 && (
                                                <div className='space-y-3'>
                                                    <h4 className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                                                        First{' '}
                                                        {
                                                            testResult.articles
                                                                .length
                                                        }{' '}
                                                        Extracted Items:
                                                    </h4>

                                                    {testResult.articles.map(
                                                        (art, idx) => (
                                                            <div
                                                                key={idx}
                                                                className='border-border space-y-1.5 rounded-lg border bg-[#1e293b]/25 p-3.5 transition-colors hover:border-slate-700'
                                                            >
                                                                <div className='line-clamp-2 text-xs leading-snug font-semibold text-white'>
                                                                    {art.title ||
                                                                        'No Title Found'}
                                                                </div>
                                                                <a
                                                                    href={
                                                                        art.url
                                                                    }
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                    className='text-primary flex items-center gap-0.5 truncate text-[10px] hover:underline'
                                                                >
                                                                    <span className='max-w-[90%] truncate'>
                                                                        {art.url ||
                                                                            'No Link Found'}
                                                                    </span>
                                                                    <ExternalLink className='h-2 w-2' />
                                                                </a>
                                                                <p className='line-clamp-3 text-[11px] leading-normal text-slate-400'>
                                                                    {art.text ||
                                                                        'No Description Found'}
                                                                </p>
                                                                {art.published_at && (
                                                                    <div className='text-right text-[9px] text-slate-500'>
                                                                        Published:{' '}
                                                                        {new Date(
                                                                            art.published_at,
                                                                        ).toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                        {testResult.success &&
                                            testResult.articles.length ===
                                                0 && (
                                                <div className='flex flex-col items-center justify-center py-6 text-slate-400'>
                                                    <AlertCircle className='mb-1 h-6 w-6 text-amber-500' />
                                                    <p className='text-xs'>
                                                        No articles returned in
                                                        the list.
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>

                            {/* Sandbox Footer Tips */}
                            <div className='border-border/40 mt-6 border-t pt-4 text-[10px] leading-relaxed text-slate-500'>
                                <span className='mb-0.5 block font-semibold text-slate-400'>
                                    Scraping Note:
                                </span>
                                The test parser downloads the target XML
                                structure and extracts elements matching BS4 tag
                                definitions. Save rules to finalize the
                                integration pipeline.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
