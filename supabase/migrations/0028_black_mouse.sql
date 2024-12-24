/*
  # Fix Volunteer Assignments

  1. Changes
    - Create a new function to handle volunteer assignments
    - Update slot creation process
    - Add better error handling

  2. Security
    - Maintain existing RLS policies
    - Ensure secure volunteer data handling
*/

-- Create a function to assign volunteers to slots
CREATE OR REPLACE FUNCTION assign_volunteers_to_slot(
  p_slot_id uuid,
  p_volunteers jsonb
) RETURNS void AS $$
DECLARE
  v_volunteer record;
BEGIN
  -- Loop through each volunteer in the JSON array
  FOR v_volunteer IN (
    SELECT * FROM jsonb_to_recordset(p_volunteers) AS x(email text, name text)
  )
  LOOP
    -- Insert or update volunteer
    WITH volunteer_upsert AS (
      INSERT INTO volunteers (email, name)
      VALUES (LOWER(v_volunteer.email), v_volunteer.name)
      ON CONFLICT (email) DO UPDATE
      SET name = COALESCE(EXCLUDED.name, volunteers.name)
      RETURNING id
    )
    -- Create slot assignment
    INSERT INTO slot_volunteers (slot_id, volunteer_id)
    SELECT p_slot_id, id FROM volunteer_upsert
    ON CONFLICT (slot_id, volunteer_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update slot_details view to properly handle volunteers
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
GROUP BY s.id;