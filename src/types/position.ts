import { User } from '@supabase/supabase-js';

export interface Position {
  id: string;
  event_id: string;
  name: string;
  start_time: string;
  end_time: string;
  volunteers_needed: number;
  volunteers_checked_in: number;
  created_at: string;
}

export interface PositionWithVolunteers extends Position {
  volunteers: User[];
}