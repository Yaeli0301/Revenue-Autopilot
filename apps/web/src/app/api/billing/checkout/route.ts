import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import {
  getStripe,
  getStripePriceId,
  getOrCreateStripeCustomer,
  getAppUrl,
  isStripeConfigured,
} from "@/lib/stripe";

const schema = z.object({
  planId: z.enum(["starter", "pro"]),
});

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) {
      return NextResponse.json({ error: "No organization" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = getStripePriceId(parsed.data.planId);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Price not configured for plan ${parsed.data.planId}. Set STRIPE_PRICE_${parsed.data.planId.toUpperCase()} in env.`,
        },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const customerId = await getOrCreateStripeCustomer({
      organizationId: org.id,
      orgName: org.name,
      email: ctx!.dbUser!.email,
      existingCustomerId: org.stripeCustomerId,
      stripe,
    });

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/billing?cancelled=1`,
      metadata: { organizationId: org.id, planId: parsed.data.planId },
      subscription_data: {
        metadata: { organizationId: org.id, planId: parsed.data.planId },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
