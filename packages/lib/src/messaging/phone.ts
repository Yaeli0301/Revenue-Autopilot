const DEFAULT_COUNTRY = "972";

export function normalizePhone(
  phone: string,
  defaultCountry = DEFAULT_COUNTRY
): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Israeli local: 0501234567
  if (digits.startsWith("0") && digits.length === 10) {
    digits = defaultCountry + digits.slice(1);
  }

  // Missing country code: 501234567
  if (
    digits.length === 9 &&
    !digits.startsWith(defaultCountry) &&
    defaultCountry === "972"
  ) {
    digits = defaultCountry + digits;
  }

  if (digits.length < 11) return null;

  return `+${digits}`;
}

export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone) !== null;
}
