/*
  # Fix Volunteer Management System

  1. Changes
    - Add volunteers column to position_slots table
    - Update trigger function to handle volunteer processing
    - Ensure proper cleanup of temporary data

  2. Security
    - Maintain existing RLS policies
    - Ensure secure volunteer processing
*/

-- Add volunteers column to position_slots
ALTER TABLE position_slots
ADD COLUMN volunteers jsonb;

-- Drop existing trigger
DROP TRIGGER IF EXISTS process_slot_volunteers_trigger ON position_slots;

-- Update volunteer processing function
CREATE OR REPLACE FUNCTION process_slot_volunteers()
RETURNS trigger AS $$
BEGIN
  -- Process volunteers if provided
  IF NEW.volunteers IS NOT NULL THEN
    -- Insert or update volunteers
    WITH volunteer_data AS (
      SELECT * FROM json_populate_recordset(
        NULL::record,
        NEW.volunteers
      ) AS x(email text, name text)
    )
    INSERT INTO volunteers (email, name)
    SELECT 
      LOWER(email),
      name
    FROM volunteer_data
    ON CONFLICT (email) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, volunteers.name);

    -- Create slot assignments
    INSERT INTO slot_volunteers (slot_id, volunteer_id)
    SELECT 
      NEW.id,
      v.id
    FROM json_populate_recordset(
      NULL::record,
      NEW.volunteers
    ) AS x(email text)
    JOIN volunteers v ON LOWER(v.email) = LOWER(x.email)
    ON CONFLICT (slot_id, volunteer_id) DO NOTHING;

    -- Clear the volunteers JSON after processing
    NEW.volunteers = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER process_slot_volunteers_trigger
  BEFORE INSERT OR UPDATE ON position_slots
  FOR EACH ROW
  EXECUTE FUNCTION process_slot_volunteers();

-- Update slot_details view to exclude volunteers column
CREATE OR REPLACE VIEW slot_details AS
SELECT 
  s.id,
  s.position_id,
  s.start_time,
  s.end_time,
  s.capacity,
  s.created_at,
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
GROUP BY s.id, s.position_id, s.start_time, s.end_time, s.capacity, s.created_at;