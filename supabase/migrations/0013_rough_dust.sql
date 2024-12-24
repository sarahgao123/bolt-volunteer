/*
  # Fix volunteer names handling

  1. Changes
    - Update process_initial_volunteers function to handle names
    - Update slot_details view to properly show volunteer names
*/

-- Update the process_initial_volunteers function to handle names
CREATE OR REPLACE FUNCTION process_initial_volunteers()
RETURNS trigger AS $$
BEGIN
  -- Insert position_volunteers entries for each initial volunteer
  INSERT INTO position_volunteers (slot_id, user_id, checked_in, name)
  SELECT 
    NEW.id,
    p.id,
    false,
    iv.name
  FROM initial_volunteers iv
  JOIN profiles p ON LOWER(p.email) = LOWER(iv.email)
  WHERE iv.slot_id = NEW.id;

  -- Clean up processed initial volunteers
  DELETE FROM initial_volunteers WHERE slot_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the slot_details view to properly show names
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