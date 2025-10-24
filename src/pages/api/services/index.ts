import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const { profile } = locals;

  if (!profile || profile.role !== 'admin') {
    return new Response('No autorizado', { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, duration_minutes, price, is_active } = body;

    if (!name || !duration_minutes || !price) {
      return new Response('Faltan campos requeridos', { status: 400 });
    }

    const { data, error } = await locals.supabase
      .from('services')
      .insert({
        name,
        description,
        duration_minutes,
        price,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear servicio:', error);
      return new Response('Error al crear servicio', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en POST /api/services:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data, error } = await locals.supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener servicios:', error);
      return new Response('Error al obtener servicios', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/services:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
