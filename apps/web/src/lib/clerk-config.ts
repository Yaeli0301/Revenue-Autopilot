export function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";

  return (
    pk.startsWith("pk_") &&
    sk.startsWith("sk_") &&
    !pk.includes("placeholder") &&
    !sk.includes("placeholder") &&
    pk.length > 20
  );
}
