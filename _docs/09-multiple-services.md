# Múltiples Servicios por Cita - IMPLEMENTACIÓN COMPLETADA

**Fecha**: 25 de octubre de 2025  
**Estado**: ✅ Implementado

---

## 🎯 Objetivo Completado

Permitir que una cita incluya múltiples servicios (ej: Corte con tijera + Baño). La duración total se calcula sumando las duraciones de cada servicio, y se verifica disponibilidad para ese tiempo total.

---

## ✅ Cambios Implementados

### 1. Base de Datos

**Migración creada**: `supabase/migrations/20251025000008_multiple_services.sql`

**Nueva tabla: `appointment_services`**

```sql
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  order_index INT NOT NULL,
  created_at TIMESTAMP,
  CONSTRAINT unique_appointment_service UNIQUE(appointment_id, service_id),
  CONSTRAINT valid_order CHECK (order_index >= 0)
);
```

**Cambios en `appointments`**:

- ✅ Removida columna `service_id` (ahora en `appointment_services`)
- ✅ Agregada `total_duration_minutes INT` - Suma de duraciones
- ✅ Agregada `total_price DECIMAL(10,2)` - Suma de precios
- ✅ Datos migrados desde `service_id` a `appointment_services`

**RLS Policies**:

- ✅ Clientes pueden ver/crear/actualizar sus appointment_services
- ✅ Admins pueden gestionar todos los appointment_services

---

### 2. API Endpoints

#### ✅ POST `/api/slots/available`

- **Cambio**: Acepta `service_ids` (array) en lugar de `service_id` único
- **Lógica**: Calcula duración total sumando todas las duraciones
- **Verificación**: Comprueba disponibilidad para duración total
- **Compatibilidad**: Aún acepta `duration` para compatibilidad

#### ✅ POST `/api/appointments/index` (Cliente)

- **Cambio**: Acepta `service_ids` (array)
- **Validación**: Array no vacío, todos los servicios existen
- **Cálculo**: total_duration_minutes y total_price
- **Datos**: Inserta en `appointments` + `appointment_services`

#### ✅ POST `/api/appointments/admin` (Admin)

- **Cambio**: Idéntico a `/appointments/index` pero sin validación de mascota
- **Soporte**: Puede crear mascota inline si no existe
- **Servicios**: Múltiples servicios con orden

---

### 3. Frontend - Componentes

#### ✅ AdminBookingModal.tsx

**Paso 2**: Multi-selección de servicios

- Estado: `selectedServices: Service[]` (array)
- Handler: `handleToggleService()` - Agrega/quita servicio
- Cálculos: `totalDuration` y `totalPrice` automáticos
- UI: Checkboxes con información de servicios seleccionados

**Paso 3**: Verifica disponibilidad para duración total

- Llama: `loadAvailableSlots()`
- Parámetros: `service_ids` (array)

**Paso 4**: Muestra resumen con todos los servicios

- Listado de servicios seleccionados con duraciones individuales
- Total de duración y precio

#### ✅ BookingWizard.tsx (Cliente)

**Igual que AdminBookingModal**:

- Paso 1: Multi-select de servicios con checkboxes
- Muestra totales: duración + precio
- Botón "Continuar" habilitado solo con servicios seleccionados
- Paso 4: Resumen con desglose de servicios

---

### 4. Páginas Astro

#### ✅ `/admin/calendario.astro`

- **Query**: Cambio a obtener `appointment_services` en lugar de `services`
- **Relación**: Incluye servicios anidados en `appointment_services`

#### ✅ `/app/dashboard.astro`

- **Query**: Obtiene `appointment_services` con servicios anidados
- **Renderizado**: Muestra servicios unidos con " + "
- **Precio**: Usa `total_price` de la cita

---

### 5. Componente AdminCalendar.tsx

#### Interfaz Actualizada

```typescript
interface Appointment {
  total_duration_minutes: number;
  total_price: number;
  appointment_services: Array<{
    order_index: number;
    services: { name: string; duration_minutes: number; price: number };
  }>;
  // ... otros campos
}
```

#### Cambios

- ✅ Calcula título con todos los servicios: "Pet - Servicio1 + Servicio2"
- ✅ Usa `total_duration_minutes` para duración total
- ✅ Renderiza lista de servicios con desglose

