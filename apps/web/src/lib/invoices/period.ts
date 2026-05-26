import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Prisma } from "@revenue-autopilot/lib/db";

const TZ = "Asia/Jerusalem";

export function buildInvoicePeriodFilter(params: {
  year: number;
  month?: number;
}): Prisma.InvoiceWhereInput["issuedAt"] {
  const { year, month } = params;

  if (month !== undefined) {
    const monthStart = toZonedTime(new Date(year, month - 1, 1), TZ);
    const monthEnd = endOfMonth(monthStart);
    return {
      gte: startOfMonth(monthStart),
      lte: monthEnd,
    };
  }

  const yearStart = toZonedTime(new Date(year, 0, 1), TZ);
  const yearEnd = endOfYear(yearStart);
  return {
    gte: startOfYear(yearStart),
    lte: yearEnd,
  };
}

export function buildExportFilename(params: {
  year: number;
  month?: number;
}): string {
  if (params.month !== undefined) {
    return `invoices-${params.year}-${String(params.month).padStart(2, "0")}.zip`;
  }
  return `invoices-${params.year}.zip`;
}
