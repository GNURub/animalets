-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS PARA PROFILES
-- ============================================================

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

-- ============================================================
-- POLÍTICAS PARA PETS
-- ============================================================

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

-- ============================================================
-- POLÍTICAS PARA SERVICES
-- ============================================================

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

-- ============================================================
-- POLÍTICAS PARA APPOINTMENTS
-- ============================================================

-- Los clientes pueden ver sus propias citas
CREATE POLICY "Clients can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = client_id);

-- Los clientes pueden crear sus propias citas
CREATE POLICY "Clients can create own appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND status = 'pending'
  );

-- Los clientes pueden cancelar sus propias citas pendientes
CREATE POLICY "Clients can cancel own pending appointments"
  ON appointments FOR UPDATE
  USING (
    auth.uid() = client_id
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
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

-- ============================================================
-- POLÍTICAS PARA BUSINESS_HOURS
-- ============================================================

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

-- ============================================================
-- POLÍTICAS PARA BLOCKED_TIMES
-- ============================================================

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
