/*
  # Fix Slot Volunteers

  1. Changes
    - Drop existing trigger and function
    - Create new volunteer processing function with better error handling
    - Update views to properly show volunteer information
    - Add check-in time to volunteer display

  2. Security
    - Maintain existing RLS policies
    - Ensure secure volunteer data handling
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS process_slot_volunteers_trigger ON position_slots CASCADE;
DROP FUNCTION IF EXISTS process_slot_volunteers() CASCADE;

-- Create improved volunteer processing function
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
    SET name = COALESCE(EXCLUDED.name, volunteers.name)
    RETURNING id;

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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER process_slot_volunteers_trigger
  AFTER INSERT OR UPDATE ON position_slots
  FOR EACH ROW
  EXECUTE FUNCTION process_slot_volunteers();

-- Update slot_details view
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
        'check_in_time', sv.check_in_time,
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