# Fase 1: Cimientos

**Duración Estimada**: 1 semana (5 días laborables)  
**Fecha Inicio**: 28 de octubre de 2025  
**Fecha Fin**: 1 de noviembre de 2025

---

## 🎯 Objetivo

Establecer toda la infraestructura básica del proyecto: base de datos, autenticación, configuración de desarrollo y estructura de archivos.

Al final de esta fase, tendremos:

- ✅ Proyecto Supabase configurado y desplegado
- ✅ Base de datos con todas las tablas y RLS
- ✅ Autenticación funcionando (email y OAuth)
- ✅ Proyecto Astro configurado con SSR
- ✅ Tailwind CSS v4 funcionando
- ✅ Islas interactivas (Preact) configuradas
- ✅ Middleware de autenticación
- ✅ Proyecto deployado en Vercel/Netlify

---

## 📋 Tareas Detalladas

### Día 1: Configuración de Supabase

#### 1.1 Crear Proyecto en Supabase Cloud ⏱️ 30 min

```bash
# 1. Ir a https://supabase.com
# 2. Crear cuenta / Login
# 3. New Project
#    - Name: animalets-prod
#    - Database Password: [generar segura]
#    - Region: Europe West (Ireland)
# 4. Esperar a que el proyecto se cree (~2 minutos)
```

**Salida**: URL del proyecto y claves API

#### 1.2 Configurar Variables de Entorno ⏱️ 15 min

```bash
# Crear archivo .env en la raíz del proyecto
touch .env

# Añadir variables (copiar del Dashboard de Supabase)
```

```env
# .env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Astro
NODE_ENV=development
```

**Verificar**:

```bash
cat .env | grep SUPABASE
```

#### 1.3 Crear Esquema de Base de Datos ⏱️ 2 horas

Crear archivo de migración:

```bash
mkdir -p supabase/migrations
touch supabase/migrations/20251028000000_initial_schema.sql
```

Copiar contenido desde `_docs/02-database-schema.md`:

```sql
-- supabase/migrations/20251028000000_initial_schema.sql

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Función auxiliar para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABLA: profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: pets
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  size TEXT NOT NULL CHECK (size IN ('pequeño', 'mediano', 'grande')),
  weight_kg DECIMAL(5, 2),
  birth_date DATE,
  gender TEXT CHECK (gender IN ('macho', 'hembra')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pets_owner_id ON pets(owner_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_is_active ON services(is_active);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: appointments
CREATE TYPE appointment_status AS ENUM (
  'pending',
  'in_bath',
  'drying',
  'grooming',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  final_photo_url TEXT,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT no_overlapping_appointments EXCLUDE USING GIST (
    pet_id WITH =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp
    ) WITH &&
  ) WHERE (status != 'cancelled' AND status != 'no_show')
);

CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_status ON appointments(date, status);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: business_hours
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);

-- TABLA: blocked_times
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_times_date ON blocked_times(date);

-- Vista de citas completas
CREATE OR REPLACE VIEW appointments_full AS
SELECT
  a.id,
  a.date,
  a.start_time,
  a.end_time,
  a.status,
  a.final_photo_url,
  a.notes,
  a.admin_notes,

  c.id AS client_id,
  c.full_name AS client_name,
  c.email AS client_email,
  c.phone AS client_phone,

  p.id AS pet_id,
  p.name AS pet_name,
  p.breed AS pet_breed,
  p.size AS pet_size,

  s.id AS service_id,
  s.name AS service_name,
  s.duration_minutes,
  s.price

FROM appointments a
JOIN profiles c ON a.client_id = c.id
JOIN pets p ON a.pet_id = p.id
JOIN services s ON a.service_id = s.id;

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Datos de ejemplo: horarios de negocio
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '00:00', '00:00', TRUE),   -- Domingo cerrado
  (1, '09:00', '18:00', FALSE),  -- Lunes
  (2, '09:00', '18:00', FALSE),  -- Martes
  (3, '09:00', '18:00', FALSE),  -- Miércoles
  (4, '09:00', '18:00', FALSE),  -- Jueves
  (5, '09:00', '18:00', FALSE),  -- Viernes
  (6, '09:00', '14:00', FALSE);  -- Sábado

-- Datos de ejemplo: servicios
INSERT INTO services (name, description, duration_minutes, price) VALUES
  ('Baño Básico', 'Baño con champú neutro y secado', 60, 25.00),
  ('Baño Premium', 'Baño con champú específico, acondicionador y secado', 75, 35.00),
  ('Corte Completo', 'Corte de pelo, baño, secado y peinado', 90, 45.00),
  ('Corte Tijera', 'Corte artístico con tijera, incluye baño', 120, 60.00),
  ('Deslanado', 'Eliminación de pelo muerto, ideal para mudas', 60, 30.00);
```