---

## 📊 Flujo de Datos

```
Usuario selecciona múltiples servicios
         ↓
Calcula duración total (sum de duraciones)
         ↓
Solicita slots disponibles con service_ids
         ↓
API calcula total_duration y verifica capacidad
         ↓
Muestra slots disponibles para tiempo total
         ↓
Usuario selecciona hora
         ↓
Crea cita:
  - INSERT appointments (total_duration_minutes, total_price)
  - INSERT appointment_services (una fila por servicio)
         ↓
Retorna cita con servicios relacionados ordenados
```

---

## 🔄 Queries Ejemplos

### Obtener cita con servicios

```typescript
const { data: appointment } = await supabase
  .from('appointments')
  .select(
    `
    *,
    appointment_services(
      order_index,
      services(id, name, price, duration_minutes)
    )
  `,
  )
  .eq('id', appointmentId)
  .single();

// Retorna:
// {
//   id, scheduled_date, scheduled_time,
//   total_duration_minutes: 120,
//   total_price: 45.50,
//   appointment_services: [
//     { order_index: 0, services: { name: "Corte", ... } },
//     { order_index: 1, services: { name: "Baño", ... } }
//   ]
// }
```

### Verificar disponibilidad

```typescript
const { data: existingAppointments } = await supabase
  .from('appointments')
  .select('scheduled_time, total_duration_minutes')
  .eq('scheduled_date', date)
  .in('status', ['pending', 'confirmed']);
```

---

## 📝 Validaciones Implementadas

- ✅ `service_ids` es array no vacío
- ✅ Todos los servicios existen y están activos
- ✅ No hay duplicados en servicios
- ✅ Duración total validada
- ✅ Disponibilidad verificada para duración total
- ✅ Sin overlaps con otras citas
- ✅ Total price > 0

---

## 🗂️ Archivos Modificados

| Archivo                                                    | Cambios                                                |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `supabase/migrations/20251025000008_multiple_services.sql` | **Creado** - Nueva tabla + migración de datos + RLS    |
| `src/pages/api/slots/available.ts`                         | ✅ Acepta `service_ids` array, calcula duración total  |
| `src/pages/api/appointments/index.ts`                      | ✅ POST y GET con múltiples servicios                  |
| `src/pages/api/appointments/admin.ts`                      | ✅ Igual que index pero sin validación de mascota      |
| `src/components/AdminBookingModal.tsx`                     | ✅ Multi-select de servicios, 4 pasos                  |
| `src/components/BookingWizard.tsx`                         | ✅ Multi-select de servicios, 4 pasos                  |
| `src/components/AdminCalendar.tsx`                         | ✅ Interfaz actualizada, renderiza múltiples servicios |
| `src/pages/admin/calendario.astro`                         | ✅ Query actualizada a appointment_services            |
| `src/pages/app/dashboard.astro`                            | ✅ Muestra servicios unidos, usa total_price           |

---

## 🎯 Casos de Uso Soportados

1. ✅ **Corte + Baño**: 60 + 30 = 90 min total
2. ✅ **Baño + Peinado + Corte**: 30 + 20 + 60 = 110 min total
3. ✅ **Servicio único**: Funciona igual que antes (1 servicio en array)
4. ✅ **Admin telefónico**: Crea cita con múltiples servicios para cliente sin cuenta
5. ✅ **Disponibilidad**: Verifica slots para duración total de combinación

---

## ✨ Ventajas

- ✅ Flexibilidad: Cualquier combinación de servicios
- ✅ Claridad: Cada servicio se ve con su duración y precio
- ✅ Precisión: Disponibilidad calculada para tiempo real requerido
- ✅ Totales: Total de duración y precio automático
- ✅ Orden: Servicios mantenidos en orden de selección
- ✅ Compatibilidad: Migración automática de datos antiguos

---

## 🚀 Estado

**IMPLEMENTACIÓN COMPLETA Y FUNCIONAL**

- ✅ Base de datos: Tabla creada, datos migrados, RLS configurado
- ✅ API: Todos los endpoints actualizados
- ✅ Frontend: Componentes actualizados
- ✅ UI: Multi-select funcional con cálculos automáticos
- ✅ Sin errores de compilación
