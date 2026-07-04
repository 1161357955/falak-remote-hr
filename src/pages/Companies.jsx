import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Plus, Pencil, Trash2, Search, UploadCloud, Paperclip, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import CompanyImportDialog from "@/components/companies/CompanyImportDialog";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  name: "", registration_number: "", commercial_register: "", activity_type: "",
  city: "", region: "", nitaqat_color: "", contact_person: "", phone: "", email: "",
  contract_status: "نشط", notes: "",
};

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await base44.entities.Company.list("-created_date");
      setCompanies(data);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.registration_number) {
      toast({ title: "خطأ", description: "اسم المنشأة ورقمها مطلوبان", variant: "destructive" });
      return;
    }
    if (editId) {
      await base44.entities.Company.update(editId, form);
    } else {
      await base44.entities.Company.create(form);
    }
    setDialogOpen(false);
    setForm(emptyForm);
    setEditId(null);
    loadData();
    toast({ title: editId ? "تم التحديث" : "تمت الإضافة" });
  };

  const handleEdit = (c) => {
    setForm({ ...emptyForm, ...c });
    setEditId(c.id);
    setDialogOpen(true);
  };

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, document_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Company.delete(id);
    loadData();
    toast({ title: "تم الحذف" });
  };

  const filtered = companies.filter((c) =>
    c.name?.includes(search) || c.registration_number?.includes(search)
  );

  const statusColor = {
    "نشط": "bg-emerald-100 text-emerald-700",
    "معلق": "bg-amber-100 text-amber-700",
    "منتهي": "bg-red-100 text-red-700",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="المنشآت" description="إدارة بيانات المنشآت وأصحاب الأعمال">
        <div className="flex items-center gap-2">
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> إضافة منشأة
          </Button>
          <Button variant="outline" size="icon" title="ترحيل ذكي للمنشآت" onClick={() => setImportOpen(true)}>
            <UploadCloud className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      <CompanyImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={loadData} />

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث بالاسم أو الرقم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد منشآت" description="ابدأ بإضافة منشأة جديدة" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-card border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.registration_number}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[c.contract_status] || ""}`}>
                  {c.contract_status}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                {c.city && <p>المدينة: {c.city}</p>}
                {c.nitaqat_color && <p>النطاق: {c.nitaqat_color}</p>}
                {c.contact_person && <p>مسؤول التواصل: {c.contact_person}</p>}
                {c.document_url && (
                  <a href={c.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <FileText className="w-3.5 h-3.5" /> عرض المستند المرفق
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                  <Pencil className="w-3.5 h-3.5 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="w-3.5 h-3.5 ml-1" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editId ? "تعديل منشأة" : "إضافة منشأة"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>اسم المنشأة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>رقم المنشأة *</Label><Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>السجل التجاري</Label><Input value={form.commercial_register} onChange={(e) => setForm({ ...form, commercial_register: e.target.value })} /></div>
            <div><Label>نوع النشاط</Label><Input value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>المدينة</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>المنطقة</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نطاق المنشأة</Label>
              <Select value={form.nitaqat_color} onValueChange={(v) => setForm({ ...form, nitaqat_color: v })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {["أخضر منخفض", "أخضر متوسط", "أخضر مرتفع", "بلاتيني", "أحمر", "أصفر"].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>حالة العقد</Label>
              <Select value={form.contract_status} onValueChange={(v) => setForm({ ...form, contract_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["نشط", "معلق", "منتهي"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>مسؤول التواصل</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <Label>المستند المرفق</Label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground border rounded-md px-3 py-2 w-fit">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              {form.document_url ? "تم إرفاق مستند" : "إرفاق مستند"}
              <input type="file" className="hidden" onChange={handleUploadDocument} />
            </label>
            {form.document_url && (
              <a href={form.document_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">عرض المستند الحالي</a>
            )}
          </div>
          <Button onClick={handleSave} className="w-full">{editId ? "تحديث" : "إضافة"}</Button>
        </div>
      </FormDialog>
    </div>
  );
}