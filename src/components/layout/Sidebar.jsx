import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, FolderKanban,
  ClipboardList, BarChart3, LogOut, Star, Columns3, X, ChevronsRight, ChevronsLeft, Wallet, Receipt, CalendarDays, Video, MessageSquare
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const adminNavItems = [
  { label: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { label: "المنشآت", icon: Building2, path: "/companies" },
  { label: "العاملون عن بُعد", icon: Users, path: "/workers" },
  { label: "المشاريع", icon: FolderKanban, path: "/projects" },
  { label: "المهام", icon: ClipboardList, path: "/tasks" },
  { label: "تقويم المهام", icon: CalendarDays, path: "/tasks-calendar" },
  { label: "لوحة كانبان", icon: Columns3, path: "/tasks-kanban" },
  { label: "الاجتماعات", icon: Video, path: "/meetings" },
  { label: "الاتصالات الداخلية", icon: MessageSquare, path: "/messages" },
  { label: "تقارير الأداء", icon: BarChart3, path: "/reports" },
  { label: "كشوف الرواتب", icon: Wallet, path: "/payroll" },
  { label: "التدفقات النقدية", icon: Wallet, path: "/cash-flow" },
  { label: "الفواتير", icon: Receipt, path: "/invoices" },
];

const restrictedNavItems = [
  { label: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { label: "الاجتماعات", icon: Video, path: "/meetings" },
  { label: "الاتصالات الداخلية", icon: MessageSquare, path: "/messages" },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const [navItems, setNavItems] = useState(restrictedNavItems);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const user = await base44.auth.me();
        setNavItems(user?.role === "admin" ? adminNavItems : restrictedNavItems);
      } catch (e) {
        setNavItems(restrictedNavItems);
      }
    };
    loadRole();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout("/login");
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed right-0 top-0 h-screen w-64 bg-[hsl(224,60%,15%)] text-white flex flex-col z-50 transition-all duration-200
        ${collapsed ? "lg:w-20" : "lg:w-64"}
        ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap">
                <h1 className="text-xl font-bold tracking-tight">فلك</h1>
                <p className="text-xs text-white/50">للموارد البشرية</p>
              </div>
            )}
          </div>
          <button onClick={onCloseMobile} className="lg:hidden text-white/70 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  collapsed ? "lg:justify-center" : ""
                } ${
                  isActive
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all w-full ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
            {!collapsed && <span>طي القائمة</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all w-full ${collapsed ? "lg:justify-center" : ""}`}
          >
            <LogOut className="w-5 h-5" />
            <span className={collapsed ? "lg:hidden" : ""}>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}