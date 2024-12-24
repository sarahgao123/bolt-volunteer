export function isTimeInRange(
  testTime: Date,
  startTime: Date,
  endTime: Date
): boolean {
  return testTime >= startTime && testTime <= endTime;
}

export function areTimesValid(
  slotStart: Date,
  slotEnd: Date,
  positionStart: Date,
  positionEnd: Date
): boolean {
  return (
    isTimeInRange(slotStart, positionStart, positionEnd) &&
    isTimeInRange(slotEnd, positionStart, positionEnd) &&
    slotStart < slotEnd
  );
}