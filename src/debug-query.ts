import { supabase } from './lib/supabase';

async function main() {
  const { data, error } = await supabase
    .from('slot_details')
    .select('*')
    .eq('id', 'bd80b33a-2ae0-46e1-aa8b-b729a6d7b4ec')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Slot data:', JSON.stringify(data, null, 2));
}

main().catch(console.error);