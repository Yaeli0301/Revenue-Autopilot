"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, LayoutDashboard, Calendar, Settings, CreditCard, LogOut } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@revenue-autopilot/ui";

interface AppShellProps {
  orgName: string;
  devMode?: boolean;
  children: React.ReactNode;
}

export function AppShell({ orgName, devMode, children }: AppShellProps) {
  const router = useRouter();

  async function logout() {
    if (devMode) {
      await fetch("/api/dev/logout", { method: "POST" });
      router.push("/");
      router.refresh();
      return;
    }
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col border-l border-border bg-card/50">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">Revenue Autopilot</p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
              {orgName}
            </p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-primary/10 text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            דשבורד
          </Link>
          <Link
            href="/dashboard/appointments"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Calendar className="h-4 w-4" />
            תורים
          </Link>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            מנוי
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            הגדרות
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <h1 className="font-semibold md:hidden">{orgName}</h1>
          <div className="mr-auto md:mr-0" />
          {devMode ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              יציאה
            </Button>
          ) : (
            <UserButton afterSignOutUrl="/" />
          )}
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
