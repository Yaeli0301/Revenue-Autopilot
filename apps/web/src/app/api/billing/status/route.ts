import { NextResponse } from "next/server";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import {
  getBillingStatus,
  isStripeConfigured,
  listAvailablePlans,
} from "@/lib/stripe";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) {
      return NextResponse.json({ ok: false, error: "No organization" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      billing: getBillingStatus(org),
      plans: listAvailablePlans(),
      stripeConfigured: isStripeConfigured(),
    });
  } catch (error) {
    console.error("Billing status error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
