"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WebSocketService } from '@/lib/websocket';

interface WebSocketContextType {
  subscribe: (destination: string, callback: (message: any) => void) => void;
  unsubscribe: (destination: string) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ 
  children,
  token 
}: { 
  children: React.ReactNode;
  token: string;
}) {
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token && !wsServiceRef.current) {
      const wsService = new WebSocketService(token);
      wsService.activate();
      wsServiceRef.current = wsService;
      setIsConnected(true);
    }

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.deactivate();
        wsServiceRef.current = null;
        setIsConnected(false);
      }
    };
  }, [token]);

  const subscribe = (destination: string, callback: (message: any) => void) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.subscribe(destination, callback);
    } else {
      console.warn('WebSocket service not initialized');
    }
  };

  const unsubscribe = (destination: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.unsubscribe(destination);
    }
  };

  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
