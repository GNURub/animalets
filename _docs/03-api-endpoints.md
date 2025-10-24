# API Endpoints y Edge Functions - Animalets

**Fecha**: 24 de octubre de 2025

---

## 🌐 API Routes de Astro

### Estructura de Rutas API

```
src/pages/api/
├── auth/
│   ├── signin.ts          ✅ [Implementado]
│   ├── register.ts        ✅ [Implementado]
│   ├── signout.ts         ✅ [Implementado]
│   └── callback.ts        ✅ [Implementado]
├── appointments/
│   ├── create.ts          [ ] Por implementar
│   ├── cancel.ts          [ ] Por implementar
│   └── [id].ts            [ ] Por implementar
├── pets/
│   ├── create.ts          [ ] Por implementar
│   ├── update.ts          [ ] Por implementar
│   └── delete.ts          [ ] Por implementar
└── admin/
    ├── appointments.ts    [ ] Por implementar
    └── stats.ts           [ ] Por implementar
```

---

## 🔐 Autenticación (Ya implementado)

### POST `/api/auth/signin`

**Archivo**: `src/pages/api/auth/signin.ts` ✅

**Funcionalidad**:

- Login con email/password
- Login con OAuth (Google, GitHub, Discord)

**Request**:

```typescript
// Email/Password
{
  email: string;
  password: string;
}

// OAuth
{
  provider: 'google' | 'github' | 'discord';
}
```

**Response**:

```typescript
// Éxito (Email/Password)
{
  redirect: '/dashboard',
  cookies: {
    'sb-access-token': string,
    'sb-refresh-token': string
  }
}

// Éxito (OAuth)
{
  redirect: string  // URL de OAuth provider
}

// Error
{
  status: 400 | 500,
  message: string
}
```

---

### POST `/api/auth/register`

**Archivo**: `src/pages/api/auth/register.ts` ✅

**Funcionalidad**: Registro de nuevo usuario

**Request**:

```typescript
{
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}
```

**Response**:

```typescript
// Éxito
{
  redirect: '/app/dashboard',
  cookies: {
    'sb-access-token': string,
    'sb-refresh-token': string
  }
}

// Error
{
  status: 400 | 500,
  message: string
}
```

---

### POST `/api/auth/signout`

**Archivo**: `src/pages/api/auth/signout.ts` ✅

**Funcionalidad**: Cerrar sesión

**Response**:

```typescript
{
  redirect: '/',
  cookies: {
    'sb-access-token': null,  // Eliminadas
    'sb-refresh-token': null
  }
}
```

---

### GET `/api/auth/callback`

**Archivo**: `src/pages/api/auth/callback.ts` ✅

**Funcionalidad**: Callback de OAuth (maneja el código de autorización)

**Query Params**:

```
?code=xxx&state=xxx
```

**Response**:

```typescript
{
  redirect: '/app/dashboard',
  cookies: {
    'sb-access-token': string,
    'sb-refresh-token': string
  }
}
```

---

## 📅 Citas (Por implementar)

### POST `/api/appointments/create`

**Funcionalidad**: Crear nueva cita (cliente)

**Request**:

```typescript
{
  pet_id: string;
  service_id: string;
  date: string;        // 'YYYY-MM-DD'
  start_time: string;  // 'HH:MM'
  notes?: string;
}
```

**Validaciones**:

1. El usuario está autenticado
2. La mascota pertenece al usuario
3. El horario está disponible
4. El servicio existe y está activo

**Response**:

```typescript
// Éxito
{
  success: true,
  appointment: {
    id: string,
    date: string,
    start_time: string,
    end_time: string,
    status: 'pending'
  }
}

// Error
{
  success: false,
  error: string
}
```

**Implementación**:

```typescript
// src/pages/api/appointments/create.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('sb-access-token')?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Usuario inválido' }), {
      status: 401,
    });
  }

  const { pet_id, service_id, date, start_time, notes } = await request.json();

  // 1. Verificar que la mascota pertenece al usuario
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('owner_id')
    .eq('id', pet_id)
    .single();

  if (petError || pet.owner_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Mascota no válida' }), {
      status: 403,
    });
  }

  // 2. Obtener duración del servicio
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', service_id)
    .single();

  if (!service) {
    return new Response(JSON.stringify({ error: 'Servicio no encontrado' }), {
      status: 404,
    });
  }

  // 3. Calcular end_time
  const endTime = calculateEndTime(start_time, service.duration_minutes);

  // 4. Crear cita
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id: user.id,
      pet_id,
      service_id,
      date,
      start_time,
      end_time: endTime,
      notes,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true, appointment }), {
    status: 201,
  });
};

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(
    2,
    '0',
  )}`;
}
```

---

### PATCH `/api/appointments/cancel`

**Funcionalidad**: Cancelar cita (cliente)

**Request**:

```typescript
{
  appointment_id: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  message?: string;
}
```

---

## 🐕 Mascotas (Por implementar)

### POST `/api/pets/create`

**Request**:

```typescript
{
  name: string;
  breed?: string;
  size: 'pequeño' | 'mediano' | 'grande';
  weight_kg?: number;
  birth_date?: string;
  gender?: 'macho' | 'hembra';
  notes?: string;
}
```

**Response**:

```typescript
{
  success: true,
  pet: {
    id: string,
    name: string,
    // ...resto de campos
  }
}
```

---

### PATCH `/api/pets/update`

**Request**:

```typescript
{
  pet_id: string;
  // Campos a actualizar
  name?: string;
  breed?: string;
  // ...
}
```

---

### DELETE `/api/pets/delete`

**Request**:

```typescript
{
  pet_id: string;
}
```

**Validación**: No se puede eliminar si tiene citas pendientes.

---

## 👑 Admin (Por implementar)

### GET `/api/admin/stats`

**Funcionalidad**: Estadísticas del negocio

**Response**:

```typescript
{
  today: {
    total_appointments: number,
    completed: number,
    pending: number,
    revenue: number
  },
  this_week: {
    total_appointments: number,
    revenue: number
  },
  this_month: {
    total_appointments: number,
    revenue: number,
    top_services: Array<{
      service_name: string,
      count: number
    }>
  }
}
```

---

## ⚡ Supabase Edge Functions

Las Edge Functions se ejecutan en el edge de Supabase (Deno runtime).

### Estructura

```
supabase/functions/
├── get-available-slots/
│   └── index.ts
├── send-appointment-notification/
│   └── index.ts
└── _shared/
    └── utils.ts
