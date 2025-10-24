import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';

interface BusinessHour {
    id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_open: boolean;
}

interface BlockedTime {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    reason: string | null;
}

interface BusinessSettingsProps {
    initialBusinessHours: BusinessHour[];
    initialBlockedTimes: BlockedTime[];
}

const activeTab = signal<'hours' | 'blocked'>('hours');
const showBlockedModal = signal(false);
const editingBlocked = signal<BlockedTime | null>(null);
const isLoading = signal(false);

const BusinessSettings: FunctionalComponent<BusinessSettingsProps> = ({
    initialBusinessHours,
    initialBlockedTimes
}) => {
    const [businessHours, setBusinessHours] = useState<BusinessHour[]>(initialBusinessHours);
    const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(initialBlockedTimes);
    const [blockedForm, setBlockedForm] = useState({
        date: '',
        start_time: '09:00',
        end_time: '18:00',
        reason: ''
    });

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const updateBusinessHour = async (hour: BusinessHour, field: keyof BusinessHour, value: any) => {
        try {
            const response = await fetch(`/api/business-hours/${hour.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...hour,
                    [field]: value
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar horario');
            }

            const updated = await response.json();
            setBusinessHours(businessHours.map(h => h.id === updated.id ? updated : h));
        } catch (error) {
            console.error('Error al actualizar horario:', error);
            alert('Error al actualizar horario');
        }
    };

    const openBlockedModal = () => {
        editingBlocked.value = null;
        setBlockedForm({
            date: new Date().toISOString().split('T')[0],
            start_time: '09:00',
            end_time: '18:00',
            reason: ''
        });
        showBlockedModal.value = true;
    };

    const openEditBlockedModal = (blocked: BlockedTime) => {
        editingBlocked.value = blocked;
        setBlockedForm({
            date: blocked.date,
            start_time: blocked.start_time,
            end_time: blocked.end_time,
            reason: blocked.reason || ''
        });
        showBlockedModal.value = true;
    };

    const closeBlockedModal = () => {
        showBlockedModal.value = false;
        editingBlocked.value = null;
    };

    const handleBlockedSubmit = async (e: Event) => {
        e.preventDefault();
        isLoading.value = true;

        try {
            const url = editingBlocked.value
                ? `/api/blocked-times/${editingBlocked.value.id}`
                : '/api/blocked-times';

            const method = editingBlocked.value ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blockedForm)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const saved = await response.json();

            if (editingBlocked.value) {
                setBlockedTimes(blockedTimes.map(bt => bt.id === saved.id ? saved : bt));
            } else {
                setBlockedTimes([...blockedTimes, saved]);
            }

            closeBlockedModal();
        } catch (error) {
            console.error('Error al guardar tiempo bloqueado:', error);
            alert(error instanceof Error ? error.message : 'Error al guardar');
        } finally {
            isLoading.value = false;
        }
    };

    const deleteBlockedTime = async (id: string) => {
        if (!confirm('¿Eliminar este tiempo bloqueado?')) return;

        try {
            const response = await fetch(`/api/blocked-times/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar');
            }

            setBlockedTimes(blockedTimes.filter(bt => bt.id !== id));
        } catch (error) {
            console.error('Error al eliminar tiempo bloqueado:', error);
            alert('Error al eliminar');
        }
    };

    return (
        <div>
            {/* Tabs */}
            <div class="flex gap-2 mb-6">
                <button
                    onClick={() => activeTab.value = 'hours'}
                    class={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab.value === 'hours'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Horarios de Negocio
                </button>
                <button
                    onClick={() => activeTab.value = 'blocked'}
                    class={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab.value === 'blocked'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Tiempos Bloqueados
                </button>
            </div>

            {/* Tab: Horarios de Negocio */}
            {activeTab.value === 'hours' && (
                <div class="card">
                    <h2 class="text-2xl font-bold mb-6">Horarios de Operación</h2>
                    <div class="space-y-4">
                        {businessHours.sort((a, b) => a.day_of_week - b.day_of_week).map(hour => (
                            <div key={hour.id} class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div class="w-32">
                                    <label class="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hour.is_open}
                                            onChange={(e) => updateBusinessHour(hour, 'is_open', (e.target as HTMLInputElement).checked)}
                                            class="form-checkbox h-5 w-5 text-purple-600 mr-2"
                                        />
                                        <span class="font-semibold">{dayNames[hour.day_of_week]}</span>
                                    </label>
                                </div>

                                {hour.is_open ? (
                                    <div class="flex items-center gap-4 flex-1">
                                        <div>
                                            <label class="text-xs text-gray-600 block mb-1">Apertura</label>
                                            <input
                                                type="time"
                                                value={hour.open_time}
                                                onChange={(e) => updateBusinessHour(hour, 'open_time', (e.target as HTMLInputElement).value)}
                                                class="input py-2"
                                            />
                                        </div>
                                        <span class="text-gray-400">—</span>
                                        <div>
                                            <label class="text-xs text-gray-600 block mb-1">Cierre</label>
                                            <input
                                                type="time"
                                                value={hour.close_time}
                                                onChange={(e) => updateBusinessHour(hour, 'close_time', (e.target as HTMLInputElement).value)}
                                                class="input py-2"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <span class="text-gray-400 flex-1">Cerrado</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Tiempos Bloqueados */}
            {activeTab.value === 'blocked' && (
                <div>
                    <div class="mb-6">
                        <button
                            onClick={openBlockedModal}
                            class="btn btn-primary"
                        >
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Bloquear Tiempo
                        </button>
                    </div>

                    {blockedTimes.length === 0 ? (
                        <div class="card text-center py-12">
                            <div class="text-6xl mb-4">🚫</div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">
                                No hay tiempos bloqueados
                            </h3>
                            <p class="text-gray-600 mb-6">
                                Bloquea horarios para vacaciones, mantenimiento u otros eventos
                            </p>
                        </div>
                    ) : (
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {blockedTimes.map(blocked => (
                                <div key={blocked.id} class="card border-l-4 border-red-500">
                                    <div class="flex items-start justify-between mb-3">
                                        <div>
                                            <div class="font-bold text-lg">
                                                {new Date(blocked.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </div>
                                            <div class="text-sm text-gray-600">
                                                {blocked.start_time} - {blocked.end_time}
                                            </div>
                                        </div>
                                        <span class="text-red-600 text-2xl">🚫</span>
                                    </div>

                                    {blocked.reason && (
                                        <p class="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                                            {blocked.reason}
                                        </p>
                                    )}

                                    <div class="flex gap-2">
                                        <button
                                            onClick={() => openEditBlockedModal(blocked)}
                                            class="btn btn-secondary flex-1 text-sm"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => deleteBlockedTime(blocked.id)}
                                            class="btn btn-danger text-sm"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal para Tiempo Bloqueado */}
            {showBlockedModal.value && (
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div class="bg-white rounded-lg max-w-md w-full p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold">
                                {editingBlocked.value ? 'Editar Tiempo Bloqueado' : 'Nuevo Tiempo Bloqueado'}
                            </h2>
                            <button
                                onClick={closeBlockedModal}
                                class="text-gray-400 hover:text-gray-600"
                            >
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleBlockedSubmit} class="space-y-4">
                            <div>
                                <label class="label">Fecha *</label>
                                <input
                                    type="date"
                                    required
                                    class="input"
                                    value={blockedForm.date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onInput={(e) => setBlockedForm({ ...blockedForm, date: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="label">Hora Inicio *</label>
                                    <input
                                        type="time"
                                        required
                                        class="input"
                                        value={blockedForm.start_time}
                                        onInput={(e) => setBlockedForm({ ...blockedForm, start_time: (e.target as HTMLInputElement).value })}
                                    />
                                </div>
                                <div>
                                    <label class="label">Hora Fin *</label>
                                    <input
                                        type="time"
                                        required
                                        class="input"
                                        value={blockedForm.end_time}
                                        onInput={(e) => setBlockedForm({ ...blockedForm, end_time: (e.target as HTMLInputElement).value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label class="label">Motivo</label>
                                <textarea
                                    class="input"
                                    rows={3}
                                    value={blockedForm.reason}
                                    onInput={(e) => setBlockedForm({ ...blockedForm, reason: (e.target as HTMLTextAreaElement).value })}
                                    placeholder="Ej: Vacaciones, Mantenimiento, Evento especial..."
                                />
                            </div>

                            <div class="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeBlockedModal}
                                    class="btn btn-secondary flex-1"
                                    disabled={isLoading.value}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    class="btn btn-primary flex-1"
                                    disabled={isLoading.value}
                                >
                                    {isLoading.value ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessSettings;
