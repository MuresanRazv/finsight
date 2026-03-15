'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Search, Bot } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { searchSchema, SearchInput } from '@/lib/validations/search'
import { semanticSearch } from '@/app/actions/search'
import { chatQuery } from '@/app/actions/chat'
import { SearchResult } from '@/components/search/SearchResult'
import { ChatResult } from '@/components/search/ChatResult'
import { SearchResultItem } from '@/lib/types/search'
import { ChatResponse } from '@/lib/types/chat'

type SearchMode = 'search' | 'chat'

export default function SearchPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [searchResult, setSearchResult] = useState<SearchResultItem[] | null>(
        null,
    )
    const [chatResult, setChatResult] = useState<ChatResponse | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    const [mode, setMode] = useState<SearchMode>('search')

    const form = useForm<SearchInput>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            query: '',
        },
    })

    const handleModeChange = (isChatMode: boolean) => {
        setMode(isChatMode ? 'chat' : 'search')
        form.reset()
        setError(null)
        setSearchResult(null)
        setChatResult(null)
        setHasSearched(false)
    }

    function onSubmit(data: SearchInput) {
        setError(null)
        setSearchResult(null)
        setChatResult(null)
        setHasSearched(true)

        startTransition(async () => {
            if (mode === 'search') {
                const response = await semanticSearch(data)
                if (response.success) {
                    setSearchResult(response.data ?? [])
                } else {
                    setError(response.message || 'Something went wrong')
                }
            } else {
                const response = await chatQuery(data)
                if (response.success) {
                    setChatResult(response.data ?? null)
                } else {
                    setError(response.message || 'Something went wrong')
                }
            }
        })
    }

    const isChatMode = mode === 'chat'
    const noResults =
        hasSearched &&
        !isPending &&
        !error &&
        (isChatMode ? !chatResult : searchResult?.length === 0)

    return (
        <div className='space-y-6'>
            <PageHeader
                title={isChatMode ? 'AI Financial Chat' : 'Semantic Search'}
                description={
                    isChatMode
                        ? 'Chat with an AI assistant for financial analysis and insights.'
                        : 'Ask complex financial questions and get AI-powered insights from news articles.'
                }
            />
            <div className='space-y-8'>
                <div className='flex items-center space-x-2'>
                    <Label htmlFor='mode-switch' className='text-slate-300'>
                        Semantic Search
                    </Label>
                    <Switch
                        id='mode-switch'
                        checked={isChatMode}
                        onCheckedChange={handleModeChange}
                        aria-label='Toggle between Search and AI Chat mode'
                    />
                    <Label htmlFor='mode-switch' className='text-slate-300'>
                        AI Chat
                    </Label>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className='flex w-full max-w-2xl items-start space-x-2'
                    >
                        <FormField
                            control={form.control}
                            name='query'
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel className='sr-only'>
                                        Query
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            className={'text-white'}
                                            placeholder={
                                                isChatMode
                                                    ? "e.g., 'Summarize the latest earnings report for AAPL.'"
                                                    : "e.g., 'What were the main drivers of NVIDIA's stock price in the last quarter?'"
                                            }
                                            {...field}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type='submit'
                            disabled={isPending}
                            className='min-w-[110px]'
                        >
                            {isPending ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                            ) : isChatMode ? (
                                <Bot className='h-4 w-4' />
                            ) : (
                                <Search className='h-4 w-4' />
                            )}
                            <span className='ml-2 hidden sm:inline'>
                                {isChatMode ? 'Ask AI' : 'Search'}
                            </span>
                        </Button>
                    </form>
                </Form>

                {error && (
                    <Card className='border-destructive bg-destructive/10'>
                        <CardHeader>
                            <CardTitle className='text-destructive'>
                                Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-destructive text-sm font-medium'>
                                {error}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {noResults && (
                    <div className='py-10 text-center text-slate-400'>
                        No results found.
                    </div>
                )}

                {mode === 'search' &&
                    searchResult &&
                    searchResult.length > 0 && (
                        <div className='space-y-4'>
                            <h2 className='text-xl font-semibold text-white'>
                                Search Results
                            </h2>
                            <SearchResult results={searchResult} />
                        </div>
                    )}

                {mode === 'chat' && chatResult && (
                    <ChatResult result={chatResult} />
                )}
            </div>
        </div>
    )
}
