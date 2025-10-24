# Backlog General - Animalets

**Fecha de Creación**: 24 de octubre de 2025  
**Última Actualización**: 24 de octubre de 2025

---

## 📊 Resumen de Fases

| Fase | Nombre                 | Duración    | Prioridad  | Estado       |
| ---- | ---------------------- | ----------- | ---------- | ------------ |
| 1    | Cimientos              | 1 semana    | 🔴 Crítica | 📝 Pendiente |
| 2    | Admin Panel MVP        | 2-3 semanas | 🔴 Crítica | ⏸️ En espera |
| 3    | Portal de Cliente      | 2 semanas   | 🟡 Alta    | ⏸️ En espera |
| 4    | Tracker en Tiempo Real | 1 semana    | 🟡 Alta    | ⏸️ En espera |
| 5    | Web Pública            | 1 semana    | 🟢 Media   | ⏸️ En espera |

**Duración Total**: 7-8 semanas  
**Fecha Inicio Estimada**: 28 de octubre de 2025  
**Fecha Fin Estimada**: 20 de diciembre de 2025

---

## 🎯 Fase 1: Cimientos (Semana 1)

### Epic 1.1: Configuración de Supabase

- [ ] Crear proyecto en Supabase Cloud
- [ ] Configurar variables de entorno
- [ ] Crear esquema de base de datos (migración SQL)
- [ ] Configurar Row Level Security (RLS)
- [ ] Configurar Storage para fotos
- [ ] Crear datos de ejemplo (servicios, horarios)

### Epic 1.2: Configuración de Astro

- [ ] Instalar dependencias (Preact, adapters)
- [ ] Configurar Astro para SSR
- [ ] Configurar TypeScript
- [ ] Actualizar cliente Supabase
- [ ] Test de conexión a Supabase

### Epic 1.3: Autenticación

- [ ] Configurar OAuth providers (Google, GitHub, Discord)
- [ ] Verificar API routes de auth
- [ ] Crear middleware de autenticación
- [ ] Crear tipos TypeScript para locals
- [ ] Test de flujos de autenticación

### Epic 1.4: Estructura de Páginas

- [ ] Crear AppLayout
- [ ] Crear AdminLayout
- [ ] Crear páginas básicas de /app
- [ ] Crear páginas básicas de /admin
- [ ] Crear componentes UI reutilizables (Button, Card)

### Epic 1.5: Deployment

- [ ] Testing local completo
- [ ] Deploy a Vercel/Netlify
- [ ] Configurar variables de entorno en producción
- [ ] Actualizar OAuth callbacks
- [ ] Smoke tests en producción

**Entregable**: Infraestructura completa y autenticación funcionando

---

## 👑 Fase 2: Admin Panel MVP (Semanas 2-4)

### Epic 2.1: Autenticación y Gestión Básica

- [ ] Página de login admin
- [ ] Mejorar middleware para roles
- [ ] CRUD de servicios (isla interactiva)
- [ ] Configuración de horarios (business_hours)
- [ ] Test de permisos

### Epic 2.2: Calendario Admin

- [ ] Instalar FullCalendar
- [ ] Crear isla `AdminCalendar`
- [ ] Vista mensual y semanal
- [ ] Ver todas las citas
- [ ] Modal de detalles de cita
- [ ] Crear cita manual (formulario)
- [ ] Editar cita existente
- [ ] Eliminar/cancelar cita
- [ ] Drag & drop para mover citas
- [ ] Colores por estado

### Epic 2.3: Tracker de Estados (Kanban)

- [ ] Instalar @dnd-kit
- [ ] Crear isla `KanbanBoard`
- [ ] Vista de columnas por estado
- [ ] Tarjetas de citas
- [ ] Drag & drop entre columnas
- [ ] Actualización de estado en Supabase
- [ ] Modal de detalles de cita
- [ ] Componente `PhotoUploader`
- [ ] Subida de foto a Storage
- [ ] Actualizar cita con foto final

### Epic 2.4: Gestión de Clientes

- [ ] Página de lista de clientes
- [ ] Búsqueda de clientes
- [ ] Ver perfil de cliente
- [ ] Ver mascotas de cliente
- [ ] Ver historial de citas

**Entregable**: Panel admin completamente funcional

---

## 🐕 Fase 3: Portal de Cliente (Semanas 5-6)

### Epic 3.1: Autenticación Cliente

- [ ] Página de registro mejorada
- [ ] Página de login mejorada
- [ ] Dashboard del cliente
- [ ] Perfil del usuario (editar)
- [ ] Test de flujos

