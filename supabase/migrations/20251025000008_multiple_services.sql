-- MIGRACIÓN: Múltiples Servicios por Cita - IDEMPOTENTE
-- Fecha: 25 de octubre de 2025
-- Descripción: Permite que una cita tenga múltiples servicios
-- Nota: Idempotente - verifica si cambios ya fueron aplicados

-- 1. Crear tabla appointment_services SI NO EXISTE
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  order_index INT NOT NULL CHECK (order_index >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_appointment_service UNIQUE(appointment_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON appointment_services(service_id);

-- 2. BLOQUE IDEMPOTENTE: Renombrar columnas SOLO SI AÚN EXISTEN
DO $$
BEGIN
  -- Verificar si columna 'date' existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'date'
  ) THEN
    -- Eliminar constraint que usa date/start_time
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments;
    
    -- Renombrar columnas
    ALTER TABLE appointments RENAME COLUMN date TO scheduled_date;
    ALTER TABLE appointments RENAME COLUMN start_time TO scheduled_time;
    
    -- Recrear constraint con nuevos nombres
    ALTER TABLE appointments ADD CONSTRAINT no_overlapping_appointments EXCLUDE USING GIST (
      pet_id WITH =,
      tsrange(
        (scheduled_date + scheduled_time)::timestamp,
        (scheduled_date + end_time)::timestamp
      ) WITH &&
    ) WHERE (status != 'cancelled' AND status != 'no_show');
    
    -- Actualizar índices
    DROP INDEX IF EXISTS idx_appointments_date;
    DROP INDEX IF EXISTS idx_appointments_date_status;
    CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
    CREATE INDEX idx_appointments_scheduled_date_status ON appointments(scheduled_date, status);
  END IF;
END $$;

-- 3. Agregar columnas SI NO EXISTEN
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_duration_minutes INT NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 3b. Remover vista dependiente si existe
DROP VIEW IF EXISTS appointments_full CASCADE;

-- 4. BLOQUE IDEMPOTENTE: Migrar datos de service_id SOLO SI EXISTE
DO $$
BEGIN
  -- Verificar si service_id aún existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'service_id'
  ) THEN
    -- Migrar datos
    INSERT INTO appointment_services (appointment_id, service_id, order_index)
    SELECT id, service_id, 0 FROM appointments
    WHERE service_id IS NOT NULL
    ON CONFLICT (appointment_id, service_id) DO NOTHING;
    
    -- Actualizar totales
    UPDATE appointments a
    SET 
      total_duration_minutes = COALESCE(
        (SELECT SUM(s.duration_minutes) 
         FROM appointment_services apms 
         JOIN services s ON s.id = apms.service_id 
         WHERE apms.appointment_id = a.id), 
        0
      ),
      total_price = COALESCE(
        (SELECT SUM(s.price) 
         FROM appointment_services apms 
         JOIN services s ON s.id = apms.service_id 
         WHERE apms.appointment_id = a.id), 
        0
      )
    WHERE EXISTS (
      SELECT 1 FROM appointment_services WHERE appointment_id = a.id
    );
    
    -- Remover service_id
    ALTER TABLE appointments DROP COLUMN service_id;
  END IF;
END $$;

-- 5. Habilitar RLS y crear policies
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Remover policies anteriores si existen
DROP POLICY IF EXISTS "Clients can view their appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Clients can create appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Clients can update appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Clients can delete appointment services if pending" ON appointment_services;
DROP POLICY IF EXISTS "Admins can manage all appointment services" ON appointment_services;

-- Crear policies nuevas
CREATE POLICY "Clients can view their appointment services"
  ON appointment_services FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create appointment services"
  ON appointment_services FOR INSERT
  WITH CHECK (
    appointment_id IN (
      SELECT id FROM appointments WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update appointment services"
  ON appointment_services FOR UPDATE
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can delete appointment services if pending"
  ON appointment_services FOR DELETE
  USING (
    appointment_id IN (
      SELECT id FROM appointments 
      WHERE client_id = auth.uid() AND status = 'pending'
    )
  );

CREATE POLICY "Admins can manage all appointment services"
  ON appointment_services
  USING (public.is_admin(auth.uid()));
