/*
  # Improve volunteer management

  1. Changes
    - Migrate existing volunteer data to new schema
    - Update triggers and functions
    - Clean up old volunteer data

  2. Benefits
    - Simpler volunteer management
    - No auth dependency for volunteers
    - Better data consistency
    - Improved query performance
*/

-- Migrate existing volunteer data
INSERT INTO volunteers (email, name)
SELECT DISTINCT 
  LOWER(pr.email),
  pv.name
FROM position_volunteers pv
JOIN profiles pr ON pr.id = pv.user_id
ON CONFLICT (email) DO UPDATE
SET name = COALESCE(EXCLUDED.name, volunteers.name);

-- Migrate slot assignments
INSERT INTO slot_volunteers (slot_id, volunteer_id, checked_in)
SELECT 
  pv.slot_id,
  v.id,
  pv.checked_in
FROM position_volunteers pv
JOIN profiles pr ON pr.id = pv.user_id
JOIN volunteers v ON LOWER(v.email) = LOWER(pr.email)
ON CONFLICT (slot_id, volunteer_id) DO NOTHING;

-- Drop old tables and views
DROP VIEW IF EXISTS slot_details CASCADE;
DROP TABLE IF EXISTS position_volunteers CASCADE;
DROP TABLE IF EXISTS initial_volunteers CASCADE;

-- Update process_initial_volunteers function to use new schema
CREATE OR REPLACE FUNCTION process_initial_volunteers()
RETURNS trigger AS $$
BEGIN
  -- Use the assign_slot_volunteer function for each volunteer
  INSERT INTO volunteers (email, name)
  SELECT DISTINCT 
    LOWER(email),
    name
  FROM json_to_recordset(NEW.volunteers::json) AS x(email text, name text)
  ON CONFLICT (email) DO UPDATE
  SET name = COALESCE(EXCLUDED.name, volunteers.name);

  INSERT INTO slot_volunteers (slot_id, volunteer_id)
  SELECT 
    NEW.id,
    v.id
  FROM json_to_recordset(NEW.volunteers::json) AS x(email text)
  JOIN volunteers v ON LOWER(v.email) = LOWER(x.email)
  ON CONFLICT (slot_id, volunteer_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add check-in function
CREATE OR REPLACE FUNCTION check_in_volunteer(
  p_slot_id uuid,
  p_email text,
  p_name text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_volunteer_id uuid;
BEGIN
  -- Get or update volunteer
  INSERT INTO volunteers (email, name)
  VALUES (LOWER(p_email), p_name)
  ON CONFLICT (email) DO UPDATE
  SET name = COALESCE(EXCLUDED.name, volunteers.name)
  RETURNING id INTO v_volunteer_id;

  -- Update check-in status
  UPDATE slot_volunteers
  SET 
    checked_in = true,
    check_in_time = CURRENT_TIMESTAMP
  WHERE slot_id = p_slot_id
    AND volunteer_id = v_volunteer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;