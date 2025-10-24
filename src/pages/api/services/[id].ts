import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { profile } = locals;
  const { id } = params;

  if (!profile || profile.role !== 'admin') {
    return new Response('No autorizado', { status: 403 });
  }

  if (!id) {
    return new Response('ID de servicio requerido', { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, description, duration_minutes, price, is_active } = body;

    if (!name || !duration_minutes || price === undefined) {
      return new Response('Faltan campos requeridos', { status: 400 });
    }

    const { data, error } = await locals.supabase
      .from('services')
      .update({
        name,
        description,
        duration_minutes,
        price,
        is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar servicio:', error);
      return new Response('Error al actualizar servicio', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en PUT /api/services/[id]:', error);
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
    return new Response('ID de servicio requerido', { status: 400 });
  }

  try {
    // Verificar si hay citas asociadas
    const { data: appointments } = await locals.supabase
      .from('appointments')
      .select('id')
      .eq('service_id', id)
      .limit(1);

    if (appointments && appointments.length > 0) {
      return new Response(
        'No se puede eliminar un servicio con citas asociadas',
        { status: 400 },
      );
    }

    const { error } = await locals.supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar servicio:', error);
      return new Response('Error al eliminar servicio', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en DELETE /api/services/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
