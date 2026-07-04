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

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: worker.email,
        subject: `تذكير: اقتراب موعد تسليم مهمة "${task.title}"`,
        body: `مرحباً ${worker.full_name},\n\nنود تذكيرك بأن موعد تسليم المهمة التالية يقترب:\n\nالمهمة: ${task.title}\nتاريخ التسليم: ${task.due_date}\nالأولوية: ${task.priority || "متوسطة"}\n\nيرجى إتمام المهمة في الوقت المحدد.\n\nمع تحيات فريق فلك للموارد البشرية`,
        from_name: "فلك للموارد البشرية",
      });
      remindersSent++;
    }

    return Response.json({ success: true, remindersSent, totalDueSoon: dueSoonTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});