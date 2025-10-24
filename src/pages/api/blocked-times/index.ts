import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const { profile } = locals;

  if (!profile || profile.role !== 'admin') {
    return new Response('No autorizado', { status: 403 });
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
      .insert({
        date,
        start_time,
        end_time,
        reason,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear tiempo bloqueado:', error);
      return new Response('Error al crear tiempo bloqueado', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en POST /api/blocked-times:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const fromDate =
      url.searchParams.get('from') || new Date().toISOString().split('T')[0];

    const { data, error } = await locals.supabase
      .from('blocked_times')
      .select('*')
      .gte('date', fromDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error al obtener tiempos bloqueados:', error);
      return new Response('Error al obtener tiempos bloqueados', {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/blocked-times:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
