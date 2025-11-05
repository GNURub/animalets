import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingWizardProps {
  pets: Pet[];
  services: Service[];
  userId: string;
}

const currentStep = signal(1);
const isLoading = signal(false);
const selectedServices = signal<Service[]>([]);
const selectedPet = signal<Pet | null>(null);
const selectedDate = signal<string>('');
const selectedTime = signal<string>('');
const notes = signal<string>('');
const availableSlots = signal<TimeSlot[]>([]);
const loadingSlots = signal(false);

const BookingWizard: FunctionalComponent<BookingWizardProps> = ({
  pets,
  services,
  userId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resetear al desmontar
  useEffect(() => {
    return () => {
      currentStep.value = 1;
      selectedServices.value = [];
      selectedPet.value = null;
      selectedDate.value = '';
      selectedTime.value = '';
      notes.value = '';
    };
  }, []);

  // Cargar slots disponibles cuando cambie la fecha o servicios
  useEffect(() => {
    if (selectedDate.value && selectedServices.value.length > 0) {
      loadAvailableSlots();
    }
  }, [selectedDate.value, selectedServices.value.map((s) => s.id).join(',')]);

  const loadAvailableSlots = async () => {
    if (!selectedDate.value || selectedServices.value.length === 0) return;

    loadingSlots.value = true;
    try {
      const response = await fetch('/api/slots/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.value,
          service_ids: selectedServices.value.map((s) => s.id),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cargar horarios disponibles');
      }

      const slots = await response.json();
      availableSlots.value = slots;
    } catch (err) {
      console.error('Error al cargar slots:', err);
      setError('Error al cargar horarios disponibles');
    } finally {
      loadingSlots.value = false;
    }
  };

  const toggleService = (service: Service) => {
    const index = selectedServices.value.findIndex((s) => s.id === service.id);
    if (index > -1) {
      selectedServices.value = selectedServices.value.filter((s) => s.id !== service.id);
    } else {
      selectedServices.value = [...selectedServices.value, service];
    }
  };

  const proceedToNextStep = () => {
    if (selectedServices.value.length === 0) {
      setError('Selecciona al menos un servicio');
      return;
    }
    setError(null);
    currentStep.value = 2;
  };

  const selectPet = (pet: Pet) => {
    selectedPet.value = pet;
    setError(null);
    currentStep.value = 3;
  };

  const selectDateTime = () => {
    if (!selectedDate.value || !selectedTime.value) {
      setError('Selecciona una fecha y hora');
      return;
    }
    setError(null);
    currentStep.value = 4;
  };

  const goBack = () => {
    if (currentStep.value > 1) {
      currentStep.value--;
      setError(null);
    }
  };

  const submitBooking = async () => {
    console.log('✅ submitBooking called');
    console.log('selectedServices:', selectedServices.value);
    console.log('selectedPet:', selectedPet.value);
    console.log('selectedDate:', selectedDate.value);
    console.log('selectedTime:', selectedTime.value);

    if (
      selectedServices.value.length === 0 ||
      !selectedPet.value ||
      !selectedDate.value ||
      !selectedTime.value
    ) {
      console.log('❌ Validation failed');
      setError('Completa todos los pasos');
      return;
    }

    isLoading.value = true;
    setError(null);

    try {
      const payload = {
        service_ids: selectedServices.value.map((s) => s.id),
        pet_id: selectedPet.value.id,
        scheduled_date: selectedDate.value,
        scheduled_time: selectedTime.value,
        notes: notes.value || null,
      };
      console.log('📤 Sending payload:', payload);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('⚠️ Error response:', errorText);
        throw new Error(errorText || 'Error al crear la reserva');
      }

      const result = await response.json();
      console.log('✅ Success response:', result);

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/app/dashboard';
      }, 2000);
    } catch (err) {
      console.error('❌ Error al crear reserva:', err);
      setError(
        err instanceof Error ? err.message : 'Error al crear la reserva',
      );
    } finally {
      isLoading.value = false;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div class="card py-12 text-center">
        <div class="mb-4 text-6xl">✅</div>
        <h3 class="mb-2 text-2xl font-bold text-green-600">
          ¡Reserva Confirmada!
        </h3>
        <p class="mb-4 text-gray-600">Tu cita ha sido reservada exitosamente</p>
        <p class="text-sm text-gray-500">Redirigiendo al dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Indicador de pasos */}
      <div class="mb-8">
        <div class="mb-4 flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} class="flex flex-1 items-center">
              <div
                class={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${currentStep.value >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} `}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  class={`mx-2 h-1 flex-1 ${currentStep.value > step ? 'bg-blue-600' : 'bg-gray-200'} `}
                />
              )}
            </div>
          ))}
        </div>
        <div class="flex justify-between text-sm text-gray-600">
          <span>Servicio</span>
          <span>Mascota</span>
          <span>Fecha/Hora</span>
          <span>Confirmar</span>
        </div>
      </div>

      {error && (
        <div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="text-red-800">{error}</p>
        </div>
      )}

      {/* Paso 1: Seleccionar Servicios (Múltiples) */}
      {currentStep.value === 1 && (
        <div class="space-y-4">
          <h2 class="mb-4 text-2xl font-bold">Selecciona Servicios</h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map((service) => {
              const isSelected = selectedServices.value.some((s) => s.id === service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service)}
                  class={`card cursor-pointer border-2 text-left transition-all ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-transparent hover:border-blue-500 hover:shadow-lg'
                    }`}
                >
                  <div class="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readonly
                      class="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600"
                    />
                    <div class="flex-1">
                      <h3 class="mb-2 text-xl font-bold">{service.name}</h3>
                      {service.description && (
                        <p class="mb-4 text-sm text-gray-600">
                          {service.description}
                        </p>
                      )}
                      <div class="flex items-center justify-between">
                        <span class="text-2xl font-bold text-blue-600">
                          {formatPrice(service.price)}
                        </span>
                        <span class="text-sm text-gray-500">
                          {service.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedServices.value.length > 0 && (
            <div class="mt-4 rounded-lg bg-gray-50 p-4">
              <p class="mb-2 text-sm font-semibold text-gray-700">
                {selectedServices.value.length} servicio{selectedServices.value.length !== 1 ? 's' : ''} seleccionado{selectedServices.value.length !== 1 ? 's' : ''}
              </p>
              <p class="mb-3 text-sm text-gray-600">
                Duración total: {selectedServices.value.reduce((sum, s) => sum + s.duration_minutes, 0)} min
              </p>
              <button
                onClick={proceedToNextStep}
                class="btn btn-primary w-full"
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paso 2: Seleccionar Mascota */}
      {currentStep.value === 2 && (
        <div class="space-y-4">
          <button onClick={goBack} class="btn btn-secondary mb-4">
            ← Volver
          </button>
          <h2 class="mb-4 text-2xl font-bold">Selecciona tu Mascota</h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => selectPet(pet)}
                class="card cursor-pointer border-2 border-transparent text-left transition-shadow hover:border-blue-500 hover:shadow-lg"
              >
                <div class="flex items-center">
                  <span class="mr-3 text-4xl">
                    {pet.species === 'dog'
                      ? '🐕'
                      : pet.species === 'cat'
                        ? '🐈'
                        : '🐾'}
                  </span>
                  <div>
                    <h3 class="text-xl font-bold">{pet.name}</h3>
                    <p class="text-sm text-gray-600">
                      {pet.breed || 'Sin raza'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: Seleccionar Fecha y Hora */}
      {currentStep.value === 3 && (
        <div class="space-y-6">
          <button onClick={goBack} class="btn btn-secondary mb-4">
            ← Volver
          </button>
          <h2 class="mb-4 text-2xl font-bold">Selecciona Fecha y Hora</h2>

          <div class="card">
            <label class="label">Fecha</label>
            <input
              type="date"
              class="input"
              min={getMinDate()}
              max={getMaxDate()}
              value={selectedDate.value}
              onInput={(e) => {
                selectedDate.value = (e.target as HTMLInputElement).value;
                selectedTime.value = '';
              }}
            />
          </div>

          {selectedDate.value && (
            <div class="card">
              <label class="label mb-3">Horarios Disponibles</label>
              {loadingSlots.value ? (
                <div class="py-8 text-center">
                  <div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                  <p class="mt-4 text-gray-600">Cargando horarios...</p>
                </div>
              ) : availableSlots.value.length === 0 ? (
                <p class="py-8 text-center text-gray-600">
                  No hay horarios disponibles para esta fecha
                </p>
              ) : (
                <div class="grid grid-cols-3 gap-2 md:grid-cols-4">
                  {availableSlots.value.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => (selectedTime.value = slot.time)}
                      disabled={!slot.available}
                      class={`rounded-lg px-4 py-2 font-medium transition-colors ${!slot.available
                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                        : selectedTime.value === slot.time
                          ? 'bg-blue-600 text-white'
                          : 'border-2 border-gray-200 bg-white hover:border-blue-500'
                        } `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTime.value && (
            <button onClick={selectDateTime} class="btn btn-primary w-full">
              Continuar →
            </button>
          )}
        </div>
      )}

      {/* Paso 4: Confirmar */}
      {currentStep.value === 4 && (
        <div class="space-y-6">
          <button onClick={goBack} class="btn btn-secondary mb-4">
            ← Volver
          </button>
          <h2 class="mb-4 text-2xl font-bold">Confirmar Reserva</h2>

          <div class="card space-y-4">
            <div class="border-b pb-4">
              <h3 class="mb-1 font-semibold text-gray-700">Servicios</h3>
              <div class="space-y-2">
                {selectedServices.value.map((service) => (
                  <div key={service.id} class="flex items-center justify-between">
                    <p class="font-medium">{service.name}</p>
                    <span class="text-sm text-gray-600">{service.duration_minutes} min</span>
                  </div>
                ))}
              </div>
              <div class="mt-3 border-t pt-3">
                <p class="text-sm font-semibold text-gray-700">
                  Duración total: {selectedServices.value.reduce((sum, s) => sum + s.duration_minutes, 0)} min
                </p>
                <p class="text-lg font-bold text-blue-600">
                  Total: {formatPrice(selectedServices.value.reduce((sum, s) => sum + s.price, 0))}
                </p>
              </div>
            </div>

            <div class="border-b pb-4">
              <h3 class="mb-1 font-semibold text-gray-700">Mascota</h3>
              <p class="text-lg font-bold">{selectedPet.value?.name}</p>
              <p class="text-gray-600">
                {selectedPet.value?.breed || 'Sin raza'}
              </p>
            </div>

            <div class="border-b pb-4">
              <h3 class="mb-1 font-semibold text-gray-700">Fecha y Hora</h3>
              <p class="text-lg font-bold">
                {new Date(selectedDate.value + 'T00:00:00').toLocaleDateString(
                  'es-ES',
                  {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
              </p>
              <p class="text-gray-600">{selectedTime.value}</p>
            </div>

            <div>
              <label class="label">Notas Adicionales (Opcional)</label>
              <textarea
                class="input"
                rows={3}
                value={notes.value}
                onInput={(e) =>
                  (notes.value = (e.target as HTMLTextAreaElement).value)
                }
                placeholder="Agrega cualquier información relevante para tu cita..."
              />
            </div>
          </div>

          <button
            onClick={(e) => {
              console.log('🖱️ Button clicked, e:', e);
              submitBooking();
            }}
            disabled={isLoading.value}
            class="btn btn-primary w-full py-4 text-lg"
          >
            {isLoading.value ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingWizard;
