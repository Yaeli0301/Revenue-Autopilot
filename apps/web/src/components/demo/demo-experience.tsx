"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@revenue-autopilot/ui";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type DemoPhase =
  | "idle"
  | "appointment"
  | "cancelled"
  | "messaging"
  | "filled"
  | "saved"
  | "done";

const PHASES: DemoPhase[] = [
  "appointment",
  "cancelled",
  "messaging",
  "filled",
  "saved",
  "done",
];

const PHASE_DELAY_MS = 3500;

export function DemoExperience() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [revenueSaved, setRevenueSaved] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    PHASES.forEach((p, i) => {
      timers.push(
        setTimeout(() => {
          setPhase(p);
          if (p === "saved") {
            let n = 0;
            const interval = setInterval(() => {
              n += 25;
              setRevenueSaved(n);
              if (n >= 250) clearInterval(interval);
            }, 80);
          }
        }, i * PHASE_DELAY_MS)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  function restart() {
    setPhase("idle");
    setRevenueSaved(0);
    setTimeout(() => setPhase("appointment"), 300);
  }

  return (
    <div className="min-h-screen hero-glow">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← חזרה לדף הבית
          </Link>
          <Badge variant="outline">דמו חי — בלי הרשמה</Badge>
          <Button size="sm" asChild>
            <Link href="/sign-up">הפעילו בעסק שלי</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ככה המערכת שומרת לכם כסף</h1>
          <p className="text-muted-foreground">
            צפו בדמו חי — תוך 30 שניות תראו ביטול שהפך להכנסה
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <MetricTile
            label="כסף שנשמר"
            value={`₪${revenueSaved}`}
            icon={TrendingUp}
            active={phase === "saved" || phase === "done"}
            accent
          />
          <MetricTile
            label="מקומות שהתמלאו"
            value={phase === "filled" || phase === "saved" || phase === "done" ? "1" : "0"}
            icon={Zap}
            active={phase === "filled" || phase === "saved" || phase === "done"}
          />
          <MetricTile
            label="הודעות שנשלחו"
            value={
              phase === "messaging" || phase === "filled" || phase === "saved" || phase === "done"
                ? "3"
                : "0"
            }
            icon={MessageSquare}
            active={phase === "messaging" || phase === "filled" || phase === "saved" || phase === "done"}
          />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">יומן התורים — היום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AppointmentRow
              title="טיפול פנים — דנה כהן"
              time="14:00"
              status={
                phase === "cancelled"
                  ? "cancelled"
                  : phase === "filled" || phase === "saved" || phase === "done"
                    ? "filled"
                    : "confirmed"
              }
              highlight={phase !== "idle" && phase !== "appointment"}
            />
            <AppointmentRow title="ייעוץ — מיכל לוי" time="15:30" status="confirmed" />
            <AppointmentRow title="טיפול — רונית אברהם" time="16:00" status="confirmed" />
          </CardContent>
        </Card>

        <div className="space-y-3 mb-8">
          <EventFeed phase={phase} revenueSaved={revenueSaved} />
        </div>

        {phase === "done" && (
          <Card className="border-primary/30 bg-primary/5 text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
              <h2 className="text-2xl font-bold">₪250 נשמרו — בלי שעשיתם כלום</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                זה קורה אוטומטית בכל ביטול. דמיינו את זה על כל התורים שלכם.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button size="lg" asChild>
                  <Link href="/sign-up">
                    הפעילו את זה בעסק שלי
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={restart}>
                  צפו שוב בדמו
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">14 יום חינם · 5 דקות להפעלה · בלי כרטיס אשראי</p>
            </CardContent>
          </Card>
        )}

        {phase !== "done" && phase !== "idle" && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            המערכת עובדת...
          </p>
        )}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  active,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  accent?: boolean;
}) {
  return (
    <Card className={active ? "border-accent/40" : ""}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${accent && active ? "text-accent" : ""}`}>{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${active ? "text-accent" : "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentRow({
  title,
  time,
  status,
  highlight,
}: {
  title: string;
  time: string;
  status: "confirmed" | "cancelled" | "filled";
  highlight?: boolean;
}) {
  const styles = {
    confirmed: { label: "מאושר", variant: "success" as const },
    cancelled: { label: "בוטל", variant: "danger" as const },
    filled: { label: "התמלא מחדש", variant: "success" as const },
  };
  const s = styles[status];

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
        highlight ? "border-accent/50 bg-accent/5" : "border-border"
      }`}
    >
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <Badge variant={s.variant}>{s.label}</Badge>
    </div>
  );
}

function EventFeed({ phase, revenueSaved }: { phase: DemoPhase; revenueSaved: number }) {
  const events: { show: boolean; icon: React.ReactNode; text: string; success?: boolean }[] = [
    {
      show: phase !== "idle",
      icon: <Users className="h-4 w-4" />,
      text: "תור נקבע — דנה כהן, 14:00",
    },
    {
      show: phase === "cancelled" || phase === "messaging" || phase === "filled" || phase === "saved" || phase === "done",
      icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      text: "דנה ביטלה — המקום נשאר פנוי",
    },
    {
      show: phase === "messaging" || phase === "filled" || phase === "saved" || phase === "done",
      icon: <MessageSquare className="h-4 w-4 text-primary" />,
      text: "הודעה נשלחה ל-3 לקוחות ברשימת ההמתנה",
      success: true,
    },
    {
      show: phase === "filled" || phase === "saved" || phase === "done",
      icon: <CheckCircle2 className="h-4 w-4 text-accent" />,
      text: "יוסי לוי אישר — המקום התמלא!",
      success: true,
    },
    {
      show: phase === "saved" || phase === "done",
      icon: <TrendingUp className="h-4 w-4 text-accent" />,
      text: `הכנסה נשמרה: ₪${revenueSaved}`,
      success: true,
    },
  ];

  return (
    <>
      {events
        .filter((e) => e.show)
        .map((e, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg border p-3 text-sm animate-in fade-in slide-in-from-bottom-2 ${
              e.success ? "border-accent/30 bg-accent/5" : "border-border"
            }`}
          >
            {e.icon}
            <span>{e.text}</span>
            {e.success && <ArrowLeft className="h-3 w-3 mr-auto text-accent rotate-180" />}
          </div>
        ))}
    </>
  );
}
