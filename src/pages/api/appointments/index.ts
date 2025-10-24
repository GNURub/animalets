import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, profile } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const body = await request.json();
    const { service_id, pet_id, scheduled_date, scheduled_time, notes } = body;

    // Validar campos requeridos
    if (!service_id || !pet_id || !scheduled_date || !scheduled_time) {
      return new Response('Faltan campos requeridos', { status: 400 });
    }

    // Verificar que la mascota pertenece al usuario
    const { data: pet } = await locals.supabase
      .from('pets')
      .select('owner_id')
      .eq('id', pet_id)
      .single();

    if (!pet || pet.owner_id !== user.id) {
      return new Response('No autorizado', { status: 403 });
    }

    // Obtener información del servicio
    const { data: service } = await locals.supabase
      .from('services')
      .select('duration_minutes, price')
      .eq('id', service_id)
      .single();

    if (!service) {
      return new Response('Servicio no encontrado', { status: 404 });
    }

    // Verificar que el slot está disponible
    const verifyResponse = await fetch(
      `${new URL(request.url).origin}/api/slots/available`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: scheduled_date,
          service_id,
          duration: service.duration_minutes,
        }),
      }
    );

    if (verifyResponse.ok) {
      const slots = await verifyResponse.json();
      const selectedSlot = slots.find((s: any) => s.time === scheduled_time);

      if (!selectedSlot || !selectedSlot.available) {
        return new Response('El horario seleccionado no está disponible', {
          status: 400,
        });
      }
    }

    // Calcular end_time
    const [hours, minutes] = scheduled_time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + service.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const end_time = `${String(endHours).padStart(2, '0')}:${String(
      endMins
    ).padStart(2, '0')}`;

    // Crear la cita
    const { data, error } = await locals.supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        service_id,
        pet_id,
        scheduled_date,
        scheduled_time,
        end_time,
        status: 'pending',
        notes,
      })
      .select(
        `
        *,
        services(name, price, duration_minutes),
        pets(name, species),
        profiles(full_name, email, phone)
      `
      )
      .single();

    if (error) {
      console.error('Error al crear cita:', error);
      return new Response('Error al crear la cita', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en POST /api/appointments:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const GET: APIRoute = async ({ locals, url }) => {
  const { user } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = locals.supabase
      .from('appointments')
      .select(
        `
        *,
        services(name, price, duration_minutes),
        pets(name, species, breed),
        profiles(full_name, email, phone)
      `
      )
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener citas:', error);
      return new Response('Error al obtener citas', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/appointments:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
