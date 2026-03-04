"use client"

import { useState, useEffect } from "react";
import {Bell, ExternalLink} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ArticleDto } from "@/lib/types/article";
import { getUserSettings } from "@/app/actions/settings";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<ArticleDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const handleMessage = (message: ArticleDto) => {
      setNotifications((prev) => [message, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    // Subscribe to general sentiments
    subscribe("/topic/sentiments", handleMessage);

    // Subscribe to user's specific tickers
    const fetchAndSubscribe = async () => {
      try {
        const settings = await getUserSettings();
        if (settings && settings.tickers && Array.isArray(settings.tickers)) {
          settings.tickers.forEach((ticker: string) => {
            subscribe(`/topic/ticker/${ticker}`, handleMessage);
          });
        }
      } catch (error) {
        console.error("Failed to fetch user settings for subscriptions", error);
      }
    };

    void fetchAndSubscribe();

    return () => {
      unsubscribe("/topic/sentiments");
      // Note: We can't easily unsubscribe from dynamic tickers here without storing them in state/ref
      // Ideally, the WebSocketService should handle bulk unsubscribe or we track subscriptions
    };
  }, [subscribe, unsubscribe]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setUnreadCount(0);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full bg-slate-800 text-white hover:bg-slate-700"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-slate-900 border-slate-800 text-slate-100" align="end">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-slate-400 hover:text-slate-100"
              onClick={() => setNotifications([])}
            >
              Clear all
            </Button>
          )}
        </div>
        <ScrollArea className="h-75">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-slate-500">
              No new notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-1 border-b border-slate-800 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      notification.overall_sentiment_label === 'positive' 
                        ? 'bg-green-500/20 text-green-400' 
                        : notification.overall_sentiment_label === 'negative'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {notification.overall_sentiment_label}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatDistanceToNow(new Date(notification.processed_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-none mt-1 truncate">
                    <a href={notification.url}>
                      View Ticker
                      <ExternalLink className="h-4 w-4 opacity-50" />
                    </a>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {notification.entities.map((entity, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] h-5 px-1 border-slate-700 text-slate-400">
                        {entity.ticker || entity.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
