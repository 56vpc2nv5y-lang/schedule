import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md border px-2 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border bg-secondary text-secondary-foreground",
        active: "border-primary/25 bg-primary/10 text-primary",
        done: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
        waiting: "border-amber-500/25 bg-amber-500/10 text-amber-700",
        risk: "border-red-500/25 bg-red-500/10 text-red-700",
        info: "border-blue-500/25 bg-blue-500/10 text-blue-700",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
