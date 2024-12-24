export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDateTimeForInput(dateStr: string): string {
  const date = new Date(dateStr);
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .slice(0, 16);
}

export function formatTimeForDB(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString();
}