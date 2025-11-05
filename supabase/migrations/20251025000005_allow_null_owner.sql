-- Migración 20251025000005: Permitir mascotas sin dueño
-- Esta migración permite crear mascotas sin propietario para citas del admin (ej: reservas telefónicas)

-- Paso 1: Permitir NULL en owner_id
ALTER TABLE pets 
  ALTER COLUMN owner_id DROP NOT NULL;

-- Paso 2: Actualizar la foreign key para permitir SET NULL
ALTER TABLE pets 
  DROP CONSTRAINT "pets_owner_id_fkey";

ALTER TABLE pets 
  ADD CONSTRAINT "pets_owner_id_fkey" 
  FOREIGN KEY (owner_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- Paso 3: Crear índice para búsqueda rápida de mascotas sin dueño
CREATE INDEX idx_pets_owner_id_null ON pets(owner_id) 
  WHERE owner_id IS NULL;

-- Paso 4: Políticas RLS para admin crear mascotas sin dueño
-- (Estas serán actualizadas en la migración 20251025000006_admin_rls_policies.sql)

COMMENT ON TABLE pets IS 'Mascotas del sistema. owner_id puede ser NULL para mascotas sin dueño (creadas por admin).';
