import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const company = payload?.data;
    if (!company) {
      return Response.json({ error: 'No company data in payload' }, { status: 400 });
    }

    await base44.asServiceRole.entities.CashTransaction.create({
      type: "رسوم تأسيس",
      company_id: payload.event.entity_id,
      amount: 3500,
      date: new Date().toISOString().slice(0, 10),
      status: "مدفوع",
      notes: `رسوم تأسيس منشأة جديدة: ${company.name || ""}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});