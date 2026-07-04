import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Building2, Globe, Phone, Mail, MapPin, Users, Calendar, Hash, Star, Lock, CheckCircle } from "lucide-react";

export default function ClientPortal() {
  const [code, setCode] = useState("");
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccess = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setCompany(null);
    try {
      const results = await base44.entities.Company.filter({ client_code: code.trim() });
      if (results.length === 0) {
        setError("كود الوصول غير صحيح. يرجى التحقق والمحاولة مجدداً.");
      } else {
        setCompany(results[0]);
      }
    } catch {
      setError("حدث خطأ، يرجى المحاولة مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/90 via-primary to-primary/70 flex flex-col items-center justify-center p-6" dir="rtl">
      {!company ? (
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white font-heading">بوابة العملاء</h1>
            <p className="text-white/70 mt-2">منصة فلك للموارد البشرية</p>
          </div>

          {/* Access Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">أدخل كود الوصول الخاص بمنشأتك</h2>
            </div>
            <div className="space-y-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: FLAK-20260001"
                className="text-center text-lg font-mono tracking-widest h-12"
                onKeyDown={(e) => e.key === "Enter" && handleAccess()}
              />
              {error && (
                <p className="text-destructive text-sm text-center bg-destructive/10 py-2 px-4 rounded-lg">{error}</p>
              )}
              <Button onClick={handleAccess} disabled={loading} className="w-full h-12 text-base font-bold bg-primary">
                {loading ? "جارٍ التحقق..." : "الدخول لبطاقة المنشأة"}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs text-center mt-4">
              كود الوصول مقدم من فريق فلك للموارد البشرية
            </p>
          </div>
        </div>
      ) : (
        <CompanyCard company={company} onBack={() => setCompany(null)} />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Badge({ label, value, color = "bg-primary/10 text-primary" }) {
  if (!value) return null;
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="font-bold text-sm mt-0.5 font-mono">{value}</p>
    </div>
  );
}

function CompanyCard({ company, onBack }) {
  const d = company;
  return (
    <div className="w-full max-w-2xl">
      {/* Header Card */}
      <div className="bg-gradient-to-l from-secondary/20 to-white rounded-2xl shadow-2xl overflow-hidden mb-4">
        {/* Top Banner */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-secondary" />
            <span className="text-white font-bold text-sm">بطاقة تعريف المنشأة</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-secondary" />
            <span className="text-secondary text-xs font-bold">موثّق</span>
          </div>
        </div>

        <div className="p-6">
          {/* Company Name & Sequential */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary font-heading">{d.name}</h2>
              {d.company_type && <p className="text-muted-foreground text-sm mt-1">{d.company_type}</p>}
            </div>
            <div className="text-left">
              {d.sequential_number && (
                <div className="bg-secondary/20 border border-secondary/40 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-muted-foreground">الرقم التسلسلي</p>
                  <p className="font-bold text-primary font-mono text-lg">{d.sequential_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Codes Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Badge label="السجل التجاري" value={d.commercial_register} />
            <Badge label="الرقم الموحد" value={d.unified_number} />
            {d.hrsd_number && <Badge label="وزارة الموارد البشرية" value={d.hrsd_number} />}
            {d.gosi_number && <Badge label="التأمينات الاجتماعية" value={d.gosi_number} />}
            {d.zakat_number && <Badge label="الزكاة والضريبة والجمارك" value={d.zakat_number} color="bg-amber-50 text-amber-700" />}
            {d.nitaqat_color && <Badge label="نطاق المنشأة" value={d.nitaqat_color} color="bg-green-50 text-green-700" />}
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-100">
            <InfoRow icon={MapPin} label="المقر الرئيسي" value={[d.address, d.city, d.region].filter(Boolean).join("، ")} />
            <InfoRow icon={Globe} label="الموقع الإلكتروني" value={d.website} />
            <InfoRow icon={Phone} label="رقم الهاتف" value={d.phone} />
            <InfoRow icon={Mail} label="البريد الإلكتروني" value={d.email} />
            <InfoRow icon={Users} label="المديرون" value={d.directors} />
            <InfoRow icon={Hash} label="رأس المال" value={d.capital ? `${d.capital.toLocaleString()} ريال سعودي` : null} />
            <InfoRow icon={Calendar} label="مدة السجل" value={[d.contract_start, d.contract_end].filter(Boolean).join(" — ")} />
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${d.contract_status === "نشط" ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm text-muted-foreground">{d.contract_status || "نشط"}</span>
            </div>
            {d.client_code && (
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono text-xs text-primary font-bold">{d.client_code}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={onBack} className="text-white/70 hover:text-white text-sm w-full text-center mt-2 transition-colors">
        ← العودة لبوابة الدخول
      </button>
    </div>
  );
}