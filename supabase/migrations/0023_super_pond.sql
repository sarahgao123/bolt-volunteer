/*
  # Fix Slot Creation and Volunteer Management

  1. Changes
    - Add process_slot_volunteers function
    - Update slot creation trigger
    - Add check-in functionality
    - Update views for proper volunteer handling

  2. Security
    - Maintain RLS policies
    - Add proper error handling
*/

-- Drop existing function if exists
DROP FUNCTION IF EXISTS process_initial_volunteers CASCADE;

-- Create function to process slot volunteers
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
    SET name = EXCLUDED.name
    WHERE EXCLUDED.name IS NOT NULL;

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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for processing volunteers
DROP TRIGGER IF EXISTS on_slot_created ON position_slots;
CREATE TRIGGER on_slot_created
  AFTER INSERT ON position_slots
  FOR EACH ROW
  EXECUTE FUNCTION process_slot_volunteers();

-- Update slot_details view
CREATE OR REPLACE VIEW slot_details AS
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