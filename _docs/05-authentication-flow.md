# Flujo de Autenticación - Animalets

**Fecha**: 24 de octubre de 2025

---

## 🔐 Estrategia de Autenticación

Animalets utiliza **Supabase Auth** con dos métodos:

1. **Email/Password**: Autenticación tradicional
2. **OAuth**: Google, GitHub, Discord

---

## 📊 Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────┐
│                   Usuario sin autenticar                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  /signin o /register  │
         └───────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐        ┌──────────────────┐
│ Email/Pass   │        │      OAuth       │
└──────────────┘        └──────────────────┘
        │                         │
        │                         ▼
        │              ┌──────────────────┐
        │              │ Provider (Google)│
        │              └──────────────────┘
        │                         │
        │                         ▼
        │              ┌──────────────────┐
        │              │ /api/auth/       │
        │              │  callback        │
        │              └──────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Tokens guardados    │
         │   en cookies          │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Redirect a            │
         │ /app/dashboard        │
         └───────────────────────┘
```

---

## 🔑 Método 1: Email/Password

### Flujo de Registro

```
Usuario → /register → Formulario
                          │
                          ▼
                    POST /api/auth/register
                          │
                          ▼
              supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { full_name }
                }
              })
                          │
                          ▼
              ¿Verificación de email?
                    │           │
                    │ No        │ Sí
                    ▼           ▼
         Crear perfil    Enviar email
         automáticamente  de verificación
                    │           │
                    └─────┬─────┘
                          │
                          ▼
                   Guardar tokens
                   en cookies
                          │
                          ▼
                Redirect a /app/dashboard
```

### Implementación del Registro

```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const fullName = formData.get('full_name')?.toString();

  if (!email || !password) {
    return new Response('Email y contraseña requeridos', { status: 400 });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response('Email inválido', { status: 400 });
  }

  // Validar longitud de contraseña
  if (password.length < 8) {
    return new Response('La contraseña debe tener al menos 8 caracteres', {
      status: 400,
    });
  }

  // Registrar usuario
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  // Si hay verificación de email, data.session será null
  if (!data.session) {
    return new Response(
      JSON.stringify({
        message: 'Por favor, verifica tu email para activar tu cuenta',
      }),
      { status: 200 }
    );
  }

  // Guardar tokens
  const { access_token, refresh_token } = data.session;
  cookies.set('sb-access-token', access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  cookies.set('sb-refresh-token', refresh_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  return redirect('/app/dashboard');
};
```

---

### Flujo de Login

```
Usuario → /signin → Formulario
                        │
                        ▼
              POST /api/auth/signin
                        │
                        ▼
        supabase.auth.signInWithPassword({
          email,
          password
        })
                        │
                        ▼
                 ¿Correcto?
                   │    │
              No ──┘    └── Sí
              │              │
              ▼              ▼
        Error 401      Guardar tokens
                       en cookies
                            │
                            ▼
                  Redirect a /app/dashboard
```

### Implementación del Login

Ya implementado en `src/pages/api/auth/signin.ts` ✅

---

## 🌐 Método 2: OAuth

### Proveedores Configurados

- **Google**: Más común, recomendado
- **GitHub**: Para usuarios técnicos
- **Discord**: Para comunidad gamer

### Configuración en Supabase

```bash
# 1. Ir a Dashboard de Supabase
# 2. Authentication → Providers
# 3. Habilitar Google, GitHub, Discord
# 4. Configurar Client ID y Client Secret de cada proveedor
# 5. Añadir Redirect URL: http://localhost:4321/api/auth/callback
```

### Flujo OAuth

```
Usuario → Click "Continuar con Google"
              │
              ▼
    POST /api/auth/signin
    { provider: 'google' }
              │
              ▼
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:4321/api/auth/callback'
      }
    })
              │
              ▼
    Redirect a Google
    (Sale de tu app)
              │
              ▼
    Usuario autoriza en Google
              │
              ▼
    Google → /api/auth/callback?code=xxx
              │
              ▼
    supabase.auth.exchangeCodeForSession(code)
              │
              ▼
    Guardar tokens en cookies
              │
              ▼
    Redirect a /app/dashboard
