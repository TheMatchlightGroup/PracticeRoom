import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Notification } from "@shared/audio-types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) return;

      const res = await fetch("/api/notifications?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const { data } = await res.json();
        setNotifications(data || []);
      } else {
        setError("Failed to load notifications");
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Error loading notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        if (!token) return;

        await fetch(`/api/notifications/${notificationId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Update local state
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [notifications]
  );

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        if (!token) return;

        await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Update local state
        setNotifications(notifications.filter((n) => n.id !== notificationId));
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    },
    [notifications]
  );

  // Load on mount
  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    deleteNotification,
  };
}
