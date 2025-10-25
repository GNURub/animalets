-- Migration: Add capacity management tables
-- Date: 2025-10-25
-- Description: Adds tables for managing hourly appointment capacity

-- ============================================================
-- 1. CREATE default_capacity TABLE (Singleton Pattern)
-- ============================================================

CREATE TABLE IF NOT EXISTS default_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointments_per_hour INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one record exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_default_capacity_single 
ON default_capacity((1)) WHERE id IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS set_updated_at_default_capacity
  BEFORE UPDATE ON default_capacity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default record if not exists
INSERT INTO default_capacity (appointments_per_hour)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM default_capacity);

-- ============================================================
-- 2. CREATE staff_schedules TABLE (Capacity Overrides)
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  staff_count INTEGER NOT NULL DEFAULT 1,
  appointments_per_hour INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate schedules for same day/time
  CONSTRAINT unique_staff_schedule UNIQUE (day_of_week, start_time, end_time)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_staff_schedules_day 
ON staff_schedules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_day_time 
ON staff_schedules(day_of_week, start_time, end_time);

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS set_updated_at_staff_schedules
  BEFORE UPDATE ON staff_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. CREATE VIEW: capacity_by_time
-- ============================================================
-- This view returns the effective capacity for each day/time
-- combining staff_schedules overrides with default_capacity

CREATE OR REPLACE VIEW capacity_by_time AS
-- Get schedule-specific capacities
SELECT 
  ss.day_of_week,
  ss.start_time,
  ss.end_time,
  ss.appointments_per_hour,
  ss.staff_count,
  'schedule' AS source
FROM staff_schedules ss

UNION ALL

-- Get default capacity for days without specific schedules
SELECT 
  bh.day_of_week,
  CAST('00:00' AS TIME) as start_time,
  CAST('23:59' AS TIME) as end_time,
  dc.appointments_per_hour,
  dc.appointments_per_hour as staff_count,
  'default' AS source
FROM business_hours bh
CROSS JOIN default_capacity dc
WHERE NOT EXISTS (
  SELECT 1 FROM staff_schedules ss 
  WHERE ss.day_of_week = bh.day_of_week
)

ORDER BY day_of_week, start_time;

-- ============================================================
-- 4. ENABLE RLS
-- ============================================================

ALTER TABLE default_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. CREATE RLS POLICIES
-- ============================================================

-- default_capacity policies
DROP POLICY IF EXISTS "Anyone can view default capacity" ON default_capacity;
CREATE POLICY "Anyone can view default capacity"
  ON default_capacity FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage default capacity" ON default_capacity;
CREATE POLICY "Admins can manage default capacity"
  ON default_capacity FOR ALL
  USING (public.is_admin(auth.uid()));

-- staff_schedules policies
DROP POLICY IF EXISTS "Anyone can view staff schedules" ON staff_schedules;
CREATE POLICY "Anyone can view staff schedules"
  ON staff_schedules FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage staff schedules" ON staff_schedules;
CREATE POLICY "Admins can manage staff schedules"
  ON staff_schedules FOR ALL
  USING (public.is_admin(auth.uid()));
