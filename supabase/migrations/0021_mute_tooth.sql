/*
  # Fix Database Schema

  1. Changes
    - Drop and recreate views in correct order
    - Drop existing policies before recreating them
    - Ensure all required tables exist
    - Add proper indexes
    - Update RLS policies

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- Drop existing views to avoid conflicts
DROP VIEW IF EXISTS slot_details CASCADE;
DROP VIEW IF EXISTS position_details CASCADE;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view volunteers" ON volunteers;
DROP POLICY IF EXISTS "Event owners can manage volunteers" ON volunteers;
DROP POLICY IF EXISTS "Anyone can view slot volunteers" ON slot_volunteers;
DROP POLICY IF EXISTS "Event owners can manage slot volunteers" ON slot_volunteers;

-- Create base tables if they don't exist
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slot_volunteers (
  slot_id uuid REFERENCES position_slots ON DELETE CASCADE,
  volunteer_id uuid REFERENCES volunteers ON DELETE CASCADE,
  checked_in boolean NOT NULL DEFAULT false,
  check_in_time timestamptz,
  PRIMARY KEY (slot_id, volunteer_id)
);

-- Enable RLS
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_volunteers ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Anyone can view volunteers"
  ON volunteers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event owners can manage volunteers"
  ON volunteers FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view slot volunteers"
  ON slot_volunteers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event owners can manage slot volunteers"
  ON slot_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM position_slots ps
      JOIN positions p ON p.id = ps.position_id
      JOIN events e ON e.id = p.event_id
      WHERE ps.id = slot_volunteers.slot_id
      AND e.user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_slot_volunteers_slot ON slot_volunteers(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_volunteers_volunteer ON slot_volunteers(volunteer_id);

-- Create views
CREATE VIEW slot_details AS
SELECT 
  s.*,
  COALESCE(
    json_agg(
      json_build_object(
        'user', json_build_object(
          'id', v.id,
          'email', v.email,
          'created_at', v.created_at
        ),
        'checked_in', sv.checked_in,
        'name', v.name
      )
      ORDER BY v.email
    ) FILTER (WHERE v.id IS NOT NULL),
    '[]'::json
  ) as volunteers,
  COUNT(sv.volunteer_id) FILTER (WHERE sv.checked_in = true) as volunteers_checked_in
FROM position_slots s
LEFT JOIN slot_volunteers sv ON s.id = sv.slot_id
LEFT JOIN volunteers v ON sv.volunteer_id = v.id
GROUP BY s.id;

CREATE VIEW position_details AS
SELECT 
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'user', json_build_object(
          'id', v.id,
          'email', v.email,
          'created_at', v.created_at
        ),
        'checked_in', sv.checked_in,
        'name', v.name
      )
      ORDER BY v.email
    ) FILTER (WHERE v.id IS NOT NULL),
    '[]'::json
  ) as volunteers
FROM positions p
LEFT JOIN position_slots ps ON p.id = ps.position_id
LEFT JOIN slot_volunteers sv ON ps.id = sv.slot_id
LEFT JOIN volunteers v ON sv.volunteer_id = v.id
GROUP BY p.id;