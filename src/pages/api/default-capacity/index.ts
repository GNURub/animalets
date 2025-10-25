import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data, error } = await locals.supabase
      .from('default_capacity')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching default capacity:', error);
      return new Response(JSON.stringify({ appointments_per_hour: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/default-capacity:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const { profile } = locals;

    if (!profile || profile.role !== 'admin') {
      return new Response('No autorizado', { status: 403 });
    }

    const body = await request.json();
    const { appointments_per_hour } = body;

    if (
      typeof appointments_per_hour !== 'number' ||
      appointments_per_hour < 1
    ) {
      return new Response('appointments_per_hour debe ser un número >= 1', {
        status: 400,
      });
    }

    const { data, error } = await locals.supabase
      .from('default_capacity')
      .update({ appointments_per_hour })
      .select()
      .single();

    if (error) {
      console.error('Error updating default capacity:', error);
      return new Response('Error al actualizar', { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in PUT /api/default-capacity:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
