# Arquitectura Técnica - Animalets

**Fecha**: 24 de octubre de 2025

---

## 📐 Arquitectura General

### Patrón Arquitectónico: MPA (Multi-Page Application) + Islands Architecture

Animalets utiliza una arquitectura híbrida que combina:

1. **MPA tradicional**: Navegación entre páginas con recarga (ultra-rápida gracias a SSR)
2. **Islands Architecture**: Componentes interactivos hidratados solo donde se necesitan
3. **Backend as a Service (BaaS)**: Supabase proporciona toda la infraestructura backend

---

## 🌊 Flujo de Petición HTTP

### Petición a Página Pública (ej: `/servicios`)

```
Cliente → Astro Server → Renderiza servicios.astro (SSR)
                       ↓
                  Fetch datos de Supabase (server-side)
                       ↓
                  Genera HTML completo
                       ↓
Cliente ← HTML estático (sin JS, solo CSS)
```

**Resultado**: Carga instantánea, SEO perfecto.

### Petición a Página con Isla Interactiva (ej: `/app/reservar`)

```
Cliente → Astro Server → Verifica autenticación (middleware)
                       ↓
                  Renderiza reservar.astro (SSR)
                       ↓
                  Genera HTML + referencia a isla
                       ↓
Cliente ← HTML + <script> del componente BookingWizard
       ↓
       Hidrata el componente (client-side)
       ↓
       Isla se conecta directamente a Supabase (WebSocket + HTTP)
```

**Resultado**: Carga inicial rápida + interactividad completa.

---

## 🏗️ Arquitectura de Componentes

