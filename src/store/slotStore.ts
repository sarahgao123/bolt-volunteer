import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { SlotWithVolunteers } from '../types/slot';
import { formatTimeForDB } from '../utils/dateFormat';

interface SlotState {
  slots: SlotWithVolunteers[];
  loading: boolean;
  error: string | null;
  fetchSlots: (positionId: string) => Promise<void>;
  createSlot: (data: any) => Promise<void>;
  updateSlot: (id: string, data: any) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;
}

export const useSlotStore = create<SlotState>((set, get) => ({
  slots: [],
  loading: false,
  error: null,

  fetchSlots: async (positionId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('slot_details')
        .select('*')
        .eq('position_id', positionId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      set({ slots: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createSlot: async (data) => {
    set({ loading: true, error: null });
    try {
      const slotData = {
        position_id: data.position_id,
        start_time: formatTimeForDB(data.start_time),
        end_time: formatTimeForDB(data.end_time),
        capacity: data.capacity
      };

      const { data: slot, error: slotError } = await supabase
        .from('position_slots')
        .insert([slotData])
        .select()
        .single();

      if (slotError) throw slotError;

      if (data.volunteers?.length > 0) {
        const { error: volunteerError } = await supabase
          .rpc('assign_volunteers_to_slot', { 
            p_slot_id: slot.id,
            p_volunteers: data.volunteers
          });

        if (volunteerError) throw volunteerError;
      }

      await get().fetchSlots(data.position_id);
    } catch (error) {
      console.error('Create slot error:', error);
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateSlot: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const slotData = {
        start_time: formatTimeForDB(data.start_time),
        end_time: formatTimeForDB(data.end_time),
        capacity: data.capacity
      };

      const { error: updateError } = await supabase
        .from('position_slots')
        .update(slotData)
        .eq('id', id);

      if (updateError) throw updateError;

      if (data.volunteers?.length > 0) {
        const { error: volunteerError } = await supabase
          .rpc('assign_volunteers_to_slot', {
            p_slot_id: id,
            p_volunteers: data.volunteers
          });

        if (volunteerError) throw volunteerError;
      }

      const slot = get().slots.find(s => s.id === id);
      if (slot?.position_id) {
        await get().fetchSlots(slot.position_id);
      }
    } catch (error) {
      console.error('Update slot error:', error);
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteSlot: async (id) => {
    set({ loading: true, error: null });
    try {
      const slot = get().slots.find(s => s.id === id);
      if (!slot) throw new Error('Slot not found');

      const { error } = await supabase
        .from('position_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchSlots(slot.position_id);
    } catch (error) {
      console.error('Delete slot error:', error);
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));