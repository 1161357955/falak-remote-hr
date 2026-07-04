import React from "react";

export default function StatCard({ title, value, icon: Icon, trend, color = "primary" }) {
  const colorMap = {
    primary: "from-blue-900 to-blue-800 text-blue-100",
    amber: "from-amber-500 to-amber-600 text-amber-50",
    green: "from-emerald-600 to-emerald-700 text-emerald-50",
    purple: "from-purple-600 to-purple-700 text-purple-50",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} p-6 relative overflow-hidden`}>
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-8 -translate-y-8" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className="text-xs bg-white/15 px-2 py-1 rounded-full">{trend}</span>
          )}
        </div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm opacity-80 mt-1">{title}</p>
      </div>
    </div>
  );
}