### Epic 3.2: Gestión de Mascotas

- [ ] Crear isla `PetManager`
- [ ] Lista de mascotas
- [ ] Modal de crear mascota
- [ ] Modal de editar mascota
- [ ] Eliminar mascota (con confirmación)
- [ ] Validaciones de formulario
- [ ] Subida de foto de mascota (opcional)

### Epic 3.3: Sistema de Reservas

- [ ] Crear Edge Function `get-available-slots`
- [ ] Test de Edge Function
- [ ] Deploy de Edge Function
- [ ] Crear isla `BookingWizard`
- [ ] Paso 1: Seleccionar mascota
- [ ] Paso 2: Seleccionar servicio
- [ ] Paso 3: Seleccionar fecha
- [ ] Cargar slots disponibles
- [ ] Paso 3: Seleccionar hora
- [ ] Input de notas
- [ ] Paso 4: Confirmación
- [ ] POST a /api/appointments/create
- [ ] Redirect a tracker
- [ ] Validaciones y manejo de errores

### Epic 3.4: Gestión de Citas

- [ ] Ver próximas citas en dashboard
- [ ] Ver historial de citas
- [ ] Cancelar cita (solo pendientes)
- [ ] Página de detalles de cita

**Entregable**: Clientes pueden autogestionar mascotas y citas

---

## ⚡ Fase 4: Tracker en Tiempo Real (Semana 7)

### Epic 4.1: Tracker del Cliente

- [ ] Crear isla `RealtimeTracker`
- [ ] Cargar estado inicial de cita
- [ ] Suscripción a cambios en tiempo real
- [ ] UI visual del estado (stepper)
- [ ] Animaciones de transición
- [ ] Mostrar tiempo estimado
- [ ] Mostrar foto final cuando esté lista
- [ ] Botón de descarga de foto
- [ ] Compartir foto en redes (opcional)
- [ ] Test de actualización en tiempo real

### Epic 4.2: Notificaciones (Opcional)

- [ ] Edge Function para notificaciones
- [ ] Database Webhook en cambio de estado
- [ ] Enviar email cuando esté listo (SendGrid/Resend)
- [ ] Enviar SMS cuando esté listo (Twilio)
- [ ] Notificaciones push (opcional)

**Entregable**: Experiencia "wow" de tracking en tiempo real

---

## 🌐 Fase 5: Web Pública (Semana 8)

### Epic 5.1: Páginas de Marketing

- [ ] Diseño de landing page
- [ ] Implementar landing page
- [ ] Página de servicios
- [ ] Página "Quiénes somos"
- [ ] Página de contacto (formulario)
- [ ] Footer con información
- [ ] Navegación responsive

### Epic 5.2: SEO y Performance

- [ ] Meta tags en todas las páginas
- [ ] Open Graph tags
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Optimización de imágenes
- [ ] Lazy loading
- [ ] Preloading de assets críticos
- [ ] Lighthouse audit
- [ ] Optimizar hasta score > 95

### Epic 5.3: Extras

- [ ] Página 404 personalizada
- [ ] Página de términos y condiciones
- [ ] Política de privacidad
- [ ] Integración con Google Analytics (opcional)
- [ ] Chat de soporte (opcional)

**Entregable**: Web pública lista para producción

---

## 📋 Backlog de Mejoras Futuras

### Funcionalidades Extra

- [ ] Sistema de recordatorios por email/SMS (1 día antes)
- [ ] Valoraciones y reseñas de servicios
- [ ] Programa de fidelización (puntos)
- [ ] Descuentos y cupones
- [ ] Multi-idioma (inglés)
- [ ] App móvil (React Native / Flutter)
- [ ] Historial médico de mascotas
- [ ] Integración con calendario de Google
- [ ] Exportar calendario a ICS
- [ ] Reportes y estadísticas avanzadas
- [ ] Dashboard de métricas de negocio
- [ ] Gestión de inventario de productos
- [ ] Punto de venta (POS) integrado
- [ ] Facturas automáticas

### Mejoras Técnicas

- [ ] Tests unitarios (Vitest)
- [ ] Tests E2E (Playwright)
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo con Sentry
- [ ] Logs centralizados
- [ ] Rate limiting en APIs
- [ ] Caché con Redis
- [ ] CDN para assets
- [ ] Backup automático de base de datos
- [ ] Documentación de API con Swagger

---

## 🎯 Priorización de Tareas

### Debe tener (Must Have) - P0

