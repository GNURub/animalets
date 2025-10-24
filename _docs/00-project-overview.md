# Animalets - Resumen del Proyecto

**Versión**: 1.0 (Stack Astro-Puro)  
**Fecha de Inicio**: 24 de octubre de 2025  
**Propietario**: Animalets

---

## 🎯 Visión del Proyecto

"Animalets" es una aplicación web integral diseñada para gestionar una peluquería canina moderna. La plataforma proporciona una experiencia completa tanto para clientes como para administradores, con un diferenciador clave: **un tracker de estado en tiempo real** estilo Glovo que permite a los clientes seguir el progreso del servicio de su mascota.

---

## 🏗️ Stack Tecnológico

### Frontend

- **Framework**: Astro v5
- **Patrón**: MPA (Multi-Page Application) con SSR (Server-Side Rendering)
- **Interactividad**: Astro Islands con Preact/Svelte
- **Estilos**: Tailwind CSS v4

### Backend (BaaS)

- **Plataforma**: Supabase
- **Base de Datos**: PostgreSQL
- **Autenticación**: Supabase Auth (Email/Password + OAuth)
- **Tiempo Real**: Supabase Realtime (PostgreSQL Changes)
- **Almacenamiento**: Supabase Storage (para fotos)
- **Funciones**: Supabase Edge Functions (Deno)

### Hosting

- **Frontend**: Vercel o Netlify
- **Backend**: Supabase Cloud

---

## 🧩 Componentes Principales

### 1. Web Pública (Marketing)

**Rutas**: `/`, `/servicios`, `/quienes-somos`, `/contacto`  
**Tecnología**: Páginas Astro estáticas con SSR  
**Objetivo**: Captación de clientes, SEO, branding

**Características**:

- Landing page optimizada para conversión
- Catálogo de servicios
- Información de contacto y ubicación
- Optimización SEO extrema

### 2. Portal de Cliente (Autoservicio)

**Rutas**: `/app/*`  
**Tecnología**: Páginas Astro + Islas Interactivas  
**Objetivo**: Autogestión de mascotas y citas

**Características**:

- Registro y autenticación (email + OAuth)
- Dashboard personal
- Gestión de mascotas (CRUD completo)
- Sistema de reservas online con disponibilidad en tiempo real
- **Tracker en tiempo real** del estado del servicio
- Visualización de foto final

### 3. Panel de Administración (Gestión)

**Rutas**: `/admin/*`  
**Tecnología**: Páginas Astro + Islas Interactivas  
**Objetivo**: Gestión operativa de la peluquería

**Características**:

- Calendario completo de citas
- Vista Kanban para gestión de estados
- Gestión de servicios y precios
- Configuración de horarios y bloqueos
- Creación manual de citas
- Subida de fotos finales
- Gestión de clientes

---

## 🚀 Diferenciador Clave

### Tracker de Estado en Tiempo Real

El cliente puede ver el progreso de su mascota en tiempo real sin necesidad de recargar la página:

```
🔵 Pendiente
    ⬇️
🟡 En Baño
    ⬇️
🟠 Secando
    ⬇️
🟣 Peinado
    ⬇️
✅ ¡Listo! (+ Foto Final)
```

**Tecnología**: Supabase Realtime + Astro Islands con suscripciones a cambios de PostgreSQL.

**Flujo**:

1. Admin arrastra la tarjeta de la cita en el panel Kanban
2. Se actualiza el estado en la base de datos
3. Todos los clientes suscritos reciben la actualización instantáneamente
4. La UI se actualiza automáticamente

---

## 📊 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
├─────────────────────────────────────────────────────────────┤
│  Páginas Astro (HTML Estático) + Islas Interactivas (JS)   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ASTRO SERVER (Vercel/Netlify)                   │
├─────────────────────────────────────────────────────────────┤
│  • SSR de páginas                                            │
│  • Middleware de autenticación                               │
│  • API Routes (/api/auth/*)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase Client
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE (Backend)                         │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL (Base de Datos)                                │
│  • Supabase Auth (Autenticación)                             │
│  • Supabase Realtime (WebSocket)                             │
│  • Supabase Storage (Fotos)                                  │
│  • Edge Functions (Lógica de disponibilidad)                 │
│  • Row Level Security (RLS)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Patrón de Desarrollo: Astro Islands

Astro genera HTML estático/SSR por defecto, pero permite "hidratar" componentes específicos que necesitan interactividad:

```astro
---
// src/pages/app/reservar.astro
import BookingWizard from '../../components/BookingWizard.jsx';
---

<Layout>
  <h1>Reservar Cita</h1>

  <!-- Esta isla se hidrata en el cliente -->
  <BookingWizard client:load />
</Layout>
```

**Ventajas**:

- Carga inicial ultra-rápida (HTML estático)
- JavaScript mínimo enviado al cliente
- Interactividad donde se necesita
- SEO óptimo

---

## 📈 Roadmap del Proyecto

### Fase 1: Cimientos (1 semana)

- Configuración de Supabase
- Esquema de base de datos
- Configuración de Astro + Tailwind
- Autenticación básica

### Fase 2: Admin Panel MVP (2-3 semanas)

- Panel de administración completo
- Calendario de citas
- Gestión de estados (Kanban)
- CRUD de servicios

### Fase 3: Portal de Cliente (2 semanas)

- Registro y login de clientes
- Gestión de mascotas
- Sistema de reservas online
- Lógica de disponibilidad

### Fase 4: Tracker en Tiempo Real (1 semana)

- Implementación del tracker
- Suscripciones en tiempo real
- Subida de fotos finales
- Notificaciones (opcional)

### Fase 5: Web Pública (1 semana)

- Landing page
- Páginas de marketing
- Optimización SEO
- Performance tuning

**Duración Total Estimada**: 7-8 semanas

---

## 🔒 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS configuradas:

- Clientes solo pueden ver/editar sus propios datos
- Admins pueden ver/editar todos los datos
- Las políticas se validan a nivel de base de datos

### Autenticación

- Contraseñas hasheadas con bcrypt
- JWT tokens seguros
- OAuth con proveedores confiables (Google, GitHub, Discord)
- Tokens de sesión en cookies HttpOnly

---

## 📦 Dependencias Principales

```json
{
  "astro": "^5.0.0",
  "tailwindcss": "^4.0.0",
  "@supabase/supabase-js": "^2.x",
  "preact": "^10.x",
  "@preact/preset-vite": "^2.x"
}
```

---

## 🎯 Objetivos de Negocio

1. **Reducir llamadas telefónicas** para reservas
2. **Mejorar la experiencia del cliente** con transparencia en tiempo real
3. **Optimizar la gestión** del tiempo del personal
4. **Aumentar la captación** con presencia web profesional
5. **Generar confianza** mostrando el proceso en tiempo real

---

## 📞 Contacto del Proyecto

**Desarrollador**: [Tu nombre]  
**Cliente**: Animalets (Peluquería Canina)  
**Repositorio**: `/home/gnurub/code/animalets`

---

**Última Actualización**: 24 de octubre de 2025
