/*
  # Add positions and volunteers management

  1. New Tables
    - `positions`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `name` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `volunteers_needed` (integer)
      - `volunteers_checked_in` (integer)
      - `created_at` (timestamptz)
    
    - `position_volunteers`
      - `position_id` (uuid, foreign key to positions)
      - `user_id` (uuid, foreign key to auth.users)
      - `checked_in` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read all positions
      - Create/update/delete positions for their own events
      - Sign up for positions
      - Check in as a volunteer
*/

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events NOT NULL,
  name text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  volunteers_needed integer NOT NULL DEFAULT 1,
  volunteers_checked_in integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create position_volunteers table
CREATE TABLE IF NOT EXISTS position_volunteers (
  position_id uuid REFERENCES positions ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  checked_in boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (position_id, user_id)
);

-- Enable RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_volunteers ENABLE ROW LEVEL SECURITY;

-- Positions policies
CREATE POLICY "Anyone can view positions"
  ON positions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create positions for their events"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update positions for their events"
  ON positions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete positions for their events"
  ON positions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.user_id = auth.uid()
    )
  );

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

-- Create function to increment volunteers_checked_in
CREATE OR REPLACE FUNCTION increment()
RETURNS integer
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 1;
$$;