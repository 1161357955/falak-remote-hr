import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CalendarClock, RefreshCw } from "lucide-react";

const CONNECTOR_ID = "6a54eec5581e3af94b3c7638";

export default function GoogleTasksSync() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      await base44.functions.invoke("syncGoogleTasks", { mode: "status" });
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await checkConnection();
      }
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncGoogleTasks", { mode: "sync" });
      toast({ title: "تمت المزامنة", description: `تم تحديث ${res.data.synced} مهمة في Google Tasks` });
    } catch (e) {
      toast({ title: "تعذرت المزامنة", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !user) return null;

  if (!connected) {
    return (
      <Button variant="outline" onClick={handleConnect} className="gap-2">
        <CalendarClock className="w-4 h-4" /> ربط Google Tasks
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleSync} disabled={syncing} className="gap-2">
        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "جارٍ المزامنة..." : "مزامنة مع Google Tasks"}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDisconnect}>إلغاء الربط</Button>
    </div>
  );
}