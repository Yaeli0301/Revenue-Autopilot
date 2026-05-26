import { prisma } from "@revenue-autopilot/lib/db";

export async function getUpcomingAppointments(organizationId: string) {
  const now = new Date();
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);

  return prisma.appointment.findMany({
    where: {
      organizationId,
      startTime: { gte: now, lte: weekAhead },
      status: { notIn: ["COMPLETED"] },
    },
    include: {
      customer: { select: { name: true, phone: true, email: true } },
    },
    orderBy: { startTime: "asc" },
    take: 20,
  });
}
