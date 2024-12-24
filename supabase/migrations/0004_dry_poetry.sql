/*
  # Create position details view

  1. Changes
    - Create a view that joins positions with volunteers and profiles
    - Aggregate volunteer information for each position

  2. Security
    - View inherits RLS policies from underlying tables
*/

-- Create the position details view
CREATE OR REPLACE VIEW position_details AS
SELECT 
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'user', json_build_object(
          'id', pr.id,
          'email', pr.email,
          'created_at', pr.created_at
        ),
        'checked_in', pv.checked_in
      )
    ) FILTER (WHERE pr.id IS NOT NULL),
    '[]'::json
  ) as volunteers
FROM positions p
LEFT JOIN position_volunteers pv ON p.id = pv.position_id
LEFT JOIN profiles pr ON pv.user_id = pr.id
GROUP BY p.id;