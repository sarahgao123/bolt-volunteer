import React from 'react';
import type { Position } from '../../types/position';
import { formatDateTimeForInput } from '../../utils/dateFormat';

interface PositionFormProps {
  onSubmit: (data: Omit<Position, 'id' | 'created_at' | 'volunteers_checked_in'>) => void;
  initialData?: Position;
  buttonText: string;
}

export function PositionForm({ onSubmit, initialData, buttonText }: PositionFormProps) {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    start_time: initialData?.start_time ? formatDateTimeForInput(initialData.start_time) : '',
    end_time: initialData?.end_time ? formatDateTimeForInput(initialData.end_time) : '',
    volunteers_needed: initialData?.volunteers_needed || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      volunteers_needed: Number(formData.volunteers_needed)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Position Name
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
          Start Time
        </label>
        <input
          type="datetime-local"
          id="start_time"
          required
          value={formData.start_time}
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
          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="volunteers_needed" className="block text-sm font-medium text-gray-700">
          Number of Volunteers Needed
        </label>
        <input
          type="number"
          id="volunteers_needed"
          required
          min="1"
          value={formData.volunteers_needed}
          onChange={(e) => setFormData({ ...formData, volunteers_needed: Math.max(1, parseInt(e.target.value) || 1) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
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