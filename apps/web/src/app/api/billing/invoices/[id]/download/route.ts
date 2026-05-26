import { NextResponse } from "next/server";
import { prisma } from "@revenue-autopilot/lib/db";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { apiError, requireDbUser } from "@/lib/api-guards";
import { getInvoiceDownloadPayload } from "@/lib/stripe";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) return apiError("No organization", 404);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: org.id,
      },
    });

    if (!invoice) return apiError("Invoice not found", 404);

    const payload = await getInvoiceDownloadPayload({ invoice, org });
    const body =
      typeof payload.body === "string" ? payload.body : Buffer.from(payload.body);

    return new NextResponse(body, {
      headers: {
        "Content-Type": payload.contentType,
        "Content-Disposition": `attachment; filename="${payload.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Invoice download error:", error);
    return apiError("Internal error", 500);
  }
}
