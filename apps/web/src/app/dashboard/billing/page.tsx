import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentOrg } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { BillingView } from "@/components/billing/billing-view";
import { getAuthContext } from "@/lib/app-auth";
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function BillingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-up");
  if (ctx.demoMode) redirect("/dashboard");
  if (!ctx.dbUser) redirect("/sign-up");

  const org = await getCurrentOrg(ctx.dbUser.id);
  if (!org?.onboardingDone) redirect("/onboarding");

  return (
    <AppShell orgName={org.name} devMode={!isClerkConfigured()}>
      <Suspense fallback={<p className="text-muted-foreground">טוען...</p>}>
        <BillingView />
      </Suspense>
    </AppShell>
  );
}
