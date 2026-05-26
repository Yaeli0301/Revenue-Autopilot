import type { Invoice, Organization } from "@revenue-autopilot/lib/db";
import { prisma } from "@revenue-autopilot/lib/db";
import {
  INVOICE_TYPE_LABELS,
  formatInvoiceDate,
  formatIlsAg,
  formatVatPercent,
  getInvoiceIssuerConfig,
} from "@revenue-autopilot/lib";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "./client";
import { getPlanFromPriceId } from "./plans";

export interface InvoiceCustomerDetails {
  legalName: string;
  taxId: string | null;
  address: string | null;
  email: string | null;
}

export function getCustomerDetailsFromOrg(org: Organization): InvoiceCustomerDetails {
  return {
    legalName: org.billingLegalName ?? org.name,
    taxId: org.billingTaxId,
    address: org.billingAddress,
    email: org.billingEmail,
  };
}

function mapStripeInvoiceStatus(
  status: Stripe.Invoice.Status | null
): "PAID" | "OPEN" | "VOID" {
  switch (status) {
    case "paid":
      return "PAID";
    case "void":
      return "VOID";
    default:
      return "OPEN";
  }
}

function resolveInvoiceNumber(stripeInvoice: Stripe.Invoice): string {
  if (stripeInvoice.number) return stripeInvoice.number;
  return `STR-${stripeInvoice.id.replace("in_", "").slice(-8).toUpperCase()}`;
}

function resolveDescription(stripeInvoice: Stripe.Invoice): string {
  const line = stripeInvoice.lines.data[0];
  if (line?.description) return line.description;
  return "מנוי Revenue Autopilot";
}

function resolvePlanLabel(stripeInvoice: Stripe.Invoice): string | null {
  const priceId = stripeInvoice.lines.data[0]?.price?.id;
  if (!priceId) return null;
  const plan = getPlanFromPriceId(priceId);
  if (plan === "STARTER") return "בסיסי";
  if (plan === "PRO") return "מתקדם";
  return null;
}

export async function upsertInvoiceFromStripe(
  stripeInvoice: Stripe.Invoice,
  organizationId: string
): Promise<Invoice> {
  const totalAg = stripeInvoice.total ?? 0;
  const vatAg = stripeInvoice.tax ?? 0;
  const subtotalAg = Math.max(0, totalAg - vatAg);
  const issuedAt = stripeInvoice.status_transitions?.paid_at
    ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
    : new Date((stripeInvoice.created ?? Date.now() / 1000) * 1000);

  const data = {
    organizationId,
    invoiceNumber: resolveInvoiceNumber(stripeInvoice),
    documentType: "TAX_INVOICE" as const,
    status: mapStripeInvoiceStatus(stripeInvoice.status),
    issuedAt,
    periodStart: stripeInvoice.period_start
      ? new Date(stripeInvoice.period_start * 1000)
      : null,
    periodEnd: stripeInvoice.period_end
      ? new Date(stripeInvoice.period_end * 1000)
      : null,
    subtotalAg,
    vatAg,
    totalAg,
    currency: (stripeInvoice.currency ?? "ils").toUpperCase(),
    description: resolveDescription(stripeInvoice),
    planLabel: resolvePlanLabel(stripeInvoice),
    stripePdfUrl: stripeInvoice.invoice_pdf ?? null,
    hostedUrl: stripeInvoice.hosted_invoice_url ?? null,
  };

  return prisma.invoice.upsert({
    where: { stripeInvoiceId: stripeInvoice.id },
    create: {
      ...data,
      stripeInvoiceId: stripeInvoice.id,
    },
    update: data,
  });
}

export async function resolveOrganizationIdFromStripeInvoice(
  stripeInvoice: Stripe.Invoice
): Promise<string | null> {
  const fromMetadata = stripeInvoice.metadata?.organizationId;
  if (fromMetadata) return fromMetadata;

  const customerId =
    typeof stripeInvoice.customer === "string"
      ? stripeInvoice.customer
      : stripeInvoice.customer?.id;

  if (!customerId) return null;

  const org = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  return org?.id ?? null;
}

export async function syncInvoicesFromStripeForOrg(
  organizationId: string,
  stripeCustomerId: string
): Promise<number> {
  if (!isStripeConfigured()) return 0;

  const stripe = getStripe();
  let synced = 0;
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 100,
      starting_after: startingAfter,
    });

    for (const stripeInvoice of page.data) {
      if (stripeInvoice.status === "draft") continue;
      await upsertInvoiceFromStripe(stripeInvoice, organizationId);
      synced += 1;
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return synced;
}

