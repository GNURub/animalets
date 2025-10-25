import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';

interface Appointment {
  id: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed';
  services: {
    name: string;
    duration_minutes: number;
    price: number;
  };
  pets: {
    name: string;
    species: string;
    breed: string | null;
  };
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  notes: string | null;
}

interface TodayKanbanProps {
  initialAppointments: {
    pending: Appointment[];
    confirmed: Appointment[];
    inProgress: Appointment[];
    completed: Appointment[];
  };
}

const selectedAppointment = signal<Appointment | null>(null);
const showModal = signal(false);

const TodayKanban: FunctionalComponent<TodayKanbanProps> = ({
  initialAppointments,
}) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      // Mover la cita entre columnas
      const allAppts = [
        ...appointments.pending,
        ...appointments.confirmed,
        ...appointments.inProgress,
        ...appointments.completed,
      ];

      const appointment = allAppts.find((a) => a.id === appointmentId);
      if (!appointment) return;

      const updatedAppointment = { ...appointment, status: newStatus as any };

      // Remover de la columna anterior
      const newAppointments = {
        pending: appointments.pending.filter((a) => a.id !== appointmentId),
        confirmed: appointments.confirmed.filter((a) => a.id !== appointmentId),
        inProgress: appointments.inProgress.filter(
          (a) => a.id !== appointmentId,
        ),
        completed: appointments.completed.filter((a) => a.id !== appointmentId),
      };

      // Agregar a la nueva columna
      if (newStatus === 'pending')
        newAppointments.pending.push(updatedAppointment);
      else if (newStatus === 'confirmed')
        newAppointments.confirmed.push(updatedAppointment);
      else if (newStatus === 'in_progress')
        newAppointments.inProgress.push(updatedAppointment);
      else if (newStatus === 'completed')
        newAppointments.completed.push(updatedAppointment);

      setAppointments(newAppointments);

      if (selectedAppointment.value?.id === appointmentId) {
        selectedAppointment.value = updatedAppointment;
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado de la cita');
    } finally {
      setIsUpdating(false);
    }
  };

  const openAppointmentModal = (appointment: Appointment) => {
    selectedAppointment.value = appointment;
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    selectedAppointment.value = null;
  };

  const renderColumn = (
    title: string,
    appointments: Appointment[],
    status: string,
    bgColor: string,
  ) => (
    <div class="min-w-[280px] flex-1">
      <div class={`${bgColor} rounded-t-lg px-4 py-3 text-white`}>
        <h3 class="text-lg font-bold">{title}</h3>
        <span class="text-sm opacity-90">{appointments.length} citas</span>
      </div>
      <div class="min-h-[500px] space-y-3 rounded-b-lg bg-gray-50 p-4">
        {appointments.length === 0 ? (
          <p class="py-8 text-center text-gray-400">No hay citas</p>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              class="card cursor-pointer bg-white transition-shadow hover:shadow-lg"
              onClick={() => openAppointmentModal(apt)}
            >
              <div class="mb-2 flex items-start justify-between">
                <span class="text-lg font-bold text-purple-600">
                  {apt.scheduled_time}
                </span>
                <span class="text-xs text-gray-500">
                  {apt.services.duration_minutes} min
                </span>
              </div>

              <div class="mb-2">
                <div class="font-semibold text-gray-900">
                  {apt.profiles.full_name}
                </div>
                <div class="text-sm text-gray-600">
                  {apt.pets.species === 'dog' ? '🐕' : '🐈'} {apt.pets.name}
                </div>
              </div>

              <div class="mb-2 text-sm text-gray-700">{apt.services.name}</div>

              <div class="flex items-center justify-between border-t pt-2">
                <span class="text-sm font-semibold text-green-600">
                  €{apt.services.price.toFixed(2)}
                </span>
                {apt.profiles.phone && (
                  <a
                    href={`tel:${apt.profiles.phone}`}
                    class="text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📞 Llamar
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Kanban Board */}
      <div class="flex gap-4 overflow-x-auto pb-4">
        {renderColumn(
          'Pendiente',
          appointments.pending,
          'pending',
          'bg-yellow-500',
        )}
        {renderColumn(
          'Confirmada',
          appointments.confirmed,
          'confirmed',
          'bg-blue-500',
        )}
        {renderColumn(
          'En Proceso',
          appointments.inProgress,
          'in_progress',
          'bg-purple-500',
        )}
        {renderColumn(
          'Completada',
          appointments.completed,
          'completed',
          'bg-green-500',
        )}
      </div>

      {/* Modal de detalle */}
      {showModal.value && selectedAppointment.value && (
        <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div class="w-full max-w-lg rounded-lg bg-white p-6">
            <div class="mb-6 flex items-start justify-between">
              <h2 class="text-2xl font-bold">Detalle de Cita</h2>
              <button
                onClick={closeModal}
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
              <div class="rounded-lg bg-gray-50 p-4">
                <div class="mb-1 text-3xl font-bold text-purple-600">
                  {selectedAppointment.value.scheduled_time}
                </div>
                <div class="text-gray-600">
                  {selectedAppointment.value.services.duration_minutes} minutos
                </div>
              </div>

              <div>
                <h3 class="mb-1 font-semibold text-gray-700">Cliente</h3>
                <p class="text-lg">
                  {selectedAppointment.value.profiles?.full_name}
                </p>
                <p class="text-sm text-gray-600">
                  {selectedAppointment.value.profiles.email}
                </p>
                {selectedAppointment.value.profiles.phone && (
                  <a
                    href={`tel:${selectedAppointment.value.profiles.phone}`}
                    class="text-sm text-blue-600 hover:underline"
                  >
                    📞 {selectedAppointment.value.profiles.phone}
                  </a>
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
                {selectedAppointment.value.pets.breed && (
                  <p class="text-sm text-gray-600">
                    {selectedAppointment.value.pets.breed}
                  </p>
                )}
              </div>

              <div>
                <h3 class="mb-1 font-semibold text-gray-700">Servicio</h3>
                <p class="text-lg">{selectedAppointment.value.services.name}</p>
                <p class="mt-1 text-2xl font-bold text-green-600">
                  €{selectedAppointment.value.services.price.toFixed(2)}
                </p>
              </div>

              {selectedAppointment.value.notes && (
                <div>
                  <h3 class="mb-1 font-semibold text-gray-700">Notas</h3>
                  <p class="rounded bg-gray-50 p-3 text-sm text-gray-600">
                    {selectedAppointment.value.notes}
                  </p>
                </div>
              )}

              <div>
                <h3 class="mb-2 font-semibold text-gray-700">Cambiar Estado</h3>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      updateStatus(selectedAppointment.value!.id, 'confirmed')
                    }
                    disabled={
                      isUpdating ||
                      selectedAppointment.value.status === 'confirmed'
                    }
                    class="btn bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() =>
                      updateStatus(selectedAppointment.value!.id, 'in_progress')
                    }
                    disabled={
                      isUpdating ||
                      selectedAppointment.value.status === 'in_progress'
                    }
                    class="btn bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50"
                  >
                    Iniciar
                  </button>
                  <button
                    onClick={() =>
                      updateStatus(selectedAppointment.value!.id, 'completed')
                    }
                    disabled={
                      isUpdating ||
                      selectedAppointment.value.status === 'completed'
                    }
                    class="btn bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    Completar
                  </button>
                  <button
                    onClick={() =>
                      updateStatus(selectedAppointment.value!.id, 'cancelled')
                    }
                    disabled={isUpdating}
                    class="btn bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <button
                onClick={closeModal}
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

export default TodayKanban;