### Capas de la Aplicación

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                  │
│  • Páginas Astro (.astro)                                │
│  • Layouts                                               │
│  • Componentes estáticos                                 │
└─────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│                  CAPA DE INTERACTIVIDAD                  │
│  • Islas Preact/Svelte (.jsx, .svelte)                  │
│  • Gestión de estado local (signals, stores)            │
│  • Lógica de UI                                          │
└─────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                     │
│  • Cliente Supabase (supabase.ts)                       │
│  • API Routes de Astro (/api/*)                         │
│  • Middleware de autenticación                           │
└─────────────────────────────────────────────────────────┘
                         ⬇️
┌─────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                       │
│  • Supabase PostgreSQL                                   │
│  • Supabase Auth                                         │
│  • Supabase Storage                                      │
│  • Supabase Realtime                                     │
│  • Edge Functions                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura de Directorios

```
/home/gnurub/code/animalets/
│
├── _docs/                          # 📚 Documentación del proyecto
│   ├── 00-project-overview.md
│   ├── 01-technical-architecture.md (este archivo)
│   ├── 02-database-schema.md
│   ├── phases/
│   └── tasks/
│
├── public/                         # 🌐 Assets estáticos
│   ├── images/
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── assets/                     # 🎨 Assets procesados por Vite
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/                 # 🧩 Componentes
│   │   ├── islands/                # Islas interactivas (Preact/Svelte)
│   │   │   ├── BookingWizard.jsx
│   │   │   ├── PetManager.jsx
│   │   │   ├── RealtimeTracker.jsx
│   │   │   ├── AdminCalendar.jsx
│   │   │   └── KanbanBoard.jsx
│   │   │
│   │   ├── ui/                     # Componentes UI reutilizables
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   ├── Modal.jsx
│   │   │   └── Input.astro
│   │   │
│   │   └── Welcome.astro           # Componentes Astro estáticos
│   │
│   ├── layouts/                    # 📄 Layouts
│   │   ├── Layout.astro            # Layout base
│   │   ├── AppLayout.astro         # Layout para /app/*
│   │   └── AdminLayout.astro       # Layout para /admin/*
│   │
│   ├── lib/                        # 📚 Librerías y utilidades
│   │   ├── supabase.ts             # Cliente Supabase
│   │   ├── auth.ts                 # Utilidades de autenticación
│   │   ├── validators.ts           # Validaciones
│   │   └── constants.ts            # Constantes
│   │
│   ├── middleware/                 # 🛡️ Middleware de Astro
│   │   └── auth.ts                 # Middleware de autenticación
│   │
│   ├── pages/                      # 📄 Rutas (file-based routing)
│   │   ├── index.astro             # Landing page (/)
│   │   ├── servicios.astro         # /servicios
│   │   ├── quienes-somos.astro     # /quienes-somos
│   │   ├── contacto.astro          # /contacto
│   │   ├── signin.astro            # /signin
│   │   ├── register.astro          # /register
│   │   │
│   │   ├── api/                    # API Routes
│   │   │   └── auth/
│   │   │       ├── signin.ts
│   │   │       ├── register.ts
│   │   │       ├── signout.ts
│   │   │       └── callback.ts
│   │   │
│   │   ├── app/                    # Portal de cliente (protegido)
│   │   │   ├── dashboard.astro
│   │   │   ├── mascotas/
│   │   │   │   └── index.astro
│   │   │   ├── reservar.astro
│   │   │   └── tracker/
│   │   │       └── [id].astro
│   │   │
│   │   └── admin/                  # Panel admin (protegido)
│   │       ├── index.astro
│   │       ├── calendario.astro
│   │       ├── hoy.astro           # Vista Kanban
│   │       ├── servicios.astro
│   │       └── ajustes.astro
│   │
│   ├── styles/                     # 🎨 Estilos globales
│   │   └── global.css
│   │
│   └── env.d.ts                    # TypeScript definitions
│
├── supabase/                       # 🗄️ Configuración de Supabase
│   ├── migrations/                 # Migraciones SQL
│   │   └── 20251024000000_initial_schema.sql
│   ├── functions/                  # Edge Functions
│   │   └── get-available-slots/
│   │       └── index.ts
│   └── config.toml                 # Configuración local
│
├── astro.config.mjs                # ⚙️ Configuración de Astro
├── tailwind.config.mjs             # ⚙️ Configuración de Tailwind
├── tsconfig.json                   # ⚙️ Configuración de TypeScript
├── package.json
└── .env                            # 🔐 Variables de entorno
```

---

## 🔌 Integraciones de Astro

### astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  output: 'server', // SSR habilitado

  adapter: vercel(), // o netlify()

  vite: {
    plugins: [tailwindcss(), preact({ devtools: true })],
  },

  integrations: [
    // Aquí se pueden añadir más integraciones
  ],
});
```

---

## 🎭 Sistema de Islas (Islands Architecture)

### Directivas de Hidratación

Astro permite controlar **cuándo** se hidrata cada isla:

```astro
<!-- Carga inmediata (al cargar la página) -->
<BookingWizard client:load />

<!-- Carga cuando es visible (lazy loading) -->
<RealtimeTracker client:visible />

<!-- Carga cuando el navegador está idle -->
<PetManager client:idle />

<!-- Solo renderiza en el servidor (sin JS en cliente) -->
<StaticComponent />

<!-- Hidrata solo en ciertos breakpoints -->
<MobileMenu client:media="(max-width: 768px)" />
```

### Comunicación entre Islas

Las islas son **independientes** por diseño, pero pueden comunicarse:

**Opción 1: Custom Events**

```javascript
// Isla A emite evento
window.dispatchEvent(
  new CustomEvent('pet-updated', {
    detail: { petId: 123 },
  })
);

// Isla B escucha
window.addEventListener('pet-updated', (e) => {
  console.log(e.detail.petId);
});
```

**Opción 2: Shared State (nanostores)**

```javascript
// store.js
import { atom } from 'nanostores';
export const selectedPet = atom(null);

// Isla A
import { selectedPet } from '../stores';
selectedPet.set(pet);

// Isla B
import { selectedPet } from '../stores';
const pet = useStore(selectedPet);
```

---

## 🔐 Autenticación y Autorización

### Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│                  Usuario hace login                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│       Astro API Route (/api/auth/signin.ts)             │
│  • Valida credenciales con Supabase Auth                │
│  • Recibe access_token + refresh_token                  │
│  • Guarda tokens en cookies HttpOnly                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Redirección a /app/dashboard               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Middleware verifica cookie en cada request      │
│  • Si válido → permite acceso                           │
│  • Si inválido/expirado → redirect a /signin           │
└─────────────────────────────────────────────────────────┘
```

### Middleware de Autenticación

```typescript
// src/middleware/auth.ts
import type { MiddlewareHandler } from 'astro';
import { supabase } from '../lib/supabase';

export const onRequest: MiddlewareHandler = async (
  { cookies, url, redirect },
  next
) => {
  const protectedPaths = ['/app', '/admin'];
  const isProtected = protectedPaths.some((path) =>
    url.pathname.startsWith(path)
  );

  if (!isProtected) return next();

  const token = cookies.get('sb-access-token')?.value;

  if (!token) {
    return redirect('/signin');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return redirect('/signin');
  }

  // Verificar rol admin para rutas /admin/*
  if (url.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return redirect('/app/dashboard');
    }
  }

  return next();
};
```

---

## 🔄 Sistema de Tiempo Real

### Arquitectura de Realtime

```
┌──────────────────────────────────────────────────────┐
│           CLIENTE (Navegador)                         │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │   Isla: RealtimeTracker.jsx                 │    │
│  │                                              │    │
│  │   useEffect(() => {                          │    │
│  │     const channel = supabase                 │    │
│  │       .channel('appointment-changes')        │    │
│  │       .on('postgres_changes', ...)           │    │
│  │       .subscribe()                           │    │
│  │   })                                         │    │
│  └─────────────────────────────────────────────┘    │
│                     │                                │
│                     │ WebSocket                      │
└─────────────────────┼────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              SUPABASE REALTIME                        │
│  • Escucha cambios en PostgreSQL                     │
│  • Broadcast a suscriptores conectados               │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                      │
│  • TRIGGER en tabla appointments                     │
│  • Notifica cambios a Realtime                       │
└──────────────────────────────────────────────────────┘
```

### Ejemplo de Suscripción

```javascript
// components/islands/RealtimeTracker.jsx
import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../../lib/supabase';

export default function RealtimeTracker({ appointmentId }) {
  const [status, setStatus] = useState('pending');
  const [photoUrl, setPhotoUrl] = useState(null);

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
          setPhotoUrl(payload.new.final_photo_url);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  async function loadAppointment() {
    const { data } = await supabase
      .from('appointments')
      .select('status, final_photo_url')
      .eq('id', appointmentId)
      .single();

    if (data) {
      setStatus(data.status);
      setPhotoUrl(data.final_photo_url);
    }
  }

  return (
    <div class='tracker'>
      <StatusIndicator status={status} />
      {photoUrl && <img src={photoUrl} alt='Resultado final' />}
    </div>
  );
}
```

---

## 📡 Edge Functions

### Arquitectura de Edge Function

```
Cliente (Isla) → supabase.functions.invoke('get-available-slots')
                          │
                          ▼
                 Edge Function (Deno)
                 • Corre en el edge de Supabase
                 • Acceso directo a PostgreSQL
                 • Lógica compleja de disponibilidad
                          │
                          ▼
                 PostgreSQL Queries
                 • business_hours
                 • appointments
                 • blocked_times
                          │
                          ▼
                 Retorna: { slots: ['09:00', '10:30', ...] }
                          │
                          ▼
                 Cliente actualiza UI
```

### Ejemplo de Edge Function

```typescript
// supabase/functions/get-available-slots/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { date, duration } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Obtener horario del día
  const dayOfWeek = new Date(date).getDay();
  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .single();

  // 2. Obtener citas existentes
  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('date', date);

  // 3. Obtener bloqueos
  const { data: blocks } = await supabase
    .from('blocked_times')
    .select('start_time, end_time')
    .eq('date', date);

  // 4. Calcular slots disponibles
  const availableSlots = calculateSlots(hours, appointments, blocks, duration);

  return new Response(JSON.stringify({ slots: availableSlots }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## 🎨 Sistema de Estilos

### Tailwind CSS v4

```css
/* src/styles/global.css */
@import 'tailwindcss';

/* Tema personalizado */
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-accent: #f59e0b;

  --font-sans: 'Inter', system-ui, sans-serif;
}

/* Componentes personalizados */
@layer components {
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition;
  }

  .card {
    @apply bg-white shadow-md rounded-lg p-6;
  }
}
```

---

## 🚀 Performance y Optimización

### Métricas Objetivo

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **Lighthouse Score**: > 95

### Estrategias de Optimización

1. **SSR por defecto**: HTML completo en primera carga
2. **Islands Architecture**: JS mínimo
3. **Image Optimization**: Astro Image + Supabase CDN
4. **Code Splitting**: Automático por ruta
5. **Lazy Loading**: `client:visible` para islas
6. **Edge Caching**: Vercel/Netlify Edge Network

---

## 📊 Monitoreo y Observabilidad

### Logs

- **Cliente**: Console + Sentry (opcional)
- **Servidor**: Vercel Analytics + Logs
- **Supabase**: Dashboard + Logs de Edge Functions

### Métricas

- **Vercel Analytics**: Web Vitals, pageviews
- **Supabase**: Query performance, Auth events
- **Custom**: Eventos de negocio (reservas, cancelaciones)

---

**Última Actualización**: 24 de octubre de 2025