```

### Implementación OAuth

Ya implementado en `src/pages/api/auth/signin.ts` ✅

```typescript
// Fragmento clave
if (provider && validProviders.includes(provider)) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: 'http://localhost:4321/api/auth/callback',
    },
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return redirect(data.url); // Redirect al proveedor OAuth
}
```

---

## 🛡️ Middleware de Autenticación

### Propósito

Proteger rutas que requieren autenticación (`/app/*` y `/admin/*`).

### Ubicación

`src/middleware/auth.ts`

### Implementación

```typescript
// src/middleware/auth.ts
import type { MiddlewareHandler } from 'astro';
import { supabase } from '../lib/supabase';

export const onRequest: MiddlewareHandler = async (
  { cookies, url, redirect, locals },
  next
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

  if (publicPaths.includes(url.pathname) || url.pathname.startsWith('/api')) {
    return next();
  }

  // Rutas protegidas
  const protectedPaths = ['/app', '/admin'];
  const isProtected = protectedPaths.some((path) =>
    url.pathname.startsWith(path)
  );

  if (!isProtected) {
    return next();
  }

  // Verificar token
  const accessToken = cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    return redirect('/signin');
  }

  // Validar token con Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // Token inválido, limpiar cookies
    cookies.delete('sb-access-token');
    cookies.delete('sb-refresh-token');
    return redirect('/signin');
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Guardar usuario en locals (disponible en todas las páginas)
  locals.user = user;
  locals.profile = profile;

  // Verificar permisos de admin
  if (url.pathname.startsWith('/admin')) {
    if (profile?.role !== 'admin') {
      return redirect('/app/dashboard');
    }
  }

  return next();
};
```

### Configurar Middleware en Astro

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  middleware: true, // Habilitar middleware
  // ...
});
```

---

## 🔄 Refresh Token

### Problema

Los access tokens de Supabase expiran después de 1 hora.

### Solución

Implementar refresh automático.

### Implementación

```typescript
// src/lib/auth.ts
import { supabase } from './supabase';

export async function refreshSession(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    return null;
  }

  return data.session;
}
```

### En el Middleware

```typescript
// Si el access token está expirado
if (error?.message === 'JWT expired') {
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (refreshToken) {
    const newSession = await refreshSession(refreshToken);

    if (newSession) {
      // Actualizar cookies
      cookies.set('sb-access-token', newSession.access_token, {
        /* ... */
      });
      cookies.set('sb-refresh-token', newSession.refresh_token, {
        /* ... */
      });

      // Continuar
      return next();
    }
  }

  // No se pudo refrescar, logout
  return redirect('/signin');
}
```

---

## 🚪 Logout

### Flujo

```
Usuario → Click "Cerrar sesión"
              │
              ▼
    POST /api/auth/signout
              │
              ▼
    supabase.auth.signOut()
              │
              ▼
    Eliminar cookies
              │
              ▼
    Redirect a /
```

### Implementación

Ya implementado en `src/pages/api/auth/signout.ts` ✅

---

## 🔒 Seguridad de Cookies

### Configuración Recomendada

```typescript
cookies.set('sb-access-token', accessToken, {
  path: '/',
  httpOnly: true, // No accesible desde JavaScript
  secure: true, // Solo HTTPS (en producción)
  sameSite: 'lax', // Protección contra CSRF
  maxAge: 60 * 60 * 24 * 7, // 7 días
});
```

### ¿Por qué HttpOnly?

Previene ataques XSS (Cross-Site Scripting). El token no puede ser robado por JavaScript malicioso.

---

## 🎭 Permisos y Roles

### Tabla de Roles

| Rol      | Permisos                        |
| -------- | ------------------------------- |
| `client` | Ver/editar sus mascotas y citas |
| `admin`  | Ver/editar todo + panel admin   |

### Verificación de Rol

```typescript
// En cualquier página protegida
---
const { profile } = Astro.locals;

if (profile.role !== 'admin') {
  return Astro.redirect('/app/dashboard');
}
---
```

---

## 📧 Verificación de Email (Opcional)

### Habilitar en Supabase

```bash
# Dashboard → Authentication → Email Auth
# ✅ Enable email confirmations
```

### Flujo

```
Usuario se registra
      │
      ▼
Supabase envía email
      │
      ▼
Usuario click en enlace
      │
      ▼
GET /api/auth/callback?token=xxx&type=signup
      │
      ▼
supabase.auth.verifyOtp()
      │
      ▼
Cuenta activada
      │
      ▼
Redirect a /app/dashboard
```

---

## 🧪 Testing de Autenticación

### Crear Usuario de Prueba

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Crear perfil
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Usuario Test', 'client'
FROM auth.users
WHERE email = 'test@example.com';
```

### Crear Admin de Prueba

```sql
-- Cambiar rol a admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'test@example.com';
```

---

## 🐛 Debugging

### Ver Tokens en Cookies

```javascript
// En DevTools Console
document.cookie;
```

### Ver Usuario Actual

```javascript
// En un componente isla
const {
  data: { user },
} = await supabase.auth.getUser();
console.log(user);
```

### Logs en Middleware

```typescript
console.log('🔐 Middleware:', {
  path: url.pathname,
  hasToken: !!accessToken,
  userId: user?.id,
});
```

---

## ✅ Checklist de Seguridad

- [ ] Cookies con `httpOnly: true`
- [ ] Cookies con `secure: true` en producción
- [ ] Validar tokens en middleware
- [ ] Row Level Security (RLS) habilitado en todas las tablas
- [ ] Políticas RLS configuradas correctamente
- [ ] Validación de inputs (email, password)
- [ ] Rate limiting en login (considerar)
- [ ] Logs de intentos fallidos (considerar)

---

**Última Actualización**: 24 de octubre de 2025
