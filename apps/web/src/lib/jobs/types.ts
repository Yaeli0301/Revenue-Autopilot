export const QUEUE_NAMES = {
  REMINDERS: "reminders",
  CALENDAR_SYNC: "calendar-sync",
  AUTOFILL: "autofill",
} as const;

export interface ReminderJobData {
  appointmentId: string;
  organizationId: string;
  template: "REMINDER_24H" | "REMINDER_3H";
}

export interface CalendarSyncJobData {
  organizationId?: string;
}

export interface AutofillJobData {
  appointmentId: string;
  organizationId: string;
}

export function reminderJobId(
  appointmentId: string,
  template: "REMINDER_24H" | "REMINDER_3H"
): string {
  return `reminder-${template.toLowerCase().replace("_", "-")}-${appointmentId}`;
}

export const CALENDAR_SYNC_REPEAT_JOB_ID = "calendar-sync-all-orgs";
