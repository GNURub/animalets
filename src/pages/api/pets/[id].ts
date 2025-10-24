import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  const { id } = params;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  if (!id) {
    return new Response('ID de mascota requerido', { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, species, breed, birth_date, weight, notes } = body;

    // Validar campos requeridos
    if (!name || !species) {
      return new Response('Nombre y especie son requeridos', { status: 400 });
    }

    // Validar especie
    if (!['dog', 'cat', 'other'].includes(species)) {
      return new Response('Especie inválida', { status: 400 });
    }

    // Verificar que la mascota pertenece al usuario
    const { data: existingPet } = await locals.supabase
      .from('pets')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!existingPet || existingPet.owner_id !== user.id) {
      return new Response('No autorizado', { status: 403 });
    }

    const { data, error } = await locals.supabase
      .from('pets')
      .update({
        name,
        species,
        breed,
        birth_date,
        weight,
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar mascota:', error);
      return new Response('Error al actualizar mascota', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en PUT /api/pets/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { user } = locals;
  const { id } = params;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  if (!id) {
    return new Response('ID de mascota requerido', { status: 400 });
  }

  try {
    // Verificar que la mascota pertenece al usuario
    const { data: existingPet } = await locals.supabase
      .from('pets')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!existingPet || existingPet.owner_id !== user.id) {
      return new Response('No autorizado', { status: 403 });
    }

    // Verificar si hay citas asociadas
    const { data: appointments } = await locals.supabase
      .from('appointments')
      .select('id')
      .eq('pet_id', id)
      .limit(1);

    if (appointments && appointments.length > 0) {
      return new Response(
        'No se puede eliminar una mascota con citas asociadas',
        { status: 400 },
      );
    }

    const { error } = await locals.supabase.from('pets').delete().eq('id', id);

    if (error) {
      console.error('Error al eliminar mascota:', error);
      return new Response('Error al eliminar mascota', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en DELETE /api/pets/[id]:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
