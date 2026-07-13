import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Video, Plus, Trash2, Link as LinkIcon, CalendarClock, Users, X, CheckCircle2, Zap, LogIn, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import FormDialog from "@/components/shared/FormDialog";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  title: "", description: "", meeting_type: "جماعي", timing: "مجدول",
  meeting_date: "", meeting_time: "", duration_minutes: 30,
  meeting_link: "", participant_emails: [],
};

const statusColor = {
  "مجدولة": "bg-blue-100 text-blue-700",
  "منعقدة": "bg-emerald-100 text-emerald-700",
  "ملغاة": "bg-red-100 text-red-700",
};

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [highlightId] = useState(() => new URLSearchParams(window.location.search).get("meeting") || null);
  const [attendance, setAttendance] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [user, m, w, a] = await Promise.all([
        base44.auth.me(),
        base44.entities.Meeting.list("-meeting_date"),
        base44.entities.RemoteWorker.list(),
        base44.entities.MeetingAttendance.list("-joined_at"),
      ]);
      setCurrentUser(user);
      setMeetings(m);
      setWorkers(w);
      setAttendance(a);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantName = (email) => workers.find((w) => w.email === email)?.full_name || email;

  const getAttendance = (meetingId) => attendance.filter((a) => a.meeting_id === meetingId);

  const handleJoin = async (m) => {
    await base44.entities.MeetingAttendance.create({
      meeting_id: m.id,
      attendee_name: currentUser?.full_name,
      attendee_email: currentUser?.email,
      joined_at: new Date().toISOString(),
    });
    if (m.status === "مجدولة") {
      await base44.entities.Meeting.update(m.id, { status: "منعقدة" });
    }
    await loadData();
    toast({ title: "تم تسجيل انضمامك للاجتماع" });
    if (m.meeting_link) window.open(m.meeting_link, "_blank");
  };

  const toggleParticipant = (email) => {
    setForm((f) => ({
      ...f,
      participant_emails: f.participant_emails.includes(email)
        ? f.participant_emails.filter((e) => e !== email)
        : [...f.participant_emails, email],
    }));
  };

  const handleSave = async () => {
    const isInstant = form.timing === "فوري";
    if (!form.title || (!isInstant && !form.meeting_date)) {
      toast({ title: "خطأ", description: "عنوان الاجتماع وتاريخه مطلوبان", variant: "destructive" });
      return;
    }
    if (form.participant_emails.length === 0) {
      toast({ title: "خطأ", description: "اختر مشاركاً واحداً على الأقل", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const payload = isInstant
        ? {
            ...form,
            meeting_date: now.toISOString().slice(0, 10),
            meeting_time: now.toTimeString().slice(0, 5),
            status: "منعقدة",
          }
        : form;
      const meeting = await base44.entities.Meeting.create({
        ...payload,
        organizer_name: currentUser?.full_name,
        organizer_email: currentUser?.email,
      });
      await base44.entities.Notification.bulkCreate(
        form.participant_emails.map((email) => ({
          recipient_email: email,
          title: isInstant ? `اجتماع فوري الآن: ${form.title}` : `دعوة اجتماع: ${form.title}`,
          message: isInstant
            ? `${currentUser?.full_name || "المنظم"} بدأ اجتماعاً فورياً الآن${form.meeting_link ? ` - ${form.meeting_link}` : ""}`
            : `بتاريخ ${form.meeting_date}${form.meeting_time ? ` - ${form.meeting_time}` : ""} من ${currentUser?.full_name || "المنظم"}`,
          meeting_id: meeting.id,
        }))
      );
      setDialogOpen(false);
      setForm(emptyForm);
      loadData();
      toast({ title: isInstant ? "تم بدء الاجتماع الفوري وإشعار المشاركين" : "تم إنشاء الاجتماع وإشعار المشاركين" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.Meeting.update(id, { status });
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const handleDelete = async (id) => {
    await base44.entities.Meeting.delete(id);
    loadData();
    toast({ title: "تم حذف الاجتماع" });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="الاجتماعات" description="تنسيق الاجتماعات الجماعية والثنائية داخل الفريق">
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> اجتماع جديد
        </Button>
      </PageHeader>

      {meetings.length === 0 ? (
        <EmptyState icon={Video} title="لا توجد اجتماعات" description="ابدأ بإنشاء اجتماع جديد مع فريقك" />
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div key={m.id} className={`bg-card border rounded-2xl p-5 ${highlightId === m.id ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Video className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">{m.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{m.meeting_type}</span>
                    {m.timing === "فوري" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> فوري
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[m.status] || ""}`}>{m.status}</span>
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground mb-2">{m.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {m.meeting_date}{m.meeting_time ? ` - ${m.meeting_time}` : ""} ({m.duration_minutes || 30} دقيقة)</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(m.participant_emails || []).map(getParticipantName).join("، ") || "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => handleJoin(m)}><LogIn className="w-3.5 h-3.5" /> انضمام</Button>
                  {m.meeting_link && (
                    <a href={m.meeting_link} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> رابط الاجتماع</Button>
                    </a>
                  )}
                  <Select value={m.status} onValueChange={(v) => handleStatusChange(m.id, v)}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مجدولة">مجدولة</SelectItem>
                      <SelectItem value="منعقدة">منعقدة</SelectItem>
                      <SelectItem value="ملغاة">ملغاة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <button
                className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5 hover:text-foreground"
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              >
                <ListChecks className="w-3.5 h-3.5" /> سجل الحضور ({getAttendance(m.id).length})
              </button>
              {expandedId === m.id && (
                <div className="mt-2 border-t pt-2 space-y-1">
                  {getAttendance(m.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا يوجد حضور مسجل بعد</p>
                  ) : (
                    getAttendance(m.id).map((a) => (
                      <div key={a.id} className="text-xs flex items-center justify-between text-muted-foreground">
                        <span>{a.attendee_name || a.attendee_email}</span>
                        <span>{new Date(a.joined_at).toLocaleString("ar-SA")}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title="اجتماع جديد">
        <div className="space-y-4">
          <div><Label>عنوان الاجتماع *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نوع الاجتماع</Label>
              <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="جماعي">جماعي</SelectItem>
                  <SelectItem value="فردي">فردي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التوقيت</Label>
              <Select value={form.timing} onValueChange={(v) => setForm({ ...form, timing: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="مجدول">مجدول</SelectItem>
                  <SelectItem value="فوري">فوري (الآن)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.timing === "فوري" ? (
            <p className="text-xs text-muted-foreground bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-red-500" /> سيبدأ الاجتماع فوراً الآن وسيُشعر جميع المشاركين مباشرة.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>التاريخ *</Label><Input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} /></div>
              <div><Label>الوقت</Label><Input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>المدة (دقيقة)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
            <div><Label>رابط الاجتماع (اختياري)</Label><Input value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} placeholder="https://..." /></div>
          </div>
          <div>
            <Label>المشاركون *</Label>
            <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 mt-1">
              {workers.filter((w) => w.email).length === 0 ? (
                <p className="text-xs text-muted-foreground">لا يوجد موظفون ببريد إلكتروني مسجل</p>
              ) : (
                workers.filter((w) => w.email).map((w) => (
                  <div key={w.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.participant_emails.includes(w.email)}
                      onCheckedChange={() => toggleParticipant(w.email)}
                      id={`p-${w.id}`}
                    />
                    <Label htmlFor={`p-${w.id}`} className="text-sm font-normal cursor-pointer">{w.full_name}</Label>
                  </div>
                ))
              )}
            </div>
            {form.participant_emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.participant_emails.map((email) => (
                  <span key={email} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full flex items-center gap-1">
                    {getParticipantName(email)}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleParticipant(email)} />
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {form.timing === "فوري" ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "جارٍ الإنشاء..." : form.timing === "فوري" ? "بدء الاجتماع الآن" : "إنشاء الاجتماع"}
          </Button>
        </div>
      </FormDialog>
    </div>
  );
}