- Autenticación
- Gestión de citas (admin y cliente)
- Calendario admin
- Reserva online con disponibilidad
- Tracker en tiempo real

### Debería tener (Should Have) - P1

- Gestión de mascotas
- Fotos finales
- Panel Kanban
- Web pública optimizada
- SEO básico

### Podría tener (Could Have) - P2

- Notificaciones por email/SMS
- OAuth con múltiples providers
- Fotos de mascotas
- Histórico completo

### No tendrá (Won't Have) - P3

- App móvil nativa
- Integraciones avanzadas
- Multi-idioma
- Sistema de inventario

---

## 📊 Estimación de Esfuerzo por Tipo de Tarea

| Tipo               | Cantidad | Horas/tarea | Total |
| ------------------ | -------- | ----------- | ----- |
| Configuración      | 10       | 2h          | 20h   |
| Backend/DB         | 15       | 3h          | 45h   |
| Componentes UI     | 25       | 4h          | 100h  |
| Islas Interactivas | 10       | 6h          | 60h   |
| API Routes         | 8        | 2h          | 16h   |
| Edge Functions     | 3        | 4h          | 12h   |
| Testing            | 15       | 1h          | 15h   |
| Deployment         | 5        | 2h          | 10h   |
| Documentación      | 10       | 1h          | 10h   |

**Total Estimado**: ~288 horas (7-8 semanas a 40h/semana)

---

## 🔄 Metodología de Trabajo

### Sprints

- **Duración**: 1 semana (5 días laborables)
- **Sprint Planning**: Lunes
- **Daily Standup**: Diario (virtual)
- **Sprint Review**: Viernes
- **Sprint Retrospective**: Viernes

### Definición de "Hecho"

Una tarea está completada cuando:

1. ✅ Código implementado
2. ✅ Tests pasados (manual o automatizado)
3. ✅ Revisión de código (si aplica)
4. ✅ Documentación actualizada
5. ✅ Deployado en entorno de test
6. ✅ Aprobado por stakeholder

---

## 📈 Métricas de Progreso

### Por Fase

- % de tareas completadas
- Días consumidos vs estimados
- Bugs encontrados
- Deuda técnica acumulada

### Globales

- Velocity (tareas/sprint)
- Burndown chart
- Cobertura de tests
- Performance (Lighthouse score)

---

## 🚨 Riesgos Identificados

| Riesgo                                      | Probabilidad | Impacto | Mitigación                                       |
| ------------------------------------------- | ------------ | ------- | ------------------------------------------------ |
| Complejidad de lógica de disponibilidad     | Media        | Alto    | Prototipo temprano, tests exhaustivos            |
| Performance de Realtime con muchos usuarios | Baja         | Alto    | Load testing, optimizaciones                     |
| Problemas con OAuth providers               | Media        | Medio   | Configurar múltiples providers, fallback a email |
| Cambios de requisitos                       | Alta         | Medio   | Sprints cortos, feedback constante               |
| Bugs en producción                          | Media        | Alto    | Testing exhaustivo, staging environment          |

---

## 👥 Equipo y Roles

| Rol                  | Responsable        | Responsabilidades                            |
| -------------------- | ------------------ | -------------------------------------------- |
| Product Owner        | Cliente (tu madre) | Definir prioridades, validar funcionalidades |
| Developer Full Stack | [Tu nombre]        | Implementar todo el stack                    |
| UX/UI Designer       | [Tu nombre]        | Diseñar interfaces                           |
| QA Tester            | [Tu nombre]        | Testing manual                               |
| DevOps               | [Tu nombre]        | Deployment y monitoreo                       |

---

## 📞 Canales de Comunicación

- **Repositorio**: GitHub
- **Project Management**: GitHub Projects / Trello
- **Documentación**: Este repositorio (`_docs/`)
- **Comunicación**: Email / WhatsApp / Slack

---

## 🎉 Hitos Principales

| Fecha       | Hito                 | Descripción              |
| ----------- | -------------------- | ------------------------ |
| 1 Nov 2025  | ✅ Fase 1 Completada | Infraestructura lista    |
| 22 Nov 2025 | ✅ Fase 2 Completada | Admin puede trabajar     |
| 6 Dic 2025  | ✅ Fase 3 Completada | Clientes pueden reservar |
| 13 Dic 2025 | ✅ Fase 4 Completada | Tracker funcionando      |
| 20 Dic 2025 | 🚀 LANZAMIENTO       | Web pública online       |

---

**Última Actualización**: 24 de octubre de 2025
