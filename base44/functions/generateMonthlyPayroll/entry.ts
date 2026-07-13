import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const WEEKLY_HOURS_TARGET = 48;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let period = null;
    try {
      const body = await req.json();
      period = body?.period || null;
    } catch {
      period = null;
    }

    const now = new Date();
    let year, month;
    if (period && /^\d{4}-\d{2}$/.test(period)) {
      [year, month] = period.split('-').map(Number);
    } else {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      year = prevMonthDate.getFullYear();
      month = prevMonthDate.getMonth() + 1;
    }
    const periodKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const daysInMonth = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);
    const targetHours = Math.round((daysInMonth / 7) * WEEKLY_HOURS_TARGET);

    const [workers, tasks, existingPayrolls] = await Promise.all([
      base44.asServiceRole.entities.RemoteWorker.filter({}),
      base44.asServiceRole.entities.Task.filter({}),
      base44.asServiceRole.entities.Payroll.filter({ period: periodKey }),
    ]);

    const alreadyIssued = new Set(existingPayrolls.map((p) => p.worker_id));
    const eligibleWorkers = workers.filter((w) => w.salary > 0 && w.status !== 'منتهي' && !alreadyIssued.has(w.id));

    const results = [];
    for (const worker of eligibleWorkers) {
      const workerTasks = tasks.filter((t) => {
        if (t.worker_id !== worker.id || !t.updated_date) return false;
        const updated = new Date(t.updated_date);
        return updated >= monthStart && updated < monthEnd;
      });
      const actualHours = Math.round(workerTasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0) * 100) / 100;
      const hourlyRate = worker.salary / targetHours;
      const rawWage = actualHours * hourlyRate;
      const calculatedWage = Math.round(Math.min(rawWage, worker.salary) * 100) / 100;
      const compliancePercentage = Math.min(100, Math.round((actualHours / targetHours) * 100));

      const payroll = await base44.asServiceRole.entities.Payroll.create({
        worker_id: worker.id,
        company_id: worker.company_id,
        period: periodKey,
        target_hours: targetHours,
        actual_hours: actualHours,
        compliance_percentage: compliancePercentage,
        hourly_rate: Math.round(hourlyRate * 100) / 100,
        base_salary: worker.salary,
        calculated_wage: calculatedWage,
        status: 'مصدر',
        issue_date: new Date().toISOString().slice(0, 10),
      });
      results.push(payroll);

      if (worker.email) {
        const emailHtml = `
        <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif; background-color: #f3f4f6; padding: 24px;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="background: #16336b; padding: 20px 24px;">
              <h1 style="color: #ffffff; font-size: 18px; margin: 0;">فلك للموارد البشرية</h1>
            </div>
            <div style="padding: 28px 24px;">
              <p style="font-size: 15px; color: #111827; margin: 0 0 16px 0;">مرحباً <strong>${worker.full_name}</strong>،</p>
              <p style="font-size: 14px; color: #374151; margin: 0 0 20px 0;">تم إصدار تقرير راتبك عن الفترة <strong>${periodKey}</strong>.</p>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 14px;"><span style="color: #6b7280;">ساعات العمل الفعلية:</span> <strong>${actualHours} ساعة</strong></p>
                <p style="margin: 0 0 8px 0; font-size: 14px;"><span style="color: #6b7280;">الساعات المستهدفة (48س/أسبوع):</span> <strong>${targetHours} ساعة</strong></p>
                <p style="margin: 0 0 8px 0; font-size: 14px;"><span style="color: #6b7280;">نسبة التغطية:</span> <strong>${compliancePercentage}%</strong></p>
                <p style="margin: 0 0 8px 0; font-size: 14px;"><span style="color: #6b7280;">الأجر بالساعة:</span> <strong>${(Math.round(hourlyRate * 100) / 100).toFixed(2)} ر.س</strong></p>
                <p style="margin: 0; font-size: 15px;"><span style="color: #6b7280;">صافي الراتب المستحق:</span> <strong style="color: #16336b;">${calculatedWage.toFixed(2)} ر.س</strong></p>
              </div>
              <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0 0;">مع تحيات فريق فلك للموارد البشرية</p>
            </div>
          </div>
        </div>`;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `فلك للموارد البشرية <${Deno.env.get('RESEND_FROM_EMAIL')}>`,
            to: [worker.email],
            subject: `تقرير راتب شهر ${periodKey}`,
            html: emailHtml,
          }),
        }).catch(() => null);
      }
    }

    return Response.json({ success: true, period: periodKey, generated: results.length, skipped: alreadyIssued.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});