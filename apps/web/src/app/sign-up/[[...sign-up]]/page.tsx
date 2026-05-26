import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getAuthContext } from "@/lib/app-auth";
import { DevAuthPage } from "@/components/auth/dev-auth-page";

export default async function SignUpPage() {
  if (!isClerkConfigured()) {
    const ctx = await getAuthContext();
    if (ctx?.demoMode) redirect("/dashboard");
    if (ctx?.dbUser) redirect("/onboarding");

    return (
      <Suspense fallback={<p className="text-center p-8 text-muted-foreground">טוען...</p>}>
        <DevAuthPage mode="sign-up" />
      </Suspense>
    );
  }

  const { SignUp } = await import("@clerk/nextjs");

  return (
    <div className="flex min-h-screen items-center justify-center hero-glow">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
      />
    </div>
  );
}
