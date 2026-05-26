import { prisma } from "@revenue-autopilot/lib/db";

import {

  routeChannel,

  renderTemplate,

  isSubscriptionActive,

} from "@revenue-autopilot/lib";

import type { MessageTemplate } from "@revenue-autopilot/lib/db";

import { sendOrganizationMessage } from "./send";

import { buildActionUrls } from "./initial-send";

import { formatInTimeZone } from "date-fns-tz";



export async function sendAppointmentReminder(params: {

  appointmentId: string;

  organizationId: string;

  template: Extract<MessageTemplate, "REMINDER_24H" | "REMINDER_3H" | "CONFIRM">;

}): Promise<{ sent: boolean; skipped?: string; error?: string }> {

  const appointment = await prisma.appointment.findFirst({

    where: {

      id: params.appointmentId,

      organizationId: params.organizationId,

    },

    include: { customer: true, organization: true },

  });



  if (!appointment) {

    return { sent: false, skipped: "appointment_not_found" };

  }



  if (!["SCHEDULED", "AT_RISK"].includes(appointment.status)) {

    return { sent: false, skipped: `status_${appointment.status}` };

  }



  if (!appointment.organization.autopilotActive) {

    return { sent: false, skipped: "autopilot_inactive" };

  }



  if (!isSubscriptionActive(appointment.organization)) {

    return { sent: false, skipped: "subscription_inactive" };

  }



  const routed = routeChannel(appointment.customer);

  if (!routed) {

    return { sent: false, skipped: "no_contact" };

  }



  const { confirmUrl, cancelUrl } = await buildActionUrls(

    appointment.id,

    appointment.customerId,

    appointment.organizationId

  );



  const body = renderTemplate(params.template, {

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

    organizationId: appointment.organizationId,

    appointmentId: appointment.id,

    customerId: appointment.customerId,

    template: params.template,

    channel: routed.channel,

    recipient: routed.recipient,

    body,

  });



  if (result.status === "SENT" && appointment.status === "SCHEDULED") {

    await prisma.appointment.update({

      where: { id: appointment.id },

      data: { status: "AT_RISK" },

    });

  }



  return {

    sent: result.status === "SENT",

    error: result.error,

  };

}


