import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

// Status pills (design system §9.6) and the AI marker (§9.8). Colour is never the only signal: always text, often an icon.
type Tone = "neutral" | "accent" | "success" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-black/[0.05] text-label-2 dark:bg-white/10",
  accent: "bg-accent-subtle text-accent-ink",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none tracking-[0.01em]",
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
    <Badge tone="accent" icon={<Sparkles aria-hidden className="size-3" />}>
      {children}
    </Badge>
  );
}
