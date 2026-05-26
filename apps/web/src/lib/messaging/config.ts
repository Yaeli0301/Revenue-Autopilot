export type MessagingMode = "dev" | "production";

export interface TwilioConfig {
  accountSid: string | undefined;
  authToken: string | undefined;
  fromNumber: string | undefined;
  whatsappNumber: string | undefined;
}

export interface MessagingConfig {
  mode: MessagingMode;
  twilio: TwilioConfig;
  resendApiKey: string | undefined;
  resendFromEmail: string | undefined;
  appUrl: string;
}

export function getMessagingMode(): MessagingMode {
  return process.env.MESSAGING_MODE === "production" ? "production" : "dev";
}

export function getMessagingConfig(): MessagingConfig {
  return {
    mode: getMessagingMode(),
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_PHONE_NUMBER,
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    },
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}

export function isTwilioSmsConfigured(): boolean {
  const { twilio } = getMessagingConfig();
  return !!(twilio.accountSid && twilio.authToken && twilio.fromNumber);
}

export function isTwilioWhatsAppConfigured(): boolean {
  const { twilio } = getMessagingConfig();
  return !!(
    twilio.accountSid &&
    twilio.authToken &&
    twilio.whatsappNumber
  );
}

export function isEmailConfigured(): boolean {
  const { resendApiKey } = getMessagingConfig();
  return !!resendApiKey;
}

export function getMessagingProviderStatus() {
  const mode = getMessagingMode();
  const smsReady = isTwilioSmsConfigured();
  const whatsappReady = isTwilioWhatsAppConfigured();
  const emailReady = isEmailConfigured();

  return {
    mode,
    sms: {
      configured: smsReady,
      provider: "twilio" as const,
      ready: mode === "dev" || smsReady,
    },
    whatsapp: {
      configured: whatsappReady,
      provider: "twilio" as const,
      enabled: process.env.MESSAGING_ENABLE_WHATSAPP === "true",
      ready:
        process.env.MESSAGING_ENABLE_WHATSAPP === "true" &&
        (mode === "dev" || whatsappReady),
    },
    email: {
      configured: emailReady,
      provider: "resend" as const,
      ready: mode === "dev" || emailReady,
    },
    productionReady: mode === "production" && smsReady,
  };
}
