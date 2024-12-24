import React from 'react';
import { PositionForm } from './PositionForm';
import type { PositionWithVolunteers } from '../../types/position';

interface PositionFormSectionProps {
  isCreating: boolean;
  editingPosition: PositionWithVolunteers | null;
  onCreate: (data: any) => Promise<void>;
  onUpdate: (data: any) => Promise<void>;
}

export function PositionFormSection({
  isCreating,
  editingPosition,
  onCreate,
  onUpdate,
}: PositionFormSectionProps) {
  if (!isCreating && !editingPosition) return null;

  return (
    <div className="mb-8 bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {isCreating ? 'Create New Position' : 'Edit Position'}
      </h3>
      <PositionForm
        onSubmit={isCreating ? onCreate : onUpdate}
        initialData={editingPosition}
        buttonText={isCreating ? 'Create Position' : 'Update Position'}
      />
    </div>
  );
}