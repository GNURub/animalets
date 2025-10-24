# 🚀 Guía de Configuración y Despliegue - Animalets

Esta guía te ayudará a configurar y desplegar completamente el sistema Animalets.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Variables de Entorno](#variables-de-entorno)
4. [Desarrollo Local](#desarrollo-local)
5. [Configuración de OAuth](#configuración-de-oauth)
6. [Despliegue a Producción](#despliegue-a-producción)
7. [Crear Usuario Admin](#crear-usuario-admin)

---

## 📦 Configuración Inicial

### 1. Requisitos

- Node.js 18+ (recomendado 20+)
- pnpm 8+ instalado globalmente
- Cuenta de Supabase (gratuita)

### 2. Clonar e Instalar

```bash
# Clonar el repositorio
git clone <repository-url>
cd animalets

# Instalar dependencias
pnpm install
```

---

## 🗄️ Configuración de Supabase

### Paso 1: Crear Proyecto

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Haz clic en **"New Project"**
3. Selecciona tu organización o crea una nueva
4. Completa los detalles:
   - **Name**: Animalets (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana a tus usuarios
   - **Pricing Plan**: Free (suficiente para comenzar)
5. Haz clic en **"Create new project"**
6. Espera ~2 minutos mientras se configura el proyecto

### Paso 2: Ejecutar Migraciones SQL

1. En el panel de Supabase, ve a **SQL Editor** (icono de consola en el menú lateral)
2. Haz clic en **"New query"**

#### Migración 1: Schema Inicial

3. Copia y pega el contenido completo del archivo:
   ```
   supabase/migrations/20251024000000_initial_schema.sql
   ```
4. Haz clic en **"Run"** (o presiona Ctrl/Cmd + Enter)
5. Verifica que aparezca el mensaje: "Success. No rows returned"

#### Migración 2: RLS Policies

6. Crea otra **"New query"**
7. Copia y pega el contenido completo del archivo:
   ```
   supabase/migrations/20251024000001_rls_policies.sql
   ```
8. Haz clic en **"Run"**
9. Verifica que se ejecute exitosamente

### Paso 3: Verificar Tablas

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver 6 tablas creadas:
   - `profiles`
   - `pets`
   - `services`
   - `appointments`
   - `business_hours`
   - `blocked_times`
3. Verifica que las tablas `services` y `business_hours` tengan datos de ejemplo

---

## 🔐 Variables de Entorno

### Obtener Credenciales de Supabase

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Encontrarás dos secciones importantes:

#### Project URL

```
Project URL: https://xxxxxxxxxxx.supabase.co
```

#### API Keys

```
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Configurar Archivo .env

1. Copia el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus credenciales:

   ```env
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu-service-role-key

   # Environment
   NODE_ENV=development

   # Site URL
   PUBLIC_SITE_URL=http://localhost:4321
   ```

⚠️ **IMPORTANTE**:

- Nunca compartas tu `SUPABASE_SERVICE_ROLE_KEY` públicamente
- No subas el archivo `.env` a Git (ya está en `.gitignore`)

---

## 💻 Desarrollo Local

### Iniciar el Servidor

```bash
pnpm dev
```

El servidor estará disponible en: [http://localhost:4321](http://localhost:4321)

### Verificar Funcionamiento

1. Abre [http://localhost:4321](http://localhost:4321)
2. Deberías ver la landing page de Animalets
3. Haz clic en **"Registrarse"** para crear una cuenta de prueba

### Probar el Sistema

#### Como Cliente:

1. Registra una cuenta en `/register`
2. Inicia sesión en `/signin`
3. Ve al dashboard en `/app/dashboard`
4. Agrega una mascota en `/app/mascotas`
5. Reserva una cita en `/app/reservar`

---

## 🔑 Configuración de OAuth (Opcional)

Si quieres habilitar login con Google, GitHub o Discord:

### Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en **Create Credentials** → **OAuth client ID**
5. Selecciona **Web application**
6. Configura:
   - **Authorized JavaScript origins**: `http://localhost:4321`, `https://tu-proyecto.supabase.co`
   - **Authorized redirect URIs**: `https://tu-proyecto.supabase.co/auth/v1/callback`
7. Copia el **Client ID** y **Client Secret**

8. En Supabase:
   - Ve a **Authentication** → **Providers**
   - Habilita **Google**
   - Pega el Client ID y Client Secret
   - Guarda los cambios

### GitHub OAuth

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Haz clic en **New OAuth App**
3. Completa:
   - **Application name**: Animalets
   - **Homepage URL**: `http://localhost:4321`
   - **Authorization callback URL**: `https://tu-proyecto.supabase.co/auth/v1/callback`
4. Registra la aplicación
5. Copia el **Client ID** y genera un **Client Secret**

6. En Supabase:
   - Ve a **Authentication** → **Providers**
   - Habilita **GitHub**
   - Pega el Client ID y Client Secret
   - Guarda los cambios

### Discord OAuth

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Haz clic en **New Application**
3. Dale un nombre (Animalets) y acepta los términos
4. Ve a **OAuth2** en el menú lateral
5. Agrega redirect: `https://tu-proyecto.supabase.co/auth/v1/callback`
6. Copia el **Client ID** y **Client Secret**

7. En Supabase:
   - Ve a **Authentication** → **Providers**
   - Habilita **Discord**
   - Pega el Client ID y Client Secret
   - Guarda los cambios

---

## 🚀 Despliegue a Producción

### Opción 1: Vercel (Recomendado)

#### Paso 1: Instalar Adaptador

```bash
pnpm add -D @astrojs/vercel
```

#### Paso 2: Actualizar astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

#### Paso 3: Desplegar

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

#### Paso 4: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV` = `production`
   - `PUBLIC_SITE_URL` = `https://tu-dominio.vercel.app`

4. Redespliega para aplicar los cambios:
   ```bash
   vercel --prod
   ```

### Opción 2: Netlify

#### Paso 1: Instalar Adaptador

```bash
pnpm add -D @astrojs/netlify
```

#### Paso 2: Actualizar astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

#### Paso 3: Desplegar

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Desplegar
netlify deploy --prod
```

#### Paso 4: Configurar Variables de Entorno

1. Ve a tu sitio en [app.netlify.com](https://app.netlify.com)
2. Ve a **Site settings** → **Environment variables**
3. Agrega las mismas variables que en Vercel

### Actualizar Callbacks de OAuth

Si configuraste OAuth, actualiza las URLs de callback en:

- Google Cloud Console
- GitHub OAuth Apps
- Discord Developer Portal
- Supabase Auth Settings

Cambia:

- `http://localhost:4321` → `https://tu-dominio.com`

---

## 👨‍💼 Crear Usuario Admin

Por defecto, todos los usuarios nuevos se crean con rol `client`. Para crear un administrador:

### Método 1: SQL Editor (Recomendado)

1. Registra una cuenta normalmente en `/register`
2. Ve a Supabase → **SQL Editor**
3. Ejecuta:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'tu-email@example.com';
   ```

### Método 2: Table Editor

1. Registra una cuenta normalmente
2. Ve a Supabase → **Authentication** → **Users**
3. Encuentra tu usuario
4. Ve a **Table Editor** → **profiles**
5. Busca tu perfil por email
6. Edita el campo `role` a `admin`
7. Guarda

### Verificar Acceso Admin

1. Cierra sesión
2. Inicia sesión nuevamente
3. Accede a `/admin/calendario`
4. Deberías ver el panel de administración completo

---

## ✅ Checklist de Configuración

Usa este checklist para verificar que todo esté configurado:

### Configuración Básica

- [ ] Proyecto de Supabase creado
- [ ] Migraciones SQL ejecutadas (ambas)
- [ ] Tablas verificadas en Table Editor
- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] Dependencias instaladas (`pnpm install`)
- [ ] Servidor de desarrollo funcionando (`pnpm dev`)

### Pruebas Locales

- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Dashboard del cliente carga correctamente
- [ ] Crear mascota funciona
- [ ] Wizard de reservas funciona
- [ ] Usuario admin creado
- [ ] Panel admin accesible

### OAuth (Opcional)

- [ ] Google OAuth configurado (si aplica)
- [ ] GitHub OAuth configurado (si aplica)
- [ ] Discord OAuth configurado (si aplica)
- [ ] Login con proveedores OAuth funciona

### Producción

- [ ] Adaptador instalado (Vercel/Netlify)
- [ ] Variables de entorno configuradas en plataforma
- [ ] Aplicación desplegada exitosamente
- [ ] URLs de callback OAuth actualizadas
- [ ] Aplicación funciona en producción

---

## 🆘 Solución de Problemas Comunes

### Error: "Invalid supabaseUrl"

**Problema**: Las variables de entorno no están configuradas correctamente.

**Solución**:

1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Asegúrate de que las URLs no tengan espacios ni comillas
3. Reinicia el servidor de desarrollo

### Error: "No autorizado" al acceder a /admin

**Problema**: Tu usuario no tiene rol de admin.

**Solución**:

1. Ve a Supabase SQL Editor
2. Ejecuta: `UPDATE profiles SET role = 'admin' WHERE email = 'tu-email@example.com';`
3. Cierra sesión y vuelve a iniciar sesión

### Error: "Module not found" al importar componentes

**Problema**: Los errores de TypeScript son normales con Preact.

**Solución**: Estos errores no afectan la funcionalidad. El código compilará y funcionará correctamente.

### Las migraciones fallan en Supabase

**Problema**: Puede haber caracteres especiales o problemas de formato.

**Solución**:

1. Copia el contenido del archivo SQL exactamente como está
2. Asegúrate de ejecutar primero `20251024000000_initial_schema.sql`
3. Luego ejecuta `20251024000001_rls_policies.sql`
4. Si aún falla, ejecuta línea por línea

### OAuth no funciona en producción

**Problema**: URLs de callback no actualizadas.

**Solución**:

1. Ve a cada proveedor OAuth (Google/GitHub/Discord)
2. Actualiza las authorized redirect URIs con tu dominio de producción
3. Verifica que en Supabase Auth Settings las URLs sean correctas

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa esta guía completa
2. Consulta la documentación en `_docs/`
3. Verifica los logs del servidor (`pnpm dev`)
4. Revisa los logs de Supabase (Logs section en el dashboard)
5. Abre un issue en el repositorio

---

## 🎉 ¡Listo!

Tu sistema Animalets está completamente configurado y listo para usar. Los clientes pueden registrarse, gestionar sus mascotas y reservar citas, mientras que los administradores tienen acceso completo al panel de gestión.

**Próximos pasos sugeridos:**

- Personaliza los colores en `src/styles/global.css`
- Agrega tu logo en los layouts
- Configura notificaciones por email (futura feature)
- Implementa seguimiento en tiempo real con Supabase Realtime
- Agrega analytics para monitorear el uso

¡Disfruta gestionando tu negocio de peluquería canina! 🐕✨
