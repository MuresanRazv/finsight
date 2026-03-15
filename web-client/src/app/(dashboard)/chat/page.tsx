'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Bot, Briefcase, Building, AlertTriangle, X } from 'lucide-react'

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
        resetChatState
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
        <div className='flex flex-col items-center max-w-4xl mx-auto w-full'>
            {/* Empty State / Welcome Screen */}
            {!chatHasSearched && (
                <div className='flex flex-col items-center w-full mb-12 mt-8'>
                    <div className='text-center max-w-2xl mb-12'>
                        <h2 className='text-3xl font-semibold text-white mb-4'>Start your analysis</h2>
                        <p className='text-[#94a3b8] leading-relaxed'>
                            Chat with FinSight's AI to get deep financial analysis, summaries of complex market events, and actionable insights derived from real-time news sources.
                        </p>
                    </div>

                    {/* Suggested Searches Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 w-full'>
                        {suggestedPrompts.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={index}
                                    onClick={() => executeSearch(item.label)}
                                    className='flex items-center px-6 py-4 bg-[#243046] hover:bg-[#293b5a] border border-[#334155] rounded-xl transition-all text-left group'
                                >
                                    <Icon className='w-5 h-5 text-[#94a3b8] group-hover:text-white mr-3 shrink-0' />
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
            <div className={`w-full relative mb-12 ${chatHasSearched ? 'mt-0' : ''}`}>
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
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Bot className="w-5 h-5 text-[#94a3b8]" />
                                            </div>
                                            <Input
                                                className='w-full pl-12 pr-32 py-7 bg-[#243046] border-[#334155] rounded-xl text-white placeholder:text-[#94a3b8] focus-visible:ring-[#3b82f6] shadow-sm text-base'
                                                placeholder="Ask AI for financial analysis..."
                                                {...field}
                                                disabled={isPending}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-2">
                            {chatHasSearched && (
                                <Button
                                    type='button'
                                    variant="ghost"
                                    onClick={handleClear}
                                    className='px-3 py-5 text-[#94a3b8] hover:text-white hover:bg-transparent'
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            )}
                            <Button
                                type='submit'
                                disabled={isPending}
                                className='px-6 py-5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-medium transition-colors border-0'
                            >
                                {isPending ? (
                                    <Loader2 className='h-5 w-5 animate-spin' />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Ask AI
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            {/* Results Area */}
            <div className="w-full">
                {error && (
                    <Card className='border-red-500/50 bg-red-500/10 mb-8'>
                        <CardHeader>
                            <CardTitle className='text-red-400'>
                                Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className='text-red-300 text-sm font-medium'>
                                {error}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {noResults && (
                    <div className='py-10 text-center text-[#94a3b8]'>
                        No AI response generated. Try rephrasing your prompt.
                    </div>
                )}

                {chatResult && (
                    <div className='pb-12'>
                         <ChatResult result={chatResult} />
                    </div>
                )}
            </div>
        </div>
    )
}
