/*
  # Fix Volunteer Management System

  1. Changes
    - Drop existing triggers and functions in correct order
    - Recreate volunteer processing function
    - Add trigger for volunteer processing
    - Update check-in function

  2. Security
    - Maintain SECURITY DEFINER for proper permissions
    - Ensure proper cascading of operations
*/

-- First drop the trigger to remove dependencies
DROP TRIGGER IF EXISTS on_slot_created ON position_slots CASCADE;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS process_slot_volunteers() CASCADE;
DROP FUNCTION IF EXISTS check_in_volunteer(uuid, text, text) CASCADE;

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
CREATE TRIGGER on_slot_created
  AFTER INSERT OR UPDATE ON position_slots
  FOR EACH ROW
  EXECUTE FUNCTION process_slot_volunteers();

-- Create new check-in function
CREATE OR REPLACE FUNCTION check_in_volunteer(
  p_slot_id uuid,
  p_email text,
  p_name text
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
  WHERE 
    slot_id = p_slot_id AND 
    volunteer_id = v_volunteer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Volunteer not registered for this slot';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;