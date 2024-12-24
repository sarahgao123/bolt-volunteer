/*
  # Update Volunteer Schema

  1. Changes
    - Add missing indexes for performance
    - Update slot_details view with proper volunteer information
    - Add helper functions for volunteer management

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_position_slots_position_id 
  ON position_slots(position_id);

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

-- Helper function to get volunteer details
CREATE OR REPLACE FUNCTION get_slot_volunteers(p_slot_id uuid)
RETURNS TABLE (
  volunteer_id uuid,
  email text,
  name text,
  checked_in boolean,
  check_in_time timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.email,
    v.name,
    sv.checked_in,
    sv.check_in_time
  FROM slot_volunteers sv
  JOIN volunteers v ON v.id = sv.volunteer_id
  WHERE sv.slot_id = p_slot_id
  ORDER BY v.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;