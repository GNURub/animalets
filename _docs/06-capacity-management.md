# Gestión de Cupos por Hora - Plan de Implementación

## 📋 Resumen Ejecutivo

Sistema modular de cupos por hora que permite:

- ✅ Cupo por defecto global (ej: 1 perro/hora)
- ✅ Excepciones por día/hora (ej: miércoles 2 perros/hora)
- ✅ Escalabilidad futura (agregar más trabajadores sin romper nada)
- ✅ Compatibilidad total con sistema actual

---

## 🎯 Objetivos

1. **Flexibilidad operativa**: Admin puede cambiar cupos sin código
2. **Escalabilidad**: Pasar de 1→2→3 personas sin afectar código
3. **Granularidad**: Excepciones por día/hora específicas
4. **Performance**: Búsquedas rápidas con índices optimizados
5. **Backwards compatibility**: Si no hay excepciones, usa default (1)

---

## 📊 Casos de Uso

### Caso 1: Inicio (1 persona toda la semana)

```
default_capacity: 1
staff_schedules: [] (vacío)
Resultado: 1 cita/hora en todas partes
```

### Caso 2: Miércoles con 2 personas

```
default_capacity: 1
staff_schedules: [
  {
    day_of_week: 3,
    start_time: '09:00',
    end_time: '18:00',
    appointments_per_hour: 2
  }
]
Resultado: 1 cita/hora Mon-Fri, 2 citas/hora miércoles
```

### Caso 3: Expansión a 2 personas (futuro)

```
default_capacity: 2  # ← Cambiar este valor
staff_schedules: [
  {
    day_of_week: 3,
    start_time: '09:00',
    end_time: '18:00',
    appointments_per_hour: 3  # ← Actualizar miércoles
  }
]
Resultado: 2 citas/hora toda la semana, 3 los miércoles
```

### Caso 4: Personal parcial (ej: 14:00-18:00 extra)

```
default_capacity: 1
staff_schedules: [
  {
    day_of_week: 1,  # Lunes
    start_time: '14:00',
    end_time: '18:00',
    appointments_per_hour: 2
  }
]
Resultado: Lunes 09:00-14:00 = 1 cita/hora, 14:00-18:00 = 2 citas/hora
```

---

## 🗄️ Diseño de Base de Datos

### Tabla: `default_capacity`

Configuración global de cupos por defecto.

```sql
CREATE TABLE default_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointments_per_hour INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solo un registro (singleton)
CREATE UNIQUE INDEX idx_default_capacity_single
ON default_capacity((1)) WHERE id IS NOT NULL;

-- Trigger para actualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON default_capacity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar valor por defecto
INSERT INTO default_capacity (appointments_per_hour) VALUES (1);
```

**Columnas**:

- `id`: UUID del registro
- `appointments_per_hour`: Cupo por hora (default 1)
- `created_at`: Timestamp de creación
- `updated_at`: Timestamp de última actualización

**Patrón**: Singleton - siempre habrá exactamente 1 registro

---

### Tabla: `staff_schedules`

Excepciones de personal por día y horario.

```sql
CREATE TABLE staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  staff_count INTEGER NOT NULL DEFAULT 1,
  appointments_per_hour INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Solo puede haber un registro por (día, horario)
  CONSTRAINT unique_staff_schedule UNIQUE (day_of_week, start_time, end_time)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_staff_schedules_day ON staff_schedules(day_of_week);
CREATE INDEX idx_staff_schedules_day_time ON staff_schedules(day_of_week, start_time, end_time);

-- Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON staff_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Columnas**:

- `id`: UUID de la excepción
- `day_of_week`: 0=Dom, 1=Lun, ..., 6=Sab
- `start_time`: Hora de inicio (ej: '14:00')
- `end_time`: Hora de fin (ej: '18:00')
- `staff_count`: Número de personas (informativo)
- `appointments_per_hour`: Cupo para este período
- `created_at`, `updated_at`: Timestamps

**Lógica**: Solo se crean excepciones cuando hay diferencia del default

---

### Vista SQL: `capacity_by_time`

Calcula la capacidad efectiva por día/hora.

```sql
CREATE OR REPLACE VIEW capacity_by_time AS
SELECT
  day_of_week,
  start_time,
  end_time,
  appointments_per_hour,
  staff_count
FROM staff_schedules

UNION ALL

SELECT
  dw.day_of_week,
  CAST('00:00' AS TIME) as start_time,
  CAST('23:59' AS TIME) as end_time,
  dc.appointments_per_hour,
  dc.appointments_per_hour as staff_count
FROM
  (SELECT DISTINCT day_of_week FROM business_hours) dw
  CROSS JOIN default_capacity dc
WHERE NOT EXISTS (
  SELECT 1 FROM staff_schedules ss
  WHERE ss.day_of_week = dw.day_of_week
)
ORDER BY day_of_week, start_time;
```

---

## 🔐 Row Level Security (RLS)

```sql
-- Lectura pública (cualquiera puede ver)
CREATE POLICY "Anyone can view default capacity"
  ON default_capacity FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view staff schedules"
  ON staff_schedules FOR SELECT
  USING (TRUE);

-- Escritura solo admin
CREATE POLICY "Admins can manage default capacity"
  ON default_capacity FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage staff schedules"
  ON staff_schedules FOR ALL
  USING (public.is_admin(auth.uid()));
