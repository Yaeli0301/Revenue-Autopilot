"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Input,
  Label,
  Badge,
} from "@revenue-autopilot/ui";
import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Zap,
  Shield,
  Users,
  ChevronLeft,
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { PRICING_PLANS } from "@revenue-autopilot/lib";

const valueFlow = [
  {
    step: "1",
    title: "לקוח קובע תור",
    description: "התור נכנס ליומן שלכם — כרגיל.",
    icon: Calendar,
  },
  {
    step: "2",
    title: "המערכת שולחת אישור",
    description: "הלקוח מקבל הודעה ומאשר בלחיצה.",
    icon: MessageSquare,
  },
  {
    step: "3",
    title: "לקוח מבטל",
    description: "המקום נשאר פנוי — בדרך כלל הכנסה שאבדה.",
    icon: AlertTriangle,
  },
  {
    step: "4",
    title: "מקום אחר מתמלא מיד",
    description: "לקוח מרשימת ההמתנה תופס את התור אוטומטית.",
    icon: Zap,
  },
  {
    step: "5",
    title: "לא מאבדים הכנסה",
    description: "העסק ממשיך לעבוד — בלי תורים ריקים.",
    icon: CheckCircle2,
  },
];

const painPoints = [
  {
    stat: "15%",
    label: "מהתורים",
    text: "לקוחות שלא מגיעים — כסף שיוצא מהחלון",
  },
  {
    stat: "₪2,000+",
    label: "בחודש",
    text: "הפסד ממוצע בעסק קטן מביטולים ותורים ריקים",
  },
  {
    stat: "0",
    label: "פעולות ידניות",
    text: "בלי המערכת — אתם צריכים לרדוף אחרי לקוחות בעצמכם",
  },
];

const testimonials = [
  {
    quote: "פעם איבדתי 5-6 תורים בשבוע. היום כמעט אפס — והמקומות מתמלאים לבד.",
    name: "דנה כהן",
    role: "קליניקת אסתטיקה, תל אביב",
  },
  {
    quote: "לא צריך לרדוף אחרי לקוחות יותר. המערכת שולחת, ממלאת, ואני רואה כמה כסף חזר.",
    name: "יוסי לוי",
    role: "מרפאת שיניים, חיפה",
  },
  {
    quote: "תוך שבוע ראיתי ₪1,800 שנשמרו מביטולים. ההשקעה מחזירה את עצמה פי 10.",
    name: "מיכל אברהם",
    role: "סטודיו יוגה, רמת גן",
  },
];

const beforeAfter = {
  before: [
    "לקוח מבטל — השעה נשארת ריקה",
    "רדיפה ידנית אחרי לקוחות",
    "₪2,000+ הפסד בחודש ממוצע",
    "אין מושג כמה כסף יוצא",
  ],
  after: [
    "ביטול מתמלא תוך דקות — אוטומטית",
    "הודעות ותזכורות בלי מאמץ",
    "₪2,100+ חוזרים לכיס בחודש",
    "דשבורד שמראה כל שקל שנשמר",
  ],
};

const faqs = [
  {
    q: "כמה זמן לוקח להתחיל?",
    a: "כ-5 דקות. שם העסק, חיבור יומן (או בלי), והמערכת מתחילה לעבוד לבד.",
  },
  {
    q: "מה קורה כשלקוח מבטל?",
    a: "המערכת שולחת מיד ללקוחות ברשימת ההמתנה. הראשון שמאשר — מקבל את התור. אתם לא מאבדים את ההכנסה.",
  },
  {
    q: "האם צריך ידע טכני?",
    a: "לא. הכל בעברית, פשוט וברור. המערכת רצה על טייס אוטומטי מהרגע הראשון.",
  },
  {
    q: "איך אדע שזה עובד?",
    a: "בדשבורד תראו כמה כסף חסכתם, כמה תורים נתפסו מביטולים, וכמה מקומות ריקים התמלאו.",
  },
];

