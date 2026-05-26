"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

interface ClerkAuthPanelProps {
  mode: "sign-in" | "sign-up";
}

export function ClerkAuthPanel({ mode }: ClerkAuthPanelProps) {
  if (mode === "sign-up") {
    return (
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
        appearance={clerkAppearance}
      />
    );
  }

  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      forceRedirectUrl="/onboarding"
      appearance={clerkAppearance}
    />
  );
}
