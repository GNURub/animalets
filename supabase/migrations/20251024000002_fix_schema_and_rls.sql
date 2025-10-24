-- Migración para corregir el esquema y las políticas RLS

-- ============================================================
-- 1. AGREGAR COLUMNA SPECIES A PETS
-- ============================================================
ALTER TABLE pets ADD COLUMN IF NOT EXISTS species TEXT NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'other'));

-- Actualizar valores existentes si los hay
UPDATE pets SET species = 'dog' WHERE species IS NULL;

-- ============================================================
-- 2. CORREGIR POLÍTICAS RLS DE PROFILES (evitar recursión)
-- ============================================================

-- Eliminar las políticas problemáticas que causan recursión infinita
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recrear políticas de admin sin recursión
-- La clave es usar una subconsulta en USING que se evalúa una sola vez
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    -- Un usuario puede ver su propio perfil o es admin
    auth.uid() = id OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    -- Un usuario puede actualizar su propio perfil o es admin
    auth.uid() = id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 3. CORREGIR POLÍTICAS RLS DE OTRAS TABLAS
-- ============================================================

-- PETS: Corregir políticas de admin
DROP POLICY IF EXISTS "Admins can view all pets" ON pets;
DROP POLICY IF EXISTS "Admins can update all pets" ON pets;

CREATE POLICY "Admins can view all pets"
  ON pets FOR SELECT
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all pets"
  ON pets FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- SERVICES: Corregir política de admin
DROP POLICY IF EXISTS "Admins can manage services" ON services;

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- APPOINTMENTS: Corregir políticas de admin
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;

CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    auth.uid() = client_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage all appointments"
  ON appointments FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- BUSINESS_HOURS: Corregir política de admin
DROP POLICY IF EXISTS "Admins can manage business hours" ON business_hours;

CREATE POLICY "Admins can manage business hours"
  ON business_hours FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- BLOCKED_TIMES: Corregir política de admin
DROP POLICY IF EXISTS "Admins can manage blocked times" ON blocked_times;

CREATE POLICY "Admins can manage blocked times"
  ON blocked_times FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 4. AGREGAR ÍNDICE PARA MEJORAR PERFORMANCE DE BÚSQUEDAS DE ROLE
-- ============================================================
-- Ya existe: CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- 5. ACTUALIZAR COLUMNAS DE APPOINTMENTS PARA USAR NOMBRES CORRECTOS
-- ============================================================
-- Cambiar 'date' a 'scheduled_date' y agregar 'scheduled_time'
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'scheduled_date') THEN
    ALTER TABLE appointments RENAME COLUMN date TO scheduled_date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'scheduled_time') THEN
    ALTER TABLE appointments RENAME COLUMN start_time TO scheduled_time;
  END IF;
END $$;

-- Comentario: La tabla ahora tiene scheduled_date, scheduled_time y end_time
COMMENT ON COLUMN appointments.scheduled_date IS 'Fecha de la cita';
COMMENT ON COLUMN appointments.scheduled_time IS 'Hora de inicio de la cita';
COMMENT ON COLUMN appointments.end_time IS 'Hora de fin de la cita';
