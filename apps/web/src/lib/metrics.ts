import { prisma } from "@revenue-autopilot/lib/db";
import { calculateRevenueSaved } from "@revenue-autopilot/lib";
import type { DashboardMetrics } from "@revenue-autopilot/lib";

export async function getDashboardMetrics(
  organizationId: string
): Promise<DashboardMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [appointments, autofillWins, org] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        organizationId,
        startTime: { gte: thirtyDaysAgo },
      },
      select: { status: true },
    }),
    prisma.slotClaim.count({
      where: {
        appointment: { organizationId },
        claimedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { avgPrice: true },
    }),
  ]);

  const total = appointments.length;
  const confirmedCount = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "COMPLETED"
  ).length;
  const cancelledCount = appointments.filter(
    (a) => a.status === "CANCELLED"
  ).length;
  const atRiskCount = appointments.filter((a) => a.status === "AT_RISK").length;

  const confirmationRate = total > 0 ? confirmedCount / total : 0;
  const autofillRate =
    cancelledCount > 0 ? autofillWins / cancelledCount : 0;

  const confirmedFromAtRisk = appointments.filter(
    (a) => a.status === "CONFIRMED"
  ).length;

  const revenueSaved = calculateRevenueSaved({
    autofillWins,
    confirmedFromAtRisk: Math.round(confirmedFromAtRisk * 0.2),
    avgPrice: org?.avgPrice ?? 200,
  });

  return {
    confirmationRate,
    autofillRate,
    revenueSaved,
    atRiskCount,
    totalAppointments: total,
    confirmedCount,
    cancelledCount,
    autofillWins,
  };
}
