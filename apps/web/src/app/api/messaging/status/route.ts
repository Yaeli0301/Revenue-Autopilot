import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/app-auth";
import { getMessagingProviderStatus } from "@/lib/messaging/config";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getMessagingProviderStatus());
}
