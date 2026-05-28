'use server'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider'
import { SearchStateProvider } from '@/components/providers/SearchStateProvider'
import { getSession } from '@/lib/session'
import React from 'react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()

    return (
        <WebSocketProvider token={session.token}>
            <SearchStateProvider>
                <div className='flex h-screen overflow-hidden bg-background text-foreground antialiased'>
                    <Sidebar session={session.user} />
                    <div className='relative flex flex-1 flex-col overflow-hidden'>
                        <TopNav />
                        <main className='relative z-10 flex flex-1 flex-col overflow-y-auto px-8 pt-16'>
                            {children}
                            {/* Subtle Background Gradient Effect */}
                            <div
                                className='pointer-events-none absolute inset-0 -z-10'
                                style={{
                                    background:
                                        'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 60%)',
                                }}
                            ></div>
                        </main>
                    </div>
                </div>
            </SearchStateProvider>
        </WebSocketProvider>
    )
}
