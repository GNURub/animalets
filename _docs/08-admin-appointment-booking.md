# 08 - Sistema de Reserva de Citas desde Admin

**Fecha**: 25 de octubre de 2025  
**Objetivo**: Permitir que el admin pueda crear citas desde el "Calendario de Citas" sin necesidad de que la mascota esté registrada previamente ni tenga dueño asignado. Útil para reservas telefónicas.

---

## 📋 Requisitos

### Funcionales

1. **Búsqueda de Mascota**: El admin puede buscar una mascota por nombre
2. **Crear Mascota Rápida**: Si la mascota no existe, el admin puede crearla en 30 segundos (solo nombre, especie, tamaño)
3. **Crear Cita sin Propietario**: La cita se crea con `owner_id = NULL` en la mascota o se crea mascota "sin dueño"
4. **Confirmar Datos**: Antes de guardar, mostrar resumen con:
   - Nombre de mascota
   - Especie
   - Servicio seleccionado
   - Fecha y hora
   - Notas (opcional)

### No-Funcionales

- No romper funcionalidad existente
- Las mascotas "sin dueño" solo pueden tener citas del admin
- Las citas del admin para mascotas sin dueño tienen `client_id = user.id` (admin)
- Compatible con React/Preact (AdminCalendar ya usa React)

---

## 🗄️ Cambios de Base de Datos

### Opción A: Permitir `owner_id = NULL` en `pets`

**Cambio a realizar**:

```sql
-- Permitir owner_id NULL para mascotas sin propietario
ALTER TABLE pets
  DROP CONSTRAINT "pets_owner_id_fkey",
  ADD CONSTRAINT "pets_owner_id_fkey"
  FOREIGN KEY (owner_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

ALTER TABLE pets
  ALTER COLUMN owner_id DROP NOT NULL;
```

**Impacto**:

- ✅ Sencillo, sin cambios estructurales
- ✅ La mascota "existe" aunque sin dueño
- ✅ Compatible con citas admin
- ⚠️ Necesita índice NULL-aware en consultas

---

## 🎯 Componentes a Crear/Modificar

### 1. **PetSearchModal.tsx** (Nuevo)

**Ubicación**: `src/components/PetSearchModal.tsx`

**Props**:

```typescript
interface PetSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPet: (pet: Pet) => void;
  onCreatePet: (pet: CreatePetPayload) => void;
  services: Service[];
}

interface Pet {
  id: string;
  name: string;
  species: string;
  size: string;
  breed?: string;
  owner_id: string | null;
}

interface CreatePetPayload {
  name: string;
  species: 'dog' | 'cat' | 'other';
  size: 'pequeño' | 'mediano' | 'grande';
  breed?: string;
  notes?: string;
}
```

**Funcionalidad**:

- Campo de búsqueda de mascota (busca por nombre)
- Lista de mascotas coincidentes
- Botón "Crear Nueva Mascota Rápida"
- Formulario inline para crear mascota sin dueño

**Estados**:

- `searching`: Buscando mascota
- `found`: Mascota encontrada, seleccionar
- `creating`: Formulario para crear nueva mascota
- `creating-loading`: Guardando nueva mascota

---

### 2. **AdminBookingModal.tsx** (Nuevo)

**Ubicación**: `src/components/AdminBookingModal.tsx`

**Props**:

```typescript
interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  services: Service[];
  onBookingComplete: (appointment: Appointment) => void;
}
```

**Flujo**:

```
Modal Abierto
    ↓
1️⃣ Buscar Mascota (PetSearchModal)
    ↓
2️⃣ Seleccionar Servicio
    ↓
3️⃣ Elegir Fecha y Hora
    ↓
4️⃣ Agregar Notas (Opcional)
    ↓
5️⃣ Confirmar y Guardar
    ↓
✅ Cita Creada
```

**Estructura**:

```tsx
<AdminBookingModal>
  {step === 'select-pet' && <PetSearchModal />}
  {step === 'select-service' && <ServiceSelector />}
  {step === 'select-time' && <TimeSelector />}
  {step === 'confirm' && <BookingSummary />}
</AdminBookingModal>
```

---

### 3. **AdminCalendar.tsx** (Modificado)

**Cambios**:

