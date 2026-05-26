import * as React from "react";
import { cn } from "../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          default: "bg-primary/15 text-primary border border-primary/30",
          success: "bg-accent/15 text-accent border border-accent/30",
          warning: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
          danger: "bg-red-500/15 text-red-400 border border-red-500/30",
          outline: "border border-border text-muted-foreground",
        }[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
