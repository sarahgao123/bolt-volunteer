import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { EventForm } from './EventForm';
import { EventList } from './EventList';
import type { Event } from '../../types/event';

export function EventManager() {
  const { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent } = useEventStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (data: Omit<Event, 'id' | 'user_id' | 'created_at'>) => {
    await createEvent(data);
    setIsCreating(false);
  };

  const handleUpdate = async (data: Omit<Event, 'id' | 'user_id' | 'created_at'>) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      setEditingEvent(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(id);
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Volunteer Events</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Event
        </button>
      </div>

      <div className="space-y-6">
        {isCreating && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Event</h3>
            <EventForm
              onSubmit={handleCreate}
              buttonText="Create Event"
            />
          </div>
        )}

        {editingEvent && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Event</h3>
            <EventForm
              onSubmit={handleUpdate}
              initialData={editingEvent}
              buttonText="Update Event"
            />
          </div>
        )}

        <EventList
          events={events}
          onEdit={setEditingEvent}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}