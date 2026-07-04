import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const tasks = await base44.asServiceRole.entities.Task.filter({});
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soonLimit = new Date(today);
    soonLimit.setDate(soonLimit.getDate() + 2);

    const dueSoonTasks = tasks.filter((t) => {
      if (!t.due_date || t.status === "مكتملة" || t.status === "ملغاة") return false;
      const due = new Date(t.due_date);
      return due >= today && due <= soonLimit;
    });

    if (dueSoonTasks.length === 0) {
      return Response.json({ success: true, remindersSent: 0 });
    }

    const workerIds = [...new Set(dueSoonTasks.map((t) => t.worker_id).filter(Boolean))];
    const workers = await base44.asServiceRole.entities.RemoteWorker.filter({});
    const workersById = {};
    workers.forEach((w) => { workersById[w.id] = w; });

    let remindersSent = 0;
    for (const task of dueSoonTasks) {
      const worker = workersById[task.worker_id];
      if (!worker || !worker.email) continue;

      const emailHtml = `
      <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif; background-color: #f3f4f6; padding: 24px;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <div style="background: #16336b; padding: 20px 24px;">
            <h1 style="color: #ffffff; font-size: 18px; margin: 0;">فلك للموارد البشرية</h1>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; color: #111827; margin: 0 0 16px 0;">مرحباً <strong>${worker.full_name}</strong>،</p>
            <p style="font-size: 14px; color: #374151; margin: 0 0 20px 0;">نود تذكيرك بأن موعد تسليم إحدى مهامك يقترب، يرجى إتمامها في الوقت المحدد.</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 14px;"><span style="color: #6b7280;">المهمة:</span> <strong style="color: #16336b;">${task.title}</strong></p>
              <p style="margin: 0 0 8px 0; font-size: 14px;"><span style="color: #6b7280;">تاريخ التسليم:</span> <strong>${task.due_date}</strong></p>
              <p style="margin: 0; font-size: 14px;"><span style="color: #6b7280;">الأولوية:</span> <strong>${task.priority || "متوسطة"}</strong></p>
            </div>
            <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0 0;">مع تحيات فريق فلك للموارد البشرية</p>
          </div>
        </div>
      </div>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: worker.email,
        subject: `تذكير: اقتراب موعد تسليم مهمة "${task.title}"`,
        body: emailHtml,
        from_name: "فلك للموارد البشرية",
      });
      remindersSent++;
    }

    return Response.json({ success: true, remindersSent, totalDueSoon: dueSoonTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});