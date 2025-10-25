import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { profile } = locals;
    const { id } = params;

    if (!profile || profile.role !== 'admin') {
      return new Response('No autorizado', { status: 403 });
    }

    if (!id) {
      return new Response('ID requerido', { status: 400 });
    }

    const body = await request.json();
    const {
      day_of_week,
      start_time,
      end_time,
      staff_count = 1,
      appointments_per_hour = 1,
    } = body;

    // Validaciones
    if (
      day_of_week === undefined ||
      !start_time ||
      !end_time ||
      typeof appointments_per_hour !== 'number'
    ) {
      return new Response('Faltan campos requeridos o inválidos', {
        status: 400,
      });
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return new Response('day_of_week debe estar entre 0 y 6', {
        status: 400,
      });
    }

    if (appointments_per_hour < 1) {
      return new Response('appointments_per_hour debe ser >= 1', {
        status: 400,
      });
    }

    const { data, error } = await locals.supabase
      .from('staff_schedules')
      .update({
        day_of_week,
        start_time,
        end_time,
        staff_count,
        appointments_per_hour,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff schedule:', error);
      return new Response('Error al actualizar: ' + error.message, {
        status: 400,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in PUT /api/staff-schedules/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { profile } = locals;
    const { id } = params;

    if (!profile || profile.role !== 'admin') {
      return new Response('No autorizado', { status: 403 });
    }

    if (!id) {
      return new Response('ID requerido', { status: 400 });
    }

    const { error } = await locals.supabase
      .from('staff_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staff schedule:', error);
      return new Response('Error al eliminar', { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/staff-schedules/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
