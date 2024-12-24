import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { PositionWithVolunteers } from '../../types/position';

interface PositionActionsProps {
  position: PositionWithVolunteers;
  onEdit: (position: PositionWithVolunteers) => void;
  onDelete: (id: string) => void;
}

export function PositionActions({ position, onEdit, onDelete }: PositionActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onEdit(position)}
        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100"
        title="Edit position"
      >
        <Pencil className="h-5 w-5" />
      </button>
      <button
        onClick={() => onDelete(position.id)}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
        title="Delete position"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}