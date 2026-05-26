import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { getUpcomingAppointments } from "@/lib/appointments";
import { prisma } from "@revenue-autopilot/lib/db";
import { APPOINTMENT_STATUS_LABELS } from "@revenue-autopilot/lib";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@revenue-autopilot/ui";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { getAuthContext } from "@/lib/app-auth";
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function AppointmentsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-up");
  if (ctx.demoMode) redirect("/dashboard");
  if (!ctx.dbUser) redirect("/sign-up");

  const org = await getCurrentOrg(ctx.dbUser.id);
  if (!org?.onboardingDone) redirect("/onboarding");

  const appointments = await prisma.appointment.findMany({
    where: { organizationId: org.id },
    include: { customer: true },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  const upcoming = await getUpcomingAppointments(org.id);

  return (
    <AppShell orgName={org.name} devMode={!isClerkConfigured()}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">תורים</h2>
          <p className="text-muted-foreground text-sm mt-1">
            כל התורים של העסק — המערכת מטפלת בתזכורות ובביטולים אוטומטית
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>קרובים ({upcoming.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList appointments={upcoming} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>כל התורים</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList appointments={appointments} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function AppointmentList({
  appointments,
}: {
  appointments: Array<{
    id: string;
    title: string;
    startTime: Date;
    status: string;
    customer: { name: string };
  }>;
}) {
  if (appointments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        אין תורים עדיין. חברו יומן Google מההגדרות — התורים יופיעו כאן אוטומטית.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {appointments.map((apt) => {
        const st = APPOINTMENT_STATUS_LABELS[apt.status] ?? {
          label: apt.status,
          variant: "outline" as const,
        };
        return (
          <div key={apt.id} className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium">{apt.title}</p>
              <p className="text-sm text-muted-foreground">
                {apt.customer.name} ·{" "}
                {format(new Date(apt.startTime), "d/M/yyyy HH:mm", { locale: he })}
              </p>
            </div>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
        );
      })}
    </div>
  );
}
