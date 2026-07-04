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

    const categoryContext = {
      'برنامج الإدارة الرشيدة': 'هذا مشروع ضمن برنامج الإدارة الرشيدة، ويغطي مراحل تأسيس وتشغيل منشأة في السعودية: حجز اسم تجاري، إصدار السجل التجاري، فتح ملف منشأة في وزارة الموارد البشرية والتنمية الاجتماعية، تسجيل المنشأة في التأمينات الاجتماعية، استئجار موقع، استخراج موافقة الدفاع المدني، استخراج رخصة البلدية، استخراج التأشيرات، تصميم العلامة التجارية، الحملة التسويقية، الإطلاق، والتوسع بالعمل. ولّد المهام المتبقية التي لم تُنجز بعد بنفس الترتيب المنطقي لهذه المراحل.',
      'أنظمة البرمجيات كخدمة': 'هذا مشروع ضمن قائمة أنظمة البرمجيات كخدمة (SaaS)، ويشمل بناء وتشغيل أنظمة مثل إدارة الموارد البشرية HRM، إدارة علاقات العملاء CRM، وتخطيط موارد المؤسسة ERP. ولّد مهام تطوير وتشغيل واقعية لهذه الأنظمة.',
      'المشاريع الرقمية': 'هذا مشروع ضمن قائمة المشاريع الرقمية، ويشمل إدارة وتشغيل تطبيقات متخصصة مثل تطبيقات تأجير السيارات، تطبيقات النوادي الصحية، وتطبيقات إدارة المنتجات السياحية. ولّد مهام إدارة وتشغيل واقعية لهذا النوع من التطبيقات.',
    };
    const context = categoryContext[project.category] || '';

    const prompt = mode === 'initial'
      ? `${context}\nاقترح 5 مهام عمل واقعية ومفصلة لبدء مشروع بعنوان "${project.title}" ووصفه: "${project.description || ''}". لكل مهمة أعطِ عنواناً قصيراً ووصفاً من جملتين وأولوية (منخفضة/متوسطة/عالية/عاجلة).`
      : `${context}\nمشروع بعنوان "${project.title}" اكتملت جميع مهامه الحالية وهي: ${completedTitles.join('، ')}. اقترح 4 مهام تصاعدية جديدة (المراحل المتبقية أو مرحلة أعمق) تبني على ما تم إنجازه لدفع المشروع للأمام، مع عنوان قصير ووصف من جملتين وأولوية لكل مهمة.`;

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