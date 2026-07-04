import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UploadCloud, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormDialog from "@/components/shared/FormDialog";
import { useToast } from "@/components/ui/use-toast";

const COMPANY_SCHEMA = {
  type: "object",
  properties: {
    companies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          registration_number: { type: "string" },
          commercial_register: { type: "string" },
          unified_number: { type: "string" },
          activity_type: { type: "string" },
          company_type: { type: "string" },
          city: { type: "string" },
          region: { type: "string" },
          address: { type: "string" },
          postal_code: { type: "string" },
          website: { type: "string" },
          nitaqat_color: { type: "string" },
          contact_person: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          capital: { type: "number" },
          directors: { type: "string" },
          gosi_number: { type: "string" },
          hrsd_number: { type: "string" },
          zakat_number: { type: "string" },
          contract_status: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
  },
};

export default function CompanyImportDialog({ open, onOpenChange, onImported }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const processFile = async (file) => {
    setFileName(file.name);
    setProcessing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: COMPANY_SCHEMA,
      });
      if (result.status !== "success" || !result.output?.companies?.length) {
        toast({ title: "تعذر استخراج البيانات", description: result.details || "تأكد من صيغة الملف", variant: "destructive" });
        return;
      }
      const records = result.output.companies
        .filter((c) => c.name)
        .map((c) => ({ registration_number: "", contract_status: "نشط", ...c }));
      await base44.entities.Company.bulkCreate(records);
      toast({ title: "تم الترحيل", description: `تم إضافة ${records.length} منشأة بنجاح` });
      onImported();
      onOpenChange(false);
    } finally {
      setProcessing(false);
      setFileName("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="ترحيل ذكي للمنشآت">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          ارفع ملف Excel أو CSV أو PDF يحتوي على بيانات المنشآت، وسيقوم النظام باستخراجها وإضافتها تلقائياً.
        </p>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-colors ${
            dragging ? "border-primary bg-accent" : "border-border hover:bg-muted/50"
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">جاري معالجة {fileName}...</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">اسحب وأفلت الملف هنا أو اضغط للاختيار</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel, CSV, PDF
              </p>
            </>
          )}
          <input type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden" onChange={handleFileInput} disabled={processing} />
        </label>
      </div>
    </FormDialog>
  );
}