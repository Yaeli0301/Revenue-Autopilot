import { NextResponse } from "next/server";
import { z } from "zod";
import JSZip from "jszip";
import { prisma } from "@revenue-autopilot/lib/db";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { apiError, requireDbUser } from "@/lib/api-guards";
import { getInvoiceDownloadPayload } from "@/lib/stripe";
import {
  buildExportFilename,
  buildInvoicePeriodFilter,
} from "@/lib/invoices/period";

const querySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) return apiError("No organization", 404);

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      year: url.searchParams.get("year"),
      month: url.searchParams.get("month") ?? undefined,
    });

    if (!parsed.success) {
      return apiError("year is required (month optional)", 400);
    }

    const { year, month } = parsed.data;

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: org.id,
        issuedAt: buildInvoicePeriodFilter({ year, month }),
      },
      orderBy: { issuedAt: "asc" },
    });

    if (invoices.length === 0) {
      return apiError("No invoices found for this period", 404);
    }

    const zip = new JSZip();

    for (const invoice of invoices) {
      const payload = await getInvoiceDownloadPayload({ invoice, org });
      const body =
        typeof payload.body === "string"
          ? payload.body
          : Buffer.from(payload.body);
      zip.file(payload.filename, body);
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const filename = buildExportFilename({ year, month });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Invoice export error:", error);
    return apiError("Internal error", 500);
  }
}
