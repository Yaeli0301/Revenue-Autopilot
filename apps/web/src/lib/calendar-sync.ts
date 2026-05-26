import { prisma } from "@revenue-autopilot/lib/db";

const DEMO_CUSTOMERS = [
  { name: "דנה כהן", phone: "+972501234567", email: "dana@example.com", whatsappOptIn: true },
  { name: "יוסי לוי", phone: "+972502345678", email: "yossi@example.com", whatsappOptIn: false },
  { name: "מיכל אברהם", phone: "+972503456789", email: "michal@example.com", whatsappOptIn: true },
  { name: "אבי שמש", phone: "+972504567890", email: null, whatsappOptIn: false },
];

export async function syncDemoAppointments(organizationId: string): Promise<number> {
  const existing = await prisma.appointment.count({ where: { organizationId } });
  if (existing > 0) return 0;

  const customers = await Promise.all(
    DEMO_CUSTOMERS.map((c) =>
      prisma.customer.create({
        data: { organizationId, ...c },
      })
    )
  );

  await prisma.waitlistEntry.createMany({
    data: customers.slice(0, 3).map((c, i) => ({
      organizationId,
      customerId: c.id,
      priority: i,
    })),
  });

  const now = new Date();
  const appointments = [
    { days: 1, hours: 10, status: "CONFIRMED" as const, customer: customers[0] },
    { days: 2, hours: 14, status: "AT_RISK" as const, customer: customers[1] },
    { days: 3, hours: 9, status: "SCHEDULED" as const, customer: customers[2] },
    { days: 4, hours: 16, status: "SCHEDULED" as const, customer: customers[3] },
    { days: -2, hours: 11, status: "CANCELLED" as const, customer: customers[0] },
  ];

  for (const apt of appointments) {
    const start = new Date(now);
    start.setDate(start.getDate() + apt.days);
    start.setHours(apt.hours, 0, 0, 0);
    const end = new Date(start);
    end.setHours(apt.hours + 1);

    await prisma.appointment.create({
      data: {
        organizationId,
        customerId: apt.customer.id,
        title: `תור — ${apt.customer.name}`,
        startTime: start,
        endTime: end,
        status: apt.status,
        externalId: `demo-${apt.customer.id}-${apt.days}`,
        confirmedAt: apt.status === "CONFIRMED" ? new Date() : undefined,
        cancelledAt: apt.status === "CANCELLED" ? new Date() : undefined,
      },
    });
  }

  return appointments.length;
}
