import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { profile } = locals;
  const { id } = params;

  if (!profile || profile.role !== 'admin') {
    return new Response('No autorizado', { status: 403 });
  }

  if (!id) {
    return new Response('ID requerido', { status: 400 });
  }

  try {
    const body = await request.json();
    const { day_of_week, open_time, close_time, is_closed } = body;

    if (
      day_of_week === undefined ||
      !open_time ||
      !close_time ||
      is_closed === undefined
    ) {
      return new Response('Faltan campos requeridos', { status: 400 });
    }

    const { data, error } = await locals.supabase
      .from('business_hours')
      .update({
        day_of_week,
        open_time,
        close_time,
        is_closed,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar horario:', error);
      return new Response('Error al actualizar horario', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en PUT /api/business-hours/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
