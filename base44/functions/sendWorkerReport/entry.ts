import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { workerId, emails } = await req.json();
    if (!workerId || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'workerId and emails are required' }, { status: 400 });
    }

    const [worker, companies, tasks, logs] = await Promise.all([
      base44.entities.RemoteWorker.get(workerId),
      base44.entities.Company.list(),
      base44.entities.Task.filter({ worker_id: workerId }),
      base44.entities.PerformanceLog.filter({ worker_id: workerId }),
    ]);
    if (!worker) return Response.json({ error: 'Worker not found' }, { status: 404 });

    const company = companies.find((c) => c.id === worker.company_id);
    const tasksAssigned = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.status === 'مكتملة').length;
    const completionRate = tasksAssigned ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;
    const totalHours = logs.reduce((s, l) => s + (l.hours_worked || 0), 0);
    const loginCount = logs.length;
    const activityLevels = logs.map((l) => l.activity_level).filter(Boolean);
    const mostCommonActivity = activityLevels.length
      ? activityLevels.sort((a, b) => activityLevels.filter((v) => v === a).length - activityLevels.filter((v) => v === b).length).pop()
      : '—';

    const points = [
      ['الاسم الكامل', worker.full_name],
      ['رقم الهوية', worker.national_id],
      ['الجنس', worker.gender],
      ['من ذوي الإعاقة', worker.is_disabled ? 'نعم' : 'لا'],
      ['رقم الجوال', worker.phone || '—'],
      ['البريد الإلكتروني', worker.email || '—'],
      ['المدينة', worker.city || '—'],
      ['المنطقة', worker.region || '—'],
      ['المسمى الوظيفي', worker.job_title || '—'],
      ['نوع الدوام', worker.work_type],
      ['الراتب', worker.salary ? `${worker.salary} ر.س` : '—'],
      ['المنشأة', company?.name || '—'],
      ['حالة العقد', worker.status],
      ['تاريخ بداية العقد', worker.contract_start || '—'],
      ['تاريخ نهاية العقد', worker.contract_end || '—'],
      ['أيام العمل المتفق عليها', `${worker.agreed_work_days || 0} أيام/أسبوع`],
      ['أيام الإجازة السنوية', `${worker.annual_leave_days || 0} يوم`],
      ['عدد المهام الموكلة', tasksAssigned],
      ['عدد المهام المنجزة', tasksCompleted],
      ['نسبة الإنجاز', `${completionRate}%`],
      ['إجمالي ساعات العمل المسجلة', `${totalHours} ساعة`],
      ['عدد مرات تسجيل الدخول والخروج', loginCount],
      ['مستوى النشاط الأكثر تكراراً', mostCommonActivity],
    ];

    const rowsHtml = points
      .map(([label, value], i) => `
        <tr>
          <td style="padding:8px 12px;color:#888;font-size:12px;">${i + 1}.</td>
          <td style="padding:8px 12px;color:#555;font-size:13px;">${label}</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:600;">${value}</td>
        </tr>`)
      .join('');

    const body = `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="color:#1e3a5f;">تقرير أداء العامل عن بُعد</h2>
        <p style="color:#888;font-size:13px;">وفق معايير وزارة الموارد البشرية والتنمية الاجتماعية — تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">${rowsHtml}</table>
      </div>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `فلك للموارد البشرية <${Deno.env.get('RESEND_FROM_EMAIL')}>`,
        to: emails,
        subject: `تقرير أداء الموظف: ${worker.full_name}`,
        html: body,
      }),
    });
    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return Response.json({ error: `Resend error: ${errText}` }, { status: 500 });
    }

    return Response.json({ success: true, sentTo: emails });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});