import { useState } from 'react';
import type { Position } from '../types/position';
import type { SlotWithVolunteers } from '../types/slot';
import { formatDateTimeForInput } from '../utils/dateFormat';
import { validateSlotTimes } from '../utils/timeValidation';

interface UseSlotFormProps {
  positionId: string;
  position: Position;
  initialData?: SlotWithVolunteers;
}

interface Volunteer {
  email: string;
  name?: string;
}

export function useSlotForm({ positionId, position, initialData }: UseSlotFormProps) {
  const [formData, setFormData] = useState({
    start_time: initialData?.start_time 
      ? formatDateTimeForInput(initialData.start_time)
      : formatDateTimeForInput(position.start_time),
    end_time: initialData?.end_time 
      ? formatDateTimeForInput(initialData.end_time)
      : formatDateTimeForInput(position.end_time),
    capacity: initialData?.capacity || 1,
  });

  const [volunteers, setVolunteers] = useState<Volunteer[]>(
    initialData?.volunteers.map(v => ({
      email: v.user.email,
      name: v.name
    })) || []
  );
  
  const [newVolunteer, setNewVolunteer] = useState('');
  const [newVolunteerName, setNewVolunteerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addVolunteer = () => {
    if (!newVolunteer) return;
    if (volunteers.some(v => v.email === newVolunteer)) {
      setError('This volunteer is already in the list');
      return;
    }
    if (!newVolunteer.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setVolunteers([...volunteers, { 
      email: newVolunteer,
      name: newVolunteerName || undefined
    }]);
    setNewVolunteer('');
    setNewVolunteerName('');
    setError(null);
  };

  const removeVolunteer = (email: string) => {
    setVolunteers(volunteers.filter(v => v.email !== email));
  };

  const updateVolunteerName = (email: string, name: string) => {
    setVolunteers(volunteers.map(v => 
      v.email === email ? { ...v, name: name || undefined } : v
    ));
  };

  const handleSubmit = async (onSubmit: (data: any) => Promise<void>) => {
    setError(null);

    // Validate times
    const validation = validateSlotTimes(formData.start_time, formData.end_time, position);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        position_id: positionId,
        volunteers: volunteers.map(v => ({
          email: v.email,
          name: v.name
        }))
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return {
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
  };
}