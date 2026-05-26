import { z } from "zod";

export const industryPresets = [
  { id: "DENTIST", label: "רופא שיניים", avgPrice: 350 },
  { id: "SALON", label: "מספרה / יופי", avgPrice: 180 },
  { id: "CLINIC", label: "מרפאה", avgPrice: 400 },
  { id: "FITNESS", label: "כושר / PT", avgPrice: 150 },
  { id: "CONSULTING", label: "ייעוץ", avgPrice: 500 },
  { id: "OTHER", label: "אחר", avgPrice: 200 },
] as const;

export const onboardingSchema = z.object({
  name: z.string().min(2, "שם העסק חייב להכיל לפחות 2 תווים"),
  industry: z.enum(["DENTIST", "SALON", "CLINIC", "FITNESS", "CONSULTING", "OTHER"]),
  avgPrice: z.number().min(0),
  timezone: z.string().min(1),
  quietHoursStart: z.number().min(0).max(23),
  quietHoursEnd: z.number().min(0).max(23),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export interface DashboardMetrics {
  confirmationRate: number;
  autofillRate: number;
  revenueSaved: number;
  atRiskCount: number;
  totalAppointments: number;
  confirmedCount: number;
  cancelledCount: number;
  autofillWins: number;
}

export interface ActionTokenPayload {
  appointmentId: string;
  action: "confirm" | "cancel" | "claim";
  customerId?: string;
  organizationId: string;
}

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "בסיסי",
    price: 149,
    appointments: 100,
    outcome: "פחות ביטולים, יותר לקוחות שמגיעים",
    features: ["הפחתת ביטולים", "הודעות אוטומטיות ללקוחות", "ראו כמה כסף חזר"],
  },
  {
    id: "pro",
    name: "מתקדם",
    price: 299,
    appointments: 500,
    outcome: "ממלאים תורים ריקים — בלי לרדוף אחרי אף אחד",
    features: ["מילוי אוטומטי של ביטולים", "תמיכה מהירה", "כל מה שבבסיסי"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "עסקי",
    price: null,
    appointments: null,
    outcome: "פתרון מלא לעסקים גדולים",
    features: ["אוטומציה מלאה", "תמיכה ייעודית", "התאמה לעסק שלכם"],
  },
] as const;
