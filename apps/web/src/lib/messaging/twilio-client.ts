import twilio from "twilio";
import type { MessageChannel } from "@revenue-autopilot/lib/db";
import { getMessagingConfig, isTwilioSmsConfigured, isTwilioWhatsAppConfigured } from "./config";

let client: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  const { twilio: cfg } = getMessagingConfig();
  if (!cfg.accountSid || !cfg.authToken) {
    throw new Error("Twilio credentials not configured");
  }
  if (!client) {
    client = twilio(cfg.accountSid, cfg.authToken);
  }
  return client;
}

export function getTwilioStatusCallbackUrl(): string | undefined {
  const { appUrl, mode } = getMessagingConfig();
  if (mode === "dev") return undefined;
  return `${appUrl}/api/webhooks/twilio/status`;
}

export interface TwilioSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: number;
  provider: "twilio";
}

export async function sendTwilioMessage(params: {
  channel: MessageChannel;
  to: string;
  body: string;
}): Promise<TwilioSendResult> {
  const { twilio: cfg } = getMessagingConfig();

  if (params.channel === "SMS") {
    if (!isTwilioSmsConfigured()) {
      return {
        success: false,
        error: "Twilio SMS not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)",
        provider: "twilio",
      };
    }

    try {
      const message = await getTwilioClient().messages.create({
        body: params.body,
        from: cfg.fromNumber!,
        to: params.to,
        statusCallback: getTwilioStatusCallbackUrl(),
      });
      return {
        success: true,
        messageId: message.sid,
        provider: "twilio",
      };
    } catch (err) {
      return mapTwilioError(err);
    }
  }

  if (params.channel === "WHATSAPP") {
    if (!isTwilioWhatsAppConfigured()) {
      return {
        success: false,
        error: "Twilio WhatsApp not configured",
        provider: "twilio",
      };
    }

    try {
      const message = await getTwilioClient().messages.create({
        body: params.body,
        from: `whatsapp:${cfg.whatsappNumber}`,
        to: `whatsapp:${params.to}`,
        statusCallback: getTwilioStatusCallbackUrl(),
      });
      return {
        success: true,
        messageId: message.sid,
        provider: "twilio",
      };
    } catch (err) {
      return mapTwilioError(err);
    }
  }

  return {
    success: false,
    error: `Twilio does not support channel ${params.channel}`,
    provider: "twilio",
  };
}

function mapTwilioError(err: unknown): TwilioSendResult {
  const twilioErr = err as { code?: number; message?: string; moreInfo?: string };
  const message =
    twilioErr.message ??
    (err instanceof Error ? err.message : "Twilio send failed");

  return {
    success: false,
    error: message,
    code: twilioErr.code,
    provider: "twilio",
  };
}

export function validateTwilioWebhook(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const { twilio: cfg } = getMessagingConfig();
  if (!cfg.authToken || !signature) return false;
  return twilio.validateRequest(cfg.authToken, signature, url, params);
}
