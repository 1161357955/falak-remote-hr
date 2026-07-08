import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workers = await base44.asServiceRole.entities.RemoteWorker.filter({ status: "نشط" });
    const today = new Date().toISOString().slice(0, 10);

    const records = workers.map((w) => ({
      type: "اشتراك شهري",
      company_id: w.company_id,
      worker_id: w.id,
      amount: 100,
      date: today,
      status: "مدفوع",
      notes: `اشتراك شهري للموظف: ${w.full_name || ""}`,
    }));

    if (records.length > 0) {
      await base44.asServiceRole.entities.CashTransaction.bulkCreate(records);
    }

    return Response.json({ success: true, count: records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});