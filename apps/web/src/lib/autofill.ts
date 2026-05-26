import { prisma } from "@revenue-autopilot/lib/db";
import { claimSlot } from "@revenue-autopilot/lib/claim";
import {
  routeChannel,
  renderTemplate,
  createActionToken,
  buildActionUrl,
} from "@revenue-autopilot/lib";
import { sendOrganizationMessage } from "@/lib/messaging/send";
import { scheduleAppointmentReminders } from "@/lib/jobs/schedule";
import { formatInTimeZone } from "date-fns-tz";

export async function handleCancellation(appointmentId: string, organizationId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId },
    include: { organization: true, customer: true },
  });

  if (!appointment) return;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  const cancelledCustomer = routeChannel(appointment.customer);
  if (cancelledCustomer) {
    await sendOrganizationMessage({
      organizationId,
      appointmentId,
      customerId: appointment.customerId,
      template: "CANCEL_SUCCESS",
      channel: cancelledCustomer.channel,
      recipient: cancelledCustomer.recipient,
      body: renderTemplate("CANCEL_SUCCESS", {
        customerName: appointment.customer.name,
        date: formatInTimeZone(
          appointment.startTime,
          appointment.organization.timezone,
          "dd/MM"
        ),
        time: formatInTimeZone(
          appointment.startTime,
          appointment.organization.timezone,
          "HH:mm"
        ),
      }),
    });
  }

  const rule = await prisma.automationRule.findFirst({
    where: { organizationId, enabled: true },
  });

  const topN = rule?.autofillTopN ?? 3;

  const waitlist = await prisma.waitlistEntry.findMany({
    where: { organizationId, active: true },
    include: { customer: true },
    orderBy: { priority: "asc" },
    take: topN,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const entry of waitlist) {
    const routed = routeChannel(entry.customer);
    if (!routed) continue;

    const claimToken = await createActionToken({
      appointmentId,
      action: "claim",
      customerId: entry.customerId,
      organizationId,
    });

    const claimUrl = buildActionUrl(baseUrl, "claim", claimToken);

    await sendOrganizationMessage({
      organizationId,
      appointmentId,
      customerId: entry.customerId,
      template: "SLOT_AVAILABLE",
      channel: routed.channel,
      recipient: routed.recipient,
      body: renderTemplate("SLOT_AVAILABLE", {
        customerName: entry.customer.name,
        date: formatInTimeZone(
          appointment.startTime,
          appointment.organization.timezone,
          "dd/MM"
        ),
        time: formatInTimeZone(
          appointment.startTime,
          appointment.organization.timezone,
          "HH:mm"
        ),
        claimUrl,
      }),
    });
  }

  await prisma.auditEvent.create({
    data: {
      organizationId,
      action: "APPOINTMENT_CANCELLED",
      entityType: "Appointment",
      entityId: appointmentId,
      metadata: { waitlistNotified: waitlist.length },
    },
  });
}

export async function handleClaim(
  appointmentId: string,
  customerId: string,
  organizationId: string
) {
  const result = await claimSlot(prisma, {
    appointmentId,
    customerId,
    organizationId,
  });

  if (!result.success) return result;

  await scheduleAppointmentReminders(appointmentId);

  const waitlist = await prisma.waitlistEntry.findMany({
    where: {
      organizationId,
      active: true,
      customerId: { not: customerId },
    },
    include: { customer: true },
  });

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { organization: true },
  });

  if (appointment) {
    for (const entry of waitlist) {
      const routed = routeChannel(entry.customer);
      if (!routed) continue;

      await sendOrganizationMessage({
        organizationId,
        appointmentId,
        customerId: entry.customerId,
        template: "SLOT_TAKEN",
        channel: routed.channel,
        recipient: routed.recipient,
        body: renderTemplate("SLOT_TAKEN", {
          customerName: entry.customer.name,
          date: formatInTimeZone(
            appointment.startTime,
            appointment.organization.timezone,
            "dd/MM"
          ),
          time: formatInTimeZone(
            appointment.startTime,
            appointment.organization.timezone,
            "HH:mm"
          ),
        }),
      });
    }
  }

  await prisma.auditEvent.create({
    data: {
      organizationId,
      action: "SLOT_CLAIMED",
      entityType: "Appointment",
      entityId: appointmentId,
      metadata: { winnerId: customerId },
    },
  });

  return result;
}
