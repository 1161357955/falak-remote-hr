import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function NotificationWatcher() {
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    let email = null;
    base44.auth.me().then((u) => { email = u.email; }).catch(() => {});

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type !== "create") return;
      if (!email || event.data.recipient_email !== email) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

      const popup = new Notification(event.data.title, { body: event.data.message || "" });
      popup.onclick = () => {
        window.focus();
        if (event.data.channel_id) window.location.href = `/messages?channel=${event.data.channel_id}`;
        else if (event.data.meeting_id) window.location.href = `/meetings?meeting=${event.data.meeting_id}`;
        else if (event.data.task_id) window.location.href = `/tasks?task=${event.data.task_id}`;
      };
    });
    return unsubscribe;
  }, []);

  return null;
}