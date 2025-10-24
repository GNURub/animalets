import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';

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

const currentMonth = signal(new Date());
const selectedDate = signal<Date | null>(null);
const showAppointmentModal = signal(false);
const selectedAppointment = signal<Appointment | null>(null);

const AdminCalendar: FunctionalComponent<AdminCalendarProps> = ({
  initialAppointments,
  services,
}) => {
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const previousMonth = () => {
    currentMonth.value = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() - 1,
      1,
    );
  };

  const nextMonth = () => {
    currentMonth.value = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth() + 1,
      1,
    );
  };

  const selectDate = (day: number) => {
    const date = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth(),
      day,
    );
    selectedDate.value = date;

    const dateStr = date.toISOString().split('T')[0];
    const dayAppts = appointments.filter((a) => a.scheduled_date === dateStr);
    setDayAppointments(dayAppts);
  };

  const getAppointmentsForDay = (day: number) => {
    const date = new Date(
      currentMonth.value.getFullYear(),
      currentMonth.value.getMonth(),
      day,
    );
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter((a) => a.scheduled_date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(
    currentMonth.value,
  );
  const monthName = new Date(year, month).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Calendario */}
      <div class="lg:col-span-2">
        <div class="card">
          {/* Header del calendario */}
          <div class="mb-6 flex items-center justify-between">
            <button onClick={previousMonth} class="btn btn-secondary">
              ← Anterior
            </button>
            <h2 class="text-2xl font-bold capitalize">{monthName}</h2>
            <button onClick={nextMonth} class="btn btn-secondary">
              Siguiente →
            </button>
          </div>

          {/* Días de la semana */}
          <div class="mb-2 grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                class="text-center text-sm font-semibold text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div class="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} class="aspect-square" />;
              }

              const dayAppointments = getAppointmentsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();
              const isSelected =
                selectedDate.value &&
                day === selectedDate.value.getDate() &&
                month === selectedDate.value.getMonth() &&
                year === selectedDate.value.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  class={`aspect-square rounded-lg border-2 p-2 transition-all ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${isSelected ? 'border-blue-600 bg-blue-100' : 'hover:bg-gray-50'} `}
                >
                  <div class="mb-1 text-sm font-semibold">{day}</div>
                  {dayAppointments.length > 0 && (
                    <div class="flex flex-wrap gap-1">
                      {dayAppointments.slice(0, 3).map((apt, i) => (
                        <div
                          key={i}
                          class={`h-2 w-2 rounded-full ${getStatusColor(apt.status)}`}
                          title={`${apt.scheduled_time} - ${apt.services.name}`}
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <div class="text-xs text-gray-500">
                          +{dayAppointments.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel lateral de citas del día seleccionado */}
      <div class="lg:col-span-1">
        <div class="card sticky top-4">
          <h3 class="mb-4 text-xl font-bold">
            {selectedDate.value
              ? selectedDate.value.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : 'Selecciona un día'}
          </h3>

          {dayAppointments.length === 0 ? (
            <p class="py-8 text-center text-gray-500">
              No hay citas programadas
            </p>
          ) : (
            <div class="max-h-[600px] space-y-3 overflow-y-auto">
              {dayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  class="cursor-pointer rounded-lg border p-3 transition-shadow hover:shadow-md"
                  onClick={() => {
                    selectedAppointment.value = apt;
                    showAppointmentModal.value = true;
                  }}
                >
                  <div class="mb-2 flex items-start justify-between">
                    <span class="text-lg font-semibold">
                      {apt.scheduled_time}
                    </span>
                    <span class={`status-badge status-${apt.status}`}>
                      {apt.status === 'pending' && 'Pendiente'}
                      {apt.status === 'confirmed' && 'Confirmada'}
                      {apt.status === 'in_progress' && 'En Proceso'}
                      {apt.status === 'completed' && 'Completada'}
                      {apt.status === 'cancelled' && 'Cancelada'}
                    </span>
                  </div>
                  <div class="mb-1 text-sm text-gray-700">
                    <strong>{apt.profiles.full_name}</strong>
                  </div>
                  <div class="text-sm text-gray-600">
                    🐕 {apt.pets.name} • {apt.services.name}
                  </div>
                  <div class="mt-1 text-sm font-semibold text-purple-600">
                    €{apt.services.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle de cita */}
      {showAppointmentModal.value && selectedAppointment.value && (
        <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div class="w-full max-w-md rounded-lg bg-white p-6">
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

              <button
                onClick={() => (showAppointmentModal.value = false)}
                class="btn btn-secondary mt-4 w-full"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
