import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getAuthContext } from "@/lib/app-auth";
import { DevAuthPage } from "@/components/auth/dev-auth-page";

export default async function SignInPage() {
  if (!isClerkConfigured()) {
    const ctx = await getAuthContext();
    if (ctx?.demoMode) redirect("/dashboard");
    if (ctx?.dbUser) redirect("/onboarding");

    return (
      <Suspense fallback={<p className="text-center p-8 text-muted-foreground">טוען...</p>}>
        <DevAuthPage mode="sign-in" />
      </Suspense>
    );
  }
  const { SignIn } = await import("@clerk/nextjs");

  return (
    <div className="flex min-h-screen items-center justify-center hero-glow">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/onboarding"
      />
    </div>
  );
}
