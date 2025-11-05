import type { APIRoute } from 'astro';

interface CreatePetPayload {
  name: string;
  species: 'dog' | 'cat' | 'other';
  size: 'pequeño' | 'mediano' | 'grande';
  breed?: string;
  weight?: number;
  birth_date?: string;
  gender?: 'macho' | 'hembra';
  notes?: string;
  photo_url?: string;
}

/**
 * POST /api/appointments/admin
 *
 * Crea una cita desde el admin sin requerir que la mascota esté registrada
 * Usada para reservas telefónicas. Soporta múltiples servicios.
 *
 * Body:
 *   {
 *     pet_id?: string | null - Si existe. Si null, usar pet_data
 *     pet_data?: CreatePetPayload - Para crear nueva mascota si no existe
 *     service_ids: string[] (requerido) - Array de IDs de servicios
 *     scheduled_date: string (YYYY-MM-DD) (requerido)
 *     scheduled_time: string (HH:MM) (requerido)
 *     notes?: string
 *   }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    // Verificar que sea admin
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response('Solo administradores pueden crear citas', {
        status: 403,
      });
    }

    const body = await request.json();
    let {
      pet_id,
      pet_data,
      service_ids,
      scheduled_date,
      scheduled_time,
      notes,
    } = body;

    // Validar campos requeridos
    if (
      !service_ids ||
      !Array.isArray(service_ids) ||
      service_ids.length === 0 ||
      !scheduled_date ||
      !scheduled_time
    ) {
      return new Response(
        'Faltan campos requeridos (service_ids debe ser array no vacío, scheduled_date, scheduled_time)',
        { status: 400 },
      );
    }

    // Si no hay pet_id, debe haber pet_data
    if (!pet_id && !pet_data) {
      return new Response('Debe proporcionar pet_id o pet_data', {
        status: 400,
      });
    }

    // Crear mascota si no existe
    if (!pet_id && pet_data) {
      const {
        name,
        species,
        size,
        breed,
        weight,
        birth_date,
        gender,
        photo_url,
      } = pet_data as CreatePetPayload;

      if (!name || !species || !size) {
        return new Response('pet_data: name, species y size son requeridos', {
          status: 400,
        });
      }

      const { data: newPet, error: petError } = await locals.supabase
        .from('pets')
        .insert({
          owner_id: null,
          name,
          species,
          size,
          breed,
          weight,
          birth_date,
          gender,
          notes: pet_data.notes,
          photo_url,
        })
        .select()
        .single();

      if (petError) {
        console.error('Error al crear mascota:', petError);
        return new Response('Error al crear mascota', { status: 500 });
      }

      pet_id = newPet.id;
    }

    // Verificar que la mascota existe
    const { data: pet, error: petFetchError } = await locals.supabase
      .from('pets')
      .select('id, name, species, owner_id')
      .eq('id', pet_id)
      .single();

    if (petFetchError || !pet) {
      return new Response('Mascota no encontrada', { status: 404 });
    }

    // Obtener información de todos los servicios
    const { data: services, error: servicesError } = await locals.supabase
      .from('services')
      .select('id, name, duration_minutes, price')
      .in('id', service_ids);

    if (servicesError || !services || services.length === 0) {
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
    const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Crear la cita
    const { data: appointmentData, error: appointmentError } =
      await locals.supabase
        .from('appointments')
        .insert({
          client_id: user.id, // El admin que crea la cita
          pet_id,
          scheduled_date,
          scheduled_time,
          end_time,
          total_duration_minutes,
          total_price,
          status: 'pending',
          notes: notes || null,
        })
        .select()
        .single();

    if (appointmentError) {
      console.error('Error al crear cita:', appointmentError);
      return new Response('Error al crear la cita', { status: 500 });
    }

    // Insertar servicios en la tabla de unión
    const appointmentServices = service_ids.map((sid, index) => ({
      appointment_id: appointmentData.id,
      service_id: sid,
      order_index: index,
    }));

    const { error: servicesInsertError } = await locals.supabase
      .from('appointment_services')
      .insert(appointmentServices);

    if (servicesInsertError) {
      console.error('Error al agregar servicios a cita:', servicesInsertError);
      // Eliminar la cita si falla al insertar servicios
      await locals.supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentData.id);
      return new Response('Error al crear la cita', { status: 500 });
    }

    // Obtener la cita completa con servicios
    const { data: appointment } = await locals.supabase
      .from('appointments')
      .select(
        `
        *,
        appointment_services(
          order_index,
          services(id, name, price, duration_minutes)
        ),
        pets(id, name, species, breed, owner_id)
      `,
      )
      .eq('id', appointmentData.id)
      .single();

    if (!appointment) {
      console.error('Error al obtener cita creada');
      return new Response('Error al obtener la cita', { status: 500 });
    }

    return new Response(JSON.stringify(appointment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en POST /api/appointments/admin:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
