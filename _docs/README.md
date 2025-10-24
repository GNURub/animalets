# 📚 Documentación del Proyecto Animalets

Bienvenido a la documentación completa del proyecto **Animalets**, una aplicación web integral para la gestión de peluquería canina con tracking en tiempo real.

---

## 📖 Índice de Documentación

### Documentos Principales

1. **[00-project-overview.md](00-project-overview.md)** - Resumen Ejecutivo

   - Visión del proyecto
   - Stack tecnológico
   - Componentes principales
   - Diferenciador clave (Tracker en tiempo real)
   - Roadmap general

2. **[01-technical-architecture.md](01-technical-architecture.md)** - Arquitectura Técnica

   - Arquitectura general (MPA + Islands)
   - Flujo de peticiones HTTP
   - Estructura de componentes
   - Sistema de islas (Astro Islands)
   - Autenticación y autorización
   - Sistema de tiempo real
   - Edge Functions

3. **[02-database-schema.md](02-database-schema.md)** - Esquema de Base de Datos

   - Diagrama ER
   - Definición de todas las tablas
   - Row Level Security (RLS)
   - Funciones auxiliares
   - Vistas útiles
   - Migración SQL completa

4. **[03-api-endpoints.md](03-api-endpoints.md)** - API y Edge Functions

   - API Routes de Astro
   - Endpoints de autenticación ✅
   - Endpoints de citas
   - Endpoints de mascotas
   - Edge Function: `get-available-slots`
   - Edge Function: notificaciones (opcional)

5. **[04-component-specifications.md](04-component-specifications.md)** - Especificaciones de Componentes

   - Islas interactivas del portal cliente
     - `BookingWizard` (Asistente de reserva)
     - `PetManager` (Gestor de mascotas)
     - `RealtimeTracker` (Tracker en tiempo real)
   - Islas del panel admin
     - `AdminCalendar` (Calendario)
     - `KanbanBoard` (Panel Kanban)
     - `PhotoUploader` (Subir fotos)
   - Componentes UI reutilizables

6. **[05-authentication-flow.md](05-authentication-flow.md)** - Flujo de Autenticación
   - Estrategia de autenticación
   - Email/Password
   - OAuth (Google, GitHub, Discord)
   - Middleware de autenticación
   - Refresh tokens
   - Logout
   - Seguridad de cookies
   - Permisos y roles

---

## 📅 Fases del Proyecto

Las fases están documentadas en detalle en la carpeta [`phases/`](phases/):

### [Fase 1: Cimientos](phases/phase-1-foundations.md) (1 semana)

**Estado**: 📝 Pendiente  
**Objetivo**: Establecer infraestructura básica

**Tareas principales**:

- Configuración de Supabase
- Esquema de base de datos
- Configuración de Astro + SSR
- Autenticación
- Middleware
- Deployment inicial

### Fase 2: Admin Panel MVP (2-3 semanas)

**Estado**: ⏸️ En espera  
**Objetivo**: Panel funcional para operaciones diarias

**Componentes clave**:

- Calendario de citas
- Panel Kanban de estados
- Gestión de servicios
- Subida de fotos

### Fase 3: Portal de Cliente (2 semanas)

**Estado**: ⏸️ En espera  
**Objetivo**: Autoservicio para clientes

**Componentes clave**:

- Gestión de mascotas
- Sistema de reservas online
- Edge Function de disponibilidad

### Fase 4: Tracker en Tiempo Real (1 semana)

**Estado**: ⏸️ En espera  
**Objetivo**: Implementar diferenciador clave

**Componentes clave**:

- Tracker con suscripciones Realtime
- Notificaciones (opcional)

### Fase 5: Web Pública (1 semana)

**Estado**: ⏸️ En espera  
**Objetivo**: Marketing y SEO

**Componentes clave**:

- Landing page
- Páginas de servicios
- Optimización SEO

---

## 📋 Gestión de Tareas

Las tareas están organizadas en la carpeta [`tasks/`](tasks/):

- **[backlog.md](tasks/backlog.md)** - Backlog general del proyecto
  - Resumen de todas las fases
  - Épicas por fase
  - Priorización de tareas
  - Estimaciones de esfuerzo
  - Metodología de trabajo
  - Riesgos identificados
  - Hitos principales

---

## 🏗️ Estructura del Proyecto

```
/home/gnurub/code/animalets/
│
├── _docs/                          # 📚 Esta carpeta (documentación)
│   ├── README.md                   # Este archivo
│   ├── 00-project-overview.md
│   ├── 01-technical-architecture.md
│   ├── 02-database-schema.md
│   ├── 03-api-endpoints.md
│   ├── 04-component-specifications.md
│   ├── 05-authentication-flow.md
│   ├── phases/
│   │   ├── phase-1-foundations.md
│   │   ├── phase-2-admin-panel.md
│   │   ├── phase-3-client-portal.md
│   │   ├── phase-4-realtime-tracker.md
│   │   └── phase-5-public-web.md
│   └── tasks/
│       ├── backlog.md
│       ├── sprint-1.md
│       └── ...
│
├── public/                         # Assets estáticos
├── src/
│   ├── assets/                     # Assets procesados
│   ├── components/                 # Componentes
│   │   ├── islands/                # Islas interactivas (Preact)
│   │   └── ui/                     # Componentes UI
│   ├── layouts/                    # Layouts de Astro
│   ├── lib/                        # Librerías y utilidades
│   ├── middleware/                 # Middleware
│   ├── pages/                      # Rutas (file-based)
│   │   ├── api/                    # API Routes
│   │   ├── app/                    # Portal cliente
│   │   └── admin/                  # Panel admin
│   └── styles/                     # Estilos globales
│
├── supabase/                       # Configuración de Supabase
│   ├── migrations/                 # Migraciones SQL
│   └── functions/                  # Edge Functions
│
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── .env                            # Variables de entorno (no versionado)
```

