import type { MessageChannel, MessageTemplate } from "@prisma/client";
import { buildDedupeKey } from "../utils";
import { normalizePhone } from "./phone";

export { normalizePhone, isValidPhone } from "./phone";

export interface CustomerContact {
  phone?: string | null;
  email?: string | null;
  whatsappOptIn?: boolean;
}

export interface RouteChannelOptions {
  /** WhatsApp only when explicitly enabled (env or option). SMS is default. */
  enableWhatsApp?: boolean;
}

export interface RoutedChannel {
  channel: MessageChannel;
  recipient: string;
}

export function routeChannel(
  customer: CustomerContact,
  options?: RouteChannelOptions
): RoutedChannel | null {
  const enableWhatsApp =
    options?.enableWhatsApp ??
    (typeof process !== "undefined" &&
      process.env?.MESSAGING_ENABLE_WHATSAPP === "true");

  const phone = customer.phone ? normalizePhone(customer.phone) : null;
  const email = customer.email?.trim().toLowerCase();

  if (enableWhatsApp && customer.whatsappOptIn && phone) {
    return { channel: "WHATSAPP", recipient: phone };
  }
  if (phone) {
    return { channel: "SMS", recipient: phone };
  }
  if (email) {
    return { channel: "EMAIL", recipient: email };
  }
  return null;
}

const TEMPLATE_BODIES: Record<MessageTemplate, (ctx: TemplateContext) => string> = {
  CONFIRM: (ctx) =>
    `שלום ${ctx.customerName}! יש לך תור ב-${ctx.date} בשעה ${ctx.time}.\n` +
    `לאשר הגעה: ${ctx.confirmUrl}\n` +
    `לביטול: ${ctx.cancelUrl ?? ""}`,
  CANCEL_SUCCESS: (ctx) =>
    `שלום ${ctx.customerName}, הביטול לתור ב-${ctx.date} אושר. תודה רבה!`,
  SLOT_AVAILABLE: (ctx) =>
    `שלום ${ctx.customerName}! נפתח תור ב-${ctx.date} בשעה ${ctx.time}.\n` +
    `לתפוס את המקום עכשיו: ${ctx.claimUrl}`,
  SLOT_TAKEN: (ctx) =>
    `שלום ${ctx.customerName}, התור ב-${ctx.date} כבר נתפס. נעדכן אותך כשיפתח מקום.`,
  REMINDER_24H: (ctx) =>
    `שלום ${ctx.customerName}! מחר ב-${ctx.time} יש לך תור.\n` +
    `לאשר: ${ctx.confirmUrl}\n` +
    `לביטול: ${ctx.cancelUrl ?? ""}`,
  REMINDER_3H: (ctx) =>
    `שלום ${ctx.customerName}! בעוד 3 שעות יש לך תור ב-${ctx.time}.\n` +
    `לאשר: ${ctx.confirmUrl}\n` +
    `לביטול: ${ctx.cancelUrl ?? ""}`,
};

export interface TemplateContext {
  customerName: string;
  date: string;
  time: string;
  confirmUrl?: string;
  cancelUrl?: string;
  claimUrl?: string;
}

export function renderTemplate(
  template: MessageTemplate,
  ctx: TemplateContext
): string {
  return TEMPLATE_BODIES[template](ctx);
}

export function createMessagePayload(params: {
  organizationId: string;
  appointmentId?: string;
  template: MessageTemplate;
  channel: MessageChannel;
  recipient: string;
  body: string;
}) {
  return {
    ...params,
    dedupeKey: buildDedupeKey({
      organizationId: params.organizationId,
      appointmentId: params.appointmentId,
      template: params.template,
      channel: params.channel,
      recipient: params.recipient,
    }),
    status: "PENDING" as const,
  };
}
