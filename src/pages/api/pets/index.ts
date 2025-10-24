import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, species, breed, birth_date, weight, notes, owner_id } = body;

    // Validar que el usuario solo puede crear mascotas para sí mismo
    if (owner_id !== user.id) {
      return new Response('No autorizado', { status: 403 });
    }

    // Validar campos requeridos
    if (!name || !species) {
      return new Response('Nombre y especie son requeridos', { status: 400 });
    }

    // Validar especie
    if (!['dog', 'cat', 'other'].includes(species)) {
      return new Response('Especie inválida', { status: 400 });
    }

    const { data, error } = await locals.supabase
      .from('pets')
      .insert({
        owner_id,
        name,
        species,
        breed,
        birth_date,
        weight,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear mascota:', error);
      return new Response('Error al crear mascota', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en POST /api/pets:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const { data, error } = await locals.supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener mascotas:', error);
      return new Response('Error al obtener mascotas', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/pets:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
