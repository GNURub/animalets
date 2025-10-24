import { signal } from '@preact/signals';
import moment from 'moment';
import 'moment/locale/es';
import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, type Event, type View } from 'react-big-calendar';
import '../styles/calendar.css';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  services: {
    name: string;
    duration_minutes: number;
    price: number;
  };
  pets: {
    name: string;
    species: string;
  };
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface AdminCalendarProps {
  initialAppointments: Appointment[];
  services: Service[];
}

interface CalendarEvent extends Event {
  resource: Appointment;
}

const showAppointmentModal = signal(false);
const selectedAppointment = signal<Appointment | null>(null);

const AdminCalendar: FC<AdminCalendarProps> = ({
  initialAppointments,
  services,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convertir appointments a eventos de react-big-calendar
  const events = useMemo<CalendarEvent[]>(() => {
    return appointments.map(apt => {
      const [hours, minutes] = apt.scheduled_time.split(':').map(Number);
      const start = new Date(apt.scheduled_date);
      start.setHours(hours, minutes, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + apt.services.duration_minutes);

      return {
        title: `${apt.pets.name} - ${apt.services.name}`,
        start,
        end,
        resource: apt,
      };
    });
  }, [appointments]);

  // Manejar selección de evento
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    selectedAppointment.value = event.resource;
    showAppointmentModal.value = true;
  }, []);

  // Personalizar estilos de eventos según estado
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = '#3174ad';

    switch (appointment.status) {
      case 'pending':
        backgroundColor = '#eab308'; // yellow-500
        break;
      case 'confirmed':
        backgroundColor = '#3b82f6'; // blue-500
        break;
      case 'in_progress':
        backgroundColor = '#a855f7'; // purple-500
        break;
      case 'completed':
        backgroundColor = '#22c55e'; // green-500
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red-500
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  }, []);

  // Mensajes en español
  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay citas en este rango',
    showMore: (total: number) => `+ Ver más (${total})`,
  };

  return (
    <div class="space-y-6">
      {/* Calendario principal */}
      <div class="card">
        <div style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={messages}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            views={['month', 'week', 'day', 'agenda']}
            step={30}
            showMultiDayTimes
            defaultDate={new Date()}
          />
        </div>
      </div>

      {/* Modal de detalle de cita */}
      {showAppointmentModal.value && selectedAppointment.value && (
        <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div class="mb-6 flex items-start justify-between">
              <h2 class="text-2xl font-bold">Detalle de Cita</h2>
              <button
                onClick={() => (showAppointmentModal.value = false)}
                class="text-gray-400 hover:text-gray-600"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <h3 class="mb-1 font-semibold text-gray-700">Cliente</h3>
                <p class="text-lg">
                  {selectedAppointment.value.profiles.full_name}
                </p>
                <p class="text-sm text-gray-600">
                  {selectedAppointment.value.profiles.email}
                </p>
                {selectedAppointment.value.profiles.phone && (
                  <p class="text-sm text-gray-600">
                    📞 {selectedAppointment.value.profiles.phone}
                  </p>
                )}
              </div>

              <div>
                <h3 class="mb-1 font-semibold text-gray-700">Mascota</h3>
                <p class="text-lg">
                  {selectedAppointment.value.pets.species === 'dog'
                    ? '🐕'
                    : '🐈'}{' '}
                  {selectedAppointment.value.pets.name}
                </p>
              </div>

              <div>
                <h3 class="mb-1 font-semibold text-gray-700">Servicio</h3>
                <p class="text-lg">{selectedAppointment.value.services.name}</p>
                <p class="text-sm text-gray-600">
                  {selectedAppointment.value.services.duration_minutes} min • €
                  {selectedAppointment.value.services.price.toFixed(2)}
                </p>
              </div>

              <div>
                <h3 class="mb-1 font-semibold text-gray-700">Horario</h3>
                <p class="text-lg">
                  {new Date(
                    selectedAppointment.value.scheduled_date + 'T00:00:00',
                  ).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p class="text-sm text-gray-600">
                  {selectedAppointment.value.scheduled_time}
                </p>
              </div>

              <div>
                <h3 class="mb-1 font-semibold text-gray-700">Estado</h3>
                <span
                  class={`status-badge status-${selectedAppointment.value.status}`}
                >
                  {selectedAppointment.value.status === 'pending' &&
                    'Pendiente'}
                  {selectedAppointment.value.status === 'confirmed' &&
                    'Confirmada'}
                  {selectedAppointment.value.status === 'in_progress' &&
                    'En Proceso'}
                  {selectedAppointment.value.status === 'completed' &&
                    'Completada'}
                  {selectedAppointment.value.status === 'cancelled' &&
                    'Cancelada'}
                </span>
              </div>

              <div class="flex gap-2">
                <button
                  onClick={() => (showAppointmentModal.value = false)}
                  class="btn btn-secondary flex-1"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
