export function buildDedupeKey(parts: {
  organizationId: string;
  appointmentId?: string;
  template: string;
  channel: string;
  recipient: string;
}): string {
  return [
    parts.organizationId,
    parts.appointmentId ?? "none",
    parts.template,
    parts.channel,
    parts.recipient,
  ].join(":");
}

export function formatCurrency(amount: number, locale = "he-IL"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "org";
}

export function isWithinQuietHours(
  hour: number,
  start: number,
  end: number
): boolean {
  if (start <= end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

export function calculateRevenueSaved(params: {
  autofillWins: number;
  confirmedFromAtRisk: number;
  avgPrice: number;
}): number {
  return (params.autofillWins + params.confirmedFromAtRisk) * params.avgPrice;
}
