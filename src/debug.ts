import { supabase } from './lib/supabase';

async function querySlotVolunteers(slotId: string) {
  const { data, error } = await supabase
    .from('slot_details')
    .select('*')
    .eq('id', slotId)
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Slot details:', {
    id: data.id,
    position_id: data.position_id,
    start_time: data.start_time,
    end_time: data.end_time,
    capacity: data.capacity,
    volunteers: data.volunteers,
    volunteers_checked_in: data.volunteers_checked_in
  });
}

// Query the specific slot
querySlotVolunteers('bd80b33a-2ae0-46e1-aa8b-b729a6d7b4ec');