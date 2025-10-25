import { signal } from '@preact/signals';
import moment from 'moment';
// @ts-ignore - Locale import doesn't have types
import 'moment/locale/es';
import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
// @ts-ignore - Calendar works with preact/compat
import { Calendar, momentLocalizer, type Event, type View } from 'react-big-calendar';
import '../styles/calendar.css';

// Configurar moment en español con lunes como primer día
moment.locale('es', {
  week: {
    dow: 1, // Lunes es el primer día de la semana
    doy: 4,
  },
});
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
const isEditingDateTime = signal(false);

// @ts-ignore - Preact compat works fine
const AdminCalendar: FC<AdminCalendarProps> = ({
  initialAppointments,
  services,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

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
    isEditingDateTime.value = false;
  }, []);

  // Cargar slots disponibles para cambio de fecha/hora
  const loadAvailableSlots = async (date: string, appointment: Appointment) => {
    setLoadingSlots(true);
    try {
      const response = await fetch('/api/slots/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          service_id: appointment.services.name, // Usamos el nombre ya que no tenemos el ID
          duration: appointment.services.duration_minutes,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cargar horarios');
      }

      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error al cargar slots:', error);
      alert('Error al cargar horarios disponibles');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Actualizar estado de cita
  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      const updated = await response.json();

      // Actualizar en la lista local
      setAppointments(prev => prev.map(apt => apt.id === id ? updated : apt));

      if (selectedAppointment.value?.id === id) {
        selectedAppointment.value = updated;
      }

      alert('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado');
    }
  };

  // Cambiar fecha/hora de cita
  const updateAppointmentDateTime = async () => {
    if (!selectedAppointment.value || !newDate || !newTime) {
      alert('Selecciona fecha y hora');
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: newDate,
          scheduled_time: newTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar cita');
      }

      const updated = await response.json();

      // Actualizar en la lista local
      setAppointments(prev => prev.map(apt => apt.id === selectedAppointment.value!.id ? updated : apt));

      selectedAppointment.value = updated;
      isEditingDateTime.value = false;
      setNewDate('');
      setNewTime('');

      alert('Cita reagendada correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al reagendar la cita');
    }
  };

  // Cancelar cita
  const cancelAppointment = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;

    await updateAppointmentStatus(id, 'cancelled');
  };

  // Iniciar edición de fecha/hora
  const startEditingDateTime = (appointment: Appointment) => {
    setNewDate(appointment.scheduled_date);
    setNewTime(appointment.scheduled_time);
    isEditingDateTime.value = true;

    // Cargar slots disponibles para esa fecha
    loadAvailableSlots(appointment.scheduled_date, appointment);
  };


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
          {/* @ts-ignore - Calendar works with preact/compat */}
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

              {!isEditingDateTime.value && (
                <div class="space-y-2 border-t pt-4">
                  <h3 class="font-semibold text-gray-700">Acciones</h3>

                  {selectedAppointment.value.status !== 'cancelled' && selectedAppointment.value.status !== 'completed' && (
                    <>
                      <button
                        onClick={() => startEditingDateTime(selectedAppointment.value!)}
                        class="btn btn-secondary w-full"
                      >
                        📅 Cambiar Fecha/Hora
                      </button>

                      {selectedAppointment.value.status === 'pending' && (
                        <button
                          onClick={() => updateAppointmentStatus(selectedAppointment.value!.id, 'confirmed')}
                          class="btn w-full bg-blue-500 text-white hover:bg-blue-600"
                        >
                          ✓ Confirmar
                        </button>
                      )}

                      {selectedAppointment.value.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(selectedAppointment.value!.id, 'in_progress')}
                          class="btn w-full bg-purple-500 text-white hover:bg-purple-600"
                        >
                          ▶ Iniciar
                        </button>
                      )}

                      {selectedAppointment.value.status === 'in_progress' && (
                        <button
                          onClick={() => updateAppointmentStatus(selectedAppointment.value!.id, 'completed')}
                          class="btn w-full bg-green-500 text-white hover:bg-green-600"
                        >
                          ✓ Completar
                        </button>
                      )}

                      <button
                        onClick={() => cancelAppointment(selectedAppointment.value!.id)}
                        class="btn w-full bg-red-500 text-white hover:bg-red-600"
                      >
                        ✕ Cancelar Cita
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => (showAppointmentModal.value = false)}
                    class="btn btn-secondary w-full"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {isEditingDateTime.value && (
                <div class="space-y-4 border-t pt-4">
                  <h3 class="font-semibold text-gray-700">Cambiar Fecha y Hora</h3>

                  <div>
                    <label class="label">Nueva Fecha</label>
                    <input
                      type="date"
                      class="input"
                      value={newDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const date = (e.target as HTMLInputElement).value;
                        setNewDate(date);
                        setNewTime('');
                        if (date && selectedAppointment.value) {
                          loadAvailableSlots(date, selectedAppointment.value);
                        }
                      }}
                    />
                  </div>

                  {newDate && (
                    <div>
                      <label class="label">Nueva Hora</label>
                      {loadingSlots ? (
                        <div class="py-4 text-center text-gray-500">
                          Cargando horarios...
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div class="py-4 text-center text-gray-500">
                          No hay horarios disponibles
                        </div>
                      ) : (
                        <div class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setNewTime(slot.time)}
                              disabled={!slot.available}
                              class={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${!slot.available
                                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                  : newTime === slot.time
                                    ? 'bg-blue-600 text-white'
                                    : 'border-2 border-gray-200 bg-white hover:border-blue-500'
                                }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div class="flex gap-2">
                    <button
                      onClick={() => {
                        isEditingDateTime.value = false;
                        setNewDate('');
                        setNewTime('');
                      }}
                      class="btn btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={updateAppointmentDateTime}
                      disabled={!newDate || !newTime}
                      class="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
