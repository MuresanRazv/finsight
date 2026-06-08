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
    User,
    Plus,
    PlusCircle,
} from 'lucide-react'
import { SessionUser } from '@/lib/session'

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
        label: 'My Ingestions',
        icon: PlusCircle,
        href: '/ingestion',
    },
]

export function Sidebar({ session }: { session?: SessionUser }) {
    const pathname = usePathname()

    return (
        <aside className='hidden w-64 flex-col justify-between border-r border-border bg-sidebar py-6 px-4 md:flex shrink-0'>
            <div>
                {/* Logo and Subtitle */}
                <div className='mb-10 px-4 flex flex-col gap-1'>
                    <Link href="/dashboard" className='flex items-center gap-2.5 group'>
                        <LineChart className='h-6 w-6 text-primary transition-transform group-hover:scale-105' />
                        <span className='text-2xl font-bold tracking-tight text-foreground'>
                            FinSight
                        </span>
                    </Link>
                    <p className='text-[10px] text-muted-foreground font-semibold uppercase tracking-widest pl-8 opacity-75'>
                        AI Financial Intelligence
                    </p>
                </div>

                {/* Navigation Links */}
                <nav className='space-y-1.5 px-2'>
                    {mainRoutes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.label}
                                href={route.href}
                                className={cn(
                                    'group flex items-center rounded-lg px-3 py-2.5 transition-all gap-3 font-medium text-sm',
                                    isActive
                                        ? 'bg-accent text-primary font-bold border-r-4 border-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                )}
                            >
                                <route.icon
                                    className={cn(
                                        'h-5 w-5 transition-colors',
                                        isActive
                                            ? 'text-primary'
                                            : 'text-muted-foreground group-hover:text-foreground',
                                    )}
                                />
                                <span>{route.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Bottom Actions and Profile */}
            <div className='px-2'>
                {pathname !== '/search' && (
                    <Link href="/search" className="block w-full">
                        <button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-4 hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md shadow-primary/10 flex items-center justify-center gap-2 text-sm cursor-pointer">
                            <Plus className="h-4 w-4" />
                            <span>New Analysis</span>
                        </button>
                    </Link>
                )}

                {/* Settings Link */}
                <Link
                    href='/settings'
                    className={cn(
                        'group flex items-center rounded-lg px-3 py-2.5 transition-all gap-3 font-medium text-sm',
                        pathname === '/settings'
                            ? 'bg-accent text-primary font-bold border-r-4 border-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                >
                    <Settings className='h-5 w-5 transition-colors text-muted-foreground group-hover:text-foreground' />
                    <span>Settings</span>
                </Link>

                {/* User Profile info */}
                <div className='mt-4 flex items-center gap-3 border-t border-border pt-4 px-2'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold shrink-0'>
                        {session?.firstname ? session.firstname[0].toUpperCase() : <User className='h-4 w-4' />}
                    </div>
                    <div className='flex flex-col min-w-0'>
                        <span className='text-sm font-semibold text-foreground leading-none truncate'>
                            {session?.firstname} {session?.lastname}
                        </span>
                        <span className='text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-75'>
                            Senior Analyst
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
