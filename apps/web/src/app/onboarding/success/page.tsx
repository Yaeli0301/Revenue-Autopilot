import { redirect } from "next/navigation";
import { prisma } from "@revenue-autopilot/lib/db";
import { ActivationSuccess } from "@/components/onboarding/activation-success";
import { getAuthContext } from "@/lib/app-auth";

export default async function OnboardingSuccessPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-up");
  if (ctx.demoMode || !ctx.dbUser) redirect("/dashboard");

  const membership = await prisma.membership.findFirst({
    where: { userId: ctx.dbUser.id },
    include: { organization: true },
  });

  if (!membership?.organization.onboardingDone) {
    redirect("/onboarding");
  }

  return <ActivationSuccess orgName={membership.organization.name} />;
}
