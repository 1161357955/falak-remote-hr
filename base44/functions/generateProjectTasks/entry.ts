import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (!event) return Response.json({ error: 'Missing event' }, { status: 400 });

    let projectId = null;
    let mode = 'initial';

    if (event.entity_name === 'Project' && event.type === 'create') {
      projectId = event.entity_id;
      mode = 'initial';
    } else if (event.entity_name === 'Task' && event.type === 'update') {
      if (data?.status !== 'مكتملة' || !data?.project_id) {
        return Response.json({ skipped: true, reason: 'Task not completed' });
      }
      projectId = data.project_id;
      mode = 'escalation';
    } else {
      return Response.json({ skipped: true, reason: 'Event not relevant' });
    }

    const project = await base44.asServiceRole.entities.Project.get(projectId);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    const existingTasks = await base44.asServiceRole.entities.Task.filter({ project_id: projectId });

    if (mode === 'escalation') {
      const allCompleted = existingTasks.length > 0 && existingTasks.every((t) => t.status === 'مكتملة' || t.status === 'ملغاة');
      if (!allCompleted) {
        return Response.json({ skipped: true, reason: 'Project has pending tasks' });
      }
      if (project.progress >= 100) {
        return Response.json({ skipped: true, reason: 'Project already complete' });
      }
    }

    const completedTitles = existingTasks.filter((t) => t.status === 'مكتملة').map((t) => t.title);
    const prompt = mode === 'initial'
      ? `اقترح 5 مهام عمل واقعية ومفصلة لبدء مشروع بعنوان "${project.title}" ووصفه: "${project.description || ''}". لكل مهمة أعطِ عنواناً قصيراً ووصفاً من جملتين وأولوية (منخفضة/متوسطة/عالية/عاجلة).`
      : `مشروع بعنوان "${project.title}" اكتملت جميع مهامه الحالية وهي: ${completedTitles.join('، ')}. اقترح 4 مهام تصاعدية جديدة (مرحلة أعمق أو أكثر تقدماً) تبني على ما تم إنجازه لدفع المشروع للمرحلة التالية، مع عنوان قصير ووصف من جملتين وأولوية لكل مهمة.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['منخفضة', 'متوسطة', 'عالية', 'عاجلة'] },
              },
            },
          },
        },
      },
    });

    const newTasks = (result.tasks || []).map((t) => ({ ...t, project_id: projectId, status: 'جديدة' }));
    if (newTasks.length > 0) {
      await base44.asServiceRole.entities.Task.bulkCreate(newTasks);
    }

    return Response.json({ success: true, mode, created: newTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});