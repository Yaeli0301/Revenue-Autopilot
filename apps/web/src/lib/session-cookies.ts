export function getSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    path: "/",
    maxAge,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
