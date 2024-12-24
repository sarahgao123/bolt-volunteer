/*
  # Improve volunteer management

  1. Changes
    - Create dedicated volunteers table
    - Simplify volunteer-slot relationship
    - Add proper indexing
    - Update views for better performance

  2. New Structure
    - volunteers table stores all volunteer information
    - slot_volunteers links volunteers to slots
    - Improved slot_details view
*/

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Create slot_volunteers table
CREATE TABLE IF NOT EXISTS slot_volunteers (
  slot_id uuid REFERENCES position_slots ON DELETE CASCADE,
  volunteer_id uuid REFERENCES volunteers ON DELETE CASCADE,
  checked_in boolean NOT NULL DEFAULT false,
  check_in_time timestamptz,
  PRIMARY KEY (slot_id, volunteer_id)
);

-- Enable RLS
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_volunteers ENABLE ROW LEVEL SECURITY;

-- RLS policies for volunteers
CREATE POLICY "Anyone can view volunteers"
  ON volunteers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event owners can manage volunteers"
  ON volunteers FOR ALL
  TO authenticated
  USING (true);

-- RLS policies for slot_volunteers
CREATE POLICY "Anyone can view slot volunteers"
  ON slot_volunteers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event owners can manage slot volunteers"
  ON slot_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM position_slots ps
      JOIN positions p ON p.id = ps.position_id
      JOIN events e ON e.id = p.event_id
      WHERE ps.id = slot_volunteers.slot_id
      AND e.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_slot_volunteers_slot ON slot_volunteers(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_volunteers_volunteer ON slot_volunteers(volunteer_id);

-- Update slot_details view
CREATE OR REPLACE VIEW slot_details AS
SELECT 
  s.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', v.id,
        'email', v.email,
        'name', v.name,
        'checked_in', sv.checked_in,
        'check_in_time', sv.check_in_time
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

-- Function to handle volunteer assignments
CREATE OR REPLACE FUNCTION assign_slot_volunteer(
  p_slot_id uuid,
  p_email text,
  p_name text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_volunteer_id uuid;
BEGIN
  -- Get or create volunteer
  INSERT INTO volunteers (email, name)
  VALUES (LOWER(p_email), p_name)
  ON CONFLICT (email) DO UPDATE
  SET name = COALESCE(EXCLUDED.name, volunteers.name)
  RETURNING id INTO v_volunteer_id;

  -- Assign to slot
  INSERT INTO slot_volunteers (slot_id, volunteer_id)
  VALUES (p_slot_id, v_volunteer_id)
  ON CONFLICT (slot_id, volunteer_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;