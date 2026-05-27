'use client'

import { Brain } from 'lucide-react'

export function ChatLoading() {
    return (
        <div className='dark animate-in fade-in w-full space-y-8 duration-500'>
            {/* AI Analyzer Pulse Card */}
            <div className='bg-card relative overflow-hidden rounded-2xl border border-blue-500/20 p-8 py-12 shadow-[0_0_30px_rgba(56,189,248,0.05)] dark:border-blue-500/30'>
                <div className='relative mx-auto mb-6 flex h-20 w-20 items-center justify-center'>
                    {/* Ripple Rings */}
                    <div className='absolute inset-0 animate-ping rounded-full bg-blue-500/10 duration-1000' />
                    <div className='absolute inset-2 animate-pulse rounded-full bg-blue-500/20 duration-1000' />

                    {/* Central Icon container */}
                    <div className='relative flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/30 bg-blue-950/60 text-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]'>
                        <Brain className='h-8 w-8 animate-pulse text-blue-400' />
                    </div>
                </div>

                <div className='flex flex-col items-center text-center'>
                    <h3 className='animate-pulse text-lg font-semibold tracking-wide text-white'>
                        FinSight AI is analyzing market data...
                    </h3>
                    <p className='text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed'>
                        Scanning thousands of news articles, extracting
                        entities, and compiling structural sentiment scores.
                    </p>
                </div>
            </div>

            {/* Skeleton Content Shimmers */}
            <div className='space-y-6'>
                {/* Paragraph Text Placeholder */}
                <div className='border-border bg-card space-y-3 rounded-xl border p-6'>
                    <div className='h-4 w-1/4 animate-pulse rounded bg-slate-700/60' />
                    <div className='h-3 w-full animate-pulse rounded bg-slate-700/40' />
                    <div className='h-3 w-5/6 animate-pulse rounded bg-slate-700/40' />
                    <div className='h-3 w-4/5 animate-pulse rounded bg-slate-700/40' />
                </div>

                {/* Sources Analyzed Grid Placeholder */}
                <div className='space-y-4'>
                    <div className='h-5 w-40 animate-pulse rounded bg-slate-700/60' />
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className='border-border bg-card flex h-32 flex-col justify-between rounded-xl border p-4'
                            >
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <div className='h-6 w-6 animate-pulse rounded bg-slate-700/50' />
                                        <div className='h-4 w-20 animate-pulse rounded bg-slate-700/50' />
                                    </div>
                                    <div className='h-5 w-16 animate-pulse rounded bg-slate-700/50' />
                                </div>
                                <div className='flex gap-2'>
                                    <div className='h-6 w-24 animate-pulse rounded bg-slate-700/40' />
                                    <div className='h-6 w-20 animate-pulse rounded bg-slate-700/40' />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
