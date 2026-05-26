import { isWithinQuietHours } from "./utils";

/** Milliseconds until quiet hours end (minimum 1 hour if currently in quiet hours). */
export function getDelayUntilQuietHoursEndMs(
  hour: number,
  quietStart: number,
  quietEnd: number
): number {
  if (!isWithinQuietHours(hour, quietStart, quietEnd)) {
    return 0;
  }

  let hoursUntilEnd: number;
  if (quietStart <= quietEnd) {
    hoursUntilEnd = quietEnd - hour;
  } else if (hour >= quietStart) {
    hoursUntilEnd = 24 - hour + quietEnd;
  } else {
    hoursUntilEnd = quietEnd - hour;
  }

  return Math.max(hoursUntilEnd, 1) * 60 * 60 * 1000;
}

export const REMINDER_OFFSETS = {
  REMINDER_24H: 24 * 60 * 60 * 1000,
  REMINDER_3H: 3 * 60 * 60 * 1000,
} as const;

export type ReminderTemplate = keyof typeof REMINDER_OFFSETS;

export function getReminderDelayMs(
  startTime: Date,
  template: ReminderTemplate,
  now = new Date()
): number {
  const offset = REMINDER_OFFSETS[template];
  const runAt = startTime.getTime() - offset;
  return runAt - now.getTime();
}
