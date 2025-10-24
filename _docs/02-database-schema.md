# Esquema de Base de Datos - Animalets

**Fecha**: 24 de octubre de 2025  
**Motor**: PostgreSQL (Supabase)

---

## 📊 Diagrama de Entidad-Relación

```
┌─────────────────┐
│    profiles     │
├─────────────────┤
│ id (PK, FK)     │──┐
│ email           │  │
│ full_name       │  │
│ phone           │  │
│ role            │  │
│ created_at      │  │
└─────────────────┘  │
                     │
                     │ 1:N
                     │
                     ├──────────────────────────┐
                     │                          │
                     ▼                          ▼
              ┌─────────────────┐      ┌──────────────────┐
              │      pets       │      │  appointments    │
              ├─────────────────┤      ├──────────────────┤
              │ id (PK)         │──┐   │ id (PK)          │
              │ owner_id (FK)   │  │   │ client_id (FK)   │
              │ name            │  │   │ pet_id (FK)      │
              │ breed           │  │   │ service_id (FK)  │
              │ size            │  │   │ date             │
              │ notes           │  │   │ start_time       │
              │ created_at      │  │   │ end_time         │
              └─────────────────┘  │   │ status           │
                                   │   │ final_photo_url  │
                                   │   │ notes            │
                              N:1  │   │ created_at       │
                                   │   └──────────────────┘
                                   │            │
                                   │            │ N:1
                                   │            │
                                   └────────────┼───────────┐
                                                │           │
                                                ▼           ▼
                                        ┌──────────────────┐
                                        │    services      │
                                        ├──────────────────┤
                                        │ id (PK)          │
                                        │ name             │
                                        │ description      │
                                        │ duration_minutes │
                                        │ price            │
                                        │ is_active        │
                                        │ created_at       │
                                        └──────────────────┘

┌────────────────────┐         ┌────────────────────┐
│  business_hours    │         │   blocked_times    │
├────────────────────┤         ├────────────────────┤
│ id (PK)            │         │ id (PK)            │
│ day_of_week        │         │ date               │
│ open_time          │         │ start_time         │
│ close_time         │         │ end_time           │
│ is_closed          │         │ reason             │
│ created_at         │         │ created_at         │
└────────────────────┘         └────────────────────┘
```

---

## 🗃️ Tablas

### 1. `profiles`

Extiende la tabla `auth.users` de Supabase con información adicional del usuario.

```sql
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

-- Índices
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger para actualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Columnas**:

- `id`: UUID del usuario (FK a `auth.users`)
- `email`: Email del usuario
- `full_name`: Nombre completo
- `phone`: Teléfono de contacto
- `role`: `'client'` o `'admin'`
- `avatar_url`: URL del avatar (opcional)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

---

### 2. `pets`

Almacena las mascotas de los clientes.

```sql
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

-- Índices
CREATE INDEX idx_pets_owner_id ON pets(owner_id);

-- Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Columnas**:

- `id`: UUID único de la mascota
- `owner_id`: FK al dueño (`profiles.id`)
- `name`: Nombre de la mascota
- `breed`: Raza
- `size`: `'pequeño'`, `'mediano'`, `'grande'`
- `weight_kg`: Peso en kg
- `birth_date`: Fecha de nacimiento
- `gender`: `'macho'` o `'hembra'`
- `notes`: Notas especiales (ej: "miedoso", "agresivo")
- `photo_url`: URL de la foto

---

### 3. `services`

Catálogo de servicios ofrecidos.

```sql
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

-- Índices
CREATE INDEX idx_services_is_active ON services(is_active);

-- Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Columnas**:

- `id`: UUID del servicio
- `name`: Nombre (ej: "Baño Completo", "Corte y Peinado")
- `description`: Descripción del servicio
- `duration_minutes`: Duración en minutos (60, 90, 120)
- `price`: Precio en euros
- `is_active`: Si el servicio está activo

**Datos de Ejemplo**:

```sql
INSERT INTO services (name, description, duration_minutes, price) VALUES
  ('Baño Básico', 'Baño con champú neutro y secado', 60, 25.00),
  ('Baño Premium', 'Baño con champú específico, acondicionador y secado', 75, 35.00),
  ('Corte Completo', 'Corte de pelo, baño, secado y peinado', 90, 45.00),
  ('Corte Tijera', 'Corte artístico con tijera, incluye baño', 120, 60.00),
  ('Deslanado', 'Eliminación de pelo muerto, ideal para mudas', 60, 30.00);
