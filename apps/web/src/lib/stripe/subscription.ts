import type { Organization, SubscriptionPlan, SubscriptionStatus } from "@revenue-autopilot/lib/db";
import { prisma } from "@revenue-autopilot/lib/db";
import {
  getTrialDaysRemaining,
  isSubscriptionActive,
  isTrialActive,
} from "@revenue-autopilot/lib";
import type Stripe from "stripe";
import { getPlanFromPriceId } from "./plans";

export interface BillingStatus {
  active: boolean;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialDaysRemaining: number;
  onTrial: boolean;
  stripeConfigured: boolean;
  hasStripeCustomer: boolean;
  canManageBilling: boolean;
}

export function getBillingStatus(org: Organization): BillingStatus {
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

  return {
    active: isSubscriptionActive(org),
    plan: org.subscriptionPlan,
    status: org.subStatus,
    trialDaysRemaining: getTrialDaysRemaining(org),
    onTrial: isTrialActive(org),
    stripeConfigured,
    hasStripeCustomer: !!org.stripeCustomerId,
    canManageBilling: stripeConfigured && !!org.stripeCustomerId,
  };
}

export async function assertOrganizationBillingActive(
  organizationId: string
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) {
    throw new Error("Organization not found");
  }
  if (!isSubscriptionActive(org)) {
    throw new Error("Subscription inactive — upgrade to continue");
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELLED";
    default:
      return "TRIALING";
  }
}

export async function syncOrganizationFromStripeSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const organizationId = subscription.metadata.organizationId;
  if (!organizationId) {
    console.warn("[stripe] subscription missing organizationId metadata");
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : null;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubId: subscription.id,
      subStatus: mapStripeStatus(subscription.status),
      subscriptionPlan: plan ?? undefined,
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      action: "SUBSCRIPTION_SYNCED",
      entityType: "Subscription",
      entityId: subscription.id,
      metadata: {
        status: subscription.status,
        plan,
        priceId,
      },
    },
  });
}

export async function getOrCreateStripeCustomer(params: {
  organizationId: string;
  orgName: string;
  email: string;
  existingCustomerId?: string | null;
  stripe: import("stripe").default;
}): Promise<string> {
  if (params.existingCustomerId) {
    return params.existingCustomerId;
  }

  const customer = await params.stripe.customers.create({
    name: params.orgName,
    email: params.email,
    metadata: { organizationId: params.organizationId },
  });

  await prisma.organization.update({
    where: { id: params.organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
