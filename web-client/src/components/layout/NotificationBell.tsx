'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWebSocket } from '@/components/providers/WebSocketProvider'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { getUserSettings } from '@/app/actions/settings'
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
} from '@/app/actions/notifications'
import { NotificationDto } from '@/lib/types/notification'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationDto[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const { subscribe, unsubscribe } = useWebSocket()

    const fetchInitialNotifications = useCallback(async () => {
        try {
            const data = await getNotifications()
            if (data && Array.isArray(data)) {
                setNotifications(data)
                setUnreadCount(data.filter((n) => !n.is_read).length)
            }
        } catch (error) {
            console.error('Failed to fetch initial notifications', error)
        }
    }, [])

    useEffect(() => {
        void fetchInitialNotifications()
    }, [fetchInitialNotifications])

    useEffect(() => {
        const handleMessage = (message: NotificationDto) => {
            setNotifications((prev) => {
                // Deduplicate by ID
                if (prev.some((n) => n.id === message.id)) {
                    return prev
                }
                return [message, ...prev]
            })
            if (!message.is_read) {
                setUnreadCount((prev) => prev + 1)
            }
        }

        const fetchAndSubscribe = async () => {
            try {
                const settings = await getUserSettings()
                if (
                    settings &&
                    settings.tickers &&
                    Array.isArray(settings.tickers)
                ) {
                    settings.tickers.forEach((ticker: string) => {
                        subscribe(`/topic/ticker/${ticker}`, handleMessage)
                    })
                }
            } catch (error) {
                console.error(
                    'Failed to fetch user settings for subscriptions',
                    error,
                )
            }
        }

        void fetchAndSubscribe()

        return () => {
            // Ideally we should track and unsubscribe from all tickers
        }
    }, [subscribe, unsubscribe])

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
    }

    const formatNotificationDate = (dateInput: any) => {
        if (!dateInput) return 'unknown'
        try {
            // Handle array format [YYYY, MM, DD, HH, mm, ss, ns] from some Jackson configurations
            if (Array.isArray(dateInput)) {
                const [year, month, day, hour, minute, second] = dateInput
                return formatDistanceToNow(
                    new Date(
                        year,
                        month - 1,
                        day,
                        hour || 0,
                        minute || 0,
                        second || 0,
                    ),
                    { addSuffix: true },
                )
            }
            const date = new Date(dateInput)
            if (isNaN(date.getTime())) return 'invalid date'
            return formatDistanceToNow(date, { addSuffix: true })
        } catch (error) {
            return 'invalid date'
        }
    }

    const handleMouseEnter = async (notification: NotificationDto) => {
        if (!notification.is_read) {
            try {
                await markAsRead(notification.id)
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notification.id ? { ...n, is_read: true } : n,
                    ),
                )
                setUnreadCount((prev) => Math.max(0, prev - 1))
            } catch (error) {
                console.error('Failed to mark as read', error)
            }
        }
    }

    const handleClearAll = async () => {
        try {
            await markAllAsRead()
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true })),
            )
            setUnreadCount(0)
        } catch (error) {
            console.error('Failed to mark all as read', error)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant='ghost'
                    size='icon'
                    className='relative rounded-full bg-slate-800 text-white hover:bg-slate-700'
                >
                    <Bell className='h-5 w-5' />
                    {unreadCount > 0 && (
                        <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white'>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className='w-80 border-slate-800 bg-slate-900 p-0 text-slate-100'
                align='end'
            >
                <div className='flex items-center justify-between border-b border-slate-800 px-4 py-3'>
                    <h4 className='font-semibold'>Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant='ghost'
                            size='sm'
                            className='h-auto p-0 text-xs text-slate-400 hover:text-slate-100'
                            onClick={handleClearAll}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className='h-80'>
                    {notifications.length === 0 ? (
                        <div className='flex h-40 items-center justify-center p-4 text-sm text-slate-500'>
                            No notifications
                        </div>
                    ) : (
                        <div className='flex flex-col'>
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onMouseEnter={() =>
                                        handleMouseEnter(notification)
                                    }
                                    className={`relative flex flex-col gap-1 border-b border-slate-800 px-4 py-3 transition-colors hover:bg-slate-800/50 ${
                                        !notification.is_read
                                            ? 'bg-blue-500/5'
                                            : 'opacity-70'
                                    }`}
                                >
                                    {!notification.is_read && (
                                        <div className='absolute left-1 top-4 h-2 w-2 rounded-full bg-blue-500'></div>
                                    )}
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                            <Badge
                                                variant='outline'
                                                className='h-5 border-blue-500/50 bg-blue-500/10 px-1 text-[10px] font-bold text-blue-400'
                                            >
                                                {notification.ticker}
                                            </Badge>
                                            <span
                                                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                                    (notification.sentiment_label ||
                                                        '') === 'positive'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : (notification.sentiment_label ||
                                                              '') === 'negative'
                                                          ? 'bg-red-500/20 text-red-400'
                                                          : 'bg-slate-500/20 text-slate-400'
                                                }`}
                                            >
                                                {notification.sentiment_label ||
                                                    'neutral'}
                                            </span>
                                        </div>
                                        <span className='text-[10px] text-slate-500'>
                                            {formatNotificationDate(
                                                notification.created_at,
                                            )}
                                        </span>
                                    </div>
                                    <div className='relative z-20 mt-1'>
                                        <p className='truncate text-sm leading-none font-medium'>
                                            <a
                                                href={notification.article_url}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className='inline-flex items-center gap-1 text-blue-400 hover:underline'
                                            >
                                                View Article
                                                <ExternalLink className='h-3 w-3 opacity-50' />
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
