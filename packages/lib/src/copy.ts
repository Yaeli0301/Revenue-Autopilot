export const APPOINTMENT_STATUS_LABELS: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" | "outline" }
> = {
  CONFIRMED: { label: "אושר", variant: "success" },
  SCHEDULED: { label: "ממתין לאישור", variant: "default" },
  AT_RISK: { label: "טרם אושר", variant: "warning" },
  CANCELLED: { label: "בוטל", variant: "outline" },
  NO_SHOW: { label: "לא הגיע", variant: "danger" },
  COMPLETED: { label: "הושלם", variant: "success" },
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  TRIALING: "תקופת ניסיון",
  ACTIVE: "פעיל",
  PAST_DUE: "תשלום נדרש",
  CANCELED: "בוטל",
  INACTIVE: "לא פעיל",
};

export const PLAN_LABELS: Record<string, string> = {
  STARTER: "בסיסי",
  PRO: "מתקדם",
  ENTERPRISE: "עסקי",
  TRIAL: "ניסיון",
};

/** Translate backend/API errors into plain Hebrew for business owners. */
export function translateUserError(error: string | undefined | null): string {
  if (!error) return "משהו השתבש. נסו שוב או פנו לתמיכה.";

  const map: Record<string, string> = {
    Unauthorized: "יש להתחבר מחדש.",
    "Invalid input": "חלק מהפרטים חסרים או לא תקינים.",
    "Internal error": "משהו השתבש. נסו שוב בעוד רגע.",
    "No organization": "לא נמצא עסק מקושר לחשבון.",
    "Appointment not found": "התור לא נמצא.",
    "Google OAuth not configured — skipped in dev":
      "חיבור יומן Google אינו זמין כרגע. אפשר להמשיך בלי יומן.",
    "Google OAuth not configured":
      "חיבור יומן Google אינו זמין כרגע. אפשר להמשיך בלי יומן.",
    invalid_grant:
      "החיבור ליומן פג. לחצו כאן לחבר מחדש.",
    token_expired:
      "החיבור ליומן פג. לחצו כאן לחבר מחדש.",
    sync_failed: "לא הצלחנו לעדכן את התורים מהיומן. ננסה שוב אוטומטית.",
    "SMS provider not configured. Add Twilio credentials or set MESSAGING_MODE=dev for local testing.":
      "שליחת הודעות אינה מוגדרת. פנו לתמיכה.",
    "Subscription inactive — upgrade at /dashboard/billing":
      "תקופת הניסיון הסתיימה. שדרגו את המנוי כדי להמשיך.",
    "Quiet hours — message will be sent when quiet hours end":
      "שעות שקט — ההודעה תישלח בבוקר.",
    "No valid phone or email for customer":
      "ללקוח אין מספר טלפון או אימייל לשליחת הודעה.",
    ALREADY_CLAIMED: "מצטערים — התור כבר נתפס.",
    APPOINTMENT_NOT_AVAILABLE: "התור כבר לא זמין.",
    NOT_ON_WAITLIST: "אינך ברשימת ההמתנה.",
  };

  for (const [key, msg] of Object.entries(map)) {
    if (error.includes(key)) return msg;
  }

  if (error.includes("calendar") || error.includes("Calendar")) {
    return "בעיה בחיבור ליומן. לחצו לחבר מחדש.";
  }

  return error;
}

export function translateCalendarError(lastError: string | null): string | null {
  if (!lastError) return null;
  return translateUserError(lastError);
}
