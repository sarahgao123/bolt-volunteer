import React from 'react';
import { Plus, X } from 'lucide-react';
import type { Position } from '../../types/position';
import type { SlotWithVolunteers } from '../../types/slot';
import { useSlotForm } from '../../hooks/useSlotForm';
import { formatDateTimeForInput } from '../../utils/dateFormat';

interface SlotFormProps {
  positionId: string;
  position: Position;
  onSubmit: (data: any) => Promise<void>;
  initialData?: SlotWithVolunteers;
  buttonText: string;
}

export function SlotForm({ positionId, position, onSubmit, initialData, buttonText }: SlotFormProps) {
  const {
    formData,
    setFormData,
    volunteers,
    newVolunteer,
    newVolunteerName,
    setNewVolunteer,
    setNewVolunteerName,
    error,
    addVolunteer,
    removeVolunteer,
    updateVolunteerName,
    handleSubmit,
  } = useSlotForm({ positionId, position, initialData });

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(onSubmit);
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
          Start Time
        </label>
        <input
          type="datetime-local"
          id="start_time"
          required
          value={formData.start_time}
          min={formatDateTimeForInput(position.start_time)}
          max={formatDateTimeForInput(position.end_time)}
          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
          End Time
        </label>
        <input
          type="datetime-local"
          id="end_time"
          required
          value={formData.end_time}
          min={formData.start_time}
          max={formatDateTimeForInput(position.end_time)}
          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
          Capacity
        </label>
        <input
          type="number"
          id="capacity"
          required
          min="1"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: Math.max(1, parseInt(e.target.value) || 1) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Volunteers
        </label>
        <div className="mt-1 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="email"
                value={newVolunteer}
                onChange={(e) => setNewVolunteer(e.target.value)}
                placeholder="Enter volunteer email"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newVolunteerName}
                onChange={(e) => setNewVolunteerName(e.target.value)}
                placeholder="Enter volunteer name (optional)"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addVolunteer}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {volunteers.length > 0 && (
          <div className="mt-2 space-y-2">
            {volunteers.map((volunteer) => (
              <div key={volunteer.email} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md">
                <div className="flex-1">
                  <span className="text-sm text-gray-600">{volunteer.email}</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={volunteer.name || ''}
                    onChange={(e) => updateVolunteerName(volunteer.email, e.target.value)}
                    placeholder="Enter name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVolunteer(volunteer.email)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {buttonText}
      </button>
    </form>
  );
}