import type { PrismaClient } from "@prisma/client";

export interface ClaimResult {
  success: boolean;
  winnerId?: string;
  error?: "ALREADY_CLAIMED" | "APPOINTMENT_NOT_AVAILABLE" | "NOT_ON_WAITLIST";
}

export async function claimSlot(
  db: PrismaClient,
  params: {
    appointmentId: string;
    customerId: string;
    organizationId: string;
  }
): Promise<ClaimResult> {
  return db.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirst({
      where: {
        id: params.appointmentId,
        organizationId: params.organizationId,
        status: "CANCELLED",
      },
      include: { slotClaim: true },
    });

    if (!appointment) {
      return { success: false, error: "APPOINTMENT_NOT_AVAILABLE" };
    }

    if (appointment.slotClaim) {
      return { success: false, error: "ALREADY_CLAIMED" };
    }

    const onWaitlist = await tx.waitlistEntry.findFirst({
      where: {
        organizationId: params.organizationId,
        customerId: params.customerId,
        active: true,
      },
    });

    if (!onWaitlist) {
      return { success: false, error: "NOT_ON_WAITLIST" };
    }

    await tx.slotClaim.create({
      data: {
        appointmentId: params.appointmentId,
        customerId: params.customerId,
      },
    });

    await tx.appointment.update({
      where: { id: params.appointmentId },
      data: {
        customerId: params.customerId,
        status: "SCHEDULED",
        cancelledAt: null,
      },
    });

    return { success: true, winnerId: params.customerId };
  });
}