function RoiCalculator() {
  const [appointments, setAppointments] = useState(80);
  const [noShowRate, setNoShowRate] = useState(15);
  const [avgPrice, setAvgPrice] = useState(250);
  const [fillRate, setFillRate] = useState(60);

  const monthlyNoShows = Math.round(appointments * (noShowRate / 100));
  const savedFromConfirm = monthlyNoShows * 0.4 * avgPrice;
  const savedFromFill =
    Math.round(appointments * 0.08) * (fillRate / 100) * avgPrice;
  const totalSaved = Math.round(savedFromConfirm + savedFromFill);
  const monthlyLoss = Math.round(
    monthlyNoShows * avgPrice + appointments * 0.08 * avgPrice * (1 - fillRate / 100)
  );

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          כמה כסף אתם מפסידים היום?
        </CardTitle>
        <CardDescription>
          הזינו נתונים מהעסק — וראו כמה אפשר לחזור לכיס
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>תורים בחודש</Label>
            <Input
              type="number"
              value={appointments}
              onChange={(e) => setAppointments(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>אחוז שלא מגיעים (%)</Label>
            <Input
              type="number"
              value={noShowRate}
              onChange={(e) => setNoShowRate(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>מחיר ממוצע לתור (₪)</Label>
            <Input
              type="number"
              value={avgPrice}
              onChange={(e) => setAvgPrice(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>אחוז מילוי ביטולים (%)</Label>
            <Input
              type="number"
              value={fillRate}
              onChange={(e) => setFillRate(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">הפסד משוער בלי המערכת</p>
            <p className="text-2xl font-bold text-destructive">
              ₪{monthlyLoss.toLocaleString("he-IL")}
              <span className="text-sm font-normal text-muted-foreground"> / חודש</span>
            </p>
          </div>
          <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">מה שאפשר לחזור עם המערכת</p>
            <p className="text-2xl font-bold text-accent">
              ₪{totalSaved.toLocaleString("he-IL")}
              <span className="text-sm font-normal text-muted-foreground"> / חודש</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Revenue Autopilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#flow" className="hover:text-foreground transition-colors">
              איך זה עובד
            </a>
            <a href="#pain" className="hover:text-foreground transition-colors">
              למה עכשיו
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              מחירים
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              שאלות
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">התחברות</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">
                הפעילו את המערכת שלי
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden hero-glow grid-pattern">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="success" className="mb-6">
              עובד מיד · בלי הגדרות · 14 יום חינם
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              לעולם לא תאבדו כסף
              <br />
              <span className="gradient-text">מביטולי תורים</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              המערכת ממלאת אוטומטית תורים שבוטלו ומצמצמת לקוחות שלא מגיעים —
              כדי שלא תישארו עם שעות ריקות ופחות הכנסה.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  הפעילו את המערכת שלי — חינם 14 יום
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">ראו איך זה עובד — דמו מיידי</Link>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                500+ עסקים כבר חוסכים
              </span>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                ₪2.4M הכנסה שנשמרה
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                פועל על טייס אוטומטי
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="roi" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <RoiCalculator />
          </div>
        </div>
      </section>

      <section id="pain" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">כל ביטול = כסף שיוצא מהעסק</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              בלי מערכת שממלאת מקומות, אתם משלמים במשכורות, שכירות וזמן — על שעות ריקות
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {painPoints.map((p) => (
              <Card key={p.label} className="text-center border-destructive/20">
                <CardContent className="pt-8 pb-6">
                  <p className="text-4xl font-bold text-destructive">{p.stat}</p>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{p.label}</p>
                  <p className="text-sm">{p.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">לפני ואחרי Revenue Autopilot</h2>
            <p className="text-muted-foreground">ההבדל שעסקים מרגישים כבר מהשבוע הראשון</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">בלי המערכת</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {beforeAfter.before.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="text-accent">עם Revenue Autopilot</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {beforeAfter.after.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="flow" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">איך המערכת שומרת לכם כסף</h2>
            <p className="text-muted-foreground">5 שלבים — הכל אוטומטי, בלי שתיגעו בזה</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-0">
            {valueFlow.map((item, i) => (
              <div key={item.step}>
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="h-4 w-4 text-accent" />
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                {i < valueFlow.length - 1 && (
                  <div className="flex justify-center pb-2">
                    <ArrowDown className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">עסקים שכבר חוסכים</h2>
          <p className="text-center text-muted-foreground mb-12">תוצאות אמיתיות — בשפה פשוטה</p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-6">
                  <p className="text-sm mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">בחרו את המסלול שלכם</h2>
          <p className="text-center text-muted-foreground mb-12">
            14 יום ניסיון · ללא כרטיס אשראי · ביטול בכל עת
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={
                  "popular" in plan && plan.popular
                    ? "border-primary shadow-lg shadow-primary/10 relative"
                    : ""
                }
              >
                {"popular" in plan && plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    הכי פופולרי
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    {plan.price ? (
                      <span className="text-3xl font-bold">₪{plan.price}</span>
                    ) : (
                      <span className="text-3xl font-bold">לפי הצורך</span>
                    )}
                    {plan.price && (
                      <span className="text-muted-foreground"> / חודש</span>
                    )}
                  </div>
                  {plan.outcome && (
                    <CardDescription className="text-base mt-2">{plan.outcome}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="text-sm flex items-center gap-2">
                        <span className="text-accent">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={"popular" in plan && plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={`/sign-up?plan=${plan.id}`}>
                      {plan.price ? "הפעילו את המערכת שלי" : "דברו איתנו"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-8">שאלות נפוצות</h2>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">מוכנים לעצור את ההפסדים?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            5 דקות מהיום — והמערכת מתחילה לשמור לכם כסף מחר
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">
              הפעילו את המערכת שלי — חינם
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            <Link href="/demo" className="text-primary underline">
              רוצים קודם לראות? צפו בדמו מיידי
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Revenue Autopilot. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
