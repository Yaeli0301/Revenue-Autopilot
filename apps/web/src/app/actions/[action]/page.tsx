import { verifyActionToken, translateUserError } from "@revenue-autopilot/lib";
import { prisma } from "@revenue-autopilot/lib/db";
import { handleCancellation } from "@/lib/autofill";
import { cancelAppointmentReminders } from "@/lib/jobs/schedule";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@revenue-autopilot/ui";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  params: { action: string };
  searchParams: { token?: string };
}

export default async function ActionPage({ params, searchParams }: Props) {
  const action = params.action as "confirm" | "cancel" | "claim";
  const token = searchParams.token ?? null;

  if (!token) {
    return <ActionResult success={false} message="קישור לא תקין" />;
  }

  const payload = await verifyActionToken(token);
  if (!payload || payload.action !== action) {
    return <ActionResult success={false} message="קישור פג תוקף או לא תקין" />;
  }

  if (action === "confirm") {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: payload.appointmentId,
        organizationId: payload.organizationId,
      },
    });

    if (!appointment) {
      return <ActionResult success={false} message="התור לא נמצא" />;
    }

    if (appointment.status === "CONFIRMED") {
      return (
        <ActionResult
          success
          message="התור כבר אושר — נתראה בקרוב."
          icon="success"
        />
      );
    }

    await cancelAppointmentReminders(payload.appointmentId);
    await prisma.appointment.update({
      where: { id: payload.appointmentId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    await prisma.auditEvent.create({
      data: {
        organizationId: payload.organizationId,
        action: "APPOINTMENT_CONFIRMED",
        entityType: "Appointment",
        entityId: payload.appointmentId,
      },
    });
    return (
      <ActionResult
        success
        message="התור אושר בהצלחה! נתראה בקרוב."
        icon="success"
      />
    );
  }

  if (action === "cancel") {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: payload.appointmentId,
        organizationId: payload.organizationId,
      },
    });

    if (!appointment) {
      return <ActionResult success={false} message="התור לא נמצא" />;
    }

    if (appointment.status === "CANCELLED") {
      return (
        <ActionResult
          success
          message="התור כבר בוטל."
          icon="success"
        />
      );
    }

    await cancelAppointmentReminders(payload.appointmentId);
    await handleCancellation(payload.appointmentId, payload.organizationId);
    return (
      <ActionResult
        success
        message="הביטול אושר. המקום יוצע ללקוחות ברשימת ההמתנה."
        icon="success"
      />
    );
  }

  if (action === "claim") {
    if (!payload.customerId) {
      return <ActionResult success={false} message="קישור לא תקין" />;
    }

    const { handleClaim } = await import("@/lib/autofill");
    const result = await handleClaim(
      payload.appointmentId,
      payload.customerId,
      payload.organizationId
    );

    if (result.success) {
      return (
        <ActionResult
          success
          message="מזל טוב! התור שלך נקבע בהצלחה."
          icon="success"
        />
      );
    }

    const messages: Record<string, string> = {
      ALREADY_CLAIMED: translateUserError("ALREADY_CLAIMED"),
      APPOINTMENT_NOT_AVAILABLE: translateUserError("APPOINTMENT_NOT_AVAILABLE"),
      NOT_ON_WAITLIST: translateUserError("NOT_ON_WAITLIST"),
    };

    return (
      <ActionResult
        success={false}
        message={messages[result.error ?? ""] ?? translateUserError(null)}
        icon="error"
      />
    );
  }

  return <ActionResult success={false} message="פעולה לא מוכרת" />;
}

function ActionResult({
  success,
  message,
  icon,
}: {
  success: boolean;
  message: string;
  icon?: "success" | "error";
}) {
  return (
    <div className="min-h-screen flex items-center justify-center hero-glow p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {icon === "success" ? (
              <CheckCircle2 className="h-16 w-16 text-accent mx-auto" />
            ) : icon === "error" ? (
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
            ) : null}
          </div>
          <CardTitle>{success ? "בוצע!" : "אופס"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{message}</p>
          <Button asChild variant="outline">
            <Link href="/">חזרה לאתר</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
