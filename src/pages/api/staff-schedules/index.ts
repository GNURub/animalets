import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data, error } = await locals.supabase
      .from('staff_schedules')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching staff schedules:', error);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/staff-schedules:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { profile } = locals;

    if (!profile || profile.role !== 'admin') {
      return new Response('No autorizado', { status: 403 });
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
      .insert({
        day_of_week,
        start_time,
        end_time,
        staff_count,
        appointments_per_hour,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating staff schedule:', error);
      return new Response('Error al crear: ' + error.message, { status: 400 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in POST /api/staff-schedules:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
