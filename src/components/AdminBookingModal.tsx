import type { FC } from 'react';
import { useState } from 'react';
import PetSearchModal from './PetSearchModal';

interface Pet {
    id: string;
    name: string;
    species: string;
    size: string;
    breed?: string;
    owner_id: string | null;
}

interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}

interface TimeSlot {
    time: string;
    available: boolean;
}

interface CreatePetData {
    name: string;
    species: 'dog' | 'cat' | 'other';
    size: 'pequeño' | 'mediano' | 'grande';
    breed?: string;
    gender?: 'macho' | 'hembra';
    notes?: string;
    weight?: number;
}

interface AdminBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    services: Service[];
    onBookingComplete: (appointment: any) => void;
}

type BookingStep = 'select-pet' | 'select-service' | 'select-time' | 'confirm' | 'loading';

// @ts-ignore - Preact compat works fine
const AdminBookingModal: FC<AdminBookingModalProps> = ({
    isOpen,
    onClose,
    selectedDate,
    services,
    onBookingComplete,
}) => {
    // Estados
    const [currentStep, setCurrentStep] = useState<BookingStep>('select-pet');
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [bookingNotes, setBookingNotes] = useState<string>('');
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSavingBooking, setIsSavingBooking] = useState(false);
    const [bookingDate, setBookingDate] = useState(
        selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    );

    // Resetear modal cuando se cierra
    const handleClose = () => {
        setCurrentStep('select-pet');
        setSelectedPet(null);
        setSelectedService(null);
        setSelectedTime('');
        setAvailableSlots([]);
        setBookingNotes('');
        setBookingDate(
            selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        );
        onClose();
    };

    // Manejar selección de mascota
    const handleSelectPet = (pet: Pet) => {
        setSelectedPet(pet);
        setCurrentStep('select-service');
    };

    // Manejar creación de mascota
    const handleCreatePet = (petData: CreatePetData) => {
        // Crear mascota con los datos + incluir en el siguiente paso
        setSelectedPet({
            id: '', // Se asignará en el servidor
            name: petData.name,
            species: petData.species,
            size: petData.size,
            breed: petData.breed,
            owner_id: null,
        });
        setCurrentStep('select-service');
    };

    // Manejar selección de servicio
    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        setCurrentStep('select-time');
        loadAvailableSlots(service);
    };

    // Cargar slots disponibles
    const loadAvailableSlots = async (service: Service) => {
        setIsLoadingSlots(true);
        try {
            const response = await fetch('/api/slots/available', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: bookingDate,
                    service_id: service.id,
                    duration: service.duration_minutes,
                }),
            });

            if (!response.ok) throw new Error('Error al cargar horarios');

            const slots = await response.json();
            setAvailableSlots(slots);
        } catch (error) {
            console.error('Error al cargar slots:', error);
            alert('Error al cargar horarios disponibles');
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    // Cambiar fecha
    const handleDateChange = async (newDate: string) => {
        setBookingDate(newDate);
        if (selectedService) {
            await loadAvailableSlots(selectedService);
        }
    };

    // Manejar selección de hora
    const handleSelectTime = (time: string) => {
        setSelectedTime(time);
        setCurrentStep('confirm');
    };

    // Guardar cita
    const handleSaveBooking = async () => {
        if (!selectedPet || !selectedService || !selectedTime) {
            alert('Faltan datos para crear la cita');
            return;
        }

        setIsSavingBooking(true);
        try {
            const response = await fetch('/api/appointments/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pet_id: selectedPet.id || null,
                    pet_data: selectedPet.id
                        ? undefined
                        : {
                            name: selectedPet.name,
                            species: selectedPet.species,
                            size: selectedPet.size,
                            breed: selectedPet.breed,
                        },
                    service_id: selectedService.id,
                    scheduled_date: bookingDate,
                    scheduled_time: selectedTime,
                    notes: bookingNotes || null,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Error al crear cita');
            }

            const appointment = await response.json();
            onBookingComplete(appointment);
            alert('✅ Cita creada correctamente');
            handleClose();
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al crear cita: ${error instanceof Error ? error.message : 'Desconocido'}`);
        } finally {
            setIsSavingBooking(false);
        }
    };

    if (!isOpen) return null;

    const speciesEmoji: Record<string, string> = {
        dog: '🐕',
        cat: '🐈',
        other: '🐾',
    };

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                {/* Header */}
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-xl font-bold">
                        {currentStep === 'select-pet' && 'Nueva Cita - Mascota'}
                        {currentStep === 'select-service' && 'Nueva Cita - Servicio'}
                        {currentStep === 'select-time' && 'Nueva Cita - Fecha y Hora'}
                        {currentStep === 'confirm' && 'Confirmar Cita'}
                        {currentStep === 'loading' && 'Creando...'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isSavingBooking}
                        class="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Contenido por paso */}
                <div class="min-h-96 space-y-4">
                    {/* Paso 1: Seleccionar Mascota */}
                    {currentStep === 'select-pet' && (
                        <PetSearchModal
                            isOpen={true}
                            onSelectPet={handleSelectPet}
                            onCreatePet={handleCreatePet}
                            services={services}
                            isLoading={isSavingBooking}
                        />
                    )}

                    {/* Paso 2: Seleccionar Servicio */}
                    {currentStep === 'select-service' && selectedPet && (
                        <div class="space-y-4">
                            <div class="rounded-lg bg-blue-50 p-3">
                                <p class="text-sm text-blue-700">
                                    <span class="font-semibold">Mascota seleccionada:</span> {speciesEmoji[selectedPet.species]} {selectedPet.name}
                                </p>
                            </div>

                            <div>
                                <label class="mb-2 block font-semibold text-gray-700">Selecciona un Servicio</label>
                                <div class="space-y-2">
                                    {services.map((service) => (
                                        <button
                                            key={service.id}
                                            onClick={() => handleSelectService(service)}
                                            class="w-full rounded-lg border-2 border-gray-200 bg-white p-3 text-left transition-colors hover:border-blue-500 hover:bg-blue-50"
                                        >
                                            <div class="flex items-center justify-between">
                                                <div>
                                                    <p class="font-medium text-gray-900">{service.name}</p>
                                                    <p class="text-xs text-gray-500">{service.duration_minutes} min</p>
                                                </div>
                                                <p class="text-lg font-semibold text-blue-600">€{service.price.toFixed(2)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentStep('select-pet')}
                                class="btn btn-secondary w-full"
                            >
                                ← Cambiar Mascota
                            </button>
                        </div>
                    )}

                    {/* Paso 3: Seleccionar Fecha y Hora */}
                    {currentStep === 'select-time' && selectedPet && selectedService && (
                        <div class="space-y-4">
                            <div class="rounded-lg bg-green-50 p-3">
                                <p class="text-sm text-green-700">
                                    <span class="font-semibold">{selectedService.name}</span> • {selectedService.duration_minutes} min
                                </p>
                            </div>

                            <div>
                                <label class="label">Fecha</label>
                                <input
                                    type="date"
                                    class="input w-full"
                                    value={bookingDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleDateChange((e.target as HTMLInputElement).value)}
                                />
                            </div>

                            <div>
                                <label class="label">Hora Disponible</label>
                                {isLoadingSlots ? (
                                    <div class="py-4 text-center text-gray-500">Cargando horarios...</div>
                                ) : availableSlots.length === 0 ? (
                                    <div class="py-4 text-center text-gray-500">No hay horarios disponibles</div>
                                ) : (
                                    <div class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                onClick={() => slot.available && handleSelectTime(slot.time)}
                                                disabled={!slot.available}
                                                class={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${!slot.available
                                                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                    : selectedTime === slot.time
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

                            <button
                                onClick={() => setCurrentStep('select-service')}
                                class="btn btn-secondary w-full"
                            >
                                ← Cambiar Servicio
                            </button>
                        </div>
                    )}

                    {/* Paso 4: Confirmar */}
                    {currentStep === 'confirm' && selectedPet && selectedService && selectedTime && (
                        <div class="space-y-4">
                            <div class="space-y-2 rounded-lg bg-gray-50 p-3">
                                <div>
                                    <p class="text-xs font-medium text-gray-500">Mascota</p>
                                    <p class="text-lg font-semibold text-gray-900">
                                        {speciesEmoji[selectedPet.species]} {selectedPet.name}
                                    </p>
                                </div>

                                <div>
                                    <p class="text-xs font-medium text-gray-500">Servicio</p>
                                    <p class="text-lg font-semibold text-gray-900">{selectedService.name}</p>
                                </div>

                                <div>
                                    <p class="text-xs font-medium text-gray-500">Fecha y Hora</p>
                                    <p class="text-lg font-semibold text-gray-900">
                                        {new Date(bookingDate).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}{' '}
                                        a las {selectedTime}
                                    </p>
                                </div>

                                <div>
                                    <p class="text-xs font-medium text-gray-500">Duración y Precio</p>
                                    <p class="text-lg font-semibold text-gray-900">
                                        {selectedService.duration_minutes} min • €{selectedService.price.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label class="label">Notas (Opcional)</label>
                                <textarea
                                    class="input w-full rounded border border-gray-300 p-2"
                                    placeholder="Ej: Llamada telefónica, cliente se llama Juan..."
                                    rows={3}
                                    value={bookingNotes}
                                    onChange={(e) => setBookingNotes((e.target as HTMLTextAreaElement).value)}
                                    disabled={isSavingBooking}
                                />
                            </div>

                            <div class="flex gap-2">
                                <button
                                    onClick={() => setCurrentStep('select-time')}
                                    class="btn btn-secondary flex-1"
                                    disabled={isSavingBooking}
                                >
                                    ← Atrás
                                </button>
                                <button
                                    onClick={handleSaveBooking}
                                    class="btn btn-primary flex-1 disabled:opacity-50"
                                    disabled={isSavingBooking}
                                >
                                    {isSavingBooking ? 'Guardando...' : '✓ Crear Cita'}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'loading' && (
                        <div class="flex items-center justify-center py-8">
                            <div class="text-center">
                                <div class="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                                <p class="text-gray-600">Creando cita...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con botón cerrar */}
                {currentStep !== 'loading' && (
                    <div class="mt-6 border-t pt-4">
                        <button onClick={handleClose} class="btn btn-secondary w-full" disabled={isSavingBooking}>
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBookingModal;
