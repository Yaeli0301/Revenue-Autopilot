import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getAuthContext } from "@/lib/app-auth";
import { DevAuthPage } from "@/components/auth/dev-auth-page";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClerkAuthPanel } from "@/components/auth/clerk-auth-panel";

export default async function SignUpPage() {
  if (!isClerkConfigured()) {
    const ctx = await getAuthContext();
    if (ctx?.demoMode) redirect("/dashboard");
    if (ctx?.dbUser) redirect("/onboarding");

    return (
      <Suspense fallback={<p className="text-center p-8 text-muted-foreground">טוען...</p>}>
        <AuthShell mode="sign-up">
          <DevAuthPage mode="sign-up" />
        </AuthShell>
      </Suspense>
    );
  }

  return (
    <AuthShell mode="sign-up">
      <ClerkAuthPanel mode="sign-up" />
    </AuthShell>
  );
}