export async function fetchStripePdfBuffer(invoice: Invoice): Promise<Buffer | null> {
  if (!invoice.stripeInvoiceId || !isStripeConfigured()) return null;

  const stripe = getStripe();
  const stripeInvoice = await stripe.invoices.retrieve(invoice.stripeInvoiceId);
  const pdfUrl = stripeInvoice.invoice_pdf ?? invoice.stripePdfUrl;
  if (!pdfUrl) return null;

  const response = await fetch(pdfUrl);
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

export function buildInvoiceHtml(params: {
  invoice: Invoice;
  customer: InvoiceCustomerDetails;
}): string {
  const issuer = getInvoiceIssuerConfig();
  const { invoice, customer } = params;
  const docLabel = INVOICE_TYPE_LABELS[invoice.documentType] ?? "חשבונית מס";
  const vatPercent = formatVatPercent(issuer.vatRate);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${docLabel} ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #111827;
      background: #fff;
    }
    .wrap { max-width: 820px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .title { font-size: 28px; font-weight: 700; margin: 0 0 8px; color: #1e40af; }
    .meta { font-size: 14px; line-height: 1.7; color: #4b5563; }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .box {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      background: #f9fafb;
    }
    .box h2 { margin: 0 0 10px; font-size: 15px; color: #374151; }
    .box p { margin: 4px 0; font-size: 14px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 12px;
      text-align: right;
      font-size: 14px;
    }
    th { background: #eff6ff; color: #1e3a8a; }
    .totals {
      width: 320px;
      margin-right: auto;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .totals div:last-child {
      border-bottom: none;
      background: #2563eb;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div>
        <h1 class="title">${docLabel}</h1>
        <div class="meta">מספר מסמך: <strong>${invoice.invoiceNumber}</strong></div>
        <div class="meta">תאריך: <strong>${formatInvoiceDate(invoice.issuedAt)}</strong></div>
        ${invoice.planLabel ? `<div class="meta">מסלול: <strong>${invoice.planLabel}</strong></div>` : ""}
      </div>
      <div class="meta" style="text-align:left">
        <div><strong>${issuer.legalName}</strong></div>
        ${issuer.taxId ? `<div>ח.פ / ע.מ: ${issuer.taxId}</div>` : ""}
        ${issuer.address ? `<div>${issuer.address}</div>` : ""}
        <div>${issuer.email}</div>
      </div>
    </div>

    <div class="parties">
      <div class="box">
        <h2>ספק</h2>
        <p><strong>${issuer.legalName}</strong></p>
        ${issuer.taxId ? `<p>ח.פ / ע.מ: ${issuer.taxId}</p>` : ""}
        ${issuer.address ? `<p>${issuer.address}</p>` : ""}
        <p>${issuer.email}</p>
      </div>
      <div class="box">
        <h2>לקוח</h2>
        <p><strong>${customer.legalName}</strong></p>
        ${customer.taxId ? `<p>ח.פ / ע.מ / ת.ז: ${customer.taxId}</p>` : ""}
        ${customer.address ? `<p>${customer.address}</p>` : ""}
        ${customer.email ? `<p>${customer.email}</p>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>תיאור</th>
          <th>תקופה</th>
          <th>סכום לפני מע"מ</th>
          <th>מע"מ (${vatPercent})</th>
          <th>סה"כ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${invoice.description}</td>
          <td>${
            invoice.periodStart && invoice.periodEnd
              ? `${formatInvoiceDate(invoice.periodStart)} – ${formatInvoiceDate(invoice.periodEnd)}`
              : "—"
          }</td>
          <td>${formatIlsAg(invoice.subtotalAg)}</td>
          <td>${formatIlsAg(invoice.vatAg)}</td>
          <td><strong>${formatIlsAg(invoice.totalAg)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div><span>סכום לפני מע"מ</span><span>${formatIlsAg(invoice.subtotalAg)}</span></div>
      <div><span>מע"מ (${vatPercent})</span><span>${formatIlsAg(invoice.vatAg)}</span></div>
      <div><span>סה"כ לתשלום</span><span>${formatIlsAg(invoice.totalAg)}</span></div>
    </div>

    <div class="footer">
      <p>מסמך זה הופק באופן ממוחשב ומהווה חשבונית/קבלה לצורכי מס לפי דין.</p>
      <p>Revenue Autopilot · ${issuer.legalName}${issuer.taxId ? ` · ח.פ ${issuer.taxId}` : ""}</p>
    </div>

    <p class="no-print" style="margin-top:24px;font-size:13px;color:#6b7280">
      לשמירה כ-PDF: Ctrl+P / ⌘+P → "שמור כ-PDF"
    </p>
  </div>
</body>
</html>`;
}

export async function getInvoiceDownloadPayload(params: {
  invoice: Invoice;
  org: Organization;
}): Promise<{ contentType: string; filename: string; body: Buffer | string }> {
  const pdfBuffer = await fetchStripePdfBuffer(params.invoice);
  if (pdfBuffer) {
    return {
      contentType: "application/pdf",
      filename: `${params.invoice.invoiceNumber}.pdf`,
      body: pdfBuffer,
    };
  }

  const html = buildInvoiceHtml({
    invoice: params.invoice,
    customer: getCustomerDetailsFromOrg(params.org),
  });

  return {
    contentType: "text/html; charset=utf-8",
    filename: `${params.invoice.invoiceNumber}.html`,
    body: html,
  };
}
