import type { MessageChannel, MessageStatus, MessageTemplate } from "@revenue-autopilot/lib/db";
import { prisma } from "@revenue-autopilot/lib/db";
import { createMessagePayload } from "@revenue-autopilot/lib";
import { dispatchMessage } from "./dispatch";

export interface SendOrganizationMessageInput {
  organizationId: string;
  appointmentId?: string;
  customerId?: string;
  template: MessageTemplate;
  channel: MessageChannel;
  recipient: string;
  body: string;
}

export interface SendOrganizationMessageResult {
  id: string;
  status: MessageStatus;
  duplicate?: boolean;
  error?: string;
  messageId?: string;
  devMode?: boolean;
}

export async function sendOrganizationMessage(
  input: SendOrganizationMessageInput
): Promise<SendOrganizationMessageResult> {
  const payload = createMessagePayload({
    organizationId: input.organizationId,
    appointmentId: input.appointmentId,
    template: input.template,
    channel: input.channel,
    recipient: input.recipient,
    body: input.body,
  });

  const existing = await prisma.messageSend.findUnique({
    where: { dedupeKey: payload.dedupeKey },
  });

  if (existing) {
    return {
      id: existing.id,
      status: existing.status,
      duplicate: true,
      error: existing.error ?? undefined,
    };
  }

  let record;
  try {
    record = await prisma.messageSend.create({
      data: {
        ...payload,
        customerId: input.customerId,
      },
    });
  } catch (err: unknown) {
    const isUniqueViolation =
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (isUniqueViolation) {
      const dup = await prisma.messageSend.findUnique({
        where: { dedupeKey: payload.dedupeKey },
      });
      if (dup) {
        return {
          id: dup.id,
          status: dup.status,
          duplicate: true,
          error: dup.error ?? undefined,
        };
      }
    }
    throw err;
  }

  const result = await dispatchMessage({
    channel: input.channel,
    recipient: input.recipient,
    body: input.body,
    template: input.template,
  });

  const status: MessageStatus = result.success ? "SENT" : "FAILED";

  await prisma.messageSend.update({
    where: { id: record.id },
    data: {
      status,
      sentAt: result.success ? new Date() : undefined,
      error: result.error,
      metadata: {
        provider: result.provider,
        messageSid: result.messageId,
        devMode: result.devMode ?? false,
        twilioCode: result.code,
      },
    },
  });

  if (!result.success) {
    await prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        action: "MESSAGE_SEND_FAILED",
        entityType: "MessageSend",
        entityId: record.id,
        metadata: {
          channel: input.channel,
          template: input.template,
          error: result.error,
          code: result.code,
        },
      },
    });
  }

  return {
    id: record.id,
    status,
    error: result.error,
    messageId: result.messageId,
    devMode: result.devMode,
  };
}
