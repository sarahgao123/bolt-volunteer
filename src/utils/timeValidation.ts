import { Position } from '../types/position';

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateSlotTimes(
  startTime: string,
  endTime: string,
  position: Position
): TimeValidationResult {
  // Convert all times to local timezone for comparison
  const slotStart = new Date(startTime);
  const slotEnd = new Date(endTime);
  const positionStart = new Date(position.start_time);
  const positionEnd = new Date(position.end_time);

  // Format times for error messages
  const formatTime = (date: Date) => date.toLocaleString();

  if (slotStart < positionStart) {
    return {
      isValid: false,
      error: `Start time cannot be before position start time (${formatTime(positionStart)})`
    };
  }

  if (slotEnd > positionEnd) {
    return {
      isValid: false,
      error: `End time cannot be after position end time (${formatTime(positionEnd)})`
    };
  }

  if (slotEnd <= slotStart) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }

  return { isValid: true };
}