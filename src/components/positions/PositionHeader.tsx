import React from 'react';
import { Clock, Users } from 'lucide-react';
import type { PositionWithVolunteers } from '../../types/position';

interface PositionHeaderProps {
  position: PositionWithVolunteers;
}

export function PositionHeader({ position }: PositionHeaderProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">{position.name}</h3>
      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>
            {new Date(position.start_time).toLocaleString()} - 
            {new Date(position.end_time).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1" />
          <span>{position.volunteers_needed} volunteers needed</span>
        </div>
      </div>
    </div>
  );
}