-- Migración 20251025000007: Fix - Agregar política para admin crear mascotas
-- Corrige la falta de política INSERT para admins en la tabla pets

-- Agregar política para que admin pueda crear mascotas (incluyendo sin dueño)
DROP POLICY IF EXISTS "Admins can create pets" ON pets;
CREATE POLICY "Admins can create pets"
  ON pets FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- También necesitamos permitir que admin pueda crear citas
DROP POLICY IF EXISTS "Admins can create appointments for any pet" ON appointments;
CREATE POLICY "Admins can create appointments for any pet"
  ON appointments FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
