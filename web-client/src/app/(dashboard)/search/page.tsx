'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Loader2,
    Search,
    TrendingUp,
    TrendingDown,
    Cpu,
    DollarSign,
    Battery,
    Zap,
    X,
    ChevronDown,
    Check,
    RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { searchSchema, SearchInput } from '@/lib/validations/search'
import { semanticSearch } from '@/app/actions/search'
import { SearchResult } from '@/components/search/SearchResult'
import { useSearchState } from '@/components/providers/SearchStateProvider'

export default function SearchPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Use global state
    const {
        searchQuery,
        setSearchQuery,
        searchResult,
        setSearchResult,
        searchHasSearched,
        setSearchHasSearched,
        resetSearchState,
    } = useSearchState()

    // Advanced Filters State
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')
    const [selectedSentiments, setSelectedSentiments] = useState<string[]>([])
    const [selectedTickers, setSelectedTickers] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<'confidence' | 'date' | 'relevance'>(
        'confidence',
    )

    const form = useForm<SearchInput>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            query: searchQuery, // Initialize with global state
        },
    })

    // Sync form when global state changes (e.g. going back to the tab)
    useEffect(() => {
        form.setValue('query', searchQuery)
    }, [searchQuery, form])

    const toggleSentiment = (sentiment: string) => {
        setSelectedSentiments((prev) =>
            prev.includes(sentiment)
                ? prev.filter((s) => s !== sentiment)
                : [...prev, sentiment],
        )
    }

    const toggleTicker = (ticker: string) => {
        setSelectedTickers((prev) =>
            prev.includes(ticker)
                ? prev.filter((t) => t !== ticker)
                : [...prev, ticker],
        )
    }

    const resetFilters = () => {
        setFromDate('')
        setToDate('')
        setSelectedSentiments([])
        setSelectedTickers([])
        setSortBy('confidence')
    }

    const executeSearch = (query: string) => {
        form.setValue('query', query)
        onSubmit({ query })
    }

    const handleClear = () => {
        resetSearchState()
        form.setValue('query', '')
        setError(null)
        resetFilters()
    }

    function onSubmit(data: SearchInput) {
        setError(null)
        setSearchHasSearched(true)
        setSearchQuery(data.query)
        resetFilters() // Reset filters on a fresh query search

        startTransition(async () => {
            const response = await semanticSearch(data)
            if (response.success) {
                setSearchResult(response.data ?? [])
            } else {
                setError(response.message || 'Something went wrong')
            }
        })
    }

    // Dynamically derive available tickers from current search results
    const availableTickers = useMemo(() => {
        if (!searchResult) return []
        const tickersSet = new Set<string>()
        searchResult.forEach((item) => {
            item.entities?.forEach((entity) => {
                if (entity.ticker) {
                    tickersSet.add(entity.ticker.toUpperCase())
                }
            })
        })
        return Array.from(tickersSet).sort()
    }, [searchResult])

    // Filter and sort results client-side
    const filteredResults = useMemo(() => {
        if (!searchResult) return []

        let results = [...searchResult]

        // 1. Date Range Filter
        if (fromDate) {
            const fromTime = new Date(fromDate).getTime()
            results = results.filter((item) => {
                if (!item.published_at) return false
                return new Date(item.published_at).getTime() >= fromTime
            })
        }
        if (toDate) {
            const toTime = new Date(toDate)
            toTime.setHours(23, 59, 59, 999)
            const toTimeMs = toTime.getTime()
            results = results.filter((item) => {
                if (!item.published_at) return false
                return new Date(item.published_at).getTime() <= toTimeMs
            })
        }

        // 2. Sentiment Filter
        if (selectedSentiments.length > 0) {
            results = results.filter((item) => {
                const label = item.sentiment_label?.toLowerCase()
                return selectedSentiments.includes(label)
            })
        }

        // 3. Tickers Filter
        if (selectedTickers.length > 0) {
            results = results.filter((item) => {
                return item.entities?.some(
                    (entity) =>
                        entity.ticker &&
                        selectedTickers.includes(entity.ticker.toUpperCase()),
                )
            })
        }

        // 4. Sort By
        results.sort((a, b) => {
            if (sortBy === 'confidence') {
                return b.sentiment_score - a.sentiment_score
            } else if (sortBy === 'date') {
                const timeA = a.published_at
                    ? new Date(a.published_at).getTime()
                    : 0
                const timeB = b.published_at
                    ? new Date(b.published_at).getTime()
                    : 0
                return timeB - timeA
            } else if (sortBy === 'relevance') {
                return b.relevance_score - a.relevance_score
            }
            return 0
        })

        return results
    }, [
        searchResult,
        fromDate,
        toDate,
        selectedSentiments,
        selectedTickers,
        sortBy,
    ])

    const noResults =
        searchHasSearched && !isPending && !error && searchResult?.length === 0

    const suggestedSearches = [
        { label: 'AI Sector Growth', icon: Cpu },
        { label: 'Fed Rate Forecasts', icon: TrendingDown },
        { label: 'Semiconductor Shortage', icon: Zap },
        { label: 'Crypto Reg News', icon: DollarSign },
        { label: 'Renewable Energy', icon: Battery },
        { label: 'EV Production', icon: TrendingUp },
    ]

    return (
        <div className='dark mx-auto flex w-full max-w-4xl flex-col items-center'>
            {/* Empty State / Welcome Screen */}
            {!searchHasSearched && (
                <div className='mt-8 mb-12 flex w-full flex-col items-center'>
                    <div className='mb-12 max-w-2xl text-center'>
                        <h2 className='mb-4 text-3xl font-semibold text-white'>
                            Start your analysis
                        </h2>
                        <p className='leading-relaxed text-[#94a3b8]'>
                            Discover hidden connections across thousands of
                            financial sources using natural language. FinSight&apos;s
                            semantic search understands context, going beyond
                            keywords to deliver precise insights and trends from
                            global markets, news, and reports.
                        </p>
                    </div>

                    {/* Suggested Searches Grid */}
                    <div data-tour='search-suggestions' className='grid w-full grid-cols-1 gap-4 md:grid-cols-3'>
                        {suggestedSearches.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={index}
                                    onClick={() => executeSearch(item.label)}
                                    className='group flex items-center rounded-xl border border-[#334155] bg-[#243046] px-6 py-4 text-left transition-all hover:bg-[#293b5a]'
                                >
                                    <Icon className='mr-3 h-5 w-5 shrink-0 text-[#94a3b8] group-hover:text-white' />
                                    <span className='font-medium text-[#f8fafc] group-hover:text-white'>
                                        {item.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Search Input Area */}
            <div
                data-tour='search-input'
                className={`relative mb-12 w-full ${searchHasSearched ? 'mt-0' : ''}`}
            >
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className='relative flex items-center'
                    >
                        <FormField
                            control={form.control}
                            name='query'
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormControl>
                                        <div className='relative'>
                                            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                                                <Search className='h-5 w-5 text-[#94a3b8]' />
                                            </div>
                                            <Input
                                                className='w-full rounded-xl border-[#334155] bg-[#243046] py-7 pr-32 pl-12 text-base text-white shadow-sm placeholder:text-[#94a3b8] focus-visible:ring-[#3b82f6]'
                                                placeholder='Search for tickers, market news, or economic trends...'
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className='absolute inset-y-0 right-0 flex items-center gap-2 pr-2'>
                            {searchHasSearched && (
                                <Button
                                    type='button'
                                    variant='ghost'
                                    onClick={handleClear}
                                    className='px-3 py-5 text-[#94a3b8] hover:bg-transparent hover:text-white'
                                >
                                    <X className='h-5 w-5' />
                                </Button>
                            )}
                            <Button
                                type='submit'
                                disabled={isPending}
                                className='rounded-lg border-0 bg-[#334155] px-6 py-5 font-medium text-white transition-colors hover:bg-[#475569]'
                            >
                                {isPending ? (
                                    <Loader2 className='h-5 w-5 animate-spin' />
                                ) : (
                                    'Search'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            {/* Advanced Filters Bar */}
            {searchHasSearched &&
                !isPending &&
                !error &&
                searchResult &&
                searchResult.length > 0 && (
                    <div className='mb-6 flex w-full flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e2532] p-4 lg:flex-row lg:items-center lg:justify-between'>
                        {/* Left: Filters Group */}
                        <div className='flex flex-wrap items-center gap-4'>
                            {/* Date Range */}
                            <div className='flex items-center gap-2'>
                                <div className='flex flex-col'>
                                    <label
                                        className='mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                        htmlFor='date-from'
                                    >
                                        From
                                    </label>
                                    <input
                                        id='date-from'
                                        type='date'
                                        value={fromDate}
                                        onChange={(e) =>
                                            setFromDate(e.target.value)
                                        }
                                        className='w-32 rounded-md border border-[#334155] bg-[#1e293b] px-2 py-1.5 text-xs text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]'
                                    />
                                </div>
                                <div className='flex flex-col'>
                                    <label
                                        className='mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase'
                                        htmlFor='date-to'
                                    >
                                        To
                                    </label>
                                    <input
                                        id='date-to'
                                        type='date'
                                        value={toDate}
                                        onChange={(e) =>
                                            setToDate(e.target.value)
                                        }
                                        className='w-32 rounded-md border border-[#334155] bg-[#1e293b] px-2 py-1.5 text-xs text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]'
                                    />
                                </div>
                            </div>

                            {/* Sentiment Chips */}
                            <div className='flex flex-col'>
                                <span className='mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                                    Sentiment
                                </span>
                                <div className='flex items-center gap-1.5'>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            toggleSentiment('positive')
                                        }
                                        className={cn(
                                            'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                            selectedSentiments.includes(
                                                'positive',
                                            )
                                                ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                : 'border-[#334155] bg-[#1e293b] text-slate-400 hover:bg-slate-800',
                                        )}
                                    >
                                        Positive
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            toggleSentiment('neutral')
                                        }
                                        className={cn(
                                            'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                            selectedSentiments.includes(
                                                'neutral',
                                            )
                                                ? 'border-slate-500/30 bg-slate-500/20 text-slate-300 hover:bg-slate-500/30'
                                                : 'border-[#334155] bg-[#1e293b] text-slate-400 hover:bg-slate-800',
                                        )}
                                    >
                                        Neutral
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            toggleSentiment('negative')
                                        }
                                        className={cn(
                                            'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                            selectedSentiments.includes(
                                                'negative',
                                            )
                                                ? 'border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                : 'border-[#334155] bg-[#1e293b] text-slate-400 hover:bg-slate-800',
                                        )}
                                    >
                                        Negative
                                    </button>
                                </div>
                            </div>

                            {/* Tickers Popover Select */}
                            <div className='flex flex-col'>
                                <span className='mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                                    Tickers
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type='button'
                                            className='flex cursor-pointer items-center gap-2 rounded-md border border-[#334155] bg-[#1e293b] px-3 py-1.5 text-xs text-white transition-colors hover:border-slate-500'
                                        >
                                            <span>
                                                {selectedTickers.length === 0
                                                    ? 'All Tickers'
                                                    : selectedTickers.length > 2
                                                      ? `${selectedTickers.slice(0, 2).join(', ')} +${selectedTickers.length - 2}`
                                                      : selectedTickers.join(
                                                            ', ',
                                                        )}
                                            </span>
                                            <ChevronDown className='h-3.5 w-3.5 text-slate-400' />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='z-50 w-48 border-[#334155] bg-[#1e2532] p-2'
                                        align='start'
                                    >
                                        {availableTickers.length === 0 ? (
                                            <div className='p-2 text-center text-xs text-slate-400'>
                                                No tickers found
                                            </div>
                                        ) : (
                                            <div className='space-y-1'>
                                                <div className='mb-1 flex items-center justify-between border-b border-[#334155] px-1 pb-1.5'>
                                                    <span className='text-[10px] font-semibold text-slate-400 uppercase'>
                                                        Filter Tickers
                                                    </span>
                                                    {selectedTickers.length >
                                                        0 && (
                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                setSelectedTickers(
                                                                    [],
                                                                )
                                                            }
                                                            className='cursor-pointer text-[10px] text-slate-400 transition-colors hover:text-white'
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                                <ScrollArea className='h-36'>
                                                    <div className='space-y-1.5 pr-2.5'>
                                                        {availableTickers.map(
                                                            (ticker) => (
                                                                <button
                                                                    key={ticker}
                                                                    type='button'
                                                                    onClick={() =>
                                                                        toggleTicker(
                                                                            ticker,
                                                                        )
                                                                    }
                                                                    className='flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white'
                                                                >
                                                                    <span>
                                                                        {ticker}
                                                                    </span>
                                                                    {selectedTickers.includes(
                                                                        ticker,
                                                                    ) && (
                                                                        <Check className='h-3.5 w-3.5 text-[#3b82f6]' />
                                                                    )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Right: Sort By & Reset */}
                        <div className='flex items-end gap-3'>
                            <div className='flex flex-col'>
                                <label className='mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                                    Sort By
                                </label>
                                <div className='relative'>
                                    <select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(e.target.value as 'confidence' | 'date' | 'relevance')
                                        }
                                        className='cursor-pointer appearance-none rounded-md border border-[#334155] bg-[#1e293b] py-1.5 pr-8 pl-3 text-xs text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]'
                                    >
                                        <option value='confidence'>
                                            Confidence Score
                                        </option>
                                        <option value='date'>Date</option>
                                        <option value='relevance'>
                                            Relevance
                                        </option>
                                    </select>
                                    <ChevronDown className='pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
                                </div>
                            </div>

                            {/* Reset Filters Button */}
                            <button
                                type='button'
                                onClick={resetFilters}
                                className={cn(
                                    'flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-md border border-[#334155] bg-[#1e293b] p-1.5 text-slate-400 transition-all hover:border-slate-500 hover:text-white',
                                    !(
                                        fromDate ||
                                        toDate ||
                                        selectedSentiments.length > 0 ||
                                        selectedTickers.length > 0 ||
                                        sortBy !== 'confidence'
                                    ) && 'pointer-events-none opacity-0',
                                )}
                                title='Reset Filters'
                            >
                                <RotateCcw className='h-3.5 w-3.5' />
                            </button>
                        </div>
                    </div>
                )}

            {/* Results Area */}
            <div className='w-full'>
                {error && (
                    <Card className='mb-8 border-red-500/50 bg-red-500/10'>
                        <CardHeader>
                            <CardTitle className='text-red-400'>
                                Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-sm font-medium text-red-300'>
                                {error}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {noResults && (
                    <div className='py-10 text-center text-[#94a3b8]'>
                        No results found for your query. Try adjusting your
                        search terms.
                    </div>
                )}

                {searchHasSearched &&
                    !isPending &&
                    !error &&
                    searchResult &&
                    searchResult.length > 0 &&
                    filteredResults.length === 0 && (
                        <div className='flex flex-col items-center gap-3 py-10 text-center text-[#94a3b8]'>
                            <span>No results match your active filters.</span>
                            <Button
                                variant='outline'
                                onClick={resetFilters}
                                className='border-[#334155] bg-[#243046] text-white hover:bg-[#293b5a]'
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}

                {searchResult &&
                    searchResult.length > 0 &&
                    filteredResults.length > 0 && (
                        <div className='w-full space-y-4 pb-12'>
                            <h2 className='mb-6 flex items-center justify-between border-b border-[#334155] pb-2 text-xl font-semibold text-white'>
                                <span>Search Results</span>
                                <span className='text-xs font-normal text-slate-400'>
                                    Showing {filteredResults.length} of{' '}
                                    {searchResult.length} articles
                                </span>
                            </h2>
                            <SearchResult results={filteredResults} />
                        </div>
                    )}
            </div>
        </div>
    )
}