```

---

## 🔌 API Endpoints

### GET `/api/default-capacity`

Obtener configuración de cupo por defecto

**Response**: `{ id, appointments_per_hour, created_at, updated_at }`

### PUT `/api/default-capacity`

Actualizar cupo por defecto (solo admin)

**Body**: `{ appointments_per_hour: number }`

**Response**: Datos actualizados

### GET `/api/staff-schedules`

Obtener todas las excepciones de personal

**Response**: Array de excepciones

### POST `/api/staff-schedules`

Crear nueva excepción (solo admin)

**Body**:

```json
{
  "day_of_week": 3,
  "start_time": "09:00",
  "end_time": "18:00",
  "staff_count": 2,
  "appointments_per_hour": 2
}
```

### PUT `/api/staff-schedules/[id]`

Actualizar excepción (solo admin)

**Body**: Mismo que POST

### DELETE `/api/staff-schedules/[id]`

Eliminar excepción (solo admin)

---

## ⚙️ Lógica de Disponibilidad Actualizada

### Algoritmo actual (citas por servicio)

```
Para cada slot de 30 minutos:
  1. ¿Hay overlap con otra cita? → NO disponible
  2. ¿Es día cerrado? → NO disponible
  3. ¿Es tiempo bloqueado? → NO disponible
  Resultado: Disponible o NO
```

### Algoritmo nuevo (cupos por hora)

```
Para cada slot de 30 minutos:
  1. ¿Es día cerrado? → NO disponible
  2. ¿Es tiempo bloqueado? → NO disponible
  3. Obtener capacidad para esta hora:
     - Si hay staff_schedule para (día, hora) → usar ese
     - Si no → usar default_capacity
  4. Contar citas en esta hora
  5. ¿Cupo < Capacidad? → Disponible
     ¿Cupo ≥ Capacidad? → NO disponible
  Resultado: Disponible o NO
```

**Cambio clave**: De "overlap" a "conteo de cupos"

---

## 🔄 Flujo de Implementación

### Fase 1: Base de Datos ✅

- [ ] Crear migración `20251025000004_capacity_management.sql`
- [ ] Crear tablas + índices + triggers + RLS
- [ ] Insertar default_capacity inicial

### Fase 2: API Backend

- [ ] GET/PUT `/api/default-capacity`
- [ ] GET/POST/PUT/DELETE `/api/staff-schedules`
- [ ] Actualizar lógica en `/api/slots/available.ts`
- [ ] Agregar types en `supabase.ts`

### Fase 3: Frontend Admin

- [ ] Crear componente `StaffScheduling.tsx`
- [ ] Agregar pestaña en `BusinessSettings.tsx`
- [ ] Integrar en `/admin/ajustes.astro`

### Fase 4: Testing & Deploy

- [ ] Testing manual de todos los casos
- [ ] Verificar backward compatibility
- [ ] Deploy gradual

---

## 🛡️ Consideraciones de Seguridad

1. **Acceso**: Solo admins pueden modificar
2. **Validación**: Constraints DB para integridad
3. **Índices**: Búsquedas rápidas, sin N+1
4. **RLS**: Lectura pública, escritura admin
5. **Atomicidad**: Una transacción = consistencia garantizada

---

## 📈 Performance

| Operación              | Complejidad | Notas                                 |
| ---------------------- | ----------- | ------------------------------------- |
| GET capacity para slot | O(1)        | Índice en (day, time)                 |
| Contar citas/hora      | O(n)        | n = citas en esa hora (típ. 1-3)      |
| Crear excepción        | O(1)        | Constraint unique previene duplicados |
| Cambiar default        | O(1)        | Singleton, una actualización          |

---

## 🔄 Backwards Compatibility

- **Sin cambios**: Todas las tablas actuales siguen funcionando igual
- **Opcionalmente**: Si no hay `staff_schedules`, usa `default_capacity`
- **Migración safe**: Insertar `default_capacity: 1` no cambia comportamiento actual
- **Rollback fácil**: Simplemente ignorar nuevas tablas

---

## 📝 Notas Técnicas

### Por qué `appointments_per_hour` no en `business_hours`?

- `business_hours` es horarios de operación (cuándo abre/cierra)
- `staff_schedules` es disponibilidad de staff (cuántos pueden atender)
- Separación de responsabilidades

### Por qué singleton en `default_capacity`?

- Simplifica lógica (siempre hay exactamente 1)
- Evita JOIN complicados
- Mejor performance

### Por qué unique constraint en `staff_schedules`?

- Previene duplicados (ej: 2 records para miércoles 09:00-18:00)
- Base de datos valida automáticamente
- DB es fuente de verdad

---

## 🚀 Próximas Fases (Futuro)

### Fase 5: Asignación de Personal

- Crear tabla `staff_members` (trabajadores)
- Crear tabla `staff_assignments` (quién trabaja cuándo)
- UI para asignar personal a horas

### Fase 6: Reportes

- Gráficos de utilización (% cupo usado)
- Predicción de demanda
- Análisis de tendencias

### Fase 7: Integraciones

- Sincronizar con Google Calendar
- Notificaciones cuando cupo lleno
- Waitlist cuando no hay disponibilidad

---

## 📞 FAQ

**P: ¿Qué pasa si cambio default_capacity a 2 a mitad de día?**
A: Solo afecta a nuevos slots buscados. Citas existentes no se ven afectadas.

**P: ¿Puedo tener excepciones que se solapan?**
A: El constraint UNIQUE lo previene. Debes eliminar la antigua antes de crear una superpuesta.

**P: ¿Y si quiero 2 personas solo 14:00-16:00?**
A: Creas una exception con `day_of_week: 1, start_time: '14:00', end_time: '16:00', appointments_per_hour: 2`

**P: ¿Cuál es el máximo de appointments_per_hour?**
A: No hay límite DB. Límite práctico depende de tu negocio (ej: 10).

**P: ¿Necesito cambiar algo en la app actual?**
A: No. La implementación es completamente backwards compatible.

---

**Última actualización**: 25 de octubre de 2025
**Estado**: Planificación completada, listo para implementación
