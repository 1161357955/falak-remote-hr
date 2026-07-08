import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return Response.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const invoice = await base44.asServiceRole.entities.Invoice.get(invoiceId);
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const company = await base44.asServiceRole.entities.Company.get(invoice.company_id);
    if (!company?.email) {
      return Response.json({ error: 'Company has no email on file' }, { status: 400 });
    }

    const body = `
      <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto;">
        <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 22px;">فلك للموارد البشرية</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 18px;">فاتورة اشتراك شهرية</h2>
          <p>عزيزنا العميل، ${company.name}،</p>
          <p>نود تذكيركم بفاتورة اشتراك منصة فلك لإدارة العمل عن بُعد للفترة <strong>${invoice.period}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">رقم الفاتورة</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${invoice.invoice_number}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">عدد الموظفين عن بعد</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${invoice.workers_count}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">قيمة الاشتراك الشهري (100 ر.س × الموظفين)</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${invoice.subscription_amount} ر.س</td></tr>
            ${invoice.setup_fee_amount > 0 ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">رسوم التأسيس (مرة واحدة)</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${invoice.setup_fee_amount} ر.س</td></tr>` : ""}
            <tr><td style="padding: 8px; font-weight: bold;">الإجمالي المستحق</td><td style="padding: 8px; font-weight: bold; color: #1e3a5f;">${invoice.total_amount} ر.س</td></tr>
            <tr><td style="padding: 8px;">تاريخ الاستحقاق</td><td style="padding: 8px;">${invoice.due_date}</td></tr>
          </table>
          <p>نرجو سداد المبلغ في أقرب وقت ممكن. لأي استفسار، تواصلوا معنا في أي وقت.</p>
          <p style="margin-top: 24px; color: #64748b; font-size: 13px;">فلك للموارد البشرية - شريكك المعتمد في إدارة العمل عن بُعد</p>
        </div>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `فلك للموارد البشرية <${Deno.env.get('RESEND_FROM_EMAIL')}>`,
        to: [company.email],
        subject: `فاتورة اشتراك فلك - ${invoice.invoice_number}`,
        html: body,
      }),
    });
    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return Response.json({ error: `Resend error: ${errText}` }, { status: 500 });
    }

    await base44.asServiceRole.entities.Invoice.update(invoiceId, { reminder_sent: true });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});