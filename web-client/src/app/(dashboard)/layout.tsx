'use server'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider'
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
            <div className='relative h-full'>
                <div className='z-80 hidden h-full bg-gray-900 md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col'>
                    <Sidebar />
                </div>
                <main className='h-full bg-slate-950 md:pl-72'>
                    <TopNav />
                    <div className='h-full overflow-y-auto p-8'>{children}</div>
                </main>
            </div>
        </WebSocketProvider>
    )
}
