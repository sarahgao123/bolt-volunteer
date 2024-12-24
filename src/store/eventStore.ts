import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Event } from '../types/event';

interface EventState {
  events: Event[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  createEvent: (event: Omit<Event, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_time', { ascending: true });
      
      if (error) throw error;
      set({ events: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  createEvent: async (event) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .insert([{
          ...event,
          user_id: user.id
        }]);
      
      if (error) throw error;
      await get().fetchEvents();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  updateEvent: async (id, event) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('events')
        .update(event)
        .eq('id', id);
      
      if (error) throw error;
      await get().fetchEvents();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await get().fetchEvents();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },
}));