import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface VolunteerState {
  loading: boolean;
  error: string | null;
  checkIn: (slotId: string, name: string, email: string) => Promise<void>;
}

export const useVolunteerStore = create<VolunteerState>((set) => ({
  loading: false,
  error: null,

  checkIn: async (slotId: string, name: string, email: string) => {
    set({ loading: true, error: null });
    try {
      // First verify the volunteer is registered for this slot
      const { data: volunteer, error: verifyError } = await supabase
        .from('slot_volunteers')
        .select('volunteer_id, volunteers!inner(email)')
        .eq('slot_id', slotId)
        .eq('volunteers.email', email.toLowerCase())
        .single();

      if (verifyError || !volunteer) {
        throw new Error('No registration found for this email address');
      }

      // Update check-in status
      const { error: updateError } = await supabase
        .from('slot_volunteers')
        .update({ 
          checked_in: true,
          check_in_time: new Date().toISOString()
        })
        .eq('slot_id', slotId)
        .eq('volunteer_id', volunteer.volunteer_id);

      if (updateError) throw updateError;

      // Update volunteer name if provided
      if (name) {
        const { error: nameError } = await supabase
          .from('volunteers')
          .update({ name })
          .eq('id', volunteer.volunteer_id);

        if (nameError) throw nameError;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));