"use client";

import type { ReactNode } from "react";
import { SwitchCamera, X, Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/cn";

// The full-screen camera stage: a dark, calm space where controls float on clear glass over the video.

export const STEPS = ["Face", "Movement", "ID front", "ID back"] as const;

export function StageTopBar({
  step,
  title,
  onClose,
  onSwitchCamera,
  torch,
}: {
  step: number;
  title: string;
  onClose: () => void;
  onSwitchCamera?: () => void;
  torch?: { on: boolean; toggle: () => void } | null;
}) {
  return (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(env(safe-area-inset-top),12px)]">
      <GlassButton label="Leave verification" onClick={onClose}>
        <X className="size-5" />
      </GlassButton>
      <div className="flex min-w-0 flex-col items-center gap-2 pt-1">
        <ol className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i < step ? "w-4 bg-white" : i === step ? "w-7 bg-white" : "w-4 bg-white/35",
              )}
            />
          ))}
        </ol>
        <p className="truncate text-[13px] font-semibold tracking-[-0.005em] text-white drop-shadow">{title}</p>
      </div>
      <div className="flex gap-2">
        {torch ? (
          <GlassButton label={torch.on ? "Turn the light off" : "Turn the light on"} onClick={torch.toggle} pressed={torch.on}>
            {torch.on ? <Zap className="size-5" /> : <ZapOff className="size-5" />}
          </GlassButton>
        ) : null}
        {onSwitchCamera ? (
          <GlassButton label="Switch camera" onClick={onSwitchCamera}>
            <SwitchCamera className="size-5" />
          </GlassButton>
        ) : (
          <span className="size-11" aria-hidden />
        )}
      </div>
    </header>
  );
}

export function GlassButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-xl transition-[background-color,transform] active:scale-95",
        pressed ? "bg-white text-label" : "bg-white/15 hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}

/** The status line above the controls. Announced to screen readers when it changes. */
export function HintPill({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "good" | "warn" }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "max-w-[min(92vw,420px)] rounded-full border px-4 py-2.5 text-center text-[15px] font-semibold leading-[20px] tracking-[-0.01em] backdrop-blur-xl transition-colors duration-200",
        tone === "good" && "border-[#4cd58a]/50 bg-[#1e7b34]/80 text-white",
        tone === "warn" && "border-white/20 bg-black/55 text-[#ffd3aa]",
        tone === "neutral" && "border-white/20 bg-black/50 text-white",
      )}
    >
      {text}
    </p>
  );
}

/** The big round capture button. "ready" adds a green ring; it's always pressable. */
export function Shutter({ onPress, ready, label, busy }: { onPress: () => void; ready: boolean; label: string; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={busy}
      aria-label={label}
      className="group relative flex size-[76px] items-center justify-center rounded-full disabled:opacity-60"
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full border-[4px] transition-colors duration-200",
          ready ? "border-[#4cd58a] shadow-[0_0_0_6px_rgba(76,213,138,0.25)]" : "border-white/85",
        )}
      />
      <span
        className={cn(
          "size-[60px] rounded-full transition-[transform,background-color] duration-150 group-active:scale-90",
          ready ? "bg-white" : "bg-white/70",
        )}
      />
    </button>
  );
}

/** A plain text action on the dark stage (for the manual route and other secondary choices). */
export function StageLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full px-4 text-[14px] font-semibold text-white/90 underline decoration-white/40 underline-offset-4 hover:text-white"
    >
      {children}
    </button>
  );
}

/** The bottom area: hint, controls and a secondary link, clear of the home indicator. */
export function StageFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-4 bg-linear-to-t from-black/70 via-black/30 to-transparent px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-16">
      {children}
    </footer>
  );
}

/** A white flash when a photo is taken. */
export function Flash({ show }: { show: boolean }) {
  return <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-30 bg-white transition-opacity", show ? "opacity-80 duration-0" : "opacity-0 duration-300")} />;
}