```

---

### 4. `appointments`

Citas de los clientes. Esta es la tabla central del negocio.

```sql
CREATE TYPE appointment_status AS ENUM (
  'pending',      -- Pendiente (reservada pero no iniciada)
  'in_bath',      -- En baño
  'drying',       -- Secando
  'grooming',     -- Peinado/Corte
  'completed',    -- Completada
  'cancelled',    -- Cancelada
  'no_show'       -- Cliente no se presentó
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
  admin_notes TEXT,  -- Notas privadas para el admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: una mascota no puede tener dos citas al mismo tiempo
  CONSTRAINT no_overlapping_appointments EXCLUDE USING GIST (
    pet_id WITH =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp
    ) WITH &&
  ) WHERE (status != 'cancelled' AND status != 'no_show')
);

-- Índices
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_status ON appointments(date, status);

-- Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Columnas**:

- `id`: UUID de la cita
- `client_id`: FK al cliente
- `pet_id`: FK a la mascota
- `service_id`: FK al servicio
- `date`: Fecha de la cita
- `start_time`: Hora de inicio
- `end_time`: Hora de fin
- `status`: Estado actual de la cita
- `final_photo_url`: URL de la foto final (cuando esté listo)
- `notes`: Notas del cliente al reservar
- `admin_notes`: Notas privadas del admin

**Estados de Cita**:

```
pending → in_bath → drying → grooming → completed
                                     ↘
                                    cancelled
                                    no_show
```

---

### 5. `business_hours`

Define el horario de apertura por día de la semana.

```sql
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Solo puede haber un registro por día
  CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);
```

**Columnas**:

- `day_of_week`: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
- `open_time`: Hora de apertura (ej: '09:00')
- `close_time`: Hora de cierre (ej: '18:00')
- `is_closed`: Si ese día está cerrado

**Datos de Ejemplo**:

```sql
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '00:00', '00:00', TRUE),   -- Domingo cerrado
  (1, '09:00', '18:00', FALSE),  -- Lunes
  (2, '09:00', '18:00', FALSE),  -- Martes
  (3, '09:00', '18:00', FALSE),  -- Miércoles
  (4, '09:00', '18:00', FALSE),  -- Jueves
  (5, '09:00', '18:00', FALSE),  -- Viernes
  (6, '09:00', '14:00', FALSE);  -- Sábado (media jornada)
```

---

### 6. `blocked_times`

Bloqueos de horario (vacaciones, eventos, mantenimiento, etc.).

```sql
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_blocked_times_date ON blocked_times(date);
```

**Columnas**:

- `date`: Fecha del bloqueo
- `start_time`: Hora de inicio del bloqueo
- `end_time`: Hora de fin del bloqueo
- `reason`: Motivo del bloqueo
- `created_by`: Admin que creó el bloqueo

**Ejemplo**:

```sql
-- Bloquear todo el día de Navidad
INSERT INTO blocked_times (date, start_time, end_time, reason) VALUES
  ('2025-12-25', '00:00', '23:59', 'Navidad - Cerrado');

-- Bloquear la tarde del viernes
INSERT INTO blocked_times (date, start_time, end_time, reason) VALUES
  ('2025-11-15', '14:00', '18:00', 'Evento especial');
```

---

## 🔐 Row Level Security (RLS)

Supabase utiliza **Row Level Security** de PostgreSQL para controlar el acceso a los datos a nivel de fila.

### Habilitar RLS en todas las tablas

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
```

---

### Políticas RLS por Tabla

#### `profiles`

```sql
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### `pets`

```sql
-- Los dueños pueden ver sus propias mascotas
CREATE POLICY "Owners can view own pets"
  ON pets FOR SELECT
  USING (auth.uid() = owner_id);

-- Los dueños pueden crear sus propias mascotas
CREATE POLICY "Owners can create own pets"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Los dueños pueden actualizar sus propias mascotas
CREATE POLICY "Owners can update own pets"
  ON pets FOR UPDATE
  USING (auth.uid() = owner_id);

-- Los dueños pueden eliminar sus propias mascotas
CREATE POLICY "Owners can delete own pets"
  ON pets FOR DELETE
  USING (auth.uid() = owner_id);

-- Los admins pueden ver todas las mascotas
CREATE POLICY "Admins can view all pets"
  ON pets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden actualizar todas las mascotas
CREATE POLICY "Admins can update all pets"
  ON pets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### `services`

```sql
-- Todos pueden ver los servicios activos (sin autenticación)
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = TRUE);

