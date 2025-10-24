import type { APIRoute } from 'astro';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { profile } = locals;
  const { id } = params;

  if (!profile) {
    return new Response('No autorizado', { status: 401 });
  }

  // Solo admins pueden actualizar citas
  if (profile.role !== 'admin') {
    return new Response('No autorizado', { status: 403 });
  }

  if (!id) {
    return new Response('ID de cita requerido', { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    // Validar estado
    const validStatuses = [
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
    ];
    if (!status || !validStatuses.includes(status)) {
      return new Response('Estado inválido', { status: 400 });
    }

    const { data, error } = await locals.supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select(
        `
        *,
        services(name, duration_minutes, price),
        pets(name, species, breed),
        profiles(full_name, email, phone)
      `,
      )
      .single();

    if (error) {
      console.error('Error al actualizar cita:', error);
      return new Response('Error al actualizar cita', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en PATCH /api/appointments/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { profile } = locals;
  const { id } = params;

  if (!profile) {
    return new Response('No autorizado', { status: 401 });
  }

  // Solo admins pueden eliminar citas
  if (profile.role !== 'admin') {
    return new Response('No autorizado', { status: 403 });
  }

  if (!id) {
    return new Response('ID de cita requerido', { status: 400 });
  }

  try {
    const { error } = await locals.supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar cita:', error);
      return new Response('Error al eliminar cita', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en DELETE /api/appointments/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
