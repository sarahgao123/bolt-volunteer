import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useVolunteerStore } from '../store/volunteerStore';
import { useSlotVolunteers } from '../hooks/useSlotVolunteers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface CheckInFormData {
  name: string;
  email: string;
}

export function CheckInPage() {
  const { positionId } = useParams<{ positionId: string }>();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get('slot');

  const { loading: checkInLoading, error: checkInError, checkIn } = useVolunteerStore();
  const { volunteers, loading: volunteersLoading, error: volunteersError } = useSlotVolunteers(slotId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckInFormData>({
    name: '',
    email: '',
  });
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [positionDetails, setPositionDetails] = useState<{ name: string; slot_time?: string } | null>(null);

  // Filter out already checked-in volunteers
  const availableVolunteers = volunteers.filter(v => !v.checked_in);

  useEffect(() => {
    async function fetchPositionDetails() {
      if (!positionId || !slotId) return;

      try {
        const { data: position, error: positionError } = await supabase
          .from('positions')
          .select('name')
          .eq('id', positionId)
          .single();

        if (positionError) throw positionError;

        const { data: slot, error: slotError } = await supabase
          .from('position_slots')
          .select('start_time, end_time')
          .eq('id', slotId)
          .single();

        if (slotError) throw slotError;

        setPositionDetails({
          name: position.name,
          slot_time: slot ? `${new Date(slot.start_time).toLocaleString()} - ${new Date(slot.end_time).toLocaleString()}` : undefined
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load position details');
      } finally {
        setLoading(false);
      }
    }

    fetchPositionDetails();
  }, [positionId, slotId]);

  const handleEmailChange = (email: string) => {
    const volunteer = volunteers.find(v => v.user.email === email);
    setFormData({
      email,
      name: formData.name // Preserve existing name
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotId) return;

    try {
      await checkIn(slotId, formData.name, formData.email);
      setCheckInStatus('success');
      setStatusMessage('Successfully checked in! Thank you for volunteering.');
    } catch (err) {
      setCheckInStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to check in');
    }
  };

  if (loading || checkInLoading || volunteersLoading) return <LoadingSpinner />;
  if (error || checkInError || volunteersError) {
    return <ErrorMessage message={error || checkInError || volunteersError || 'An error occurred'} />;
  }
  if (!positionDetails) return <ErrorMessage message="Position not found" />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{positionDetails.name}</h2>
        {positionDetails.slot_time && (
          <p className="text-sm text-gray-600 mb-4">{positionDetails.slot_time}</p>
        )}
        <p className="text-gray-600 mb-6">Please enter your details to check in</p>

        {checkInStatus === 'idle' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <select
                id="email"
                required
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select your email</option>
                {availableVolunteers.map(volunteer => (
                  <option key={volunteer.user.id} value={volunteer.user.email}>
                    {volunteer.user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>

            <button
              type="submit"
              disabled={!formData.email || !formData.name}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check In
            </button>
          </form>
        ) : (
          <div className={`text-center p-4 rounded-md ${
            checkInStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}