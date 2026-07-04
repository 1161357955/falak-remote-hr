import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Building2, Users, FolderKanban, 
  ClipboardList, BarChart3, LogOut, Star
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { label: "المنشآت", icon: Building2, path: "/companies" },
  { label: "العاملون عن بُعد", icon: Users, path: "/workers" },
  { label: "المشاريع", icon: FolderKanban, path: "/projects" },
  { label: "المهام", icon: ClipboardList, path: "/tasks" },
  { label: "تقارير الأداء", icon: BarChart3, path: "/reports" },
];

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = async () => {
    await base44.auth.logout("/login");
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-[hsl(224,60%,15%)] text-white flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">فلك</h1>
            <p className="text-xs text-white/50">للموارد البشرية</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}