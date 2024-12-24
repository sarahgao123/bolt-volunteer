/*
  # Add check-in name field

  1. Changes
    - Add check_in_name column to position_volunteers table
    - This allows storing the volunteer's name at check-in time

  2. Security
    - Maintain existing RLS policies
*/

-- Add check_in_name column to position_volunteers
ALTER TABLE position_volunteers 
ADD COLUMN check_in_name text;