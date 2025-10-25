-- Migración 20251025000006: Políticas RLS para admin booking (mascotas sin dueño)
-- Extiende las políticas RLS para permitir al admin crear citas sin propietario

-- ============================================================
-- 1. ACTUALIZAR POLÍTICAS DE PETS
-- ============================================================

-- Admin puede crear mascotas sin dueño (owner_id NULL)
DROP POLICY IF EXISTS "Admins can create pets without owner" ON pets;
CREATE POLICY "Admins can create pets without owner"
  ON pets FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Admin puede eliminar mascotas sin dueño
DROP POLICY IF EXISTS "Admins can delete pets without owner" ON pets;

-- ============================================================
-- 2. ACTUALIZAR POLÍTICAS DE APPOINTMENTS
-- ============================================================

-- Admin puede crear citas para cualquier mascota (incluyendo sin dueño)
DROP POLICY IF EXISTS "Admins can create appointments for any pet" ON appointments;
CREATE POLICY "Admins can create appointments for any pet"
  ON appointments FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Admin puede actualizar cualquier cita
DROP POLICY IF EXISTS "Admins can update all appointments" ON appointments;
CREATE POLICY "Admins can update all appointments"
  ON appointments FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Admin puede cancelar cualquier cita
DROP POLICY IF EXISTS "Admins can cancel any appointment" ON appointments;

-- Admin puede eliminar citas
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;
CREATE POLICY "Admins can delete appointments"
  ON appointments FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 3. NOTAS IMPORTANTES
-- ============================================================

/*
Con estas políticas:

1. PETS:
   - Owner: Solo puede ver/crear/actualizar/eliminar sus mascotas (owner_id = user_id)
   - Admin: Puede ver todas las mascotas, crear sin dueño (owner_id NULL), actualizar/eliminar cualquiera

2. APPOINTMENTS:
   - Client: Puede ver solo sus citas, crear/modificar solo las pendientes
   - Admin: Puede ver todas las citas, crear para cualquier mascota, modificar cualquier cita

3. Las mascotas sin dueño (owner_id NULL) solo pueden ser:
   - Creadas por admin
   - Vistas por admin
   - Modificadas/eliminadas por admin
   - Usadas en citas del admin

4. Las citas del admin para mascotas sin dueño:
   - client_id = admin_uuid
   - pet_id = uuid de mascota sin dueño
   - Aparecen en el calendario del admin
   - No aparecen en el perfil del cliente (porque no hay cliente)
*/
