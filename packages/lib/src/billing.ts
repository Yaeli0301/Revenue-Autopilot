import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export const TRIAL_DAYS = 14;

export interface SubscriptionCheckInput {
  subStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  createdAt: Date;
}

export function isTrialActive(org: SubscriptionCheckInput, now = new Date()): boolean {
  if (org.subStatus !== "TRIALING") return false;
  const trialEnd = new Date(org.createdAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  return now < trialEnd;
}

export function isSubscriptionActive(
  org: SubscriptionCheckInput,
  now = new Date()
): boolean {
  if (org.subStatus === "ACTIVE") return true;
  return isTrialActive(org, now);
}

export function getTrialDaysRemaining(
  org: SubscriptionCheckInput,
  now = new Date()
): number {
  if (org.subStatus !== "TRIALING") return 0;
  const trialEnd = new Date(org.createdAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  const ms = trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export const BILLING_PLANS = [
  {
    id: "starter" as const,
    plan: "STARTER" as SubscriptionPlan,
    name: "בסיסי",
    price: 149,
    priceLabel: "₪149",
    appointments: 100,
    envPriceKey: "STRIPE_PRICE_STARTER",
    features: ["הפחתת ביטולים", "הודעות אוטומטיות", "ראו כמה כסף חזר"],
  },
  {
    id: "pro" as const,
    plan: "PRO" as SubscriptionPlan,
    name: "מתקדם",
    price: 299,
    priceLabel: "₪299",
    appointments: 500,
    envPriceKey: "STRIPE_PRICE_PRO",
    popular: true,
    features: ["מילוי אוטומטי של ביטולים", "תמיכה מהירה", "כל מה שבבסיסי"],
  },
] as const;

export type BillingPlanId = (typeof BILLING_PLANS)[number]["id"];
