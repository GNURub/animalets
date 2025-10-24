import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { date, service_id, duration } = body;

    if (!date || !service_id || !duration) {
      return new Response('Faltan parámetros requeridos', { status: 400 });
    }

    // Obtener el día de la semana (0 = domingo, 6 = sábado)
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();

    // Obtener horario de negocio para ese día
    const { data: businessHours } = await locals.supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_closed', false)
      .single();

    if (!businessHours) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener citas existentes para ese día
    const { data: existingAppointments } = await locals.supabase
      .from('appointments')
      .select('scheduled_time, services(duration_minutes)')
      .eq('scheduled_date', date)
      .in('status', ['pending', 'confirmed', 'in_progress']);

    // Obtener horarios bloqueados
    const { data: blockedTimes } = await locals.supabase
      .from('blocked_times')
      .select('*')
      .eq('date', date);

    // Generar slots cada 30 minutos
    const slots = [];
    const startTime = businessHours.open_time;
    const endTime = businessHours.close_time;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(
        currentMin,
      ).padStart(2, '0')}`;

      // Verificar si hay suficiente tiempo antes del cierre
      const slotEndMinutes = currentHour * 60 + currentMin + duration;
      const closeMinutes = endHour * 60 + endMin;

      if (slotEndMinutes <= closeMinutes) {
        // Verificar si el slot está bloqueado
        const isBlocked =
          blockedTimes?.some((bt) => {
            const btStart = bt.start_time;
            const btEnd = bt.end_time;
            return timeString >= btStart && timeString < btEnd;
          }) || false;

        // Verificar si hay una cita en ese horario
        const hasAppointment =
          existingAppointments?.some((apt) => {
            const aptTime = apt.scheduled_time;
            // services es un objeto, no un array
            const aptDuration = (apt.services as any)?.duration_minutes || 60;
            const aptEndMinutes =
              parseInt(aptTime.split(':')[0]) * 60 +
              parseInt(aptTime.split(':')[1]) +
              aptDuration;
            const slotStartMinutes = currentHour * 60 + currentMin;

            return (
              slotStartMinutes < aptEndMinutes &&
              slotEndMinutes >
                parseInt(aptTime.split(':')[0]) * 60 +
                  parseInt(aptTime.split(':')[1])
            );
          }) || false;

        slots.push({
          time: timeString,
          available: !isBlocked && !hasAppointment,
        });
      }

      // Avanzar 30 minutos
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour++;
        currentMin = 0;
      }
    }

    return new Response(JSON.stringify(slots), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener slots disponibles:', error);
    return new Response('Error del servidor', { status: 500 });
  }
};
