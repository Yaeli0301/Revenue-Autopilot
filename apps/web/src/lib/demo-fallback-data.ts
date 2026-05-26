import type { DashboardMetrics } from "@revenue-autopilot/lib";

export const DEMO_SESSION_VALUE = "demo";
export const DEMO_PROFILE_COOKIE = "demo_profile";

export interface DemoProfile {
  businessName?: string;
  email?: string;
}

export interface DemoAppointment {
  id: string;
  title: string;
  startTime: Date;
  status: string;
  customer: { name: string; phone: string | null; email: string | null };
}

export function getDemoOrgName(profile: DemoProfile): string {
  return profile.businessName?.trim() || "העסק שלי";
}

export function getDemoDashboardMetrics(): DashboardMetrics {
  return {
    confirmationRate: 0.82,
    autofillRate: 0.71,
    revenueSaved: 2100,
    atRiskCount: 1,
    totalAppointments: 48,
    confirmedCount: 14,
    cancelledCount: 3,
    autofillWins: 6,
  };
}

export function getDemoAppointments(): DemoAppointment[] {
  const base = new Date();
  base.setHours(14, 0, 0, 0);
  const tomorrow = new Date(base);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 30, 0, 0);
  const dayAfter = new Date(base);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(16, 0, 0, 0);

  return [
    {
      id: "demo-1",
      title: "טיפול פנים",
      startTime: base,
      status: "CONFIRMED",
      customer: { name: "דנה כהן", phone: null, email: null },
    },
    {
      id: "demo-2",
      title: "ייעוץ ראשון",
      startTime: tomorrow,
      status: "COMPLETED",
      customer: { name: "יוסי לוי", phone: null, email: null },
    },
    {
      id: "demo-3",
      title: "טיפול שגרתי",
      startTime: dayAfter,
      status: "AT_RISK",
      customer: { name: "עדי שחר", phone: null, email: null },
    },
  ];
}

export const DEMO_ACTIVITY = [
  { text: "הודעת תזכורת נשלחה — דנה כהן", time: "לפני 2 דקות" },
  { text: "מקום שהתמלא מביטול — יוסי לוי", time: "לפני 18 דקות" },
  { text: "הכנסה נשמרה: ₪250", time: "לפני 18 דקות" },
  { text: "הודעת אישור נשלחה — עדי שחר", time: "לפני שעה" },
] as const;
