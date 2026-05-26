"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@revenue-autopilot/ui";
import { ChevronLeft, Loader2, Zap } from "lucide-react";

export function DemoConnectView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tryConnect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/upgrade", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.ok && data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }

      setError(
        data.message ??
          data.error ??
          "לא הצלחנו לחבר את המערכת — נסו שוב בעוד רגע"
      );
    } catch {
      setError("שגיאת רשת — בדקו חיבור ונסו שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen hero-glow flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle>חברו את המערכת לעסק האמיתי</CardTitle>
          <CardDescription>
            3 שלבים קצרים — יומן, הודעות, והמערכת שומרת לכם כסף מביטולים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button className="w-full" size="lg" onClick={tryConnect} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                התחילו הפעלה אמיתית
                <ChevronLeft className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/dashboard">חזרה לדשבורד הדמו</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
