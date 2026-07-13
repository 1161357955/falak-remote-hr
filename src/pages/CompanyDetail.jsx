import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Building2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CompanyOverviewTab from "@/components/company-detail/CompanyOverviewTab";
import CompanyWorkersTab from "@/components/company-detail/CompanyWorkersTab";
import CompanyProjectsTab from "@/components/company-detail/CompanyProjectsTab";
import CompanyTasksTab from "@/components/company-detail/CompanyTasksTab";
import CompanyKanbanTab from "@/components/company-detail/CompanyKanbanTab";
import CompanyReportsTab from "@/components/company-detail/CompanyReportsTab";

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [user, comp] = await Promise.all([
        base44.auth.me(),
        base44.entities.Company.get(id),
      ]);
      setCompany(comp);
      setIsAdmin(user?.role === "admin");
      setAllowed(user?.role === "admin" || (comp?.email && user?.email === comp.email));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!company) {
    return <div className="p-8 text-center text-muted-foreground">المنشأة غير موجودة</div>;
  }

  if (!allowed) {
    return <div className="p-8 text-center text-muted-foreground">غير مصرح لك بالوصول إلى بيانات هذه المنشأة</div>;
  }

  return (
    <div>
      <Link to="/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="w-4 h-4" /> العودة إلى المنشآت
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{company.name}</h1>
          <p className="text-xs text-muted-foreground">{company.registration_number}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="workers">العاملون</TabsTrigger>
          <TabsTrigger value="projects">المشاريع</TabsTrigger>
          <TabsTrigger value="tasks">المهام</TabsTrigger>
          <TabsTrigger value="kanban">لوحة كانبان</TabsTrigger>
          <TabsTrigger value="reports">تقارير الأداء</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><CompanyOverviewTab companyId={id} /></TabsContent>
        <TabsContent value="workers"><CompanyWorkersTab companyId={id} /></TabsContent>
        <TabsContent value="projects"><CompanyProjectsTab companyId={id} isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="tasks"><CompanyTasksTab companyId={id} isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="kanban"><CompanyKanbanTab companyId={id} /></TabsContent>
        <TabsContent value="reports"><CompanyReportsTab companyId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}