import type { User } from "@clerk/nextjs/server";
import { prisma } from "@revenue-autopilot/lib/db";

export async function ensureUser(clerkUser: User) {
  const email =
    clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUser.id}@unknown.local`;

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
    },
    update: {
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
    },
  });
}

export async function getCurrentOrg(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.organization ?? null;
}
