import { areTimesValid } from './dateValidation';
import type { Position } from '../types/position';
import type { Slot } from '../types/slot';

export interface SlotValidationError {
  message: string;
}

export function validateSlot(
  slotData: Omit<Slot, 'id' | 'created_at' | 'volunteers_checked_in'>,
  position: Position
): SlotValidationError | null {
  const slotStart = new Date(slotData.start_time);
  const slotEnd = new Date(slotData.end_time);
  const positionStart = new Date(position.start_time);
  const positionEnd = new Date(position.end_time);

  if (!areTimesValid(slotStart, slotEnd, positionStart, positionEnd)) {
    return {
      message: 'Slot time range must be within position time range'
    };
  }

  if (slotData.capacity < 1) {
    return {
      message: 'Slot capacity must be at least 1'
    };
  }

  return null;
}