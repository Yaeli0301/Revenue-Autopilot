import type { MessageChannel, MessageTemplate } from "@revenue-autopilot/lib/db";
import { Resend } from "resend";
import {
  getMessagingConfig,
  getMessagingMode,
  isEmailConfigured,
  isTwilioSmsConfigured,
} from "./config";
import { sendTwilioMessage } from "./twilio-client";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: number;
  provider?: "twilio" | "resend" | "dev";
  devMode?: boolean;
}

export async function sendViaChannel(
  channel: MessageChannel,
  recipient: string,
  body: string
): Promise<SendResult> {
  switch (channel) {
    case "SMS":
    case "WHATSAPP":
      return sendPhoneMessage(channel, recipient, body);
    case "EMAIL":
      return sendEmail(recipient, body);
    default:
      return { success: false, error: "Unknown channel" };
  }
}

async function sendPhoneMessage(
  channel: MessageChannel,
  recipient: string,
  body: string
): Promise<SendResult> {
  const mode = getMessagingMode();
  const smsConfigured = isTwilioSmsConfigured();

  if (mode === "production" || smsConfigured) {
    const result = await sendTwilioMessage({ channel, to: recipient, body });
    if (!result.success && mode === "production") {
      return result;
    }
    if (result.success) {
      return result;
    }
    if (mode === "production") {
      return result;
    }
  }

  if (mode === "dev") {
    console.log(`[DEV ${channel}] To: ${recipient}\n${body}`);
    return {
      success: true,
      messageId: `dev-${channel.toLowerCase()}-${Date.now()}`,
      provider: "dev",
      devMode: true,
    };
  }

  return {
    success: false,
    error:
      "SMS delivery requires Twilio configuration. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER and MESSAGING_MODE=production",
    provider: "twilio",
  };
}

async function sendEmail(to: string, body: string): Promise<SendResult> {
  const { resendApiKey, resendFromEmail, mode } = getMessagingConfig();

  if (!isEmailConfigured()) {
    if (mode === "dev") {
      console.log(`[DEV EMAIL] To: ${to}\n${body}`);
      return {
        success: true,
        messageId: `dev-email-${Date.now()}`,
        provider: "dev",
        devMode: true,
      };
    }
    return {
      success: false,
      error: "Email delivery requires RESEND_API_KEY",
      provider: "resend",
    };
  }

  const resend = new Resend(resendApiKey);
  const { data, error } = await resend.emails.send({
    from:
      resendFromEmail ??
      "Revenue Autopilot <noreply@revenueautopilot.com>",
    to,
    subject: "Revenue Autopilot — עדכון תור",
    text: body,
  });

  if (error) {
    return { success: false, error: error.message, provider: "resend" };
  }
  return { success: true, messageId: data?.id, provider: "resend" };
}

export async function dispatchMessage(params: {
  channel: MessageChannel;
  recipient: string;
  body: string;
  template: MessageTemplate;
}): Promise<SendResult> {
  return sendViaChannel(params.channel, params.recipient, params.body);
}
