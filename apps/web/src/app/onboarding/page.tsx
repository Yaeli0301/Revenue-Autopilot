import { redirect } from "next/navigation";
import { prisma } from "@revenue-autopilot/lib/db";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { DemoConnectView } from "@/components/onboarding/demo-connect-view";
import { getAuthContext } from "@/lib/app-auth";
import { Suspense } from "react";

export default async function OnboardingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-up");

  if (ctx.demoMode) {
    return <DemoConnectView />;
  }

  if (!ctx.dbUser) redirect("/sign-up");

  const membership = await prisma.membership.findFirst({
    where: { userId: ctx.dbUser.id },
    include: { organization: true },
  });

  if (membership?.organization.onboardingDone) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen hero-glow">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ברוכים הבאים 👋</h1>
          <p className="text-muted-foreground">
            שם העסק — ומיד מתחילים. 3 שלבים, 5 דקות, והמערכת עובדת
          </p>
        </div>
        <Suspense fallback={<p className="text-center text-muted-foreground">טוען...</p>}>
          <OnboardingWizard existingOrg={membership?.organization ?? null} />
        </Suspense>
      </div>
    </div>
  );
}
