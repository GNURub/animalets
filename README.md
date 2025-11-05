# 🐾 Animalets - Sistema de Gestión para Peluquería Canina

Sistema completo de gestión para negocios de peluquería canina con reservas online, seguimiento en tiempo real y panel de administración.

## ✨ Características

- 🔐 **Autenticación Completa**: Email/password + OAuth (Google, GitHub, Discord)
- 📅 **Sistema de Reservas**: Asistente paso a paso para agendar citas
- 🐕 **Gestión de Mascotas**: CRUD completo con información detallada
- 📊 **Dashboard del Cliente**: Vista de próximas citas y mascotas registradas
- 🔄 **Seguimiento en Tiempo Real**: Estado de las citas con Supabase Realtime
- 👨‍💼 **Panel de Administración**: Calendario, kanban de citas, gestión de servicios
- 🎨 **TailwindCSS v4**: Diseño moderno y responsivo
- ⚡ **Astro v5 + Preact**: MPA con islas interactivas para máximo rendimiento

## 🛠️ Stack Tecnológico

- **Frontend**: [Astro](https://astro.build) v5 (SSR) + [Preact](https://preactjs.com)
- **Estilos**: [TailwindCSS](https://tailwindcss.com) v4
- **Backend**: [Supabase](https://supabase.com) (PostgreSQL + Auth + Realtime + Storage)
- **Gestión de Estado**: [@preact/signals](https://preactjs.com/guide/v10/signals/)
- **Lenguaje**: TypeScript
- **Gestor de Paquetes**: PNPM

## 📋 Requisitos Previos

- **Node.js** 18+ (recomendado 20+)
- **pnpm** 8+ (o npm/yarn)
- **Cuenta de Supabase** (gratuita)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd animalets
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar Supabase

#### a) Crear proyecto en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Crea una nueva organización (si no tienes una)
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración (~2 minutos)

#### b) Ejecutar migraciones

1. En el proyecto de Supabase, ve a **SQL Editor**
2. Ejecuta el contenido de `supabase/migrations/20251024000000_initial_schema.sql`
3. Ejecuta el contenido de `supabase/migrations/20251024000001_rls_policies.sql`

#### c) Configurar Auth Providers (Opcional)

Si quieres usar OAuth (Google, GitHub, Discord):

1. Ve a **Authentication > Providers** en tu proyecto de Supabase
2. Habilita los proveedores deseados
3. Configura las credenciales OAuth de cada proveedor

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y completa las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de Supabase:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

**Obtener las credenciales:**

- `PUBLIC_SUPABASE_URL`: Settings > API > Project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Settings > API > Project API keys > anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Settings > API > Project API keys > service_role ⚠️

⚠️ **IMPORTANTE**: Nunca compartas tu `SUPABASE_SERVICE_ROLE_KEY` públicamente.

### 5. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

El sitio estará disponible en [http://localhost:4321](http://localhost:4321)

## 📁 Estructura del Proyecto

```
animalets/
├── _docs/                      # Documentación del proyecto
│   ├── 00-project-overview.md
│   ├── 01-technical-architecture.md
│   ├── 02-database-schema.md
│   ├── 03-api-endpoints.md
│   ├── 04-component-specifications.md
│   └── 05-authentication-flow.md
├── src/
│   ├── components/             # Componentes Preact interactivos
│   │   ├── PetManager.tsx      # Gestión de mascotas
│   │   └── BookingWizard.tsx   # Asistente de reservas
│   ├── layouts/                # Layouts de Astro
│   │   ├── Layout.astro        # Layout base
│   │   ├── AppLayout.astro     # Layout del cliente
│   │   └── AdminLayout.astro   # Layout del admin
│   ├── pages/                  # Páginas y rutas
│   │   ├── index.astro         # Página de inicio
│   │   ├── signin.astro        # Inicio de sesión
│   │   ├── register.astro      # Registro
│   │   ├── app/                # Portal del cliente
│   │   │   ├── dashboard.astro
│   │   │   ├── mascotas.astro
│   │   │   └── reservar.astro
│   │   └── api/                # API endpoints
│   │       ├── auth/           # Autenticación
│   │       ├── pets/           # Mascotas
│   │       ├── appointments/   # Citas
│   │       └── slots/          # Horarios disponibles
│   ├── lib/
│   │   └── supabase.ts         # Cliente de Supabase
│   ├── middleware.ts           # Middleware de autenticación
│   └── styles/
│       └── global.css          # Estilos globales + TailwindCSS v4
├── supabase/
│   └── migrations/             # Migraciones de base de datos
└── astro.config.mjs            # Configuración de Astro
```

## 🔑 Usuarios de Prueba

Después de ejecutar las migraciones, necesitarás crear usuarios desde la aplicación:

1. Ve a [http://localhost:4321/register](http://localhost:4321/register)
2. Registra una cuenta de cliente
3. Para crear un admin:
   - Regístrate normalmente
   - Ve a Supabase Dashboard > Authentication > Users
   - Encuentra tu usuario y edita el campo `raw_user_meta_data`
   - En el SQL Editor ejecuta:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE email = 'tu-email@example.com';
     ```

## 📖 Documentación Completa

Para más detalles sobre la arquitectura, base de datos, APIs y componentes, consulta la carpeta `_docs/`:

- [Visión General del Proyecto](./_docs/00-project-overview.md)
- [Arquitectura Técnica](./_docs/01-technical-architecture.md)
- [Esquema de Base de Datos](./_docs/02-database-schema.md)
- [Endpoints de API](./_docs/03-api-endpoints.md)
- [Especificaciones de Componentes](./_docs/04-component-specifications.md)
- [Flujo de Autenticación](./_docs/05-authentication-flow.md)

## 🚢 Despliegue

### Producción en Vercel

1. Instala el adaptador de Vercel:

   ```bash
   pnpm add -D @astrojs/vercel
   ```

2. Actualiza `astro.config.mjs`:

   ```js
   import { defineConfig } from 'astro/config';
   import vercel from '@astrojs/vercel';

   export default defineConfig({
     output: 'server',
     adapter: vercel(),
   });
   ```

3. Despliega en Vercel:

   ```bash
   vercel
   ```

4. Configura las variables de entorno en Vercel Dashboard

### Otras Plataformas

Astro soporta múltiples adaptadores:

- Netlify: `@astrojs/netlify`
- Cloudflare: `@astrojs/cloudflare`
- Node.js: `@astrojs/node`

Consulta la [documentación de Astro](https://docs.astro.build/en/guides/deploy/) para más opciones.

## 📝 Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Inicia el servidor de desarrollo

# Producción
pnpm build        # Compila para producción
pnpm preview      # Vista previa de la build de producción

# Utilidades
pnpm astro --help # Ayuda de Astro CLI
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la [documentación](./_docs/)
2. Busca en los issues existentes
3. Crea un nuevo issue

## 👏 Agradecimientos

- [Astro](https://astro.build) - Framework web
- [Supabase](https://supabase.com) - Backend as a Service
- [TailwindCSS](https://tailwindcss.com) - Framework CSS
- [Preact](https://preactjs.com) - Librería de UI

---

Hecho con ❤️ para amantes de las mascotas
