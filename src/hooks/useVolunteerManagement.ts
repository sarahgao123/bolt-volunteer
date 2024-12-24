import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Volunteer {
  email: string;
  name?: string;
}

export function useVolunteerManagement() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addVolunteer = async (email: string, name?: string) => {
    try {
      // Validate email
      if (!email.includes('@')) {
        throw new Error('Invalid email address');
      }

      // Check if volunteer already exists
      if (volunteers.some(v => v.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Volunteer already added');
      }

      // Add volunteer
      setVolunteers([...volunteers, { 
        email: email.toLowerCase(),
        name: name || undefined
      }]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add volunteer');
      throw err;
    }
  };

  const removeVolunteer = (email: string) => {
    setVolunteers(volunteers.filter(v => v.email !== email));
  };

  const updateVolunteerName = (email: string, name: string) => {
    setVolunteers(volunteers.map(v => 
      v.email === email ? { ...v, name: name || undefined } : v
    ));
  };

  const createSlotWithVolunteers = async (slotData: any) => {
    try {
      // First create the slot
      const { data: slot, error: slotError } = await supabase
        .from('position_slots')
        .insert([{
          ...slotData,
          position_id: slotData.position_id,
          capacity: slotData.capacity
        }])
        .select()
        .single();

      if (slotError) throw slotError;

      // Then assign volunteers
      for (const volunteer of volunteers) {
        // First ensure volunteer exists
        const { data: volunteerData, error: volunteerError } = await supabase
          .from('volunteers')
          .upsert([{
            email: volunteer.email.toLowerCase(),
            name: volunteer.name
          }])
          .select()
          .single();

        if (volunteerError) throw volunteerError;

        // Then create slot assignment
        const { error: assignmentError } = await supabase
          .from('slot_volunteers')
          .insert([{
            slot_id: slot.id,
            volunteer_id: volunteerData.id
          }]);

        if (assignmentError) throw assignmentError;
      }

      return slot;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create slot');
      throw err;
    }
  };

  return {
    volunteers,
    error,
    addVolunteer,
    removeVolunteer,
    updateVolunteerName,
    createSlotWithVolunteers
  };
}