- Agregar botón "➕ Nueva Cita" en la barra de herramientas
- Pasar `isOpen` y `onClose` a `AdminBookingModal`
- Refrescar calendario cuando se crea cita desde admin

```tsx
// Nuevo estado
const [showAdminBookingModal, setShowAdminBookingModal] = useState(false);
const [selectedDateForBooking, setSelectedDateForBooking] =
  useState<Date | null>(null);

// Nuevo manejador
const handleNewAppointmentClick = () => {
  setSelectedDateForBooking(new Date());
  setShowAdminBookingModal(true);
};

// Render
<AdminBookingModal
  isOpen={showAdminBookingModal}
  onClose={() => setShowAdminBookingModal(false)}
  selectedDate={selectedDateForBooking}
  services={services}
  onBookingComplete={(apt) => {
    setAppointments([...appointments, apt]);
  }}
/>;
```

---

## 🔌 Endpoints API a Crear/Modificar

### 1. **POST `/api/appointments/admin`** (Nuevo)

**Objetivo**: Crear cita desde admin, permitiendo mascota sin dueño

**Método**: `POST`

**Request**:

```json
{
  "pet_id": "uuid-o-null",
  "pet_data": {
    "name": "Fluffy",
    "species": "cat",
    "size": "mediano",
    "breed": "Persa",
    "notes": "Miedoso"
  },
  "service_id": "uuid",
  "date": "2025-10-30",
  "start_time": "10:00",
  "notes": "Llamada telefónica, cliente se llama Juan"
}
```

**Response (201)**:

```json
{
  "id": "uuid",
  "client_id": "admin-uuid",
  "pet_id": "pet-uuid",
  "service_id": "service-uuid",
  "date": "2025-10-30",
  "start_time": "10:00",
  "end_time": "11:00",
  "status": "pending",
  "notes": "...",
  "created_at": "...",
  "pets": {
    "name": "Fluffy",
    "species": "cat",
    "owner_id": null
  },
  "services": {
    "name": "Baño Premium",
    "price": 35.0,
    "duration_minutes": 75
  }
}
```

**Validaciones**:

- Usuario debe ser admin
- Si `pet_id` es null, `pet_data` es requerido
- `service_id` debe existir
- La fecha/hora debe estar dentro de horario de negocio
- No debe haber conflicto con otras citas para esa mascota

**Lógica**:

- Si `pet_id` es null:
  - Crear nueva mascota con `owner_id = NULL`
  - Usar ese `pet_id` para la cita
- Crear cita con `client_id = user.id` (el admin)
- Retornar cita completa con relaciones

---

### 2. **GET `/api/pets/search`** (Nuevo)

**Objetivo**: Buscar mascotas por nombre (no solo propias del usuario)

**Método**: `GET`

**Query Parameters**:

```
?q=fluffy&limit=10
```

**Response (200)**:

```json
[
  {
    "id": "uuid1",
    "name": "Fluffy",
    "species": "cat",
    "size": "mediano",
    "breed": "Persa",
    "owner_id": "user-uuid"
  },
  {
    "id": "uuid2",
    "name": "Fluff-Dog",
    "species": "dog",
    "size": "pequeño",
    "breed": "Poodle",
    "owner_id": null
  }
]
```

**Validaciones**:

- Usuario debe ser admin
- Busca en todas las mascotas (incluyendo `owner_id = NULL`)
- `q` es case-insensitive
- Ordena por coincidencia exacta primero, luego parcial

---

### 3. **POST `/api/pets/admin`** (Nuevo)

**Objetivo**: Crear mascota "sin dueño" desde admin

**Método**: `POST`

**Request**:

```json
{
  "name": "Fluffy",
  "species": "cat",
  "size": "mediano",
  "breed": "Persa",
  "notes": "Miedoso, no le gusta el agua",
  "gender": "hembra"
}
```

**Response (201)**:

```json
{
  "id": "uuid",
  "name": "Fluffy",
  "species": "cat",
  "size": "mediano",
  "breed": "Persa",
  "notes": "...",
  "gender": "hembra",
  "owner_id": null,
  "created_at": "..."
}
```

**Validaciones**:

- Usuario debe ser admin
- `name`, `species`, `size` son requeridos
- `species`: 'dog' | 'cat' | 'other'
- `size`: 'pequeño' | 'mediano' | 'grande'

---

