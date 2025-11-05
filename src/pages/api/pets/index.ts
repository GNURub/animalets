import type { APIRoute } from 'astro';
import z from 'zod';
import { validateCreatePet } from './validatos';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const body = await request.json();

    // Validar datos con Zod
    const validationResult = validateCreatePet(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Datos inválidos: ' + z.prettifyError(validationResult.error),
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: validatedData } = validationResult;

    // Validar que el usuario solo puede crear mascotas para sí mismo
    if (validatedData.owner_id !== user.id) {
      return new Response('No autorizado', { status: 403 });
    }

    const { data, error } = await locals.supabase
      .from('pets')
      .insert({
        owner_id: validatedData.owner_id,
        name: validatedData.name,
        species: validatedData.species,
        breed: validatedData.breed,
        birth_date: validatedData.birth_date,
        weight: validatedData.weight,
        notes: validatedData.notes,
        size: validatedData.size,
        gender: validatedData.gender,
        photo_url: validatedData.photo_url,
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
