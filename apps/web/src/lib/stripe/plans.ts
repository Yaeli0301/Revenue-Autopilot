import type { SubscriptionPlan } from "@revenue-autopilot/lib/db";
import { BILLING_PLANS, type BillingPlanId } from "@revenue-autopilot/lib";

export function getStripePriceId(planId: BillingPlanId): string | null {
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  return process.env[plan.envPriceKey] ?? null;
}

export function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  for (const plan of BILLING_PLANS) {
    const envPrice = process.env[plan.envPriceKey];
    if (envPrice && envPrice === priceId) {
      return plan.plan;
    }
  }
  return null;
}

export function getPlanDetails(planId: BillingPlanId) {
  return BILLING_PLANS.find((p) => p.id === planId) ?? null;
}

export function listAvailablePlans() {
  return BILLING_PLANS.map((plan) => ({
    ...plan,
    stripePriceConfigured: !!getStripePriceId(plan.id),
  }));
}
