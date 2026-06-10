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
    Rss,
    Activity,
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
    {
        label: 'RSS Feeds',
        icon: Rss,
        href: '/sources',
        isAdminOnly: true,
    },
    {
        label: 'Observability',
        icon: Activity,
        href: '/metrics',
        isAdminOnly: true,
    },
]


export function Sidebar({ session }: { session?: SessionUser }) {
    const pathname = usePathname()

    const filteredRoutes = mainRoutes.filter(
        (route) => !route.isAdminOnly || session?.role === 'ADMIN',
    )

    return (
        <aside className='border-border bg-sidebar hidden w-64 shrink-0 flex-col justify-between border-r px-4 py-6 md:flex'>
            <div>
                {/* Logo and Subtitle */}
                <div className='mb-10 flex flex-col gap-1 px-4'>
                    <Link
                        href='/dashboard'
                        className='group flex items-center gap-2.5'
                    >
                        <LineChart className='text-primary h-6 w-6 transition-transform group-hover:scale-105' />
                        <span className='text-foreground text-2xl font-bold tracking-tight'>
                            FinSight
                        </span>
                    </Link>
                    <p className='text-muted-foreground pl-8 text-[10px] font-semibold tracking-widest uppercase opacity-75'>
                        AI Financial Intelligence
                    </p>
                </div>

                {/* Navigation Links */}
                <nav data-tour='sidebar-nav' className='space-y-1.5 px-2'>
                    {filteredRoutes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.label}
                                href={route.href}
                                className={cn(
                                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-accent text-primary border-primary border-r-4 font-bold'
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
                    <Link href='/search' className='block w-full'>
                        <button className='bg-primary text-primary-foreground shadow-primary/10 mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-md transition-all duration-150 hover:opacity-90 active:scale-95'>
                            <Plus className='h-4 w-4' />
                            <span>New Analysis</span>
                        </button>
                    </Link>
                )}

                {/* Settings Link */}
                <Link
                    href='/settings'
                    className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        pathname === '/settings'
                            ? 'bg-accent text-primary border-primary border-r-4 font-bold'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                >
                    <Settings className='text-muted-foreground group-hover:text-foreground h-5 w-5 transition-colors' />
                    <span>Settings</span>
                </Link>

                {/* User Profile info */}
                <div className='border-border mt-4 flex items-center gap-3 border-t px-2 pt-4'>
                    <div className='bg-primary/10 border-primary/20 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-bold'>
                        {session?.firstname ? (
                            session.firstname[0].toUpperCase()
                        ) : (
                            <User className='h-4 w-4' />
                        )}
                    </div>
                    <div className='flex min-w-0 flex-col'>
                        <span className='text-foreground truncate text-sm leading-none font-semibold'>
                            {session?.firstname} {session?.lastname}
                        </span>
                        <span className='text-muted-foreground mt-1 text-[9px] font-bold tracking-widest uppercase opacity-75'>
                            Senior Analyst
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
