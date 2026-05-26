"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@revenue-autopilot/ui";
import { PLAN_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@revenue-autopilot/lib";
import { Loader2, CreditCard, Check, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { InvoicesSection } from "./invoices-section";

interface BillingInfo {
  active: boolean;
  plan: string;
  status: string;
  trialDaysRemaining: number;
  onTrial: boolean;
  canManageBilling: boolean;
}

interface PlanInfo {
  id: string;
  name: string;
  priceLabel: string;
  appointments: number;
  features: readonly string[];
  popular?: boolean;
  stripePriceConfigured: boolean;
}

export function BillingView() {
  const searchParams = useSearchParams();
  const fromActivation = searchParams.get("from") === "activation";
  const paymentSuccess = searchParams.get("success") === "1";
  const paymentCancelled = searchParams.get("cancelled") === "1";

  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => {
        setBilling(data.billing);
        setPlans(data.plans ?? []);
      })
      .catch(() => null);
  }, []);

  async function startCheckout(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPlan(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {paymentSuccess && (
        <div className="rounded-lg bg-accent/15 border border-accent/30 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-accent">המנוי הופעל בהצלחה!</p>
            <p className="text-sm text-muted-foreground mt-1">
              המערכת ממשיכה לעבוד — תזכורות, מילוי ביטולים, ומעקב הכנסה
            </p>
          </div>
        </div>
      )}

      {paymentCancelled && (
        <div className="rounded-lg bg-muted border border-border p-4 text-sm text-muted-foreground">
          התשלום בוטל — המערכת עדיין פעילה בתקופת הניסיון. אפשר לשדרג בכל רגע.
        </div>
      )}

      {fromActivation && !paymentSuccess && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 space-y-3">
            <p className="font-semibold text-lg">המערכת כבר עובדת בשבילכם</p>
            <p className="text-sm text-muted-foreground">
              14 יום חינם — אחר כך בלי מנוי לא תוכלו לשלוח תזכורות ולמלא ביטולים
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
                <p className="font-medium flex items-center gap-2 text-accent">
                  <TrendingUp className="h-4 w-4" /> עם המערכת
                </p>
                <p className="text-muted-foreground mt-1">ביטולים מתמלאים · פחות הפסדים · הכל אוטומטי</p>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> בלי המערכת
                </p>
                <p className="text-muted-foreground mt-1">תורים ריקים · רדיפה אחרי לקוחות · ₪2,000+ הפסד</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold">שמרו את המערכת פעילה</h2>
        <p className="text-muted-foreground text-sm mt-1">
          14 יום ניסיון חינם · ביטול בכל עת · המערכת כבר עובדת
        </p>
      </div>

      {billing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              המנוי שלכם
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={billing.active ? "success" : "danger"}>
                {billing.active ? "פעיל" : "לא פעיל"}
              </Badge>
              <Badge variant="outline">{PLAN_LABELS[billing.plan] ?? billing.plan}</Badge>
              <Badge variant="outline">
                {SUBSCRIPTION_STATUS_LABELS[billing.status] ?? billing.status}
              </Badge>
            </div>
            {billing.onTrial && (
              <p className="text-sm text-muted-foreground">
                תקופת ניסיון: עוד {billing.trialDaysRemaining} ימים — שדרגו עכשיו ולא תפספסו אף ביטול
              </p>
            )}
            {!billing.active && (
              <p className="text-sm text-destructive">
                תקופת הניסיון הסתיימה — שדרגו כדי להמשיך לשלוח תזכורות ולמלא ביטולים
              </p>
            )}
            {billing.canManageBilling && (
              <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "נהל תשלום וחשבוניות"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""}
          >
            <CardHeader>
              {plan.popular && <Badge className="w-fit mb-2">הכי פופולרי</Badge>}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.priceLabel} / חודש · עד {plan.appointments} תורים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                disabled={!plan.stripePriceConfigured || loadingPlan === plan.id}
                onClick={() => startCheckout(plan.id)}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : plan.stripePriceConfigured ? (
                  "הפעילו מנוי — המשיכו לחסוך"
                ) : (
                  "בחרו מסלול — דמו"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <InvoicesSection />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-primary underline">
          חזרה לדשבורד
        </Link>
      </p>
    </div>
  );
}
