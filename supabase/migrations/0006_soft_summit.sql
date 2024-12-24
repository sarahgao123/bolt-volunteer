/*
  # Update position volunteers structure for slots

  1. Changes
    - Drop dependent views
    - Store existing volunteers in temp table
    - Update position_volunteers table structure
    - Recreate views with updated schema
*/

-- Drop dependent views
DROP VIEW IF EXISTS position_details;
DROP VIEW IF EXISTS slot_details;

-- Store existing volunteers in temp table
CREATE TEMP TABLE temp_volunteers AS
SELECT * FROM position_volunteers;

-- Drop existing table
DROP TABLE position_volunteers;

-- Recreate position_volunteers with new structure
CREATE TABLE position_volunteers (
  slot_id uuid REFERENCES position_slots ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  checked_in boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (slot_id, user_id)
);

-- Enable RLS
ALTER TABLE position_volunteers ENABLE ROW LEVEL SECURITY;

-- Position volunteers policies
CREATE POLICY "Anyone can view position volunteers"
  ON position_volunteers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can sign up for positions"
  ON position_volunteers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own volunteer status"
  ON position_volunteers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recreate position_details view
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
LEFT JOIN position_slots ps ON p.id = ps.position_id
LEFT JOIN position_volunteers pv ON ps.id = pv.slot_id
LEFT JOIN profiles pr ON pv.user_id = pr.id
GROUP BY p.id;

-- Recreate slot_details view
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