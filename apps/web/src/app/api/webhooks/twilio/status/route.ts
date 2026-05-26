import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import type { MessageStatus } from "@revenue-autopilot/lib/db";
import { validateTwilioWebhook } from "@/lib/messaging/twilio-client";

function mapTwilioStatus(twilioStatus: string): MessageStatus {
  switch (twilioStatus) {
    case "delivered":
      return "DELIVERED";
    case "failed":
    case "undelivered":
      return "FAILED";
    case "sent":
    case "queued":
    case "sending":
    case "accepted":
      return "SENT";
    default:
      return "SENT";
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = String(value);
    });

    const signature = req.headers.get("x-twilio-signature");
    const url = req.url;

    if (process.env.TWILIO_AUTH_TOKEN) {
      const valid = validateTwilioWebhook(signature, url, params);
      if (!valid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;
    const errorCode = params.ErrorCode;
    const errorMessage = params.ErrorMessage;

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const status = mapTwilioStatus(messageStatus);

    const messages = await prisma.messageSend.findMany({
      where: {
        metadata: {
          path: ["messageSid"],
          equals: messageSid,
        },
      },
      take: 1,
    });

    const message = messages[0];
    if (message) {
      await prisma.messageSend.update({
        where: { id: message.id },
        data: {
          status,
          error:
            status === "FAILED"
              ? `${errorCode ?? "unknown"}: ${errorMessage ?? "delivery failed"}`
              : undefined,
          metadata: {
            ...(typeof message.metadata === "object" && message.metadata !== null
              ? (message.metadata as Record<string, unknown>)
              : {}),
            twilioStatus: messageStatus,
            twilioErrorCode: errorCode,
          },
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
