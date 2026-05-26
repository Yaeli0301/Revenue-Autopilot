import { redirect } from "next/navigation";
import { getTrialDaysRemaining, isTrialActive } from "@revenue-autopilot/lib";
import { getCurrentOrg } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardMetrics } from "@/lib/metrics";
import { getUpcomingAppointments } from "@/lib/appointments";
import { getAuthContext } from "@/lib/app-auth";
import { isClerkConfigured } from "@/lib/clerk-config";
import {
  getDemoAppointments,
  getDemoDashboardMetrics,
  getDemoOrgName,
} from "@/lib/demo-fallback";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { activated?: string; welcome?: string };
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-up");

  if (ctx.demoMode) {
    return (
      <AppShell orgName={getDemoOrgName(ctx.demoProfile)} devMode={!isClerkConfigured()}>
        <DashboardView
          metrics={getDemoDashboardMetrics()}
          appointments={getDemoAppointments()}
          autopilotActive={false}
          justActivated={searchParams.welcome === "1" || searchParams.activated === "1"}
          fallbackDemoMode
        />
      </AppShell>
    );
  }

  if (!ctx.dbUser) redirect("/sign-up");

  const org = await getCurrentOrg(ctx.dbUser.id);
  if (!org) redirect("/onboarding");
  if (!org.onboardingDone) redirect("/onboarding");

  const [metrics, appointments] = await Promise.all([
    getDashboardMetrics(org.id),
    getUpcomingAppointments(org.id),
  ]);

  const trialDaysRemaining = getTrialDaysRemaining(org);
  const onTrial = isTrialActive(org);

  return (
    <AppShell orgName={org.name} devMode={!isClerkConfigured()}>
      <DashboardView
        metrics={metrics}
        appointments={appointments}
        autopilotActive={org.autopilotActive}
        justActivated={searchParams.activated === "1"}
        trialDaysRemaining={trialDaysRemaining}
        onTrial={onTrial}
      />
    </AppShell>
  );
}
