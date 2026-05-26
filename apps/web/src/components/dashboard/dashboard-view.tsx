"use client";

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
import type { DashboardMetrics } from "@revenue-autopilot/lib";
import { APPOINTMENT_STATUS_LABELS, formatCurrency } from "@revenue-autopilot/lib";
import { DEMO_ACTIVITY } from "@/lib/demo-fallback-data";
import { MessageSquare, TrendingUp, Zap, CheckCircle2, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface AppointmentRow {
  id: string;
  title: string;
  startTime: Date;
  status: string;
  customer: { name: string; phone: string | null; email: string | null };
}

interface Props {
  metrics: DashboardMetrics;
  appointments: AppointmentRow[];
  autopilotActive: boolean;
  justActivated?: boolean;
  trialDaysRemaining?: number;
  onTrial?: boolean;
  fallbackDemoMode?: boolean;
}

export function DashboardView({
  metrics,
  appointments,
  autopilotActive,
  justActivated,
  trialDaysRemaining = 0,
  onTrial,
  fallbackDemoMode,
}: Props) {
  return (
    <div className="space-y-6">
      {fallbackDemoMode && (
        <Card className="border-yellow-500/40 bg-yellow-500/10">
          <CardContent className="pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium">מצב דמו — המערכת עובדת על נתונים לדוגמה</p>
              <p className="text-sm text-muted-foreground">
                חברו את המערכת לעסק האמיתי כדי לשלוח הודעות ולמלא ביטולים באמת
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/onboarding">
                חברו את המערכת להפעלה אמיתית
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {justActivated && (
        <div className="rounded-lg bg-accent/15 border border-accent/30 p-4 text-center">
          <p className="font-semibold text-accent">
            {fallbackDemoMode
              ? "המערכת מוכנה — כך זה ייראה בעסק שלכם"
              : "המערכת פעילה — היא כבר מתחילה לשמור לכם כסף"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            תזכורות נשלחות, ביטולים מתמלאים, והדשבורד מתעדכן אוטומטית
          </p>
        </div>
      )}

      {onTrial && trialDaysRemaining > 0 && !fallbackDemoMode && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium">המערכת עובדת — עוד {trialDaysRemaining} ימי ניסיון חינם</p>
              <p className="text-sm text-muted-foreground">
                שדרגו עכשיו כדי שלא תפספסו אף ביטול אחרי הניסיון
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/billing">
                שמרו את המערכת פעילה
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <div>
        <h2 className="text-2xl font-bold">ההכנסה שלכם</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {autopilotActive
            ? "המערכת פועלת על טייס אוטומטי — שומרת לכם כסף מביטולים ותורים ריקים"
            : "המערכת כבויה — הפעילו מההגדרות כדי להתחיל לחסוך"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="כסף שנשמר"
          value={formatCurrency(metrics.revenueSaved)}
          icon={TrendingUp}
          accent
          subtitle="30 הימים האחרונים"
        />
        <MetricCard
          title="תורים שנשמרו"
          value={String(metrics.confirmedCount)}
          icon={CheckCircle2}
          subtitle="לקוחות שאישרו הגעה"
        />
        <MetricCard
          title="מקומות ריקים שהתמלאו"
          value={String(metrics.autofillWins)}
          icon={Zap}
          subtitle="ביטולים שהפכו להכנסה"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>תורים קרובים</CardTitle>
          <CardDescription>
            המערכת שולחת תזכורות וממלאת ביטולים — אתם רק רואים את התוצאות
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>אין תורים קרובים עדיין.</p>
              <p className="text-sm mt-1">
                חברו יומן Google מההגדרות — התורים יופיעו כאן אוטומטית.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {appointments.map((apt) => {
                const st = APPOINTMENT_STATUS_LABELS[apt.status] ?? {
                  label: apt.status,
                  variant: "outline" as const,
                };
                return (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="font-medium">{apt.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.customer.name} ·{" "}
                        {format(new Date(apt.startTime), "EEEE d/M HH:mm", {
                          locale: he,
                        })}
                      </p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {fallbackDemoMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              פעילות המערכת — עכשיו
            </CardTitle>
            <CardDescription>המערכת עובדת ברקע — אתם רק רואים את התוצאות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEMO_ACTIVITY.map((item) => (
              <div
                key={item.text}
                className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-sm"
              >
                <span>{item.text}</span>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${accent ? "text-accent" : ""}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-2 ${accent ? "bg-accent/10" : "bg-primary/10"}`}>
            <Icon className={`h-5 w-5 ${accent ? "text-accent" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
