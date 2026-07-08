import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const companies = await base44.asServiceRole.entities.Company.list();
    const today = new Date();
    const period = today.toISOString().slice(0, 7);
    const issueDate = today.toISOString().slice(0, 10);
    const dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const createdInvoiceIds = [];

    for (const company of companies) {
      const workers = await base44.asServiceRole.entities.RemoteWorker.filter({ company_id: company.id, status: "نشط" });
      const workersCount = workers.length;
      const subscriptionAmount = workersCount * 100;
      const setupFeeAmount = company.setup_fee_invoiced ? 0 : 3500;
      const totalAmount = subscriptionAmount + setupFeeAmount;

      if (totalAmount <= 0) continue;

      const invoiceNumber = `INV-${(company.client_code || company.id.slice(-6)).toString().toUpperCase()}-${period}`;

      const invoice = await base44.asServiceRole.entities.Invoice.create({
        invoice_number: invoiceNumber,
        company_id: company.id,
        period,
        workers_count: workersCount,
        subscription_amount: subscriptionAmount,
        setup_fee_amount: setupFeeAmount,
        total_amount: totalAmount,
        issue_date: issueDate,
        due_date: dueDate,
        status: "غير مدفوعة",
      });

      if (setupFeeAmount > 0) {
        await base44.asServiceRole.entities.Company.update(company.id, { setup_fee_invoiced: true });
      }

      createdInvoiceIds.push(invoice.id);

      if (company.email) {
        await base44.functions.invoke('sendInvoiceReminder', { invoiceId: invoice.id });
      }
    }

    return Response.json({ success: true, invoicesCreated: createdInvoiceIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});