"use client";

import type { Organization } from "@revenue-autopilot/lib/db";
import { industryPresets, translateUserError } from "@revenue-autopilot/lib";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Check, Loader2, Zap } from "lucide-react";

const STEPS = ["העסק שלכם", "חיבור יומן", "הפעלה"];

interface Props {
  existingOrg: Organization | null;
}

export function OnboardingWizard({ existingOrg }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoActivated = useRef(false);
  const [step, setStep] = useState(existingOrg ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarMode, setCalendarMode] = useState<"google" | "manual" | null>(null);

  const [form, setForm] = useState({
    name: existingOrg?.name ?? "",
    industry: existingOrg?.industry ?? "OTHER",
    avgPrice: existingOrg?.avgPrice ?? 200,
    timezone: existingOrg?.timezone ?? "Asia/Jerusalem",
    quietHoursStart: existingOrg?.quietHoursStart ?? 22,
    quietHoursEnd: existingOrg?.quietHoursEnd ?? 8,
  });

  const activateSystem = useCallback(
    async (mode: "google" | "manual") => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/onboarding/activate", { method: "POST" });
        if (!res.ok) throw new Error("שגיאה בהפעלת המערכת");
        router.push("/onboarding/success");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "שגיאה");
      } finally {
        setLoading(false);
      }
      void mode;
    },
    [router]
  );

  useEffect(() => {
    const calendarConnected = searchParams.get("calendar") === "connected";
    const calendarError = searchParams.get("error") === "calendar";

    if (calendarError) {
      setError("לא הצלחנו לחבר את היומן. אפשר לנסות שוב או להמשיך בלי יומן.");
      setStep(1);
    }

    if (calendarConnected && existingOrg && !autoActivated.current) {
      autoActivated.current = true;
      setCalendarMode("google");
      setStep(2);
      void activateSystem("google");
    }
  }, [searchParams, existingOrg, activateSystem]);

  async function createOrg() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(translateUserError(data.error ?? "שגיאה ביצירת העסק"));
      }
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  async function connectCalendar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/google-calendar/connect", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(translateUserError(data.error ?? "שגיאה בחיבור יומן"));
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCalendarMode("manual");
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  function continueWithoutCalendar() {
    setCalendarMode("manual");
    setStep(2);
  }

  return (
    <div>
      <div className="mb-8 flex justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>איך קוראים לעסק?</CardTitle>
            <CardDescription>
              זה יעזור לנו לחשב כמה כסף המערכת תחזיר לכם מביטולים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם העסק</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="לדוגמה: מרפאת שיניים דנה"
              />
            </div>
            <div className="space-y-2">
              <Label>תחום העסק</Label>
              <div className="grid grid-cols-2 gap-2">
                {industryPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        industry: preset.id,
                        avgPrice: preset.avgPrice,
                      })
                    }
                    className={`rounded-lg border p-3 text-sm text-right transition-colors ${
                      form.industry === preset.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgPrice">מחיר ממוצע לתור (₪)</Label>
              <Input
                id="avgPrice"
                type="number"
                value={form.avgPrice}
                onChange={(e) =>
                  setForm({ ...form, avgPrice: Number(e.target.value) })
                }
              />
            </div>
            <Button
              className="w-full"
              onClick={createOrg}
              disabled={loading || !form.name.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "המשיכו להפעלה"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              מאיפה מגיעים התורים?
            </CardTitle>
            <CardDescription>
              חברו יומן Google — או התחילו מיד עם תורים לדוגמה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={connectCalendar} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "חבר את יומן Google"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={continueWithoutCalendar}
              disabled={loading}
            >
              המשך בלי יומן — נראה תוצאות מיד
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              מוכנים לחסוך כסף?
            </CardTitle>
            <CardDescription>
              {calendarMode === "google"
                ? "היומן מחובר — לחצו והמערכת מתחילה לעבוד"
                : "לחצו והמערכת מתחילה לשמור לכם כסף מביטולים"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                תזכורות אוטומטיות — פחות לקוחות שלא מגיעים
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                מילוי אוטומטי של תורים שבוטלו
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                דשבורד שמראה כמה כסף חזר
              </li>
            </ul>
            <Button
              className="w-full"
              size="lg"
              onClick={() => activateSystem(calendarMode ?? "manual")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
              "הפעילו את המערכת שלי"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
