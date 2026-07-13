import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Star } from "lucide-react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import PresenceHeartbeat from "./PresenceHeartbeat";
import NotificationWatcher from "./NotificationWatcher";
import { CallProvider } from "@/lib/CallContext";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CallProvider>
    <div className="min-h-screen bg-background">
      <PresenceHeartbeat />
      <NotificationWatcher />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-card border-b flex items-center gap-2 px-4 z-30">
        <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <Star className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold">فلك</span>
        <div className="mr-auto">
          <NotificationBell />
        </div>
      </header>

      <div className="hidden lg:block fixed top-4 left-4 z-30">
        <NotificationBell />
      </div>

      <main className={`min-h-screen pt-14 lg:pt-0 transition-all duration-200 ${collapsed ? "lg:mr-20" : "lg:mr-64"}`}>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
    </CallProvider>
  );
}