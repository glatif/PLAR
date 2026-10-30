import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Capsule buttons in a row, one primary per view. Default height is 44px (the HIG default touch target).
type Variant = "primary" | "secondary" | "neutral" | "bordered" | "plain" | "destructive";
type Size = "lg" | "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-150 ease-calm active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(138,59,15,0.25)] hover:bg-accent-hover active:bg-accent-press",
  secondary: "bg-accent-soft text-accent-ink hover:bg-tangerine-200",
  neutral: "bg-fill-1 text-label hover:bg-fill-2",
  bordered: "bg-surface text-label shadow-[inset_0_0_0_1px_var(--separator-strong),0_1px_2px_rgba(29,29,31,0.05)] hover:bg-surface-2",
  plain: "text-accent-text hover:bg-accent-subtle",
  destructive: "bg-danger-subtle text-danger hover:bg-[#fad9d5]",
};

const sizes: Record<Size, string> = {
  lg: "h-[52px] px-[26px] text-[17px]",
  md: "h-11 px-5 text-[15px]",
  sm: "h-8 gap-1.5 px-3.5 text-[13px]",
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
