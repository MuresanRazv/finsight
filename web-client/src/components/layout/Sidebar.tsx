'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Search, Settings, LineChart } from 'lucide-react'

const routes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        color: 'text-sky-500',
    },
    {
        label: 'Semantic Search',
        icon: Search,
        href: '/search',
        color: 'text-violet-500',
    },
    {
        label: 'Settings',
        icon: Settings,
        href: '/settings',
        color: 'text-gray-400',
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className='flex h-full flex-col space-y-4 border-r border-slate-800 bg-slate-900 py-4 text-white'>
            <div className='flex-1 px-3 py-2'>
                <Link href='/' className='mb-14 flex items-center pl-3'>
                    <div className='relative mr-4 h-8 w-8'>
                        <LineChart className='h-8 w-8 text-emerald-500' />
                    </div>
                    <h1 className='text-2xl font-bold'>FinSight</h1>
                </Link>
                <div className='space-y-1'>
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                'group flex w-full cursor-pointer justify-start rounded-lg p-3 text-sm font-medium transition hover:bg-white/10 hover:text-white',
                                pathname === route.href
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400',
                            )}
                        >
                            <div className='flex flex-1 items-center'>
                                <route.icon
                                    className={cn('mr-3 h-5 w-5', route.color)}
                                />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
