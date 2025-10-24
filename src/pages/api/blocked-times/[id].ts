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
    const { date, start_time, end_time, reason } = body;

    if (!date || !start_time || !end_time) {
      return new Response('Faltan campos requeridos', { status: 400 });
    }

    // Validar que start_time sea antes que end_time
    if (start_time >= end_time) {
      return new Response(
        'La hora de inicio debe ser antes que la hora de fin',
        { status: 400 },
      );
    }

    const { data, error } = await locals.supabase
      .from('blocked_times')
      .update({
        date,
        start_time,
        end_time,
        reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar tiempo bloqueado:', error);
      return new Response('Error al actualizar tiempo bloqueado', {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en PUT /api/blocked-times/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { profile } = locals;
  const { id } = params;

  if (!profile || profile.role !== 'admin') {
    return new Response('No autorizado', { status: 403 });
  }

  if (!id) {
    return new Response('ID requerido', { status: 400 });
  }

  try {
    const { error } = await locals.supabase
      .from('blocked_times')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar tiempo bloqueado:', error);
      return new Response('Error al eliminar tiempo bloqueado', {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en DELETE /api/blocked-times/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