```

---

## 🎯 Edge Function: `get-available-slots`

**Propósito**: Calcular slots de tiempo disponibles para reservar.

**Ubicación**: `supabase/functions/get-available-slots/index.ts`

**Input**:

```typescript
{
  date: string; // 'YYYY-MM-DD'
  duration: number; // Minutos del servicio
}
```

**Output**:

```typescript
{
  slots: string[];     // ['09:00', '09:15', '09:30', ...]
}
```

### Implementación

```typescript
// supabase/functions/get-available-slots/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  date: string;
  duration: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { date, duration }: RequestBody = await req.json();

    // Validar input
    if (!date || !duration) {
      throw new Error('date y duration son requeridos');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Obtener día de la semana (0 = Domingo, 1 = Lunes, ...)
    const dayOfWeek = new Date(date).getDay();

    // 2. Obtener horario del negocio para ese día
    const { data: businessHour, error: bhError } = await supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .single();

    if (bhError || !businessHour) {
      return new Response(
        JSON.stringify({ error: 'No hay horario configurado para este día' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (businessHour.is_closed) {
      return new Response(JSON.stringify({ slots: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Obtener citas existentes para ese día
    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('date', date)
      .in('status', ['pending', 'in_bath', 'drying', 'grooming']);

    // 4. Obtener bloqueos para ese día
    const { data: blocks } = await supabase
      .from('blocked_times')
      .select('start_time, end_time')
      .eq('date', date);

    // 5. Generar todos los slots posibles
    const allSlots = generateTimeSlots(
      businessHour.open_time,
      businessHour.close_time,
      15, // Intervalos de 15 minutos
    );

    // 6. Filtrar slots ocupados
    const availableSlots = allSlots.filter((slot) => {
      const slotEnd = addMinutes(slot, duration);

      // Verificar que el servicio completo quepa antes del cierre
      if (slotEnd > businessHour.close_time) {
        return false;
      }

      // Verificar que no choque con citas existentes
      const hasAppointmentConflict = appointments?.some((apt) => {
        return timeRangesOverlap(slot, slotEnd, apt.start_time, apt.end_time);
      });

      if (hasAppointmentConflict) {
        return false;
      }

      // Verificar que no choque con bloqueos
      const hasBlockConflict = blocks?.some((block) => {
        return timeRangesOverlap(
          slot,
          slotEnd,
          block.start_time,
          block.end_time,
        );
      });

      if (hasBlockConflict) {
        return false;
      }

      return true;
    });

    return new Response(JSON.stringify({ slots: availableSlots }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Utilidades
function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
): string[] {
  const slots: string[] = [];
  let current = start;

  while (current < end) {
    slots.push(current);
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(
    2,
    '0',
  )}`;
}

function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  return start1 < end2 && end1 > start2;
}
```

---

### Llamar a la Edge Function desde el cliente

```typescript
// En un componente isla
const { data, error } = await supabase.functions.invoke('get-available-slots', {
  body: {
    date: '2025-10-25',
    duration: 90,
  },
});

if (data) {
  console.log('Slots disponibles:', data.slots);
  // ['09:00', '10:30', '14:00', ...]
}
```

---

## 📧 Edge Function: `send-appointment-notification` (Opcional)

**Propósito**: Enviar notificación cuando una cita cambia de estado.

**Trigger**: Database Webhook (cuando `appointments.status` cambia a `'completed'`)

**Input**:

```typescript
{
  type: 'UPDATE',
  record: {
    id: string,
    status: 'completed',
    client_id: string,
    // ...
  }
}
```

**Acción**:

- Obtener email del cliente
- Enviar email con SendGrid/Resend
- Enviar SMS con Twilio (opcional)

---

## 🔒 Seguridad de Edge Functions

### Service Role Key

Las Edge Functions tienen acceso a la **Service Role Key**, que bypasea RLS.

**Importante**: Siempre validar permisos manualmente en las funciones.

```typescript
// ❌ MAL - No valida permisos
const { data } = await supabase.from('appointments').select('*'); // Retorna TODAS las citas

// ✅ BIEN - Valida permisos
const userId = req.headers.get('x-user-id');
const { data } = await supabase
  .from('appointments')
  .select('*')
  .eq('client_id', userId);
```

---

## 🧪 Testing de Edge Functions

### Local

```bash
# Iniciar Supabase localmente
supabase start

# Servir función localmente
supabase functions serve get-available-slots

# Test con curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/get-available-slots' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"date":"2025-10-25","duration":90}'
```

### Deployment

```bash
# Deploy a Supabase
supabase functions deploy get-available-slots

# Invocar desde producción
curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/get-available-slots' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"date":"2025-10-25","duration":90}'
```

---

## 📊 Rate Limiting (Consideración futura)

Para producción, considerar implementar rate limiting en las funciones críticas:

```typescript
// Usando Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

const { success } = await ratelimit.limit(userId);

if (!success) {
  return new Response('Too many requests', { status: 429 });
}
```

---

**Última Actualización**: 24 de octubre de 2025
