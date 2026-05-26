import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { getAuthContext } from "@/lib/app-auth";
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function SettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-up");
  if (ctx.demoMode) redirect("/dashboard");
  if (!ctx.dbUser) redirect("/sign-up");

  const org = await getCurrentOrg(ctx.dbUser.id);
  if (!org?.onboardingDone) redirect("/onboarding");

  return (
    <AppShell orgName={org.name} devMode={!isClerkConfigured()}>
      <SettingsForm
        org={{
          id: org.id,
          name: org.name,
          avgPrice: org.avgPrice,
          timezone: org.timezone,
          quietHoursStart: org.quietHoursStart,
          quietHoursEnd: org.quietHoursEnd,
          autopilotActive: org.autopilotActive,
        }}
      />
    </AppShell>
  );
}
