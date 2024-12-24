import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SlotWithVolunteers } from '../types/slot';

export function useSlotVolunteers(slotId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<SlotWithVolunteers['volunteers']>([]);

  useEffect(() => {
    async function fetchVolunteers() {
      if (!slotId) return;

      try {
        const { data, error: slotError } = await supabase
          .from('slot_details')
          .select('volunteers')
          .eq('id', slotId)
          .single();

        if (slotError) throw slotError;
        setVolunteers(data.volunteers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load volunteers');
      } finally {
        setLoading(false);
      }
    }

    fetchVolunteers();
  }, [slotId]);

  return { volunteers, loading, error };
}