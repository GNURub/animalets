# Especificaciones de Componentes - Animalets

**Fecha**: 24 de octubre de 2025

---

## 🏝️ Islas Interactivas (Interactive Islands)

Las islas son componentes que se hidratan en el cliente. Se implementarán en **Preact** para mantener el bundle pequeño.

---

## 📋 Componentes del Portal de Cliente

### 1. `BookingWizard` (Asistente de Reserva)

**Ubicación**: `src/components/islands/BookingWizard.jsx`  
**Ruta**: `/app/reservar`  
**Hidratación**: `client:load`

#### Funcionalidad

Asistente multi-paso para reservar una cita:

1. **Paso 1**: Seleccionar mascota
2. **Paso 2**: Seleccionar servicio
3. **Paso 3**: Seleccionar fecha y hora
4. **Paso 4**: Confirmación

#### Estado

```typescript
interface BookingState {
  step: 1 | 2 | 3 | 4;
  selectedPet: Pet | null;
  selectedService: Service | null;
  selectedDate: string | null;
  selectedTime: string | null;
  availableSlots: string[];
  notes: string;
  loading: boolean;
  error: string | null;
}
```

#### Props

```typescript
interface BookingWizardProps {
  userId: string;
}
```

#### Flujo

```
┌─────────────────────────────────────────────────────────┐
│                    Paso 1: Mascota                       │
│  • Fetch pets del usuario                               │
│  • Mostrar tarjetas con foto y nombre                   │
│  • Botón "Añadir nueva mascota"                         │
│  • Al seleccionar → setStep(2)                          │
└─────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│                   Paso 2: Servicio                       │
│  • Fetch servicios activos                              │
│  • Mostrar tarjetas con nombre, duración y precio       │
│  • Al seleccionar → setStep(3)                          │
└─────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│                 Paso 3: Fecha y Hora                     │
│  • Datepicker (deshabilitar pasado y domingos)          │
│  • Al seleccionar fecha:                                │
│    → Llamar Edge Function getAvailableSlots             │
│    → Mostrar botones de horarios disponibles            │
│  • Input de notas (opcional)                            │
│  • Al seleccionar hora → setStep(4)                     │
└─────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│                  Paso 4: Confirmación                    │
│  • Resumen de la reserva                                │
│  • Botón "Confirmar" → POST /api/appointments/create    │
│  • Loading spinner mientras se crea                     │
│  • Redirect a /app/tracker/:id                          │
└─────────────────────────────────────────────────────────┘
```

#### Ejemplo de Código

