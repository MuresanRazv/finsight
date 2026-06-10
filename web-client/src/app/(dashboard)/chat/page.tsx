'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Loader2,
    Bot,
    Briefcase,
    Building,
    AlertTriangle,
    X,
} from 'lucide-react'

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
import { chatQuery as performChatQuery } from '@/app/actions/chat'
import { ChatResult } from '@/components/search/ChatResult'
import { ChatLoading } from '@/components/search/ChatLoading'
import { useSearchState } from '@/components/providers/SearchStateProvider'

export default function ChatPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Use global state
    const {
        chatQuery,
        setChatQuery,
        chatResult,
        setChatResult,
        chatHasSearched,
        setChatHasSearched,
        resetChatState,
    } = useSearchState()

    const form = useForm<SearchInput>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            query: chatQuery, // Initialize with global state
        },
    })

    // Sync form when global state changes (e.g. going back to the tab)
    useEffect(() => {
        form.setValue('query', chatQuery)
    }, [chatQuery, form])

    const executeSearch = (query: string) => {
        form.setValue('query', query)
        onSubmit({ query })
    }

    const handleClear = () => {
        resetChatState()
        form.setValue('query', '')
        setError(null)
    }

    function onSubmit(data: SearchInput) {
        setError(null)
        setChatHasSearched(true)
        setChatQuery(data.query)

        startTransition(async () => {
            const response = await performChatQuery(data)
            if (response.success) {
                setChatResult(response.data ?? null)
            } else {
                setError(response.message || 'Something went wrong')
            }
        })
    }

    const noResults = chatHasSearched && !isPending && !error && !chatResult

    const suggestedPrompts = [
        { label: 'Summarize AAPL earnings', icon: Briefcase },
        { label: 'Analyze NVIDIA supply chain', icon: Building },
        { label: 'Explain recent tech stock drop', icon: AlertTriangle },
    ]

    return (
        <div className='dark mx-auto flex w-full max-w-4xl flex-col items-center'>
            {/* Empty State / Welcome Screen */}
            {!chatHasSearched && (
                <div className='mt-8 mb-12 flex w-full flex-col items-center'>
                    <div className='mb-12 max-w-2xl text-center'>
                        <h2 className='mb-4 text-3xl font-semibold text-white'>
                            Start your analysis
                        </h2>
                        <p className='leading-relaxed text-[#94a3b8]'>
                            Chat with FinSight's AI to get deep financial
                            analysis, summaries of complex market events, and
                            actionable insights derived from real-time news
                            sources.
                        </p>
                    </div>

                    {/* Suggested Searches Grid */}
                    <div className='grid w-full grid-cols-1 gap-4 md:grid-cols-3'>
                        {suggestedPrompts.map((item, index) => {
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
                data-tour='chat-input'
                className={`relative mb-12 w-full ${chatHasSearched ? 'mt-0' : ''}`}
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
                                                <Bot className='h-5 w-5 text-[#94a3b8]' />
                                            </div>
                                            <Input
                                                className='w-full rounded-xl border-[#334155] bg-[#243046] py-7 pr-32 pl-12 text-base text-white shadow-sm placeholder:text-[#94a3b8] focus-visible:ring-[#3b82f6]'
                                                placeholder='Ask AI for financial analysis...'
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
                            {chatHasSearched && (
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
                                className='rounded-lg border-0 bg-[#3b82f6] px-6 py-5 font-medium text-white transition-colors hover:bg-[#2563eb]'
                            >
                                {isPending ? (
                                    <Loader2 className='h-5 w-5 animate-spin' />
                                ) : (
                                    <div className='flex items-center gap-2'>
                                        Ask AI
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

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

                {isPending ? (
                    <div className='pb-12'>
                        <ChatLoading />
                    </div>
                ) : (
                    <>
                        {noResults && (
                            <div className='py-10 text-center text-[#94a3b8]'>
                                No AI response generated. Try rephrasing your
                                prompt.
                            </div>
                        )}

                        {chatResult && (
                            <div className='pb-12'>
                                <ChatResult result={chatResult} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
