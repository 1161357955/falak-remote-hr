import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function PresenceHeartbeat() {
  useEffect(() => {
    let workerId = null;

    const beat = async () => {
      try {
        const user = await base44.auth.me();
        if (!workerId) {
          const found = await base44.entities.RemoteWorker.filter({ email: user.email });
          if (found.length === 0) return;
          workerId = found[0].id;
        }
        await base44.entities.RemoteWorker.update(workerId, { last_active_at: new Date().toISOString() });
      } catch {
        // ignore heartbeat failures silently
      }
    };

    beat();
    const interval = setInterval(beat, 60000);
    return () => clearInterval(interval);
  }, []);

  return null;
}