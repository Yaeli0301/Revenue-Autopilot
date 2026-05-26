import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import { onboardingSchema } from "@revenue-autopilot/lib";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";

export async function PATCH(req: Request) {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) {
      return NextResponse.json({ error: "No organization" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = onboardingSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
