'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, ArrowRight } from 'lucide-react'
import Link from 'next/link'
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
import { cleanArticleTitle } from '@/lib/utils'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationDto[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const { subscribe, unsubscribe } = useWebSocket()

    const fetchInitialNotifications = useCallback(async () => {
        try {
            const data = await getNotifications()
            if (data && Array.isArray(data)) {
                const normalized = data.map((n: any) => ({
                    ...n,
                    article_title: cleanArticleTitle(
                        n.article_title || n.articleTitle || '',
                        n.source,
                        n.article_url || n.articleUrl,
                    ),
                    article_overall_sentiment_score: n.article_overall_sentiment_score !== undefined ? n.article_overall_sentiment_score : n.articleOverallSentimentScore,
                    article_overall_sentiment_label: n.article_overall_sentiment_label || n.articleOverallSentimentLabel || null,
                    article_entities: n.article_entities || n.articleEntities || null,
                    article_uuid: n.article_uuid || n.articleUuid || null,
                }))
                setNotifications(normalized)
                setUnreadCount(normalized.filter((n) => !n.is_read).length)
            }
        } catch (error) {
            console.error('Failed to fetch initial notifications', error)
        }
    }, [])

    useEffect(() => {
        void fetchInitialNotifications()
    }, [fetchInitialNotifications])

    useEffect(() => {
        const handleMessage = (message: any) => {
            let notification: NotificationDto

            if (message.id !== undefined) {
                notification = {
                    ...(message as NotificationDto),
                    article_title: cleanArticleTitle(
                        message.article_title || message.articleTitle || '',
                        message.source,
                        message.article_url || message.articleUrl || message.url,
                    ),
                    article_overall_sentiment_score: message.article_overall_sentiment_score !== undefined ? message.article_overall_sentiment_score : message.articleOverallSentimentScore,
                    article_overall_sentiment_label: message.article_overall_sentiment_label || message.articleOverallSentimentLabel || null,
                    article_entities: message.article_entities || message.articleEntities || null,
                    article_uuid: message.article_uuid || message.articleUuid || null,
                }
            } else {
                // Map AnalyzedArticleDto from public ticker topic
                const entityWithTicker =
                    message.entities && Array.isArray(message.entities)
                        ? message.entities.find((e: any) => !!e.ticker)
                        : null
                const ticker = entityWithTicker ? entityWithTicker.ticker : 'NEWS'

                // Simple hash function for deterministic unique ID
                let hash = 0
                const str = (message.url || '') + '_' + ticker
                for (let i = 0; i < str.length; i++) {
                    hash = (hash << 5) - hash + str.charCodeAt(i)
                    hash |= 0
                }

                notification = {
                    id: Math.abs(hash),
                    ticker: ticker || 'NEWS',
                    article_url: message.url || '',
                    article_processed_at:
                        message.processed_at ||
                        message.processedAt ||
                        new Date().toISOString(),
                    sentiment_score:
                        entityWithTicker
                            ? (entityWithTicker.sentiment_score !== undefined
                                ? entityWithTicker.sentiment_score
                                : entityWithTicker.sentimentScore || 0)
                            : 0,
                    sentiment_label:
                        entityWithTicker
                            ? (entityWithTicker.sentiment_label ||
                                entityWithTicker.sentimentLabel ||
                                'neutral')
                            : 'neutral',
                    is_read: false,
                    created_at: new Date().toISOString(),
                    source: message.source || null,
                    article_title: cleanArticleTitle(
                        message.title || '',
                        message.source || null,
                        message.url,
                    ),
                    article_overall_sentiment_score:
                        message.overall_sentiment_score !== undefined
                            ? message.overall_sentiment_score
                            : message.overallSentimentScore || 0,
                    article_overall_sentiment_label:
                        message.overall_sentiment_label ||
                        message.overallSentimentLabel ||
                        'neutral',
                    article_entities: message.entities || null,
                    article_uuid: message.uuid || message.article_uuid || message.articleUuid || null,
                }
            }

            setNotifications((prev) => {
                if (
                    prev.some(
                        (n) =>
                            n.id === notification.id ||
                            (n.article_url === notification.article_url &&
                                n.ticker === notification.ticker),
                    )
                ) {
                    return prev
                }
                return [notification, ...prev]
            })

            if (!notification.is_read) {
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
                                        <div className='absolute top-4 left-1 h-2 w-2 rounded-full bg-blue-500'></div>
                                    )}
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                            <Badge
                                                variant='outline'
                                                className='flex h-5 min-w-0 items-center gap-1 border-blue-500/50 bg-blue-500/10 px-1.5 text-[10px] font-bold text-blue-400'
                                            >
                                                <span className='shrink-0'>
                                                    {notification.ticker}
                                                </span>
                                                {notification.source && (
                                                    <>
                                                        <span className='shrink-0 opacity-40'>
                                                            •
                                                        </span>
                                                        <span
                                                            className='max-w-[100px] truncate font-medium opacity-90'
                                                            title={
                                                                notification.source
                                                            }
                                                        >
                                                            {
                                                                notification.source
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </Badge>
                                            <span
                                                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase ${
                                                    (notification.sentiment_label ||
                                                        '') === 'positive'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : (notification.sentiment_label ||
                                                                '') ===
                                                            'negative'
                                                          ? 'bg-red-500/20 text-red-400'
                                                          : 'bg-slate-500/20 text-slate-400'
                                                }`}
                                            >
                                                {notification.sentiment_label ||
                                                    'neutral'}
                                            </span>
                                        </div>
                                    </div>
                                    {notification.article_title && (
                                        <p className='text-slate-300 mt-1 line-clamp-2 text-xs font-medium'>
                                            {notification.article_title}
                                        </p>
                                    )}
                                    <div className='relative z-20 mt-2 flex items-center justify-between gap-4'>
                                        <p className='truncate text-xs font-semibold'>
                                            <Link
                                                href={`/articles/deep-dive/${notification.article_uuid}`}
                                                onClick={() => setIsOpen(false)}
                                                className='inline-flex items-center gap-1 text-blue-400 hover:underline'
                                            >
                                                View Analysis
                                                <ArrowRight className='h-3 w-3 opacity-50' />
                                            </Link>
                                        </p>
                                        <span className='shrink-0 text-[10px] font-medium text-slate-500'>
                                            {formatNotificationDate(
                                                notification.created_at,
                                            )}
                                        </span>
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
