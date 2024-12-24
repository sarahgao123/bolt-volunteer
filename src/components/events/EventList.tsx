import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { Event } from '../../types/event';
import { useAuthStore } from '../../store/authStore';

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}

export function EventList({ events, onEdit, onDelete }: EventListProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div 
          key={event.id} 
          className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/events/${event.id}/positions`)}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
            {user?.id === event.user_id && (
              <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(event)}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(event.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-gray-600">{event.description}</p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(event.event_time).toLocaleString()}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {event.location}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              View Positions
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}