## 📁 Archivos a Crear/Modificar

### Crear:

- `src/components/PetSearchModal.tsx`
- `src/components/AdminBookingModal.tsx`
- `src/pages/api/appointments/admin.ts`
- `src/pages/api/pets/search.ts`
- `src/pages/api/pets/admin.ts`

### Modificar:

- `src/components/AdminCalendar.tsx` (agregar botón + modal)
- `supabase/migrations/20251025000005_allow_null_owner.sql` (nueva migración)

---

## 🔐 Seguridad y Políticas RLS

### Cambios a RLS

**Para `pets`**:

```sql
-- Admin puede crear mascotas sin dueño (owner_id NULL)
CREATE POLICY admin_create_pets_no_owner
  ON pets FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Admin puede ver todas las mascotas
CREATE POLICY admin_view_all_pets
  ON pets FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

**Para `appointments`**:

```sql
-- Appointments creadas por admin (client_id = admin) con pet sin owner
CREATE POLICY admin_appointments_no_owner
  ON appointments FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Admin puede ver todas las citas
CREATE POLICY admin_view_all_appointments
  ON appointments FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

---

## 🧪 Plan de Testing

### Casos de Uso:

1. **Buscar mascota existente**:
   - Escribe "Fluffy" → debe mostrar todos los Fluffy
   - Seleccionar uno → ir a paso 2

2. **Crear mascota nueva rápida**:
   - Búsqueda vacía → mostrar "Crear Nueva"
   - Rellenar: Nombre, Especie, Tamaño
   - Crear → ir a paso 2

3. **Seleccionar servicio y fecha**:
   - Elegir "Baño Premium"
   - Seleccionar fecha y hora disponible
   - Agregar notas (opcional)

4. **Confirmar y guardar**:
   - Mostrar resumen
   - Guardar → cita en calendario

5. **Verificar que no rompe**:
   - Cliente reserva desde app (flujo existente)
   - Admin modifica cita existente
   - Búsqueda de citas de cliente

---

## 🔄 Orden de Implementación

1. **Migración DB**: Permitir `owner_id = NULL`
2. **Endpoints API**: `/api/pets/admin`, `/api/pets/search`, `/api/appointments/admin`
3. **Componentes**: `PetSearchModal`, `AdminBookingModal`
4. **Integración**: Modificar `AdminCalendar`
5. **Testing**: Validar casos de uso

---

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────┐
│   AdminCalendar                     │
│  (Presiona ➕ Nueva Cita)            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   AdminBookingModal (Step 1)        │
│   → PetSearchModal                  │
│   (Buscar mascota o crear nueva)    │
└────────────┬────────────────────────┘
             │ (Mascota seleccionada)
             ▼
┌─────────────────────────────────────┐
│   AdminBookingModal (Step 2)        │
│   (Seleccionar servicio)            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   AdminBookingModal (Step 3)        │
│   (Elegir fecha y hora)             │
│   → /api/slots/available            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   AdminBookingModal (Step 4)        │
│   (Confirmar datos)                 │
└────────────┬────────────────────────┘
             │ (Guardar)
             ▼
        POST /api/appointments/admin
             │
             ▼
┌─────────────────────────────────────┐
│   ✅ Cita Creada                    │
│   (Refrescar calendario)            │
└─────────────────────────────────────┘
```

---

## 📝 Notas

- Las citas creadas por admin tienen `client_id = admin_uuid`
- Las mascotas "sin dueño" tienen `owner_id = NULL`
- El cliente normal no puede crear citas para mascotas sin dueño
- El admin ve TODAS las citas (las suyas y las de clientes)
- Las políticas RLS aseguran que solo admins pueden acceder a estos endpoints

---

## ✅ Criterios de Aceptación

- [ ] Admin puede buscar y crear citas sin que la mascota tenga propietario
- [ ] Se pueden crear mascotas nuevas rápidamente desde el modal de reserva
- [ ] Las citas aparecen en el calendario
- [ ] Las citas se puede modificar/cancelar como cualquier otra
- [ ] No se rompe el flujo de reserva del cliente
- [ ] No se rompe el flujo de búsqueda de mascotas del cliente
- [ ] Las mascotas sin dueño solo se pueden ver/editar desde admin
- [ ] Las citas sin cliente registrado muestran correctamente en el admin
