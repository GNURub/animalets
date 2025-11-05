import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, profile } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const body = await request.json();
    const { service_ids, pet_id, scheduled_date, scheduled_time, notes } = body;

    // Validar campos requeridos
    if (
      !service_ids ||
      !Array.isArray(service_ids) ||
      service_ids.length === 0 ||
      !pet_id ||
      !scheduled_date ||
      !scheduled_time
    ) {
      return new Response(
        'Faltan campos requeridos (service_ids debe ser array no vacío)',
        { status: 400 },
      );
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

    // Obtener información de todos los servicios
    const { data: services } = await locals.supabase
      .from('services')
      .select('id, duration_minutes, price')
      .in('id', service_ids);

    if (!services || services.length === 0) {
      return new Response('Servicios no encontrados', { status: 404 });
    }

    // Validar que todos los service_ids existen
    if (services.length !== service_ids.length) {
      return new Response('Uno o más servicios no existen', { status: 404 });
    }

    // Calcular totales
    const total_duration_minutes = services.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    );
    const total_price = services.reduce((sum, s) => sum + s.price, 0);

    // Calcular end_time basado en duración total
    const [hours, minutes] = scheduled_time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + total_duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const end_time = `${String(endHours).padStart(2, '0')}:${String(
      endMins,
    ).padStart(2, '0')}`;

    // Crear la cita
    const { data: appointmentData, error: appointmentError } =
      await locals.supabase
        .from('appointments')
        .insert({
          client_id: user.id,
          pet_id,
          scheduled_date,
          scheduled_time,
          end_time,
          total_duration_minutes,
          total_price,
          status: 'pending',
          notes,
        })
        .select()
        .single();

    if (appointmentError) {
      console.error('Error al crear cita:', appointmentError);
      return new Response('Error al crear la cita', { status: 500 });
    }

    // Insertar servicios en la tabla de unión
    const appointmentServices = service_ids.map((service_id, index) => ({
      appointment_id: appointmentData.id,
      service_id,
      order_index: index,
    }));

    const { error: servicesError } = await locals.supabase
      .from('appointment_services')
      .insert(appointmentServices);

    if (servicesError) {
      console.error('Error al agregar servicios a cita:', servicesError);
      // Eliminar la cita si falla al insertar servicios
      await locals.supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentData.id);
      return new Response('Error al crear la cita', { status: 500 });
    }

    // Obtener la cita completa con servicios
    const { data: completeAppointment } = await locals.supabase
      .from('appointments')
      .select(
        `
        *,
        appointment_services(
          order_index,
          services(id, name, price, duration_minutes)
        ),
        pets(name, species),
        profiles(full_name, email, phone)
      `,
      )
      .eq('id', appointmentData.id)
      .single();

    return new Response(JSON.stringify(completeAppointment), {
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
        appointment_services(
          order_index,
          services(name, price, duration_minutes)
        ),
        pets(name, species, breed),
        profiles(full_name, email, phone)
      `,
      )
      .eq('client_id', user.id)
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
