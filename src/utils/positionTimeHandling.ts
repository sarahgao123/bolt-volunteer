import { Position } from '../types/position';

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePositionTimes(
  startTime: string,
  endTime: string
): TimeValidationResult {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }

  return { isValid: true };
}

export function formatPositionTimeForDB(dateStr: string): string {
  // Convert local time to UTC ISO string for database
  const localDate = new Date(dateStr);
  return localDate.toISOString();
}

export function formatPositionTimeForInput(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(' ', 'T');
}