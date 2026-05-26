import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import { onboardingSchema, slugify } from "@revenue-autopilot/lib";
import { getAuthContext } from "@/lib/app-auth";
import { requireDbUser } from "@/lib/api-guards";

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const dbUser = ctx!.dbUser!;
    const existing = await prisma.membership.findFirst({
      where: { userId: dbUser.id },
    });
    if (existing) {
      return NextResponse.json({ ok: true, organizationId: existing.organizationId });
    }

    const data = parsed.data;
    let slug = slugify(data.name);
    const slugExists = await prisma.organization.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug,
        industry: data.industry,
        avgPrice: data.avgPrice,
        timezone: data.timezone,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        memberships: {
          create: { userId: dbUser.id, role: "OWNER" },
        },
        automationRules: {
          create: {
            name: "Default",
            reminder24h: true,
            reminder3h: true,
            autofillTopN: 3,
          },
        },
      },
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: org.id,
        userId: dbUser.id,
        action: "ORG_CREATED",
        entityType: "Organization",
        entityId: org.id,
      },
    });

    return NextResponse.json({ ok: true, organizationId: org.id });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
