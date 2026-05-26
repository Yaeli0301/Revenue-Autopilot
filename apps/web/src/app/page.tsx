import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getAuthContext } from "@/lib/app-auth";

export default async function HomePage() {
  const ctx = await getAuthContext();
  if (ctx) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
