/*
  # Make slot times optional

  1. Changes
    - Make start_time and end_time nullable in position_slots table
    - Update slot_details view to handle null times
*/

ALTER TABLE position_slots 
ALTER COLUMN start_time DROP NOT NULL,
ALTER COLUMN end_time DROP NOT NULL;