```jsx
// src/components/islands/BookingWizard.jsx
import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../../lib/supabase';

export default function BookingWizard({ userId }) {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar mascotas
  useEffect(() => {
    loadPets();
  }, []);

  // Cargar servicios cuando se selecciona mascota
  useEffect(() => {
    if (selectedPet) {
      loadServices();
    }
  }, [selectedPet]);

  // Cargar slots cuando se selecciona fecha
  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  async function loadPets() {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', userId);

    if (!error) setPets(data);
  }

  async function loadServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true);

    if (!error) setServices(data);
  }

  async function loadAvailableSlots() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke(
      'get-available-slots',
      {
        body: {
          date: selectedDate,
          duration: selectedService.duration_minutes,
        },
      },
    );

    if (!error) {
      setAvailableSlots(data.slots);
    }
    setLoading(false);
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet_id: selectedPet.id,
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedTime,
        notes,
      }),
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = `/app/tracker/${result.appointment.id}`;
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div class="booking-wizard">
      {/* Progress bar */}
      <div class="progress-bar">
        {[1, 2, 3, 4].map((s) => (
          <div class={`step ${s <= step ? 'active' : ''}`}>Paso {s}</div>
        ))}
      </div>

      {/* Paso 1: Seleccionar Mascota */}
      {step === 1 && (
        <div class="step-content">
          <h2>Selecciona tu mascota</h2>
          <div class="pets-grid">
            {pets.map((pet) => (
              <div
                key={pet.id}
                class="pet-card"
                onClick={() => {
                  setSelectedPet(pet);
                  setStep(2);
                }}
              >
                <img src={pet.photo_url || '/default-pet.png'} alt={pet.name} />
                <h3>{pet.name}</h3>
                <p>
                  {pet.breed} • {pet.size}
                </p>
              </div>
            ))}
          </div>
          <button
            class="btn-secondary"
            onClick={() => (window.location.href = '/app/mascotas')}
          >
            + Añadir nueva mascota
          </button>
        </div>
      )}

      {/* Paso 2: Seleccionar Servicio */}
      {step === 2 && (
        <div class="step-content">
          <h2>Selecciona el servicio</h2>
          <div class="services-grid">
            {services.map((service) => (
              <div
                key={service.id}
                class="service-card"
                onClick={() => {
                  setSelectedService(service);
                  setStep(3);
                }}
              >
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div class="service-details">
                  <span>⏱️ {service.duration_minutes} min</span>
                  <span class="price">€{service.price}</span>
                </div>
              </div>
            ))}
          </div>
          <button class="btn-secondary" onClick={() => setStep(1)}>
            ← Atrás
          </button>
        </div>
      )}

      {/* Paso 3: Seleccionar Fecha y Hora */}
      {step === 3 && (
        <div class="step-content">
          <h2>Selecciona fecha y hora</h2>

          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {loading && <p>Cargando horarios disponibles...</p>}

          {availableSlots.length > 0 && (
            <div class="time-slots">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  class={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          {selectedDate && availableSlots.length === 0 && !loading && (
            <p class="no-slots">No hay horarios disponibles para esta fecha</p>
          )}

          <textarea
            placeholder="Notas adicionales (opcional)"
            value={notes}
            onInput={(e) => setNotes(e.target.value)}
          />

          <div class="actions">
            <button class="btn-secondary" onClick={() => setStep(2)}>
              ← Atrás
            </button>
            <button
              class="btn-primary"
              disabled={!selectedTime}
              onClick={() => setStep(4)}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Confirmación */}
      {step === 4 && (
        <div class="step-content confirmation">
          <h2>Confirma tu reserva</h2>

          <div class="summary">
            <div class="summary-item">
              <strong>Mascota:</strong> {selectedPet.name}
            </div>
            <div class="summary-item">
              <strong>Servicio:</strong> {selectedService.name}
            </div>
            <div class="summary-item">
              <strong>Fecha:</strong> {selectedDate}
            </div>
            <div class="summary-item">
              <strong>Hora:</strong> {selectedTime}
            </div>
            <div class="summary-item">
              <strong>Precio:</strong> €{selectedService.price}
            </div>
            {notes && (
              <div class="summary-item">
                <strong>Notas:</strong> {notes}
              </div>
            )}
          </div>

          {error && <p class="error">{error}</p>}

          <div class="actions">
            <button
              class="btn-secondary"
              onClick={() => setStep(3)}
              disabled={loading}
            >
              ← Atrás
            </button>
            <button
              class="btn-primary"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 2. `PetManager` (Gestor de Mascotas)

**Ubicación**: `src/components/islands/PetManager.jsx`  
**Ruta**: `/app/mascotas`  
**Hidratación**: `client:load`

#### Funcionalidad

CRUD completo de mascotas del usuario.

#### Estado

```typescript
interface PetManagerState {
  pets: Pet[];
  selectedPet: Pet | null;
  isModalOpen: boolean;
  mode: 'create' | 'edit' | 'delete';
  loading: boolean;
}
```

#### UI

- Lista de tarjetas de mascotas
- Botón "Añadir mascota" → abre modal
- En cada tarjeta: botones "Editar" y "Eliminar"
- Modal con formulario

#### Formulario

```jsx
<form onSubmit={handleSubmit}>
  <input type="text" placeholder="Nombre" required />
  <input type="text" placeholder="Raza" />
  <select required>
    <option value="pequeño">Pequeño</option>
    <option value="mediano">Mediano</option>
    <option value="grande">Grande</option>
  </select>
  <input type="number" placeholder="Peso (kg)" />
  <input type="date" placeholder="Fecha de nacimiento" />
  <select>
    <option value="macho">Macho</option>
    <option value="hembra">Hembra</option>
  </select>
  <textarea placeholder="Notas especiales" />
  <button type="submit">Guardar</button>
