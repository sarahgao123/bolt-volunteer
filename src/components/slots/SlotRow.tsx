import React from 'react';
import { Clock, Users, Pencil, Trash2, CheckCircle, Hash } from 'lucide-react';
import type { SlotWithVolunteers } from '../../types/slot';
import { formatDateTime } from '../../utils/dateFormat';

interface SlotRowProps {
  slot: SlotWithVolunteers;
  isOwner: boolean;
  onEdit: (slot: SlotWithVolunteers) => void;
  onDelete: (id: string) => void;
  onCheckIn: (id: string) => void;
}

export function SlotRow({ slot, isOwner, onEdit, onDelete, onCheckIn }: SlotRowProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Hash className="h-4 w-4" />
            <span className="font-mono">{slot.id}</span>
          </div>

          {(slot.start_time || slot.end_time) && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {slot.start_time && formatDateTime(slot.start_time)}
                  {slot.start_time && slot.end_time && ' - '}
                  {slot.end_time && formatDateTime(slot.end_time)}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>
                {slot.volunteers.length} / {slot.capacity} volunteers
              </span>
            </div>
          </div>
          
          {slot.volunteers.length > 0 && (
            <div className="text-sm text-gray-500">
              <strong>Volunteers:</strong>
              <div className="mt-1 space-y-1">
                {slot.volunteers.map(volunteer => (
                  <div key={volunteer.user.id} className="flex items-center justify-between">
                    <span className="inline-flex items-center">
                      {volunteer.name || volunteer.user.email}
                      {volunteer.checked_in && (
                        <CheckCircle className="h-4 w-4 ml-1 text-green-500" />
                      )}
                    </span>
                    {volunteer.check_in_time && (
                      <span className="text-xs text-gray-400">
                        Checked in: {formatDateTime(volunteer.check_in_time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onCheckIn(slot.id)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            title="Check in volunteers"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Check In
          </button>
          
          {isOwner && (
            <>
              <button
                onClick={() => onEdit(slot)}
                className="text-gray-400 hover:text-indigo-600"
                title="Edit slot"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(slot.id)}
                className="text-gray-400 hover:text-red-600"
                title="Delete slot"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}