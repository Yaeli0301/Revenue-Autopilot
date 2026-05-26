import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import {
  routeChannel,
  renderTemplate,
  createActionToken,
  buildActionUrl,
  isWithinQuietHours,
  isSubscriptionActive,
  translateUserError,
} from "@revenue-autopilot/lib";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import { sendOrganizationMessage } from "@/lib/messaging/send";
import { getMessagingProviderStatus } from "@/lib/messaging/config";
import { buildActionUrls } from "@/lib/messaging/initial-send";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

const sendSchema = z.object({
  appointmentId: z.string(),
  template: z.enum([
    "CONFIRM",
    "CANCEL_SUCCESS",
    "SLOT_AVAILABLE",
    "SLOT_TAKEN",
    "REMINDER_24H",
    "REMINDER_3H",
  ]),
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
        { error: translateUserError("SMS provider not configured. Add Twilio credentials or set MESSAGING_MODE=dev for local testing.") },
        { status: 503 }
      );
    }

    if (!isSubscriptionActive(org)) {
      return NextResponse.json(
        { error: translateUserError("Subscription inactive — upgrade at /dashboard/billing") },
        { status: 402 }
      );
    }

    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: parsed.data.appointmentId, organizationId: org.id },
      include: { customer: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const hour = Number(formatInTimeZone(new Date(), org.timezone, "H"));
    if (isWithinQuietHours(hour, org.quietHoursStart, org.quietHoursEnd)) {
      return NextResponse.json(
        { error: translateUserError("Quiet hours — message will be sent when quiet hours end") },
        { status: 429 }
      );
    }

    const routed = routeChannel(appointment.customer);
    if (!routed) {
      return NextResponse.json(
        { error: translateUserError("No valid phone or email for customer") },
        { status: 400 }
      );
    }

    const { confirmUrl, cancelUrl } = await buildActionUrls(
      appointment.id,
      appointment.customerId,
      org.id
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const claimToken = await createActionToken({
      appointmentId: appointment.id,
      action: "claim",
      customerId: appointment.customerId,
      organizationId: org.id,
    });
    const claimUrl = buildActionUrl(baseUrl, "claim", claimToken);

    const messageBody = renderTemplate(parsed.data.template, {
      customerName: appointment.customer.name,
      date: formatInTimeZone(appointment.startTime, org.timezone, "dd/MM"),
      time: formatInTimeZone(appointment.startTime, org.timezone, "HH:mm"),
      confirmUrl,
      cancelUrl,
      claimUrl,
    });

    const result = await sendOrganizationMessage({
      organizationId: org.id,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      template: parsed.data.template,
      channel: routed.channel,
      recipient: routed.recipient,
      body: messageBody,
    });

    if (result.duplicate) {
      return NextResponse.json({
        message: "Already sent",
        id: result.id,
        status: result.status,
      });
    }

    if (parsed.data.template === "CONFIRM" && appointment.status === "SCHEDULED" && result.status === "SENT") {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "AT_RISK" },
      });
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      channel: routed.channel,
      messageId: result.messageId,
      devMode: result.devMode,
      error: result.error,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