**Ejecutar migración**:

```bash
# Opción 1: En Supabase Dashboard
# SQL Editor → New query → Pegar contenido → Run

# Opción 2: Con CLI (si está instalado)
supabase db push
```

**Verificar**:

```sql
-- En SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Debe mostrar: profiles, pets, services, appointments, business_hours, blocked_times
```

#### 1.4 Configurar Row Level Security (RLS) ⏱️ 1 hora

Crear archivo:

```bash
touch supabase/migrations/20251028000001_rls_policies.sql
```

Copiar políticas RLS desde `_docs/02-database-schema.md` y ejecutar en SQL Editor.

**Verificar**:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Todas las tablas deben tener rowsecurity = true
```

#### 1.5 Configurar Storage para Fotos ⏱️ 30 min

```bash
# En Supabase Dashboard
# Storage → New Bucket
#   - Name: appointment-photos
#   - Public: YES
#   - File size limit: 5MB
#   - Allowed MIME types: image/jpeg, image/png, image/webp
```

**Política de Storage**:

```sql
-- Permitir a admins subir fotos
CREATE POLICY "Admins can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'appointment-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Todos pueden ver fotos
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'appointment-photos');
```

---

### Día 2: Configuración de Astro

#### 2.1 Instalar Dependencias ⏱️ 30 min

```bash
cd /home/gnurub/code/animalets

# Instalar Preact para islas interactivas
pnpm add preact @preact/signals

# Instalar preset de Preact para Vite
pnpm add -D @preact/preset-vite

# Verificar que Supabase esté instalado
pnpm list @supabase/supabase-js
```

#### 2.2 Configurar Astro para SSR ⏱️ 30 min

Actualizar `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  output: 'server', // SSR habilitado

  vite: {
    plugins: [tailwindcss(), preact({ devtools: true })],
  },

  // Para deployment en Vercel
  // adapter: vercel()
});
```

**Instalar adapter** (elegir uno):

```bash
# Para Vercel
pnpm add -D @astrojs/vercel

# O para Netlify
pnpm add -D @astrojs/netlify
```

Actualizar config con adapter:

```javascript
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // ...
});
```

#### 2.3 Configurar TypeScript ⏱️ 15 min

Actualizar `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

#### 2.4 Actualizar Cliente Supabase ⏱️ 30 min

El archivo `src/lib/supabase.ts` ya existe. Verificar y mejorar:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Manejamos sesiones con cookies
  },
});

// Tipos de base de datos (generados más tarde con CLI)
export type Database = {
  // ... tipos generados
};
```

**Test**:

```bash
# Crear archivo de test
touch src/test-supabase.ts
```

```typescript
// src/test-supabase.ts
import { supabase } from './lib/supabase';

async function test() {
  const { data, error } = await supabase.from('services').select('*');

  console.log('Services:', data);
  console.log('Error:', error);
}

