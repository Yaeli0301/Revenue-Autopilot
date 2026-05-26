import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import "@revenue-autopilot/ui/globals.css";
import "./globals.css";
import { isClerkConfigured } from "@/lib/clerk-config";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "Revenue Autopilot — אל תאבדו כסף מביטולי תורים",
  description:
    "ממלאים תורים שבוטלו ומצמצמים לקוחות שלא מגיעים — אוטומטית, בלי מאמץ.",
};

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className={`${heebo.variable} font-sans antialiased`}>
        {!isClerkConfigured() && (
          <div className="bg-yellow-500/15 border-b border-yellow-500/30 px-4 py-2 text-center text-sm text-yellow-200">
            מצב דמו — לחצו &quot;התחילו לחסוך כסף&quot; כדי לראות את כל המערכת
          </div>
        )}
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isClerkConfigured()) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <ClerkProvider localization={heIL}>
      <AppShell>{children}</AppShell>
    </ClerkProvider>
  );
}
