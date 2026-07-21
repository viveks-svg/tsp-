import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getNotifications, markAsRead, markAllAsRead, Notification } from "../api/notifications";
import { useSocketListener } from "@/features/call/hooks/useCallSocket";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds between retries

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      retryCount.current = 0; // Reset on success
    } catch (error: any) {
      const msg = error?.message || "";
      const isTransient = msg.includes("500") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed");

      if (isTransient && retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        const delay = RETRY_DELAY_MS * retryCount.current;
        console.log(`[Notifications] API not ready, retrying in ${delay}ms (attempt ${retryCount.current}/${MAX_RETRIES})`);
        retryTimer.current = setTimeout(() => {
          fetchNotifications();
        }, delay);
        return; // Don't set isLoading false yet
      }

      // Only log after all retries exhausted, and only if it's not the dev startup issue
      if (!isTransient) {
        console.error("Failed to fetch notifications", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [fetchNotifications]);

  // Listen for realtime notifications from the socket
  useSocketListener("notification:new", useCallback((newNotification: Notification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []));

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
    refetch: fetchNotifications,
  };
}