test();
```

```bash
# Ejecutar
pnpm tsx src/test-supabase.ts
```

---

### Día 3: Autenticación

#### 3.1 Configurar OAuth Providers ⏱️ 1 hora

**Google**:

```bash
# 1. Ir a https://console.cloud.google.com
# 2. Crear proyecto "Animalets"
# 3. APIs & Services → Credentials → Create OAuth Client ID
#    - Application type: Web application
#    - Authorized redirect URIs:
#      https://xxxxx.supabase.co/auth/v1/callback
# 4. Copiar Client ID y Client Secret
# 5. En Supabase Dashboard:
#    Authentication → Providers → Google
#    - Enable
#    - Pegar Client ID y Secret
```

**GitHub**:

```bash
# 1. Ir a https://github.com/settings/developers
# 2. New OAuth App
#    - Application name: Animalets
#    - Homepage URL: http://localhost:4321
#    - Authorization callback URL:
#      https://xxxxx.supabase.co/auth/v1/callback
# 3. Generate a new client secret
# 4. En Supabase Dashboard:
#    Authentication → Providers → GitHub
#    - Enable
#    - Pegar Client ID y Secret
```

**Discord** (opcional):
Similar al proceso de GitHub.

#### 3.2 Verificar API Routes de Auth ⏱️ 30 min

Los archivos ya existen:

- ✅ `src/pages/api/auth/signin.ts`
- ✅ `src/pages/api/auth/register.ts`
- ✅ `src/pages/api/auth/signout.ts`
- ✅ `src/pages/api/auth/callback.ts`

**Revisar y actualizar** si es necesario según `_docs/05-authentication-flow.md`.

#### 3.3 Crear Middleware de Autenticación ⏱️ 1 hora

```bash
mkdir -p src/middleware
touch src/middleware/auth.ts
```

```typescript
// src/middleware/auth.ts
import type { MiddlewareHandler } from 'astro';
import { supabase } from '../lib/supabase';

export const onRequest: MiddlewareHandler = async (
  { cookies, url, redirect, locals },
  next,
) => {
  // Rutas públicas
  const publicPaths = [
    '/',
    '/servicios',
    '/quienes-somos',
    '/contacto',
    '/signin',
    '/register',
  ];

  const isPublic =
    publicPaths.includes(url.pathname) || url.pathname.startsWith('/api/');

  if (isPublic) {
    return next();
  }

  // Verificar autenticación
  const accessToken = cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    return redirect('/signin');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    cookies.delete('sb-access-token');
    cookies.delete('sb-refresh-token');
    return redirect('/signin');
  }

  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  locals.user = user;
  locals.profile = profile;

  // Verificar permisos admin
  if (url.pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return redirect('/app/dashboard');
  }

  return next();
};
```

**Configurar en Astro**:

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'server',
  middleware: './src/middleware/auth.ts',
  // ...
});
```

#### 3.4 Tipos de Locals ⏱️ 15 min

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: {
      id: string;
      email: string;
    } | null;
    profile: {
      id: string;
      email: string;
      full_name: string | null;
      role: 'client' | 'admin';
    } | null;
  }
}
```

---

### Día 4: Estructura de Páginas

#### 4.1 Crear Layouts ⏱️ 1 hora

**Layout Base** (ya existe, mejorar):

```astro
---
// src/layouts/Layout.astro
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | Animalets</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Layout del Portal**:

```bash
touch src/layouts/AppLayout.astro
```

```astro
---
// src/layouts/AppLayout.astro
import Layout from './Layout.astro';

const { profile } = Astro.locals;
const { title } = Astro.props;
---

<Layout title={title}>
  <div class="app-layout">
    <nav class="app-nav">
      <a href="/app/dashboard">Dashboard</a>
      <a href="/app/mascotas">Mis Mascotas</a>
      <a href="/app/reservar">Reservar Cita</a>
      <span>Hola, {profile?.full_name || profile?.email}</span>
      <form action="/api/auth/signout" method="POST">
        <button type="submit">Cerrar sesión</button>
      </form>
    </nav>

    <main class="app-main">
      <slot />
    </main>
  </div>
</Layout>

<style>
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-nav {
    @apply flex items-center gap-4 bg-blue-600 p-4 text-white;
  }

  .app-nav a {
    @apply hover:underline;
  }

  .app-main {
    @apply container mx-auto flex-1 p-6;
  }
</style>
```

**Layout de Admin**:

```bash
touch src/layouts/AdminLayout.astro
```

Similar al AppLayout pero con navegación de admin.

#### 4.2 Crear Páginas Básicas ⏱️ 2 horas

```bash
# Portal de cliente
mkdir -p src/pages/app
touch src/pages/app/dashboard.astro
touch src/pages/app/mascotas.astro
touch src/pages/app/reservar.astro

# Admin
mkdir -p src/pages/admin
touch src/pages/admin/index.astro
touch src/pages/admin/calendario.astro
touch src/pages/admin/hoy.astro
```

**Ejemplo de Dashboard**:

