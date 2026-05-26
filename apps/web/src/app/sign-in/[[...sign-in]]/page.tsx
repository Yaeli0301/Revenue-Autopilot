import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getAuthContext } from "@/lib/app-auth";
import { DevAuthPage } from "@/components/auth/dev-auth-page";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClerkAuthPanel } from "@/components/auth/clerk-auth-panel";

export default async function SignInPage() {
  if (!isClerkConfigured()) {
    const ctx = await getAuthContext();
    if (ctx?.demoMode) redirect("/dashboard");
    if (ctx?.dbUser) redirect("/onboarding");

    return (
      <Suspense fallback={<p className="text-center p-8 text-muted-foreground">טוען...</p>}>
        <AuthShell mode="sign-in">
          <DevAuthPage mode="sign-in" />
        </AuthShell>
      </Suspense>
    );
  }

  return (
    <AuthShell mode="sign-in">
      <ClerkAuthPanel mode="sign-in" />
    </AuthShell>
  );
}
