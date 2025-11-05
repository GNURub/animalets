import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import toast from 'react-hot-toast';

interface StaffSchedule {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    staff_count: number;
    appointments_per_hour: number;
    created_at: string;
    updated_at: string;
}

interface DefaultCapacity {
    id: string;
    appointments_per_hour: number;
    created_at: string;
    updated_at: string;
}

interface StaffSchedulingProps {
    initialCapacity: DefaultCapacity;
    initialSchedules: StaffSchedule[];
}

const showScheduleModal = signal(false);
const editingSchedule = signal<StaffSchedule | null>(null);
const isLoading = signal(false);

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const StaffScheduling: FunctionalComponent<StaffSchedulingProps> = ({
    initialCapacity,
    initialSchedules,
}) => {
    const [capacity, setCapacity] = useState<DefaultCapacity>(initialCapacity);
    const [schedules, setSchedules] = useState<StaffSchedule[]>(initialSchedules);
    const [formData, setFormData] = useState({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '18:00',
        staff_count: 1,
        appointments_per_hour: 1,
    });

    // Actualizar cupo por defecto
    const updateDefaultCapacity = async (appointmentsPerHour: number) => {
        isLoading.value = true;
        try {
            const response = await fetch('/api/default-capacity', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointments_per_hour: appointmentsPerHour }),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar');
            }

            const data = await response.json();
            setCapacity(data);
            toast.success('Cupo por defecto actualizado correctamente', {
                id: 'update-default-capacity',
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar el cupo por defecto');
        } finally {
            isLoading.value = false;
        }
    };

    // Crear/actualizar excepción de personal
    const saveSchedule = async () => {
        if (!formData.day_of_week && formData.start_time && formData.end_time) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        isLoading.value = true;
        try {
            const isEdit = editingSchedule.value;
            const method = isEdit ? 'PUT' : 'POST';
            const url = isEdit ? `/api/staff-schedules/${editingSchedule.value!.id}` : '/api/staff-schedules';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const data = await response.json();

            if (isEdit) {
                setSchedules(prev => prev.map(s => s.id === data.id ? data : s));
            } else {
                setSchedules(prev => [...prev, data]);
            }

            // Reset form
            setFormData({
                day_of_week: 1,
                start_time: '09:00',
                end_time: '18:00',
                staff_count: 1,
                appointments_per_hour: 1,
            });
            editingSchedule.value = null;
            showScheduleModal.value = false;

            toast.success(isEdit ? 'Excepción actualizada' : 'Excepción creada');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al guardar la excepción');
        } finally {
            isLoading.value = false;
        }
    };

    // Eliminar excepción
    const deleteSchedule = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta excepción?')) return;

        isLoading.value = true;
        try {
            const response = await fetch(`/api/staff-schedules/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Error al eliminar');
            }

            setSchedules(prev => prev.filter(s => s.id !== id));
            toast.success('Excepción eliminada');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al eliminar la excepción');
        } finally {
            isLoading.value = false;
        }
    };

    // Abrir modal para editar
    const openEditModal = (schedule: StaffSchedule) => {
        editingSchedule.value = schedule;
        setFormData({
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            staff_count: schedule.staff_count,
            appointments_per_hour: schedule.appointments_per_hour,
        });
        showScheduleModal.value = true;
    };

    // Cerrar modal
    const closeModal = () => {
        showScheduleModal.value = false;
        editingSchedule.value = null;
        setFormData({
            day_of_week: 1,
            start_time: '09:00',
            end_time: '18:00',
            staff_count: 1,
            appointments_per_hour: 1,
        });
    };

    return (
        <div class="space-y-6">
            {/* Cupo por Defecto */}
            <div class="card">
                <h3 class="mb-4 text-lg font-bold text-gray-900">Cupo Por Defecto</h3>
                <p class="mb-4 text-sm text-gray-600">
                    Número de citas que se pueden agendar por hora en toda la semana
                </p>

                <div class="flex items-end gap-4">
                    <div class="flex-1">
                        <label class="label">Citas por Hora</label>
                        <div class="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (capacity.appointments_per_hour > 1) {
                                        updateDefaultCapacity(capacity.appointments_per_hour - 1);
                                    }
                                }}
                                disabled={capacity.appointments_per_hour <= 1 || isLoading.value}
                                class="btn btn-secondary px-3 py-2 disabled:opacity-50"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={capacity.appointments_per_hour}
                                onChange={(e) => {
                                    const val = parseInt((e.target as HTMLInputElement).value);
                                    if (val >= 1 && val <= 10) {
                                        updateDefaultCapacity(val);
                                    }
                                }}
                                class="input w-20 text-center"
                            />
                            <button
                                onClick={() => {
                                    if (capacity.appointments_per_hour < 10) {
                                        updateDefaultCapacity(capacity.appointments_per_hour + 1);
                                    }
                                }}
                                disabled={capacity.appointments_per_hour >= 10 || isLoading.value}
                                class="btn btn-secondary px-3 py-2 disabled:opacity-50"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div class="rounded-lg bg-blue-50 px-4 py-3 text-sm">
                        <p class="font-semibold text-blue-900">
                            {capacity.appointments_per_hour} perro{capacity.appointments_per_hour !== 1 ? 's' : ''} por hora
                        </p>
                        <p class="text-xs text-blue-700">en toda la semana</p>
                    </div>
                </div>
            </div>

            {/* Excepciones de Personal */}
            <div class="card">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-bold text-gray-900">Excepciones por Día/Hora</h3>
                    <button
                        onClick={() => showScheduleModal.value = true}
                        class="btn btn-primary"
                    >
                        + Agregar Excepción
                    </button>
                </div>

                <p class="mb-4 text-sm text-gray-600">
                    Define diferentes cupos para días u horas específicas
                </p>

                {schedules.length === 0 ? (
                    <div class="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8 text-center">
                        <p class="text-gray-600">
                            Sin excepciones. Se usa el cupo por defecto en toda la semana.
                        </p>
                    </div>
                ) : (
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="border-b-2 border-gray-200 bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-semibold text-gray-700">Día</th>
                                    <th class="px-4 py-3 text-left font-semibold text-gray-700">Horario</th>
                                    <th class="px-4 py-3 text-left font-semibold text-gray-700">Personal</th>
                                    <th class="px-4 py-3 text-left font-semibold text-gray-700">Cupo/Hora</th>
                                    <th class="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                {schedules.map((schedule) => (
                                    <tr key={schedule.id} class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium text-gray-900">
                                            {dayNames[schedule.day_of_week]}
                                        </td>
                                        <td class="px-4 py-3 text-gray-700">
                                            {schedule.start_time} - {schedule.end_time}
                                        </td>
                                        <td class="px-4 py-3 text-gray-700">
                                            <span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                                {schedule.staff_count}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-gray-700">
                                            <span class="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                                {schedule.appointments_per_hour}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <button
                                                onClick={() => openEditModal(schedule)}
                                                class="btn btn-secondary mr-2 px-3 py-1 text-xs"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => deleteSchedule(schedule.id)}
                                                class="btn bg-red-500 text-white hover:bg-red-600 px-3 py-1 text-xs"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Excepción */}
            {showScheduleModal.value && (
                <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div class="mb-6 flex items-start justify-between">
                            <h2 class="text-2xl font-bold">
                                {editingSchedule.value ? 'Editar' : 'Nueva'} Excepción
                            </h2>
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
                            <div>
                                <label class="label">Día de la Semana</label>
                                <select
                                    value={formData.day_of_week}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            day_of_week: parseInt((e.target as HTMLSelectElement).value),
                                        })
                                    }
                                    class="input"
                                >
                                    {dayNames.map((name, idx) => (
                                        <option key={idx} value={idx}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="label">Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                start_time: (e.target as HTMLInputElement).value,
                                            })
                                        }
                                        class="input"
                                    />
                                </div>
                                <div>
                                    <label class="label">Hora Fin</label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                end_time: (e.target as HTMLInputElement).value,
                                            })
                                        }
                                        class="input"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="label">Personas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.staff_count}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                staff_count: parseInt((e.target as HTMLInputElement).value),
                                            })
                                        }
                                        class="input"
                                    />
                                </div>
                                <div>
                                    <label class="label">Cupo/Hora</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.appointments_per_hour}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                appointments_per_hour: parseInt((e.target as HTMLInputElement).value),
                                            })
                                        }
                                        class="input"
                                    />
                                </div>
                            </div>

                            <div class="flex gap-2 border-t pt-4">
                                <button
                                    onClick={closeModal}
                                    disabled={isLoading.value}
                                    class="btn btn-secondary flex-1 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveSchedule}
                                    disabled={isLoading.value}
                                    class="btn btn-primary flex-1 disabled:opacity-50"
                                >
                                    {isLoading.value ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffScheduling;
