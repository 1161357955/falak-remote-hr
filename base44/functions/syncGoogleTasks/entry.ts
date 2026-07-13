import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const CONNECTOR_ID = '6a54eec5581e3af94b3c7638';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'sync';

    if (mode === 'status') {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return Response.json({ error: 'Google Tasks connection invalid' }, { status: 400 });
      return Response.json({ connected: true });
    }

    const workers = await base44.asServiceRole.entities.RemoteWorker.filter({ email: user.email });
    let tasks = [];
    if (workers.length > 0) {
      tasks = await base44.asServiceRole.entities.Task.filter({ worker_id: workers[0].id });
    } else if (user.role === 'admin') {
      tasks = await base44.asServiceRole.entities.Task.list();
    }

    const dueTasks = tasks.filter((t) => t.due_date && t.status !== 'مكتملة' && t.status !== 'ملغاة');

    let synced = 0;
    for (const task of dueTasks) {
      const taskBody = {
        title: task.title,
        notes: task.description || '',
        due: new Date(task.due_date).toISOString(),
      };

      if (task.google_task_id) {
        const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${task.google_task_id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(taskBody),
        });
        if (res.ok) synced++;
      } else {
        const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(taskBody),
        });
        if (res.ok) {
          const created = await res.json();
          await base44.asServiceRole.entities.Task.update(task.id, { google_task_id: created.id });
          synced++;
        }
      }
    }

    return Response.json({ success: true, synced, total: dueTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});