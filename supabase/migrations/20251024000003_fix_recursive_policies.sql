-- Migración para eliminar completamente la recursión en las políticas RLS
-- Usamos una función SECURITY DEFINER que se ejecuta con privilegios elevados

-- ============================================================
-- 1. CREAR FUNCIÓN HELPER PARA VERIFICAR SI ES ADMIN
-- ============================================================
-- Esta función se ejecuta con SECURITY DEFINER, evitando la recursión
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- PETS
DROP POLICY IF EXISTS "Owners can view own pets" ON pets;
DROP POLICY IF EXISTS "Owners can create own pets" ON pets;
DROP POLICY IF EXISTS "Owners can update own pets" ON pets;
DROP POLICY IF EXISTS "Owners can delete own pets" ON pets;
DROP POLICY IF EXISTS "Admins can view all pets" ON pets;
DROP POLICY IF EXISTS "Admins can update all pets" ON pets;

-- SERVICES
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;

-- APPOINTMENTS
DROP POLICY IF EXISTS "Clients can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can cancel own pending appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;

-- BUSINESS_HOURS
DROP POLICY IF EXISTS "Anyone can view business hours" ON business_hours;
DROP POLICY IF EXISTS "Admins can manage business hours" ON business_hours;

-- BLOCKED_TIMES
DROP POLICY IF EXISTS "Anyone can view blocked times" ON blocked_times;
DROP POLICY IF EXISTS "Admins can manage blocked times" ON blocked_times;

-- ============================================================
-- 3. RECREAR POLÍTICAS DE PROFILES SIN RECURSIÓN
-- ============================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 4. RECREAR POLÍTICAS DE PETS SIN RECURSIÓN
-- ============================================================

CREATE POLICY "Owners can view own pets"
  ON pets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create own pets"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own pets"
  ON pets FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own pets"
  ON pets FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all pets"
  ON pets FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create pets"
  ON pets FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all pets"
  ON pets FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all pets"
  ON pets FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 5. RECREAR POLÍTICAS DE SERVICES SIN RECURSIÓN
-- ============================================================

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 6. RECREAR POLÍTICAS DE APPOINTMENTS SIN RECURSIÓN
-- ============================================================

CREATE POLICY "Clients can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create own appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND status = 'pending'
  );

CREATE POLICY "Clients can cancel own pending appointments"
  ON appointments FOR UPDATE
  USING (
    auth.uid() = client_id
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all appointments"
  ON appointments FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 7. RECREAR POLÍTICAS DE BUSINESS_HOURS SIN RECURSIÓN
-- ============================================================

CREATE POLICY "Anyone can view business hours"
  ON business_hours FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage business hours"
  ON business_hours FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 8. RECREAR POLÍTICAS DE BLOCKED_TIMES SIN RECURSIÓN
-- ============================================================

CREATE POLICY "Anyone can view blocked times"
  ON blocked_times FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage blocked times"
  ON blocked_times FOR ALL
  USING (public.is_admin(auth.uid()));
