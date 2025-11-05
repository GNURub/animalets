import type { APIRoute } from 'astro';
import { estimateGroomingTime } from '../../../utils/estimation';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;

  if (!user) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const body = await request.json();
    const { dogProfile, requestedServices } = body;

    // Validar datos requeridos
    if (!dogProfile || !requestedServices || !Array.isArray(requestedServices)) {
      return new Response(
        JSON.stringify({
          error: 'Datos faltantes: se requiere dogProfile y requestedServices',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar estructura del dogProfile
    const { breed, size, coat_condition } = dogProfile;
    if (!breed || !size || !coat_condition) {
      return new Response(
        JSON.stringify({
          error: 'dogProfile debe incluir: breed, size, coat_condition',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar valores permitidos
    const validSizes = ['pequeño', 'mediano', 'grande'];
    const validCoatConditions = ['buen_estado', 'enredado', 'muy_enredado', 'con_nudos'];

    if (!validSizes.includes(size)) {
      return new Response(
        JSON.stringify({
          error: `Tamaño inválido. Valores permitidos: ${validSizes.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!validCoatConditions.includes(coat_condition)) {
      return new Response(
        JSON.stringify({
          error: `Estado del pelaje inválido. Valores permitidos: ${validCoatConditions.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Llamar a la función de estimación
    const estimation = await estimateGroomingTime(dogProfile, requestedServices);

    return new Response(JSON.stringify(estimation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en estimación:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al generar estimación',
        details: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};