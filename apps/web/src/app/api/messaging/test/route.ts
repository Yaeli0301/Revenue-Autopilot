import { NextResponse } from "next/server";
import { normalizePhone } from "@revenue-autopilot/lib";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import { getMessagingProviderStatus } from "@/lib/messaging/config";
import { sendOrganizationMessage } from "@/lib/messaging/send";
import { z } from "zod";

const testSchema = z.object({
  phone: z.string().min(9),
});

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) {
      return NextResponse.json({ error: "No organization" }, { status: 404 });
    }

    const providerStatus = getMessagingProviderStatus();
    if (providerStatus.mode === "production" && !providerStatus.sms.ready) {
      return NextResponse.json(
        { error: "Twilio SMS not configured for production mode" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const recipient = normalizePhone(parsed.data.phone);
    if (!recipient) {
      return NextResponse.json(
        { error: "Could not normalize phone number to E.164" },
        { status: 400 }
      );
    }

    const result = await sendOrganizationMessage({
      organizationId: org.id,
      template: "CONFIRM",
      channel: "SMS",
      recipient,
      body: `Revenue Autopilot — הודעת בדיקה מ-${org.name}. אם קיבלת את זה, SMS פעיל ✓`,
    });

    return NextResponse.json({
      id: result.id,
      status: result.status,
      recipient,
      messageId: result.messageId,
      devMode: result.devMode,
      error: result.error,
    });
  } catch (error) {
    console.error("Test SMS error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
