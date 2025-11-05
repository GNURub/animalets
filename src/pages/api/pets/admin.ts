import type { APIRoute } from 'astro';

/**
 * POST /api/pets/admin
 *
 * Crea una mascota sin propietario (solo admin)
 * Usada para reservas telefónicas cuando no se conoce al cliente
 *
 * Body:
 *   {
 *     name: string (requerido)
 *     species: 'dog' | 'cat' | 'other' (requerido)
 *     size: 'pequeño' | 'mediano' | 'grande' (requerido)
 *     breed?: string
 *     weight?: number
 *     birth_date?: date
 *     gender?: 'macho' | 'hembra'
 *     notes?: string
 *     photo_url?: string
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
      return new Response('Solo administradores pueden crear mascotas', {
        status: 403,
      });
    }

    const body = await request.json();
    const {
      name,
      species,
      breed,
      weight,
      birth_date,
      gender,
      notes,
      size,
      photo_url,
    } = body;

    // Validar campos requeridos
    if (!name || !species || !size) {
      return new Response('Nombre, especie y tamaño son requeridos', {
        status: 400,
      });
    }

    // Validar especie
    if (!['dog', 'cat', 'other'].includes(species)) {
      return new Response('Especie inválida', { status: 400 });
    }

    // Validar tamaño
    if (!['pequeño', 'mediano', 'grande'].includes(size)) {
      return new Response('Tamaño inválido', { status: 400 });
    }

    // Validar género si se proporciona
    if (gender && !['macho', 'hembra'].includes(gender)) {
      return new Response('Género inválido', { status: 400 });
    }

    // Crear mascota sin dueño (owner_id = NULL)
    const { data, error } = await locals.supabase
      .from('pets')
      .insert({
        owner_id: null, // Mascota sin propietario
        name,
        species,
        breed,
        weight,
        birth_date,
        gender,
        notes,
        size,
        photo_url,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear mascota admin:', error);
      return new Response('Error al crear mascota', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en POST /api/pets/admin:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
