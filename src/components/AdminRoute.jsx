import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function AdminRoute() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    base44.auth.me()
      .then((user) => setStatus(user?.role === "admin" ? "allowed" : "denied"))
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}