/*
  # Add volunteer list support

  1. Changes
    - Add initial_volunteers table to store volunteer emails during slot creation
    - Add function to process initial volunteers and create position_volunteers entries
*/

-- Create table for initial volunteers
CREATE TABLE IF NOT EXISTS initial_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES position_slots ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE initial_volunteers ENABLE ROW LEVEL SECURITY;

-- Initial volunteers policies
CREATE POLICY "Event owners can manage initial volunteers"
  ON initial_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM position_slots ps
      JOIN positions p ON p.id = ps.position_id
      JOIN events e ON e.id = p.event_id
      WHERE ps.id = initial_volunteers.slot_id
      AND e.user_id = auth.uid()
    )
  );

-- Function to process initial volunteers
CREATE OR REPLACE FUNCTION process_initial_volunteers()
RETURNS trigger AS $$
BEGIN
  -- Insert position_volunteers entries for each initial volunteer
  INSERT INTO position_volunteers (slot_id, user_id, checked_in)
  SELECT 
    NEW.id,
    p.id,
    false
  FROM initial_volunteers iv
  JOIN profiles p ON LOWER(p.email) = LOWER(iv.email)
  WHERE iv.slot_id = NEW.id;

  -- Clean up processed initial volunteers
  DELETE FROM initial_volunteers WHERE slot_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to process initial volunteers after slot creation
CREATE OR REPLACE TRIGGER after_position_slot_created
  AFTER INSERT ON position_slots
  FOR EACH ROW
  EXECUTE FUNCTION process_initial_volunteers();