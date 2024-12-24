import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position } from '../../types/position';
import type { SlotWithVolunteers } from '../../types/slot';
import { useSlotStore } from '../../store/slotStore';
import { SlotForm } from './SlotForm';
import { SlotRow } from './SlotRow';

interface SlotListProps {
  positionId: string;
  position: Position;
  slots: SlotWithVolunteers[];
  isOwner: boolean;
}

export function SlotList({ positionId, position, slots, isOwner }: SlotListProps) {
  const navigate = useNavigate();
  const { updateSlot, deleteSlot } = useSlotStore();
  const [editingSlot, setEditingSlot] = useState<SlotWithVolunteers | null>(null);

  if (!slots.length) {
    return (
      <div className="text-gray-500 text-center py-4">
        No slots available for this position.
      </div>
    );
  }

  const handleEdit = async (data: any) => {
    try {
      if (editingSlot) {
        await updateSlot(editingSlot.id, data);
        setEditingSlot(null);
      }
    } catch (error) {
      console.error('Error updating slot:', error);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      try {
        await deleteSlot(slotId);
      } catch (error) {
        console.error('Error deleting slot:', error);
      }
    }
  };

  const handleCheckIn = (slotId: string) => {
    navigate(`/checkin/${positionId}?slot=${slotId}`);
  };

  return (
    <div className="space-y-4">
      {slots.map((slot) => (
        <div key={slot.id}>
          {editingSlot?.id === slot.id ? (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Slot</h4>
              <SlotForm
                positionId={positionId}
                position={position}
                onSubmit={handleEdit}
                initialData={slot}
                buttonText="Update Slot"
              />
              <button
                onClick={() => setEditingSlot(null)}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <SlotRow
              slot={slot}
              isOwner={isOwner}
              onEdit={setEditingSlot}
              onDelete={handleDelete}
              onCheckIn={handleCheckIn}
            />
          )}
        </div>
      ))}
    </div>
  );
}