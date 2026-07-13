import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then((user) => {
      setEmail(user.email);
      base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date").then(setNotifications);
    });
  }, []);

  useEffect(() => {
    if (!email) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.recipient_email !== email) return;
      if (event.type === "create") {
        setNotifications((prev) => [event.data, ...prev]);
      } else if (event.type === "update") {
        setNotifications((prev) => prev.map((n) => (n.id === event.data.id ? event.data : n)));
      }
    });
    return unsubscribe;
  }, [email]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpenChange = async (open) => {
    if (open) {
      const unread = notifications.filter((n) => !n.is_read);
      if (unread.length > 0) {
        await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger className="relative p-2 rounded-lg hover:bg-accent">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد إشعارات</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`px-3 py-2 border-b last:border-0 ${!n.is_read ? "bg-accent/50" : ""}`}>
              <p className="text-sm font-medium">{n.title}</p>
              {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_date).toLocaleString("ar-SA")}</p>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}