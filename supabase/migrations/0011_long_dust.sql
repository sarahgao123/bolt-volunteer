/*
  # Add volunteer name field

  1. Changes
    - Add name column to position_volunteers table
    - Update slot_details view to include volunteer names
*/

-- Add name column to position_volunteers
ALTER TABLE position_volunteers
ADD COLUMN name text;

-- Update slot_details view to include names
CREATE OR REPLACE VIEW slot_details AS
SELECT 
  s.*,
  COALESCE(
    json_agg(
      json_build_object(
        'user', json_build_object(
          'id', pr.id,
          'email', pr.email,
          'created_at', pr.created_at
        ),
        'checked_in', pv.checked_in,
        'name', pv.name
      )
    ) FILTER (WHERE pr.id IS NOT NULL),
    '[]'::json
  ) as volunteers,
  COUNT(pv.user_id) FILTER (WHERE pv.checked_in = true) as volunteers_checked_in
FROM position_slots s
LEFT JOIN position_volunteers pv ON s.id = pv.slot_id
LEFT JOIN profiles pr ON pv.user_id = pr.id
GROUP BY s.id;