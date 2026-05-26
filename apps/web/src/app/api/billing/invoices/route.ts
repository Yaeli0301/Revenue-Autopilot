import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@revenue-autopilot/lib/db";
import {
  formatIlsAg,
  formatInvoiceDate,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
} from "@revenue-autopilot/lib";
import { getCurrentOrg } from "@/lib/auth";
import { getAuthContext } from "@/lib/app-auth";
import { apiError, apiSuccess, requireDbUser } from "@/lib/api-guards";
import { syncInvoicesFromStripeForOrg } from "@/lib/stripe";
import { buildInvoicePeriodFilter } from "@/lib/invoices/period";

const querySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  sync: z.enum(["1", "true"]).optional(),
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
      year: url.searchParams.get("year") ?? undefined,
      month: url.searchParams.get("month") ?? undefined,
      sync: url.searchParams.get("sync") ?? undefined,
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters", 400);
    }

    const now = new Date();
    const year = parsed.data.year ?? now.getFullYear();
    const month = parsed.data.month;

    if (parsed.data.sync && org.stripeCustomerId) {
      await syncInvoicesFromStripeForOrg(org.id, org.stripeCustomerId);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: org.id,
        issuedAt: buildInvoicePeriodFilter({ year, month }),
      },
      orderBy: { issuedAt: "desc" },
    });

    return apiSuccess({
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        documentType: invoice.documentType,
        documentTypeLabel: INVOICE_TYPE_LABELS[invoice.documentType] ?? invoice.documentType,
        status: invoice.status,
        statusLabel: INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status,
        issuedAt: invoice.issuedAt.toISOString(),
        issuedAtLabel: formatInvoiceDate(invoice.issuedAt),
        description: invoice.description,
        planLabel: invoice.planLabel,
        subtotalLabel: formatIlsAg(invoice.subtotalAg),
        vatLabel: formatIlsAg(invoice.vatAg),
        totalLabel: formatIlsAg(invoice.totalAg),
        hasStripePdf: !!invoice.stripePdfUrl || !!invoice.stripeInvoiceId,
        hostedUrl: invoice.hostedUrl,
      })),
      filters: { year, month: month ?? null },
      billingDetails: {
        billingLegalName: org.billingLegalName ?? org.name,
        billingTaxId: org.billingTaxId ?? "",
        billingAddress: org.billingAddress ?? "",
        billingEmail: org.billingEmail ?? ctx!.dbUser!.email,
      },
      canSync: !!org.stripeCustomerId,
    });
  } catch (error) {
    console.error("Invoices list error:", error);
    return apiError("Internal error", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getAuthContext();
    const authError = requireDbUser(ctx);
    if (authError) return authError;

    const org = await getCurrentOrg(ctx!.dbUser!.id);
    if (!org) return apiError("No organization", 404);

    const bodySchema = z.object({
      billingLegalName: z.string().min(1).max(200),
      billingTaxId: z.string().max(20).optional(),
      billingAddress: z.string().max(500).optional(),
      billingEmail: z.string().email().optional(),
    });

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid billing details", 400);
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        billingLegalName: parsed.data.billingLegalName,
        billingTaxId: parsed.data.billingTaxId || null,
        billingAddress: parsed.data.billingAddress || null,
        billingEmail: parsed.data.billingEmail || null,
      },
    });

    return apiSuccess({
      billingDetails: {
        billingLegalName: updated.billingLegalName ?? updated.name,
        billingTaxId: updated.billingTaxId ?? "",
        billingAddress: updated.billingAddress ?? "",
        billingEmail: updated.billingEmail ?? ctx!.dbUser!.email,
      },
    });
  } catch (error) {
    console.error("Billing details error:", error);
    return apiError("Internal error", 500);
  }
}
