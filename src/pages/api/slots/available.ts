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

    // Obtener capacidad por defecto
    const { data: defaultCapacity } = await locals.supabase
      .from('default_capacity')
      .select('appointments_per_hour')
      .single();

    const defaultAppointmentsPerHour =
      defaultCapacity?.appointments_per_hour || 1;

    // Obtener excepciones de personal para ese día
    const { data: staffSchedules } = await locals.supabase
      .from('staff_schedules')
      .select('start_time, end_time, appointments_per_hour')
      .eq('day_of_week', dayOfWeek);

    // Verificar si la fecha es hoy
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Función auxiliar para obtener capacidad para una hora específica
    const getCapacityForTime = (hour: number, minute: number): number => {
      const timeMinutes = hour * 60 + minute;

      // Buscar en excepciones de personal
      if (staffSchedules && staffSchedules.length > 0) {
        for (const schedule of staffSchedules) {
          const [schedStartH, schedStartM] = schedule.start_time
            .split(':')
            .map(Number);
          const [schedEndH, schedEndM] = schedule.end_time
            .split(':')
            .map(Number);
          const schedStart = schedStartH * 60 + schedStartM;
          const schedEnd = schedEndH * 60 + schedEndM;

          if (timeMinutes >= schedStart && timeMinutes < schedEnd) {
            return schedule.appointments_per_hour;
          }
        }
      }

      // Si no hay excepción, usar default
      return defaultAppointmentsPerHour;
    };

    // Generar slots cada 30 minutos
    const slots = [];
    const startTime = businessHours.open_time;
    const endTime = businessHours.close_time;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let slotHour = startHour;
    let slotMin = startMin;

    while (slotHour < endHour || (slotHour === endHour && slotMin < endMin)) {
      const timeString = `${String(slotHour).padStart(2, '0')}:${String(
        slotMin,
      ).padStart(2, '0')}`;

      // Si es hoy, solo mostrar slots desde la próxima hora
      if (isToday) {
        const slotTotalMinutes = slotHour * 60 + slotMin;
        const nowTotalMinutes = currentHour * 60 + currentMinute;

        // Saltar slots que ya pasaron o están en la hora actual
        // Añadir 60 minutos de buffer (próxima hora)
        if (slotTotalMinutes <= nowTotalMinutes + 60) {
          slotMin += 30;
          if (slotMin >= 60) {
            slotHour++;
            slotMin = 0;
          }
          continue;
        }
      }

      // Verificar si hay suficiente tiempo antes del cierre
      const slotEndMinutes = slotHour * 60 + slotMin + duration;
      const closeMinutes = endHour * 60 + endMin;

      if (slotEndMinutes <= closeMinutes) {
        // Verificar si el slot está bloqueado
        const isBlocked =
          blockedTimes?.some((bt) => {
            const btStart = bt.start_time;
            const btEnd = bt.end_time;
            return timeString >= btStart && timeString < btEnd;
          }) || false;

        // Obtener capacidad para esta hora
        const capacityForSlot = getCapacityForTime(slotHour, slotMin);

        // Contar citas que comienzan exactamente en esta hora
        const appointmentsInSlot =
          existingAppointments?.filter((apt) => {
            return apt.scheduled_time === timeString;
          }).length || 0;

        // Verificar disponibilidad: comparar cupo usado vs capacidad
        const hasCapacity = appointmentsInSlot < capacityForSlot;

        slots.push({
          time: timeString,
          available: !isBlocked && hasCapacity,
        });
      }

      // Avanzar 30 minutos
      slotMin += 30;
      if (slotMin >= 60) {
        slotHour++;
        slotMin = 0;
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
