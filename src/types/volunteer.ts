export interface Volunteer {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface SlotVolunteer {
  volunteer_id: string;
  slot_id: string;
  checked_in: boolean;
  check_in_time?: string;
  volunteer: Volunteer;
}