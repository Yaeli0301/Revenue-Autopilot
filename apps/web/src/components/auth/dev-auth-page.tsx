"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@revenue-autopilot/ui";
import { Loader2, Zap } from "lucide-react";
import Link from "next/link";

interface Props {
  mode?: "sign-in" | "sign-up";
}

export function DevAuthPage({ mode = "sign-up" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const plan = searchParams.get("plan");
  const nextParam = searchParams.get("next");
  const explicitDemo = searchParams.get("demo") === "1";

  function resolveRedirect(apiRedirect: string | undefined): string {
    const candidate = apiRedirect ?? nextParam ?? "/onboarding";
    if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\")) {
      return candidate;
    }
    return "/onboarding";
  }

  async function enterProduct() {
    setLoading(true);
    setPreparing(true);
    setError(null);

    try {
      const endpoint = explicitDemo ? "/api/dev/enter-demo" : "/api/dev/enter";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || undefined,
          email: email || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.ok === false) {
        setError(data.error ?? "לא הצלחנו להיכנס — נסו שוב");
        setPreparing(false);
        setLoading(false);
        return;
      }

      let dest = resolveRedirect(data.redirect);
      if (plan) {
        dest = `${dest}${dest.includes("?") ? "&" : "?"}plan=${encodeURIComponent(plan)}`;
      }
      router.push(dest);
      router.refresh();
    } catch {
      setError("שגיאת רשת — בדקו חיבור ונסו שוב");
      setPreparing(false);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl">
          {mode === "sign-up" ? "הפעילו את המערכת שלכם" : "כניסה למערכת"}
        </CardTitle>
        <CardDescription>
          {preparing
            ? "מכינים את המערכת שלכם…"
            : mode === "sign-up"
              ? "14 יום חינם — בלי כרטיס אשראי"
              : "היכנסו עם האימייל שלכם"}
        </CardDescription>
      </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {!preparing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessName">שם העסק (אופציונלי)</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="לדוגמה: קליניקת יופי דנה"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">אימייל (אופציונלי)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </>
          )}
          <Button className="w-full" size="lg" onClick={enterProduct} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {preparing ? "מכינים את המערכת שלכם…" : "נכנסים…"}
              </>
            ) : (
              "הפעילו את המערכת שלי — חינם"
            )}
          </Button>
          {!preparing && (
            <p className="text-xs text-center text-muted-foreground">
              {mode === "sign-up" ? (
                <>
                  רוצים קודם לראות?{" "}
                  <Link href="/demo" className="text-primary underline">
                    צפו בדמו מיידי
                  </Link>
                  {" · "}
                  <Link href="/sign-in" className="text-primary underline">
                    כבר נכנסתם?
                  </Link>
                </>
              ) : (
                <>
                  חדשים?{" "}
                  <Link href="/sign-up" className="text-primary underline">
                    הפעילו את המערכת
                  </Link>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>
  );
}