</form>
```

---

### 3. `RealtimeTracker` (Tracker en Tiempo Real)

**Ubicación**: `src/components/islands/RealtimeTracker.jsx`  
**Ruta**: `/app/tracker/:id`  
**Hidratación**: `client:load`

#### Funcionalidad

Muestra el estado actual de la cita en tiempo real y se suscribe a cambios.

#### Estado

```typescript
interface TrackerState {
  appointment: Appointment | null;
  status: 'pending' | 'in_bath' | 'drying' | 'grooming' | 'completed';
  finalPhotoUrl: string | null;
  loading: boolean;
}
```

#### Suscripción Realtime

```jsx
useEffect(() => {
  // Cargar estado inicial
  loadAppointment();

  // Suscribirse a cambios
  const channel = supabase
    .channel(`appointment-${appointmentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'appointments',
        filter: `id=eq.${appointmentId}`,
      },
      (payload) => {
        setStatus(payload.new.status);
        setFinalPhotoUrl(payload.new.final_photo_url);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [appointmentId]);
```

#### UI Visual

```
┌─────────────────────────────────────┐
│         Hola! 👋                     │
│     Tu mascota está siendo atendida │
│                                     │
│  ┌─────┐                            │
│  │ 🐕  │  Max                       │
│  └─────┘                            │
│                                     │
│  Estado Actual:                     │
│                                     │
│    [✓] Pendiente                    │
│    [✓] En Baño                      │
│    [→] Secando  ← AHORA             │
│    [ ] Peinado                      │
│    [ ] ¡Listo!                      │
│                                     │
│  🕐 Tiempo estimado: 15 min         │
│                                     │
└─────────────────────────────────────┘
```

#### Animaciones

```css
.status-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

#### Cuando está completado

```jsx
{
  status === 'completed' && (
    <div class="completed">
      <h2>🎉 ¡Listo!</h2>
      <p>Tu mascota está lista para ser recogida</p>
      {finalPhotoUrl && (
        <div class="final-photo">
          <img src={finalPhotoUrl} alt="Foto final" />
          <button onClick={() => downloadPhoto(finalPhotoUrl)}>
            📥 Descargar foto
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 👑 Componentes del Panel Admin

### 4. `AdminCalendar` (Calendario de Citas)

**Ubicación**: `src/components/islands/AdminCalendar.jsx`  
**Ruta**: `/admin/calendario`  
**Hidratación**: `client:load`

#### Dependencia

```bash
pnpm add @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

#### Funcionalidad

- Vista mensual y semanal
- Ver todas las citas
- Crear cita manual (click en slot vacío)
- Editar cita (click en evento)
- Arrastrar para mover citas

#### Eventos del Calendario

```typescript
interface CalendarEvent {
  id: string;
  title: string; // "Max - Baño Completo"
  start: Date;
  end: Date;
  backgroundColor: string; // Color según estado
  extendedProps: {
    petName: string;
    clientName: string;
    serviceName: string;
    status: string;
  };
}
```

#### Colores por Estado

```javascript
const statusColors = {
  pending: '#3b82f6', // Azul
  in_bath: '#f59e0b', // Naranja
  drying: '#8b5cf6', // Morado
  grooming: '#ec4899', // Rosa
  completed: '#10b981', // Verde
  cancelled: '#6b7280', // Gris
};
```

---

### 5. `KanbanBoard` (Panel de Estados)

**Ubicación**: `src/components/islands/KanbanBoard.jsx`  
**Ruta**: `/admin/hoy`  
**Hidratación**: `client:load`

#### Dependencia

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable
```

#### Funcionalidad

Vista tipo Trello para gestionar los estados de las citas del día.

#### Columnas

```javascript
const columns = [
  { id: 'pending', title: '📋 Pendiente', color: 'blue' },
  { id: 'in_bath', title: '🛁 En Baño', color: 'orange' },
  { id: 'drying', title: '💨 Secando', color: 'purple' },
  { id: 'grooming', title: '✂️ Peinado', color: 'pink' },
  { id: 'completed', title: '✅ Completado', color: 'green' },
];
```

#### Tarjeta de Cita

```jsx
<div class="appointment-card" draggable>
  <div class="card-header">
    <span class="time">10:30</span>
    <span class="duration">90 min</span>
  </div>
  <div class="card-body">
    <h3>🐕 Max</h3>
    <p>Cliente: Juan Pérez</p>
    <p>Servicio: Corte Completo</p>
  </div>
  <div class="card-actions">
    <button onClick={() => openDetails(appointment)}>Ver detalles</button>
    <button onClick={() => openPhotoUpload(appointment)}>📸 Subir foto</button>
  </div>
</div>
```

#### Drag & Drop

```jsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function handleDragEnd(event) {
  const { active, over } = event;

  if (!over) return;

  const appointmentId = active.id;
  const newStatus = over.id; // ID de la columna

  // Actualizar en Supabase
  updateAppointmentStatus(appointmentId, newStatus);
}

async function updateAppointmentStatus(id, status) {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (!error) {
    // El cambio se propagará automáticamente a los clientes suscritos
    console.log('✅ Estado actualizado');
  }
}
```

---

### 6. `PhotoUploader` (Subir Foto Final)

**Ubicación**: `src/components/islands/PhotoUploader.jsx`  
**Usado en**: Modal del `KanbanBoard`

#### Funcionalidad

Permite al admin subir la foto final de la mascota.

#### Flujo

```jsx
async function handlePhotoUpload(file, appointmentId) {
  // 1. Subir archivo a Supabase Storage
  const fileName = `${appointmentId}-${Date.now()}.jpg`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('appointment-photos')
    .upload(fileName, file);

  if (uploadError) {
    alert('Error al subir foto');
    return;
  }

  // 2. Obtener URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from('appointment-photos').getPublicUrl(fileName);

  // 3. Actualizar la cita con la URL
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      final_photo_url: publicUrl,
      status: 'completed', // Marcar como completada
    })
    .eq('id', appointmentId);

  if (!updateError) {
    alert('✅ Foto subida y cita completada!');
  }
}
```

#### UI

```jsx
<div class="photo-uploader">
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setFile(e.target.files[0])}
  />

  {file && (
    <div class="preview">
      <img src={URL.createObjectURL(file)} alt="Preview" />
    </div>
  )}

  <button onClick={() => handlePhotoUpload(file, appointmentId)}>
    Subir y completar
  </button>
</div>
```

---

## 🎨 Componentes UI Reutilizables (Astro)

### `Button.astro`

```astro
---
interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const {
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
} = Astro.props;

const classes = `btn btn-${variant} btn-${size}`;
---

<button type={type} class={classes} disabled={disabled}>
  <slot />
</button>

<style>
  .btn {
    @apply rounded-lg px-4 py-2 font-medium transition;
  }

  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700;
  }

  .btn-sm {
    @apply px-3 py-1 text-sm;
  }

  .btn-lg {
    @apply px-6 py-3 text-lg;
  }

  .btn:disabled {
    @apply cursor-not-allowed opacity-50;
  }
</style>
```

---

### `Card.astro`

```astro
---
interface Props {
  title?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const { title, padding = 'md' } = Astro.props;
---

<div class={`card card-padding-${padding}`}>
  {title && <h3 class="card-title">{title}</h3>}
  <div class="card-content">
    <slot />
  </div>
</div>

<style>
  .card {
    @apply rounded-lg bg-white shadow-md;
  }

  .card-padding-sm {
    @apply p-2;
  }

  .card-padding-md {
    @apply p-4;
  }

  .card-padding-lg {
    @apply p-6;
  }

  .card-title {
    @apply mb-4 text-xl font-bold;
  }
</style>
```

---

### `Modal.jsx` (Isla)

```jsx
// src/components/islands/Modal.jsx
import { useEffect } from 'preact/hooks';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal-content" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>{title}</h2>
          <button class="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div class="modal-body">{children}</div>
      </div>
    </div>
  );
}
```

```css
.modal-overlay {
  @apply bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black;
}

.modal-content {
  @apply max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white;
}

.modal-header {
  @apply flex items-center justify-between border-b p-6;
}

.close-btn {
  @apply text-3xl text-gray-500 hover:text-gray-700;
}

.modal-body {
  @apply p-6;
}
```

---

## 📊 Resumen de Componentes

| Componente        | Tipo  | Ruta                | Prioridad | Complejidad |
| ----------------- | ----- | ------------------- | --------- | ----------- |
| `BookingWizard`   | Isla  | `/app/reservar`     | Alta      | Alta        |
| `PetManager`      | Isla  | `/app/mascotas`     | Alta      | Media       |
| `RealtimeTracker` | Isla  | `/app/tracker/:id`  | Alta      | Alta        |
| `AdminCalendar`   | Isla  | `/admin/calendario` | Alta      | Alta        |
| `KanbanBoard`     | Isla  | `/admin/hoy`        | Alta      | Alta        |
| `PhotoUploader`   | Isla  | Modal               | Media     | Baja        |
| `Button`          | Astro | Global              | Media     | Baja        |
| `Card`            | Astro | Global              | Media     | Baja        |
| `Modal`           | Isla  | Global              | Media     | Media       |

---

**Última Actualización**: 24 de octubre de 2025
