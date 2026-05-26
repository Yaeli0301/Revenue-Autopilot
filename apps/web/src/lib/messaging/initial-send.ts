import { prisma } from "@revenue-autopilot/lib/db";
import {
  routeChannel,
  renderTemplate,
  createActionToken,
  buildActionUrl,
} from "@revenue-autopilot/lib";
import { sendOrganizationMessage } from "./send";
import { formatInTimeZone } from "date-fns-tz";

async function buildActionUrls(
  appointmentId: string,
  customerId: string,
  organizationId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [confirmToken, cancelToken] = await Promise.all([
    createActionToken({
      appointmentId,
      action: "confirm",
      customerId,
      organizationId,
    }),
    createActionToken({
      appointmentId,
      action: "cancel",
      customerId,
      organizationId,
    }),
  ]);

  return {
    confirmUrl: buildActionUrl(baseUrl, "confirm", confirmToken),
    cancelUrl: buildActionUrl(baseUrl, "cancel", cancelToken),
  };
}

/** Send first confirmation messages for upcoming appointments after activation. */
export async function sendInitialConfirmations(
  organizationId: string
): Promise<number> {
  const appointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      status: "SCHEDULED",
      startTime: { gt: new Date() },
    },
    include: { customer: true, organization: true },
    take: 20,
  });

  let sent = 0;

  for (const appointment of appointments) {
    const routed = routeChannel(appointment.customer);
    if (!routed) continue;

    const { confirmUrl, cancelUrl } = await buildActionUrls(
      appointment.id,
      appointment.customerId,
      organizationId
    );

    const body = renderTemplate("CONFIRM", {
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
      confirmUrl,
      cancelUrl,
    });

    const result = await sendOrganizationMessage({
      organizationId,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      template: "CONFIRM",
      channel: routed.channel,
      recipient: routed.recipient,
      body,
    });

    if (result.status === "SENT" && !result.duplicate) {
      sent++;
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "AT_RISK" },
      });
    }
  }

  return sent;
}

export { buildActionUrls };
