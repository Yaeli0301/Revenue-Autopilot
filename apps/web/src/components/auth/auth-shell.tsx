import Link from "next/link";
import { Badge } from "@revenue-autopilot/ui";
import {
  CheckCircle2,
  ChevronLeft,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";

interface AuthShellProps {
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
}

const signUpBullets = [
  "14 יום ניסיון חינם — בלי כרטיס אשראי",
  "מילוי אוטומטי של ביטולים ותזכורות ללקוחות",
  "דשבורד שמראה כמה כסף חזר לכיס",
];

const signInBullets = [
  "המשיכו מאיפה שעצרתם",
  "תורים, הודעות ומילוי ביטולים — הכל במקום אחד",
  "מאובטח עם Clerk",
];

export function AuthShell({ mode, children }: AuthShellProps) {
  const isSignUp = mode === "sign-up";
  const bullets = isSignUp ? signUpBullets : signInBullets;

  return (
    <div className="min-h-screen hero-glow grid-pattern flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Revenue Autopilot</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            חזרה לאתר
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_420px] lg:gap-16 items-center">
          <section className="order-2 lg:order-1 text-center lg:text-right">
            <Badge variant="success" className="mb-5">
              {isSignUp ? "עובד מיד · 14 יום חינם" : "כניסה מאובטחת"}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              {isSignUp ? (
                <>
                  הפעילו את המערכת
                  <br />
                  <span className="gradient-text">שחוסכת לכם כסף</span>
                </>
              ) : (
                <>
                  ברוכים
                  <br />
                  <span className="gradient-text">השבים</span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto lg:mx-0 lg:mr-0 mb-8">
              {isSignUp
                ? "הירשמו בדקות — והמערכת תתחיל למלא ביטולים ולשלוח תזכורות אוטומטית."
                : "היכנסו לדשבורד, לתורים ולהגדרות — הכל בעברית ופשוט."}
            </p>

            <ul className="space-y-3 text-sm text-muted-foreground max-w-md mx-auto lg:mx-0 lg:mr-0 mb-8">
              {bullets.map((item) => (
                <li key={item} className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="hidden lg:flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                ₪2.4M הכנסה שנשמרה
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                מאובטח ומוצפן
              </span>
            </div>
          </section>

          <section className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
