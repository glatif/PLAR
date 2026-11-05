import type { Database } from "@/lib/supabase/database.types";
import type { Tone } from "@/components/ui/badge";

// Display helpers shared by the workspace views. Times show in Pacific time, where TRU is.

const TZ = "America/Vancouver";

export type CaseStage = Database["public"]["Enums"]["case_stage"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];

export const stageOrder: CaseStage[] = ["readiness", "portfolio", "feedback", "approval", "interview", "assessment", "decision", "credit", "closed"];

export const stageMeta: Record<CaseStage, { label: string; tone: Tone }> = {
  readiness: { label: "Readiness", tone: "neutral" },
  portfolio: { label: "Portfolio", tone: "neutral" },
  feedback: { label: "Feedback", tone: "accent" },
  approval: { label: "Approval", tone: "warning" },
  interview: { label: "Interview", tone: "info" },
  assessment: { label: "Assessment", tone: "accent" },
  decision: { label: "Decision", tone: "warning" },
  credit: { label: "Credit", tone: "success" },
  closed: { label: "Closed", tone: "success" },
};

export const taskMeta: Record<TaskStatus, { label: string; tone: Tone }> = {
  todo: { label: "To do", tone: "neutral" },
  ready: { label: "Your turn", tone: "accent" },
  due_soon: { label: "Due soon", tone: "warning" },
  review: { label: "Review", tone: "accent" },
  waiting: { label: "Waiting", tone: "neutral" },
  done: { label: "Done", tone: "success" },
};

/** Today's date in Pacific time, as YYYY-MM-DD. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Whole days from a to b (dates as YYYY-MM-DD). */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!iso) return "—";
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("en-CA", { timeZone: iso.length === 10 ? "UTC" : TZ, ...opts }).format(date);
}

export function formatSlot(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

export function dueLabel(dueOn: string | null, today = todayISO()) {
  if (!dueOn) return null;
  const days = daysBetween(today, dueOn);
  if (days < 0) return `Was due ${formatDate(dueOn)}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${formatDate(dueOn)}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}