-- Los admins pueden gestionar servicios
CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### `appointments`

```sql
-- Los clientes pueden ver sus propias citas
CREATE POLICY "Clients can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = client_id);

-- Los clientes pueden crear sus propias citas
CREATE POLICY "Clients can create own appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND status = 'pending'  -- Solo pueden crear citas pendientes
  );

-- Los clientes pueden cancelar sus propias citas pendientes
CREATE POLICY "Clients can cancel own pending appointments"
  ON appointments FOR UPDATE
  USING (
    auth.uid() = client_id
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'  -- Solo pueden cambiar a cancelado
  );

-- Los admins pueden ver todas las citas
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden gestionar todas las citas
CREATE POLICY "Admins can manage all appointments"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### `business_hours`

```sql
-- Todos pueden ver el horario (sin autenticación)
CREATE POLICY "Anyone can view business hours"
  ON business_hours FOR SELECT
  USING (TRUE);

-- Solo los admins pueden modificar el horario
CREATE POLICY "Admins can manage business hours"
  ON business_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

#### `blocked_times`

```sql
-- Todos pueden ver los bloqueos (para calcular disponibilidad)
CREATE POLICY "Anyone can view blocked times"
  ON blocked_times FOR SELECT
  USING (TRUE);

-- Solo los admins pueden gestionar bloqueos
CREATE POLICY "Admins can manage blocked times"
  ON blocked_times FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 🔧 Funciones Auxiliares

### Función para actualizar `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Función para crear perfil al registrarse

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 📈 Vistas Útiles

### Vista de citas con información completa

```sql
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

  -- Cliente
  c.id AS client_id,
  c.full_name AS client_name,
  c.email AS client_email,
  c.phone AS client_phone,

  -- Mascota
  p.id AS pet_id,
  p.name AS pet_name,
  p.breed AS pet_breed,
  p.size AS pet_size,

  -- Servicio
  s.id AS service_id,
  s.name AS service_name,
  s.duration_minutes,
  s.price

FROM appointments a
JOIN profiles c ON a.client_id = c.id
JOIN pets p ON a.pet_id = p.id
JOIN services s ON a.service_id = s.id;
```

---

## 🗂️ Migración Completa

Archivo: `supabase/migrations/20251024000000_initial_schema.sql`

```sql
-- Ver el archivo completo en el repositorio
```

---

## 📝 Notas de Implementación

### 1. Índices

Todos los campos usados en `WHERE`, `JOIN` y `ORDER BY` tienen índices para optimizar las consultas.

### 2. Constraints

- **Foreign Keys**: Garantizan integridad referencial
- **Check Constraints**: Validan valores permitidos
- **Unique Constraints**: Evitan duplicados
- **Exclusion Constraints**: Evitan solapamiento de citas

### 3. Tipos de Datos

- **UUID**: Para IDs (más seguros que integers)
- **TIMESTAMP WITH TIME ZONE**: Para fechas/horas
- **ENUM**: Para estados de cita
- **DECIMAL**: Para precios y pesos

### 4. Cascadas

- `ON DELETE CASCADE`: En `profiles` → `pets` (si se elimina usuario, se eliminan mascotas)
- `ON DELETE RESTRICT`: En citas (no se puede eliminar cliente/mascota/servicio con citas)

---

## 🔍 Consultas de Ejemplo

### Obtener citas de hoy con información completa

```sql
SELECT * FROM appointments_full
WHERE date = CURRENT_DATE
ORDER BY start_time;
```

### Obtener slots disponibles (simplificado)

```sql
-- Esta lógica compleja se implementará en la Edge Function
SELECT DISTINCT start_time
FROM generate_series(
  '09:00'::time,
  '18:00'::time,
  '15 minutes'::interval
) AS start_time
WHERE NOT EXISTS (
  SELECT 1 FROM appointments
  WHERE date = '2025-10-25'
  AND status NOT IN ('cancelled', 'no_show')
  AND (
    start_time <= start_time::time
    AND end_time > start_time::time
  )
);
```

### Obtener próximas citas de un cliente

```sql
SELECT * FROM appointments_full
WHERE client_id = 'uuid-del-cliente'
AND date >= CURRENT_DATE
ORDER BY date, start_time
LIMIT 5;
```

---

**Última Actualización**: 24 de octubre de 2025
