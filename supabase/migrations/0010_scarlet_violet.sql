/*
  # Add cascade delete for events

  1. Changes
    - Add ON DELETE CASCADE to positions.event_id foreign key
    - This ensures positions are deleted when their parent event is deleted

  2. Implementation
    - Drop existing foreign key
    - Re-create with CASCADE option
*/

-- First drop the existing foreign key constraint
ALTER TABLE positions 
  DROP CONSTRAINT IF EXISTS positions_event_id_fkey;

-- Re-create it with CASCADE delete
ALTER TABLE positions
  ADD CONSTRAINT positions_event_id_fkey 
  FOREIGN KEY (event_id) 
  REFERENCES events(id) 
  ON DELETE CASCADE;