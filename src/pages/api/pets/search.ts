import type { APIRoute } from 'astro';

/**
 * GET /api/pets/search
 *
 * Busca mascotas por nombre (disponible solo para admin)
 * Retorna mascotas de todos los propietarios, incluyendo sin dueño
 *
 * Query params:
 *   q: string (obligatorio) - término de búsqueda
 *   limit: number (opcional, default 10) - máximo de resultados
 */
export const GET: APIRoute = async ({ locals, url }) => {
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
      return new Response('Solo administradores pueden buscar mascotas', {
        status: 403,
      });
    }

    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buscar mascotas por nombre (case-insensitive)
    // Priorizar coincidencias exactas, luego parciales
    const { data, error } = await locals.supabase
      .from('pets')
      .select(
        'id, name, species, breed, size, owner_id, weight_kg, gender, notes, photo_url',
      )
      .or(`name.ilike.%${query}%,breed.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error al buscar mascotas:', error);
      return new Response('Error al buscar mascotas', { status: 500 });
    }

    // Reordenar: exactas primero, luego parciales
    const results =
      data?.sort((a, b) => {
        const aExact = a.name.toLowerCase() === query.toLowerCase();
        const bExact = b.name.toLowerCase() === query.toLowerCase();

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name.localeCompare(b.name);
      }) || [];

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/pets/search:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
