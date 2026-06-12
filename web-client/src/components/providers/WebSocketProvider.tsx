'use client'

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import { WebSocketService } from '@/lib/websocket'

export interface WSMessage {
    id?: number
    ticker?: string
    article_title?: string
    articleTitle?: string
    title?: string
    url?: string
    source?: string | null
    article_url?: string
    articleUrl?: string
    article_overall_sentiment_score?: number
    articleOverallSentimentScore?: number
    article_overall_sentiment_label?: string | null
    articleOverallSentimentLabel?: string | null
    article_entities?: { ticker?: string; sentiment_score?: number; sentimentScore?: number; sentiment_label?: string; sentimentLabel?: string }[] | null
    articleEntities?: { ticker?: string; sentiment_score?: number; sentimentScore?: number; sentiment_label?: string; sentimentLabel?: string }[] | null
    article_uuid?: string | null
    articleUuid?: string | null
    is_read?: boolean
    created_at?: string
    entities?: { ticker?: string; sentiment_score?: number; sentimentScore?: number; sentiment_label?: string; sentimentLabel?: string }[]
    processed_at?: string
    processedAt?: string
    overall_sentiment_score?: number
    overallSentimentScore?: number
    overall_sentiment_label?: string
    overallSentimentLabel?: string
    uuid?: string
}

interface WebSocketContextType {
    subscribe: (destination: string, callback: (message: WSMessage) => void) => void
    unsubscribe: (destination: string) => void
    isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({
    children,
    token,
}: {
    children: React.ReactNode
    token: string
}) {
    const wsServiceRef = useRef<WebSocketService | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (token && !wsServiceRef.current) {
            const wsService = new WebSocketService(token)
            wsService.activate()
            wsServiceRef.current = wsService
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsConnected(true)
        }

        return () => {
            if (wsServiceRef.current) {
                wsServiceRef.current.deactivate()
                wsServiceRef.current = null
                setIsConnected(false)
            }
        }
    }, [token])

    const subscribe = (
        destination: string,
        callback: (message: WSMessage) => void,
    ) => {
        if (wsServiceRef.current) {
            wsServiceRef.current.subscribe(destination, callback)
        } else {
            console.warn('WebSocket service not initialized')
        }
    }

    const unsubscribe = (destination: string) => {
        if (wsServiceRef.current) {
            wsServiceRef.current.unsubscribe(destination)
        }
    }

    return (
        <WebSocketContext.Provider
            value={{ subscribe, unsubscribe, isConnected }}
        >
            {children}
        </WebSocketContext.Provider>
    )
}

export function useWebSocket() {
    const context = useContext(WebSocketContext)
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider')
    }
    return context
}