```astro
---
// src/pages/app/dashboard.astro
import AppLayout from '../../layouts/AppLayout.astro';
import { supabase } from '../../lib/supabase';

const { user } = Astro.locals;

// Obtener próximas citas
const { data: appointments } = await supabase
  .from('appointments_full')
  .select('*')
  .eq('client_id', user.id)
  .gte('date', new Date().toISOString().split('T')[0])
  .order('date', { ascending: true })
  .limit(5);

// Obtener mascotas
const { data: pets } = await supabase
  .from('pets')
  .select('*')
  .eq('owner_id', user.id);
---

<AppLayout title="Dashboard">
  <h1>Bienvenido</h1>

  <section>
    <h2>Próximas Citas</h2>
    {appointments?.length === 0 && <p>No tienes citas próximas</p>}
    {
      appointments?.map((apt) => (
        <div class="appointment-card">
          <p>
            {apt.date} - {apt.start_time}
          </p>
          <p>
            {apt.pet_name} - {apt.service_name}
          </p>
          <p>Estado: {apt.status}</p>
        </div>
      ))
    }
  </section>

  <section>
    <h2>Mis Mascotas</h2>
    {
      pets?.map((pet) => (
        <div class="pet-card">
          <img src={pet.photo_url || '/default-pet.png'} alt={pet.name} />
          <p>{pet.name}</p>
        </div>
      ))
    }
    <a href="/app/mascotas">Ver todas</a>
  </section>
</AppLayout>
```

---

### Día 5: Testing y Deployment

#### 5.1 Testing Local ⏱️ 2 horas

**Crear usuario de prueba**:

```sql
-- En Supabase SQL Editor
-- El email debe ser real si la verificación está activada
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@animalets.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Usuario Test"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

**Test de flujos**:

1. ✅ Registro de usuario
2. ✅ Login con email/password
3. ✅ Login con OAuth (Google, GitHub)
4. ✅ Acceso a /app/dashboard
5. ✅ Logout
6. ✅ Intento de acceso sin auth (debe redirigir)
7. ✅ Admin puede acceder a /admin
8. ✅ Cliente no puede acceder a /admin

#### 5.2 Deploy a Producción ⏱️ 1 hora

**Vercel**:

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar variables de entorno en dashboard
# Settings → Environment Variables
```

**Configurar variables**:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Actualizar OAuth callbacks**:

```
# Añadir a cada provider (Google, GitHub, etc.)
https://tu-app.vercel.app/api/auth/callback
```

#### 5.3 Smoke Tests en Producción ⏱️ 30 min

1. Abrir `https://tu-app.vercel.app`
2. Crear cuenta
3. Login
4. Verificar dashboard

---

## ✅ Checklist de Finalización

- [ ] Proyecto Supabase creado
- [ ] Base de datos con todas las tablas
- [ ] RLS configurado y probado
- [ ] Storage configurado
- [ ] OAuth providers configurados
- [ ] Variables de entorno configuradas
- [ ] Astro con SSR funcionando
- [ ] Tailwind CSS funcionando
- [ ] Preact configurado
- [ ] Middleware de autenticación funcionando
- [ ] Layouts creados
- [ ] Páginas básicas creadas
- [ ] Usuario de prueba creado
- [ ] Tests locales pasados
- [ ] Deployado en producción
- [ ] Tests en producción pasados

---

## 📊 Entregables

1. **Supabase Dashboard** con proyecto configurado
2. **Código** en GitHub con:
   - Migraciones SQL
   - Configuración Astro
   - Middleware
   - Layouts y páginas básicas
3. **Aplicación desplegada** en Vercel/Netlify
4. **Documento de credenciales** (guardar seguro):
   - URLs de Supabase
   - Claves API
   - Credenciales OAuth
   - URL de producción

---

## 🚧 Problemas Comunes

### RLS bloquea queries

**Síntoma**: `new row violates row-level security policy`

**Solución**: Verificar políticas RLS, usar Service Role Key temporalmente para debug.

### OAuth no funciona

**Síntoma**: "Redirect URI mismatch"

**Solución**: Verificar que las redirect URIs en providers coincidan exactamente.

### Middleware no se ejecuta

**Síntoma**: Páginas protegidas accesibles sin login

**Solución**: Verificar configuración en `astro.config.mjs`.

---

**Última Actualización**: 24 de octubre de 2025
