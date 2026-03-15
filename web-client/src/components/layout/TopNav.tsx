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
        <header className='relative z-10 flex h-16 items-center justify-between border-b border-[#334155] bg-[#1e2637] px-8'>
            {/* Left side: Page Title & Subtitle (conditionally rendered) */}
            <div className="flex-1">
                {pathname === '/search' && (
                    <div>
                        <h1 className='text-xl font-semibold text-white'>Semantic Search</h1>
                        <p className='text-xs text-[#94a3b8] mt-0.5'>
                            Discover hidden connections across thousands of financial sources.
                        </p>
                    </div>
                )}
                {pathname === '/chat' && (
                    <div>
                        <h1 className='text-xl font-semibold text-white'>AI Financial Chat</h1>
                        <p className='text-xs text-[#94a3b8] mt-0.5'>
                            Chat with an AI assistant for financial analysis and insights.
                        </p>
                    </div>
                )}
            </div>

            {/* Right side: Controls */}
            <div className='flex items-center space-x-6'>
                {/* Search/Chat Toggle Switch */}
                {isSearchOrChat && (
                    <div className='flex items-center bg-[#243046] rounded-full p-1 border border-[#334155]'>
                        <button
                            onClick={() => router.push('/search')}
                            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                                pathname === '/search' ? 'bg-[#293b5a] text-white' : 'text-[#94a3b8] hover:text-white'
                            }`}
                        >
                            Semantic
                        </button>
                        <button
                            onClick={() => router.push('/chat')}
                            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                                pathname === '/chat' ? 'bg-[#293b5a] text-white' : 'text-[#94a3b8] hover:text-white'
                            }`}
                        >
                            AI Chat
                        </button>
                    </div>
                )}

                {/* Icons */}
                <div className='flex items-center space-x-4 text-[#94a3b8]'>
                    <NotificationBell />
                    <button
                        onClick={() => router.push('/settings')}
                        className='transition-colors hover:text-white'
                    >
                        <User className='h-5 w-5' />
                    </button>
                    <button
                        onClick={handleLogout}
                        className='transition-colors hover:text-white'
                    >
                        <LogOut className='h-5 w-5' />
                    </button>
                </div>
            </div>
        </header>
    )
}
