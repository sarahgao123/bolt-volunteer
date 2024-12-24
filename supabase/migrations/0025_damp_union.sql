/*
  # Fix Volunteer Management System

  1. Changes
    - Drop existing views and triggers
    - Recreate views with consistent types
    - Update volunteer processing function
    - Add proper indexes

  2. Security
    - Maintain RLS policies
    - Ensure proper cascading
*/

-- First drop existing views and triggers
DROP VIEW IF EXISTS slot_details CASCADE;
DROP VIEW IF EXISTS position_details CASCADE;
DROP TRIGGER IF EXISTS on_slot_created ON position_slots CASCADE;
DROP FUNCTION IF EXISTS process_slot_volunteers() CASCADE;

-- Create improved slot volunteer processing function
CREATE OR REPLACE FUNCTION process_slot_volunteers()
RETURNS trigger AS $$
BEGIN
  -- If volunteers are provided in the NEW record
  IF NEW.volunteers IS NOT NULL THEN
    -- Insert or update volunteers
    WITH volunteer_data AS (
      SELECT * FROM json_populate_recordset(
        NULL::record,
        NEW.volunteers::json
      ) AS x(email text, name text)
    )
    INSERT INTO volunteers (email, name)
    SELECT 
      LOWER(email),
      name
    FROM volunteer_data
    ON CONFLICT (email) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, volunteers.name);

    -- Create slot_volunteer entries
    INSERT INTO slot_volunteers (slot_id, volunteer_id)
    SELECT 
      NEW.id,
      v.id
    FROM json_populate_recordset(
      NULL::record,
      NEW.volunteers::json
    ) AS x(email text)
    JOIN volunteers v ON LOWER(v.email) = LOWER(x.email)
    ON CONFLICT (slot_id, volunteer_id) DO NOTHING;

    -- Clear the volunteers JSON after processing
    NEW.volunteers = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for processing volunteers
CREATE TRIGGER process_slot_volunteers_trigger
  BEFORE INSERT OR UPDATE ON position_slots
  FOR EACH ROW
  EXECUTE FUNCTION process_slot_volunteers();

-- Recreate views with consistent types
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_slot_volunteers_slot ON slot_volunteers(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_volunteers_volunteer ON slot_volunteers(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_positions_event_id ON positions(event_id);
CREATE INDEX IF NOT EXISTS idx_position_slots_position_id ON position_slots(position_id);