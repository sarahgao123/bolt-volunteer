/*
  # Add name column to initial_volunteers table

  1. Changes
    - Add `name` column to `initial_volunteers` table
*/

-- Add name column to initial_volunteers
ALTER TABLE initial_volunteers
ADD COLUMN name text;