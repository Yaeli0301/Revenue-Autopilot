"use client";



import {

  Button,

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

  Input,

  Label,

  Badge,

} from "@revenue-autopilot/ui";

import { translateCalendarError } from "@revenue-autopilot/lib";

import { useEffect, useState } from "react";

import { Loader2, Calendar, Zap } from "lucide-react";



interface OrgSettings {

  id: string;

  name: string;

  avgPrice: number;

  timezone: string;

  quietHoursStart: number;

  quietHoursEnd: number;

  autopilotActive: boolean;

}



interface CalendarStatus {

  connected: boolean;

  active: boolean;

  needsReconnect: boolean;

  lastSyncAt: string | null;

  lastError: string | null;

}



interface Props {

  org: OrgSettings;

}



export function SettingsForm({ org }: Props) {

  const [form, setForm] = useState(org);

  const [loading, setLoading] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);



  useEffect(() => {

    fetch("/api/integrations/google-calendar/connect")

      .then((r) => r.json())

      .then(setCalendarStatus)

      .catch(() => null);

  }, []);



  async function save() {
    setLoading(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "שגיאה בשמירה");
        return;
      }
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }



  async function toggleSystem() {

    const res = await fetch("/api/settings/autopilot", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ active: !form.autopilotActive }),

    });

    if (res.ok) {

      setForm({ ...form, autopilotActive: !form.autopilotActive });

    }

  }



  async function connectCalendar() {

    const res = await fetch("/api/integrations/google-calendar/connect", {

      method: "POST",

    });

    const data = await res.json();

    if (data.url) {

      window.location.href = data.url;

    }

  }



  const calendarError = translateCalendarError(calendarStatus?.lastError ?? null);



  return (

    <div className="space-y-6 max-w-2xl">

      <div>

        <h2 className="text-2xl font-bold">הגדרות</h2>

        <p className="text-muted-foreground text-sm mt-1">

          כאן מנהלים את העסק, היומן והמערכת

        </p>

      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Zap className="h-5 w-5" />

            המערכת שלי

          </CardTitle>

          <CardDescription>

            {form.autopilotActive

              ? "פעילה — שולחת תזכורות וממלאת ביטולים אוטומטית"

              : "כבויה — לא נשלחות הודעות ולא מתמלאים ביטולים"}

          </CardDescription>

        </CardHeader>

        <CardContent>

          <Button

            variant={form.autopilotActive ? "destructive" : "default"}

            onClick={toggleSystem}

          >

            {form.autopilotActive ? "כבה את המערכת" : "הפעל את המערכת"}

          </Button>

        </CardContent>

      </Card>



      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Calendar className="h-5 w-5" />

            יומן Google

          </CardTitle>

          <CardDescription>

            {calendarStatus?.connected

              ? "מחובר — התורים מתעדכנים אוטומטית"

              : "לא מחובר — חברו כדי שהתורים יופיעו בדשבורד"}

          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-3">

          <Badge variant={calendarStatus?.connected ? "success" : "outline"}>

            {calendarStatus?.connected ? "מחובר" : "לא מחובר"}

          </Badge>

          {calendarStatus?.lastSyncAt && (

            <p className="text-sm text-muted-foreground">

              עדכון אחרון:{" "}

              {new Date(calendarStatus.lastSyncAt).toLocaleString("he-IL")}

            </p>

          )}

          {calendarError && (

            <p className="text-sm text-destructive">{calendarError}</p>

          )}

          {(!calendarStatus?.connected || calendarStatus?.needsReconnect) && (

            <Button onClick={connectCalendar}>חבר את יומן Google</Button>

          )}

        </CardContent>

      </Card>



      <Card>

        <CardHeader>

          <CardTitle>פרטי העסק</CardTitle>

          <CardDescription>משמש לחישוב כמה כסף חסכתם</CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="space-y-2">

            <Label>שם העסק</Label>

            <Input

              value={form.name}

              onChange={(e) => setForm({ ...form, name: e.target.value })}

            />

          </div>

          <div className="space-y-2">

            <Label>מחיר ממוצע לתור (₪)</Label>

            <Input

              type="number"

              value={form.avgPrice}

              onChange={(e) =>

                setForm({ ...form, avgPrice: Number(e.target.value) })

              }

            />

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label>שעות שקט — מ</Label>

              <Input

                type="number"

                min={0}

                max={23}

                value={form.quietHoursStart}

                onChange={(e) =>

                  setForm({ ...form, quietHoursStart: Number(e.target.value) })

                }

              />

            </div>

            <div className="space-y-2">

              <Label>שעות שקט — עד</Label>

              <Input

                type="number"

                min={0}

                max={23}

                value={form.quietHoursEnd}

                onChange={(e) =>

                  setForm({ ...form, quietHoursEnd: Number(e.target.value) })

                }

              />

            </div>

          </div>

          <p className="text-xs text-muted-foreground">

            בשעות שקט לא נשלחות הודעות ללקוחות (למשל בלילה)

          </p>

          <Button onClick={save} disabled={loading}>

            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שמור שינויים"}

          </Button>

          {saved && <p className="text-sm text-accent">נשמר ✓</p>}

        </CardContent>

      </Card>

    </div>

  );

}


