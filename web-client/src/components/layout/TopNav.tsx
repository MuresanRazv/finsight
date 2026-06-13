'use client'

import { User, LogOut, Menu } from 'lucide-react'
import { logoutUser } from '@/app/actions/auth'
import { useRouter, usePathname } from 'next/navigation'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useSidebar } from '@/components/providers/SidebarProvider'

export function TopNav() {
    const router = useRouter()
    const pathname = usePathname()
    const { toggle } = useSidebar()

    const handleLogout = async () => {
        await logoutUser()
        router.push('/login')
    }

    const isSearchOrChat = pathname === '/search' || pathname === '/chat'

    return (
        <header className='border-border bg-background/80 relative z-30 flex h-16 items-center justify-between border-b px-4 md:px-8 backdrop-blur-xl'>
            {/* Mobile Hamburger Button */}
            <button
                onClick={toggle}
                className='text-muted-foreground hover:text-foreground mr-3 p-1 md:hidden focus:outline-none'
                aria-label='Toggle sidebar'
            >
                <Menu className='h-6 w-6' />
            </button>

            {/* Left side: Page Title & Subtitle (conditionally rendered) */}
            <div className='flex-1'>
                {pathname === '/search' && (
                    <div>
                        <h1 className='text-lg md:text-xl font-semibold text-white'>
                            Semantic Search
                        </h1>
                        <p className='mt-0.5 text-xs text-[#94a3b8] hidden sm:block'>
                            Discover hidden connections across thousands of
                            financial sources.
                        </p>
                    </div>
                )}
                {pathname === '/chat' && (
                    <div>
                        <h1 className='text-lg md:text-xl font-semibold text-white'>
                            AI Financial Chat
                        </h1>
                        <p className='mt-0.5 text-xs text-[#94a3b8] hidden sm:block'>
                            Chat with an AI assistant for financial analysis and
                            insights.
                        </p>
                    </div>
                )}
            </div>

            {/* Right side: Controls */}
            <div data-tour='top-controls' className='flex items-center space-x-2 md:space-x-6'>
                {/* Search/Chat Toggle Switch */}
                {isSearchOrChat && (
                    <div className='border-border bg-surface-container flex items-center rounded-full border p-0.5 md:p-1'>
                        <button
                            onClick={() => router.push('/search')}
                            className={`rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium transition-colors ${
                                pathname === '/search'
                                    ? 'bg-accent text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span className='hidden sm:inline'>Semantic</span>
                            <span className='sm:hidden'>Search</span>
                        </button>
                        <button
                            onClick={() => router.push('/chat')}
                            className={`rounded-full px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium transition-colors ${
                                pathname === '/chat'
                                    ? 'bg-accent text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span className='hidden sm:inline'>AI Chat</span>
                            <span className='sm:hidden'>Chat</span>
                        </button>
                    </div>
                )}

                {/* Icons */}
                <div className='text-muted-foreground flex items-center space-x-1.5 md:space-x-4'>
                    <NotificationBell />
                    <button
                        onClick={() => router.push('/settings')}
                        className='hover:text-foreground transition-colors p-1'
                    >
                        <User className='h-5 w-5' />
                    </button>
                    <button
                        onClick={handleLogout}
                        className='hover:text-foreground transition-colors p-1'
                    >
                        <LogOut className='h-5 w-5' />
                    </button>
                </div>
            </div>
        </header>
    )
}
