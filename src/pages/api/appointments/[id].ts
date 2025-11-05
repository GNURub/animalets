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
    const { status, scheduled_date, scheduled_time } = body;

    let updateData: any = {};

    // Actualizar estado
    if (status) {
      const validStatuses = [
        'pending',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return new Response('Estado inválido', { status: 400 });
      }
      updateData.status = status;
    }

    // Actualizar fecha y hora
    if (scheduled_date && scheduled_time) {
      // Obtener información del servicio para calcular end_time
      const { data: appointment } = await locals.supabase
        .from('appointments')
        .select('services(duration_minutes)')
        .eq('id', id)
        .single();

      if (!appointment) {
        return new Response('Cita no encontrada', { status: 404 });
      }

      const duration = (appointment.services as any)?.duration_minutes || 60;
      const [hours, minutes] = scheduled_time.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      updateData.scheduled_date = scheduled_date;
      updateData.scheduled_time = scheduled_time;
      updateData.end_time = end_time;
    }

    const { data, error } = await locals.supabase
      .from('appointments')
      .update(updateData)
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
