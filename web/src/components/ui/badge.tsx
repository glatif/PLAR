import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AiSparkle } from "@/components/ui/filled-icons";

// Status pills and the AI marker. Colour is never the only signal: always text, usually a filled icon.
export type Tone = "neutral" | "accent" | "success" | "warning" | "info" | "danger" | "ai";

const tones: Record<Tone, string> = {
  neutral: "bg-fill-1 text-neutral-chip-ink",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  info: "bg-info-subtle text-info",
  danger: "bg-danger-subtle text-danger",
  ai: "bg-ai-soft text-ai",
};

export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium leading-none [&>svg]:size-[13px]",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Marks AI-generated or AI-suggested content until a person accepts it. */
export function AiBadge({ children = "AI suggestion" }: { children?: ReactNode }) {
  return (
    <Badge tone="ai" icon={<AiSparkle />}>
      {children}
    </Badge>
  );
}
