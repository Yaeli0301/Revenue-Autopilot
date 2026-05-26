export const DEFAULT_VAT_RATE = 0.18;

export function getVatRateFromEnv(): number {
  const raw = process.env.INVOICE_VAT_RATE;
  if (!raw) return DEFAULT_VAT_RATE;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_VAT_RATE;
}

/** Split VAT-inclusive total (agorot) into subtotal + VAT. */
export function splitVatInclusiveTotal(
  totalAg: number,
  vatRate = getVatRateFromEnv()
): { subtotalAg: number; vatAg: number; totalAg: number } {
  const subtotalAg = Math.round(totalAg / (1 + vatRate));
  const vatAg = totalAg - subtotalAg;
  return { subtotalAg, vatAg, totalAg };
}

export function formatIlsAg(agorot: number): string {
  return `₪${(agorot / 100).toLocaleString("he-IL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatVatPercent(vatRate = getVatRateFromEnv()): string {
  return `${Math.round(vatRate * 100)}%`;
}

export interface InvoiceIssuerConfig {
  legalName: string;
  taxId: string;
  address: string;
  email: string;
  vatRate: number;
}

export function getInvoiceIssuerConfig(): InvoiceIssuerConfig {
  return {
    legalName: process.env.INVOICE_ISSUER_NAME ?? "Revenue Autopilot",
    taxId: process.env.INVOICE_ISSUER_TAX_ID ?? "",
    address: process.env.INVOICE_ISSUER_ADDRESS ?? "",
    email: process.env.INVOICE_ISSUER_EMAIL ?? "billing@revenue-autopilot.com",
    vatRate: getVatRateFromEnv(),
  };
}

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  TAX_INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  PAID: "שולם",
  OPEN: "פתוח",
  VOID: "בוטל",
};
