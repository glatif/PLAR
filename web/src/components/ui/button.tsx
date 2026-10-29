import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Variants and sizes follow design system §9.1. Default height is 44px (the HIG default touch target).
type Variant = "primary" | "secondary" | "plain" | "neutral";
type Size = "lg" | "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 ease-calm disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-accent-subtle text-accent-ink hover:bg-teal-100 dark:hover:bg-teal-900/60",
  plain: "text-accent hover:text-accent-hover",
  neutral: "bg-black/5 text-label hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15",
};

const sizes: Record<Size, string> = {
  lg: "h-[52px] px-7 text-[17px]",
  md: "h-11 px-5 text-[15px]",
  sm: "h-8 px-3.5 text-[13px]",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
