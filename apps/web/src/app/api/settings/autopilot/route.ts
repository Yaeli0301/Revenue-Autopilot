import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";
import {
  scheduleRemindersForOrganization,
  cancelRemindersForOrganization,
} from "@/lib/jobs/schedule";
import { z } from "zod";

const schema = z.object({ active: z.boolean() });

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) return NextResponse.json({ ok: false, error: "No organization" }, { status: 404 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { autopilotActive: parsed.data.active },
    });

    let remindersScheduled = 0;
    if (parsed.data.active) {
      remindersScheduled = await scheduleRemindersForOrganization(org.id);
    } else {
      await cancelRemindersForOrganization(org.id);
    }

    return NextResponse.json({ ok: true, remindersScheduled });
  } catch (error) {
    console.error("Autopilot toggle error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
