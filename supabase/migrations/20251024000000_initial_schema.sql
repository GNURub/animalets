-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Función auxiliar para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABLA: profiles
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

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: pets
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

CREATE INDEX idx_pets_owner_id ON pets(owner_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: services
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

CREATE INDEX idx_services_is_active ON services(is_active);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: appointments
CREATE TYPE appointment_status AS ENUM (
  'pending',
  'in_bath',
  'drying',
  'grooming',
  'completed',
  'cancelled',
  'no_show'
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
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT no_overlapping_appointments EXCLUDE USING GIST (
    pet_id WITH =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp
    ) WITH &&
  ) WHERE (status != 'cancelled' AND status != 'no_show')
);

CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_status ON appointments(date, status);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- TABLA: business_hours
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);

-- TABLA: blocked_times
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_times_date ON blocked_times(date);

-- Vista de citas completas
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
  
  c.id AS client_id,
  c.full_name AS client_name,
  c.email AS client_email,
  c.phone AS client_phone,
  
  p.id AS pet_id,
  p.name AS pet_name,
  p.breed AS pet_breed,
  p.size AS pet_size,
  
  s.id AS service_id,
  s.name AS service_name,
  s.duration_minutes,
  s.price
  
FROM appointments a
JOIN profiles c ON a.client_id = c.id
JOIN pets p ON a.pet_id = p.id
JOIN services s ON a.service_id = s.id;

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Datos de ejemplo: horarios de negocio
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '00:00', '00:00', TRUE),   -- Domingo cerrado
  (1, '09:00', '18:00', FALSE),  -- Lunes
  (2, '09:00', '18:00', FALSE),  -- Martes
  (3, '09:00', '18:00', FALSE),  -- Miércoles
  (4, '09:00', '18:00', FALSE),  -- Jueves
  (5, '09:00', '18:00', FALSE),  -- Viernes
  (6, '09:00', '14:00', FALSE);  -- Sábado

-- Datos de ejemplo: servicios
INSERT INTO services (name, description, duration_minutes, price) VALUES
  ('Baño', 'Baño con champú específico, acondicionador y secado', 60, 35.00),
  ('Corte Completo', 'Corte de pelo, baño, secado y peinado', 60, 45.00),
  ('Deslanado', 'Eliminación de pelo muerto, ideal para mudas', 60, 30.00);
