'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Search,
    Settings,
    LineChart,
    MessageSquare,
    BarChart3,
    FileText,
    User,
} from 'lucide-react'

const mainRoutes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
    },
    {
        label: 'Semantic Search',
        icon: Search,
        href: '/search',
    },
    {
        label: 'AI Chat',
        icon: MessageSquare,
        href: '/chat',
    },
    {
        label: 'Market Analysis',
        icon: BarChart3,
        href: '#', // Placeholder
    },
    {
        label: 'Reports',
        icon: FileText,
        href: '#', // Placeholder
    },
]

export function Sidebar({ session }: { session: any }) {
    const pathname = usePathname()

    return (
        <aside className='hidden w-64 flex-col justify-between border-r border-[#334155] bg-[#182132] text-[#f8fafc] md:flex'>
            <div>
                {/* Logo */}
                <div className='flex h-16 items-center border-b border-[#334155] px-6'>
                    <LineChart className='mr-2 h-6 w-6 text-[#3b82f6]' />
                    <span className='text-xl font-bold tracking-wide'>
                        FinSight
                    </span>
                </div>

                {/* Navigation */}
                <nav className='space-y-1 p-4'>
                    {mainRoutes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.label}
                                href={route.href}
                                className={cn(
                                    'group flex items-center rounded-md px-3 py-2 transition-colors',
                                    isActive
                                        ? 'bg-[#293b5a] text-white'
                                        : 'text-[#94a3b8] hover:bg-[#293b5a] hover:text-white',
                                )}
                            >
                                <route.icon
                                    className={cn(
                                        'mr-3 h-5 w-5',
                                        isActive
                                            ? 'text-[#3b82f6]'
                                            : 'group-hover:text-white',
                                    )}
                                />
                                {route.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Bottom Sidebar Actions */}
            <div className='border-t border-[#334155] p-4'>
                <Link
                    href='/settings'
                    className='group mb-2 flex items-center rounded-md px-3 py-2 text-[#94a3b8] transition-colors hover:bg-[#293b5a] hover:text-white'
                >
                    <Settings className='mr-3 h-5 w-5 group-hover:text-white' />
                    Settings
                </Link>
                <div className='mt-auto flex items-center px-3 py-2'>
                    <div className='mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-500'>
                        <User className='h-5 w-5 text-white' />
                    </div>
                    <span className='text-sm font-medium'>
                        {session?.firstname} {session?.lastname}
                    </span>
                </div>
            </div>
        </aside>
    )
}
