'use client'

import { User, LogOut } from 'lucide-react'
import { logoutUser } from '@/app/actions/auth'
import { useRouter, usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/layout/NotificationBell'

export function TopNav() {
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = async () => {
        await logoutUser()
        router.push('/login')
    }

    const isSearchOrChat = pathname === '/search' || pathname === '/chat'

    return (
        <header className='border-border bg-background/80 relative z-10 flex h-16 items-center justify-between border-b px-8 backdrop-blur-xl'>
            {/* Left side: Page Title & Subtitle (conditionally rendered) */}
            <div className='flex-1'>
                {pathname === '/search' && (
                    <div>
                        <h1 className='text-xl font-semibold text-white'>
                            Semantic Search
                        </h1>
                        <p className='mt-0.5 text-xs text-[#94a3b8]'>
                            Discover hidden connections across thousands of
                            financial sources.
                        </p>
                    </div>
                )}
                {pathname === '/chat' && (
                    <div>
                        <h1 className='text-xl font-semibold text-white'>
                            AI Financial Chat
                        </h1>
                        <p className='mt-0.5 text-xs text-[#94a3b8]'>
                            Chat with an AI assistant for financial analysis and
                            insights.
                        </p>
                    </div>
                )}
            </div>

            {/* Right side: Controls */}
            <div data-tour='top-controls' className='flex items-center space-x-6'>
                {/* Search/Chat Toggle Switch */}
                {isSearchOrChat && (
                    <div className='border-border bg-surface-container flex items-center rounded-full border p-1'>
                        <button
                            onClick={() => router.push('/search')}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                pathname === '/search'
                                    ? 'bg-accent text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Semantic
                        </button>
                        <button
                            onClick={() => router.push('/chat')}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                pathname === '/chat'
                                    ? 'bg-accent text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            AI Chat
                        </button>
                    </div>
                )}

                {/* Icons */}
                <div className='text-muted-foreground flex items-center space-x-4'>
                    <NotificationBell />
                    <button
                        onClick={() => router.push('/settings')}
                        className='hover:text-foreground transition-colors'
                    >
                        <User className='h-5 w-5' />
                    </button>
                    <button
                        onClick={handleLogout}
                        className='hover:text-foreground transition-colors'
                    >
                        <LogOut className='h-5 w-5' />
                    </button>
                </div>
            </div>
        </header>
    )
}
