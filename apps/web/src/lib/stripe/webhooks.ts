import { prisma } from "@revenue-autopilot/lib/db";
import type Stripe from "stripe";
import { syncOrganizationFromStripeSubscription } from "./subscription";
import {
  resolveOrganizationIdFromStripeInvoice,
  upsertInvoiceFromStripe,
} from "./invoices";

export async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: {
      provider_eventId: {
        provider: "stripe",
        eventId,
      },
    },
  });
  return !!existing;
}

export async function markWebhookProcessed(
  eventId: string,
  type: string
): Promise<void> {
  await prisma.webhookEvent.create({
    data: {
      provider: "stripe",
      eventId,
      type,
    },
  });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const organizationId = session.metadata?.organizationId;
      if (!organizationId) break;

      const stripe = (await import("./client")).getStripe();
      const subscription = await stripe.subscriptions.retrieve(
        String(session.subscription)
      );

      await syncOrganizationFromStripeSubscription({
        ...subscription,
        metadata: { ...subscription.metadata, organizationId },
      });

      const latestInvoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 1,
      });
      const latestInvoice = latestInvoices.data[0];
      if (latestInvoice) {
        await upsertInvoiceFromStripe(latestInvoice, organizationId);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncOrganizationFromStripeSubscription(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata.organizationId;
      if (!organizationId) break;

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subStatus: "CANCELLED",
          stripeSubId: null,
          subscriptionPlan: "FREE",
        },
      });

      await prisma.auditEvent.create({
        data: {
          organizationId,
          action: "SUBSCRIPTION_CANCELLED",
          entityType: "Subscription",
          entityId: subscription.id,
        },
      });
      break;
    }

    case "invoice.paid":
    case "invoice.finalized": {
      const invoice = event.data.object as Stripe.Invoice;
      const organizationId = await resolveOrganizationIdFromStripeInvoice(invoice);
      if (!organizationId) break;
      await upsertInvoiceFromStripe(invoice, organizationId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const organizationId = invoice.metadata?.organizationId;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      let orgId = organizationId;
      if (!orgId && customerId) {
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        orgId = org?.id;
      }

      if (!orgId) break;

      await prisma.organization.update({
        where: { id: orgId },
        data: { subStatus: "PAST_DUE" },
      });
      break;
    }

    default:
      break;
  }
}

export async function processStripeWebhookEvent(
  event: Stripe.Event
): Promise<{ duplicate: boolean }> {
  if (await isWebhookProcessed(event.id)) {
    return { duplicate: true };
  }

  await handleStripeEvent(event);
  await markWebhookProcessed(event.id, event.type);
  return { duplicate: false };
}