---

## 🚀 Guía de Inicio Rápido

### Para Desarrolladores

1. **Leer documentación base**:

   ```
   1. project-overview.md       # Entender el proyecto
   2. technical-architecture.md # Entender la arquitectura
   3. authentication-flow.md    # Entender auth
   ```

2. **Iniciar desarrollo**:

   ```
   Seguir phase-1-foundations.md paso a paso
   ```

3. **Desarrollar features**:
   ```
   Consultar component-specifications.md
   Consultar database-schema.md
   Consultar api-endpoints.md
   ```

### Para Product Owners / Stakeholders

1. **Entender el proyecto**:

   ```
   Leer: project-overview.md
   ```

2. **Ver progreso**:

   ```
   Consultar: tasks/backlog.md
   Ver: GitHub Projects
   ```

3. **Priorizar features**:
   ```
   Actualizar: tasks/backlog.md
   ```

---

## 📊 Estado Actual del Proyecto

**Fecha**: 24 de octubre de 2025  
**Fase Actual**: Fase 0 (Planificación) ✅ Completada  
**Próxima Fase**: Fase 1 (Cimientos) 📝 Lista para iniciar

### Progreso Global

```
[████░░░░░░░░░░░░░░░░] 20% - Planificación completada
```

### Checklist de Inicio

- [x] Documentación completa creada
- [x] Arquitectura definida
- [x] Esquema de base de datos diseñado
- [x] Componentes especificados
- [x] Backlog priorizado
- [ ] Configuración de Supabase
- [ ] Configuración de Astro
- [ ] Autenticación implementada
- [ ] Deployment inicial

---

## 🔧 Tecnologías y Herramientas

### Frontend

- **Astro v5**: Framework principal
- **Preact**: Para islas interactivas
- **Tailwind CSS v4**: Estilos
- **TypeScript**: Tipado estático

### Backend

- **Supabase**: BaaS completo
  - PostgreSQL
  - Auth
  - Realtime
  - Storage
  - Edge Functions

### Deployment

- **Vercel / Netlify**: Hosting frontend
- **Supabase Cloud**: Backend

### Herramientas de Desarrollo

- **pnpm**: Gestor de paquetes
- **VS Code**: Editor recomendado
- **Git**: Control de versiones
- **GitHub**: Repositorio

---

## 📝 Convenciones de Documentación

### Formato de Archivos

- Todos los archivos en Markdown (`.md`)
- Nombres en kebab-case (ej: `database-schema.md`)
- Numeración para orden lógico (ej: `01-`, `02-`)

### Estructura de Documentos

```markdown
# Título del Documento

**Fecha**: DD de MM de YYYY

---

## 🎯 Sección Principal

### Subsección

Contenido...

#### Sub-subsección

Más contenido...

---

**Última Actualización**: DD de MM de YYYY
```

### Emojis Estándar

- 📚 Documentación
- 🎯 Objetivos
- 📋 Tareas
- ✅ Completado
- 📝 En progreso
- ⏸️ En espera
- 🔴 Crítico
- 🟡 Importante
- 🟢 Normal
- 🚀 Deployment
- 🐛 Bug
- 🔧 Configuración
- 💡 Idea
- ⚡ Performance
- 🔒 Seguridad

---

## 🤝 Contribución a la Documentación

### Actualizar Documentación

1. Editar el archivo correspondiente en `_docs/`
2. Actualizar la fecha de última actualización al final
3. Commit con mensaje descriptivo:
   ```bash
   git commit -m "docs: actualizar esquema de base de datos"
   ```

### Crear Nueva Documentación

1. Crear archivo en la carpeta apropiada
2. Seguir convenciones de formato
3. Actualizar este README con el nuevo documento
4. Commit:
   ```bash
   git commit -m "docs: añadir guía de testing"
   ```

---

## 📞 Contacto y Soporte

**Desarrollador**: [Tu nombre]  
**Cliente**: Animalets (Peluquería Canina)  
**Email**: [tu-email]  
**GitHub**: [tu-usuario]

---

## 🗂️ Historial de Cambios

| Fecha       | Cambio                                    | Autor       |
| ----------- | ----------------------------------------- | ----------- |
| 24 Oct 2025 | Creación de toda la documentación inicial | [Tu nombre] |
| 24 Oct 2025 | Fase 1 documentada en detalle             | [Tu nombre] |

---

## 📚 Referencias Externas

### Documentación Oficial

- [Astro Docs](https://docs.astro.build)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Preact Docs](https://preactjs.com)

### Tutoriales Relevantes

- [Astro + Supabase Auth](https://docs.astro.build/en/guides/backend/supabase/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Astro Islands](https://docs.astro.build/en/concepts/islands/)

---

## 🎯 Próximos Pasos

1. **Revisión de documentación** con el cliente
2. **Aprobación de arquitectura** y diseño de base de datos
3. **Iniciar Fase 1**: Seguir [`phases/phase-1-foundations.md`](phases/phase-1-foundations.md)
4. **Crear Sprint 1**: Basado en tareas de Fase 1
5. **Setup de repositorio**: GitHub Projects, issues, etc.

---

**Esta documentación es un living document y se actualizará continuamente durante el desarrollo del proyecto.**

**Última Actualización**: 24 de octubre de 2025
