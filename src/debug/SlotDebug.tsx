import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function SlotDebug() {
  const [slotData, setSlotData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlotData();
  }, []);

  async function fetchSlotData() {
    try {
      // First, let's get all events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .limit(1);

      if (eventsError) throw eventsError;
      if (!events.length) throw new Error('No events found');

      // Get positions for the first event
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('event_id', events[0].id)
        .limit(1);

      if (positionsError) throw positionsError;
      if (!positions.length) throw new Error('No positions found');

      // Get slots for the first position
      const { data: slots, error: slotsError } = await supabase
        .from('position_slots')
        .select(`
          *,
          volunteers:slot_volunteers(
            volunteer:volunteers(
              id,
              email,
              name
            ),
            checked_in,
            check_in_time
          )
        `)
        .eq('position_id', positions[0].id);

      if (slotsError) throw slotsError;
      
      setSlotData({
        event: events[0],
        position: positions[0],
        slots
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!slotData) return <div className="p-4">No data found</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Database Debug View</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Event</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(slotData.event, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Position</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(slotData.position, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Slots with Volunteers</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(slotData.slots, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}