/*
  # Add position slots support

  1. New Tables
    - `position_slots`
      - `id` (uuid, primary key)
      - `position_id` (uuid, references positions)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `capacity` (integer)
      - `created_at` (timestamptz)

  2. Changes
    - Update position_volunteers to reference slots instead of positions directly
    - Create view for slot details including volunteers

  3. Security
    - Enable RLS on position_slots
    - Add policies for CRUD operations
*/

-- Create position slots table
CREATE TABLE IF NOT EXISTS position_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid REFERENCES positions ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Update position_volunteers to reference slots
ALTER TABLE position_volunteers
  DROP CONSTRAINT position_volunteers_pkey,
  ADD COLUMN slot_id uuid REFERENCES position_slots ON DELETE CASCADE,
  ADD PRIMARY KEY (slot_id, user_id);

-- Enable RLS
ALTER TABLE position_slots ENABLE ROW LEVEL SECURITY;

-- Position slots policies
CREATE POLICY "Anyone can view position slots"
  ON position_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event owners can manage position slots"
  ON position_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM positions p
      JOIN events e ON e.id = p.event_id
      WHERE p.id = position_slots.position_id
      AND e.user_id = auth.uid()
    )
  );

-- Create view for slot details
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
        'checked_in', pv.checked_in
      )
    ) FILTER (WHERE pr.id IS NOT NULL),
    '[]'::json
  ) as volunteers,
  COUNT(pv.user_id) FILTER (WHERE pv.checked_in = true) as volunteers_checked_in
FROM position_slots s
LEFT JOIN position_volunteers pv ON s.id = pv.slot_id
LEFT JOIN profiles pr ON pv.user_id = pr.id
GROUP BY s.id;