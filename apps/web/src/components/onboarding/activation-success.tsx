"use client";

import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
} from "@revenue-autopilot/ui";
import {
  CheckCircle2,
  ChevronLeft,
  MessageSquare,
  TrendingUp,
  Zap,
} from "lucide-react";

interface Props {
  orgName: string;
}

export function ActivationSuccess({ orgName }: Props) {
  return (
    <div className="min-h-screen hero-glow flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">המערכת פעילה!</h1>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{orgName}</span> — מעכשיו אנחנו עובדים בשבילכם
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4 text-right">
            <p className="font-medium text-center mb-4">מה קורה מעכשיו אוטומטית:</p>
            <SuccessItem
              icon={MessageSquare}
              title="תזכורות ללקוחות"
              text="לפני כל תור — פחות לקוחות שלא מגיעים"
            />
            <SuccessItem
              icon={Zap}
              title="מילוי ביטולים"
              text="כשמישהו מבטל — המקום מתמלא מרשימת ההמתנה"
            />
            <SuccessItem
              icon={TrendingUp}
              title="מעקב הכנסה"
              text="בדשבורד תראו כמה כסף חזר — בזמן אמת"
            />
          </CardContent>
        </Card>

        <div className="rounded-lg bg-accent/10 border border-accent/30 p-4">
          <p className="text-sm font-medium text-accent">הודעות ראשונות נשלחו · תורים לדוגמה נוספו</p>
          <p className="text-xs text-muted-foreground mt-1">תראו תוצאות בדשבורד תוך דקות</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              לראות את הדשבורד שלי
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard/billing?from=activation">
              שמרו את המערכת לטווח ארוך — 14 יום חינם
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          14 יום ניסיון חינם · בלי כרטיס אשראי · ביטול בכל עת
        </p>
      </div>
    </div>
  );
}

function SuccessItem({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
