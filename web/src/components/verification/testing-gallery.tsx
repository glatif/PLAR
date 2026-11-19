"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, Check, ChevronDown, Download, Lock, LockOpen, Play, RefreshCw, Search, Trash2, X } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Badge, type Tone } from "@/components/ui/badge";
import { AlertFilled, InboxFilled, LockFilled } from "@/components/ui/filled-icons";
import { deleteCaptures, fileUrl, lockCaptures, patchSession, reprocess, unlockCaptures } from "@/components/verification/client-api";
import { AiCheckPanel } from "@/components/verification/ai-check-panel";
import { cn } from "@/lib/cn";
import type { AiCheck } from "@/lib/verification/ai-check";
import type { Artifact, VerificationSession } from "@/lib/verification/storage";
import { flagsFor, outcomeMeta, straighteningMeta, type ArtifactKind, type StepKey, type StepOutcome } from "@/lib/verification/states";

// Staff view of every verification attempt: find a student, open their row, compare the photos with
// the ID and mark them verified or not. The AI's suggestion sits alongside; a person decides.

type Decision = "verified" | "not_verified" | null;
type StatusFilter = "all" | "to_review" | "verified" | "not_verified";
type Sort = "newest" | "oldest" | "name" | "match";

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "to_review", label: "To review" },
  { key: "verified", label: "Verified" },
  { key: "not_verified", label: "Not verified" },
];

const sorts: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "name", label: "Name A–Z" },
  { key: "match", label: "Highest match" },
];

const kindLabel: Record<ArtifactKind, string> = {
  face: "Face photo",
  "head-turn": "Head movement",
  "id-front": "ID front · original",
  "id-back": "ID back · original",
  "id-front-straightened": "ID front · straightened",
  "id-back-straightened": "ID back · straightened",
};

/** The four captures shown in an open row, in order. */
const slots: { kind: ArtifactKind; step: StepKey; label: string }[] = [
  { kind: "face", step: "face", label: "Face photo" },
  { kind: "head-turn", step: "headTurn", label: "Head movement" },
  { kind: "id-front", step: "idFront", label: "ID front" },
  { kind: "id-back", step: "idBack", label: "ID back" },
];

/** Face plus both ID sides captured: the AI check can run. */
function eligibleForAi(session: VerificationSession) {
  return ["face", "id-front", "id-back"].every((kind) => session.artifacts.some((a) => a.kind === kind));
}

function formatBytes(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

function deviceSummary(ua: string) {
  const device = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Computer";
  const browser = /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return browser ? `${device} · ${browser}` : device;
}

function when(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

const noSubscribe = () => () => {};

/**
 * A date and time in the viewer's own time zone. Formatted in the browser only: the server's clock
 * settings can differ (and its time zone data can be older), which would show a different hour.
 */
function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(noSubscribe, () => when(iso), () => null);
  return <time dateTime={iso}>{text ?? " "}</time>;
}

/** IDs print names in capitals: show "GURSAHIB SINGH" as "Gursahib Singh" (mixed-case names stay as read). */
function displayName(name: string) {
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}

/** The person's name as the AI read it from the ID, or what's holding it up. */
function runTitle(session: VerificationSession): { name: string; known: boolean } {
  const front = session.aiCheck?.status === "done" ? session.aiCheck.result?.id_front : undefined;
  const read = front?.full_name?.trim() || [front?.given_names, front?.surname].map((x) => x?.trim()).filter(Boolean).join(" ");
  if (read) return { name: displayName(read), known: true };
  const hasId = session.artifacts.some((a) => a.kind === "id-front");
  if (!hasId) return { name: "No ID photo yet", known: false };
  if (session.aiCheck?.status === "running") return { name: "Reading the ID…", known: false };
  return { name: "Name not read", known: false };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** The AI's face-match suggestion as a short pill, or nothing when there isn't one. */
function matchPill(check?: AiCheck): { label: string; tone: Tone; value: number } | null {
  if (!check) return null;
  if (check.status === "running") return { label: "Checking…", tone: "ai", value: -1 };
  if (check.status === "error" || !check.result) return { label: "AI check failed", tone: "neutral", value: -1 };
  const { probability_same_person: p, verdict } = check.result.face_match;
  if (verdict === "uncertain" && p === 0) return { label: "Can't compare", tone: "neutral", value: -1 };
  return { label: `${p}% match`, tone: verdict === "likely_same" ? "success" : verdict === "uncertain" ? "warning" : "danger", value: p };
}

/** Anything about the attempt itself that deserves a look, as one short pill. */
function attentionPill(session: VerificationSession, flagCount: number): { label: string; tone: Tone } | null {
  if (session.status === "blocked") return { label: "Camera unavailable", tone: "neutral" };
  if (session.status === "in_progress" || session.status === "abandoned") return { label: "Incomplete", tone: "neutral" };
  if (flagCount) return { label: `${flagCount} to check`, tone: "warning" };
  return null;
}

/** Plain-language reasons a reviewer should look closely at this attempt. */
function flagsOf(session: VerificationSession) {
  const outcomes = Object.fromEntries(Object.entries(session.steps).map(([k, v]) => [k, v?.outcome])) as Partial<Record<StepKey, StepOutcome>>;
  const straightening = Object.fromEntries(
    session.artifacts.filter((a) => a.kind === "id-front" || a.kind === "id-back").map((a) => [a.kind === "id-front" ? "idFront" : "idBack", a.straightening]),
  );
  return flagsFor(outcomes, straightening);
}

/** Readable rows for a capture's technical details. */
function captureDetails(a: Artifact): [string, string][] {
  const m = a.metrics ?? {};
  const rows: [string, string | null | undefined][] = [
    ["Length", a.durationMs ? `${(a.durationMs / 1000).toFixed(1)} s` : null],
    ["Camera", m.camera === "user" ? "Front" : m.camera === "environment" ? "Back" : null],
    ["Card at capture", typeof m.hintAtCapture === "string" ? m.hintAtCapture.replace(/_/g, " ") : null],
    ["Card fills frame", typeof m.fillOfFrame === "number" ? `${Math.round(m.fillOfFrame * 100)}%` : null],
    ["Corners", a.quad ? (m.method === "rect" ? "Fitted to a rough outline" : "Found") : a.straightening === "cropped" ? "Not found (cropped to frame)" : null],
    ["Edge confidence", typeof m.score === "number" ? `${Math.round(m.score * 100)}%` : null],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1]));
}

type Toast = { message: string; undo?: () => void };

/**
 * Locked or unlocked. Locked (the default), the list shows names, dates, the AI's match percentage and
 * decisions only: no photos, video or ID details reach the browser. The password unlocks them for 30
 * minutes, which also allows decisions and deleting.
 */
function UnlockBar({ until, onChanged }: { until: number | null; onChanged: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const time = useSyncExternalStore(
    noSubscribe,
    () => (until ? new Date(until).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" }) : null),
    () => null,
  );

  if (until) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-success-subtle px-4 py-3">
        <LockOpen className="size-5 shrink-0 text-success" aria-hidden />
        <p className="min-w-0 flex-1 text-[14.5px] text-success">
          <strong>Unlocked.</strong> Photos, video and ID details are visible{time ? ` until ${time}` : ""}.
        </p>
        <button
          type="button"
          onClick={async () => {
            await lockCaptures().catch(() => undefined);
            onChanged();
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-4 text-[13.5px] font-semibold text-label shadow-1 hover:bg-surface-2"
        >
          <Lock className="size-4" aria-hidden />
          Lock now
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-6 rounded-xl bg-surface p-4 shadow-1 sm:p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await unlockCaptures(password);
          setPassword("");
          onChanged();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't unlock");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-label text-white">
          <LockFilled className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15.5px] font-semibold">Photos, video and ID details are hidden</p>
          <p className="text-[13.5px] leading-[19px] text-label-2">They&rsquo;re stored encrypted. Enter the password to see them for 30 minutes, and to record decisions.</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            placeholder="Password"
            aria-describedby={error ? "unlock-error" : undefined}
            className="h-11 w-full rounded-full bg-surface-2 px-4 text-[15px] shadow-[inset_0_0_0_1px_var(--separator-strong)] outline-none placeholder:text-label-2 focus:shadow-[inset_0_0_0_1.5px_var(--accent),0_0_0_4px_var(--focus-ring)]"
          />
        </label>
        <button type="submit" disabled={busy || !password} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50">
          <LockOpen className="size-4" aria-hidden />
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </div>
      {error ? (
        <p id="unlock-error" role="alert" className="mt-2 flex items-center gap-2 text-[13.5px] text-danger">
          <AlertFilled className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function TestingGallery({ sessions, aiEnabled, unlockedUntil }: { sessions: VerificationSession[]; aiEnabled: boolean; unlockedUntil: number | null }) {
  const router = useRouter();
  const locked = !unlockedUntil;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState<{ session: VerificationSession; artifact: Artifact } | null>(null);
  // Decisions show straight away; the server copy catches up on the next refresh.
  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map());

  const decisionOf = (s: VerificationSession): Decision => {
    if (decisions.has(s.id)) return decisions.get(s.id)!;
    const d = s.review?.decision;
    return d === "verified" || d === "not_verified" ? d : null;
  };

  const rows = useMemo(
    () =>
      sessions.map((session) => {
        const title = runTitle(session);
        const flags = flagsOf(session);
        return { session, title, flags, match: matchPill(session.aiCheck) };
      }),
    [sessions],
  );

  const counts = {
    all: rows.length,
    to_review: rows.filter((r) => !decisionOf(r.session)).length,
    verified: rows.filter((r) => decisionOf(r.session) === "verified").length,
    not_verified: rows.filter((r) => decisionOf(r.session) === "not_verified").length,
  };

  const q = query.trim().toLowerCase();
  const visible = rows
    .filter((r) => !q || (r.title.known && r.title.name.toLowerCase().includes(q)))
    .filter((r) => status === "all" || (status === "to_review" ? !decisionOf(r.session) : decisionOf(r.session) === status))
    .sort((a, b) => {
      if (sort === "oldest") return a.session.createdAt.localeCompare(b.session.createdAt);
      if (sort === "name") return Number(b.title.known) - Number(a.title.known) || a.title.name.localeCompare(b.title.name);
      if (sort === "match") return (b.match?.value ?? -1) - (a.match?.value ?? -1) || b.session.createdAt.localeCompare(a.session.createdAt);
      return b.session.createdAt.localeCompare(a.session.createdAt);
    });
  const visibleIds = visible.map((r) => r.session.id);
  const chosen = visibleIds.filter((id) => selected.has(id));
  const allChosen = visibleIds.length > 0 && chosen.length === visibleIds.length;

  // Keep refreshing while ID photos are processed or the AI check runs in the background.
  const processing = sessions.some((s) => s.artifacts.some((a) => a.straightening === "pending") || s.aiCheck?.status === "running");
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(timer);
  }, [processing, router]);

  // When the unlock runs out, show the locked list again.
  useEffect(() => {
    if (!unlockedUntil) return;
    const timer = setTimeout(() => router.refresh(), Math.max(0, unlockedUntil - Date.now()) + 500);
    return () => clearTimeout(timer);
  }, [unlockedUntil, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.undo ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function decide(session: VerificationSession, next: Decision, name: string, offerUndo = true) {
    const previous = decisionOf(session);
    setDecisions((m) => new Map(m).set(session.id, next));
    try {
      await patchSession(session.id, { review: next ? { decision: next } : null });
      const message = next === "verified" ? `${name} marked verified` : next === "not_verified" ? `${name} marked not verified` : `${name} moved back to review`;
      setToast({ message, undo: offerUndo ? () => decide(session, previous, name, false) : undefined });
      router.refresh();
    } catch {
      setDecisions((m) => new Map(m).set(session.id, previous));
      setToast({ message: "Couldn't save the decision. Try again." });
    }
  }

  async function runDelete(ids: string[]) {
    setBusy(true);
    try {
      await deleteCaptures({ sessions: ids });
      setToast({ message: ids.length === 1 ? "Deleted 1 test permanently" : `Deleted ${ids.length} tests permanently` });
      setSelected((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
      router.refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Couldn't delete" });
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <BrandMark href="/" />
        <Link href="/verify" className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-[14px] font-semibold text-on-accent hover:bg-accent-hover">
          Run a new test
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <header className="mt-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-text">Verification lab</p>
        <h1 className="mt-2 font-serif text-[36px] font-semibold leading-[42px] tracking-[-0.025em] sm:text-[40px] sm:leading-[46px]">Identity checks</h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-[24px] text-label-2">Open a student to compare their photos with their ID, then mark them verified or not.</p>
      </header>

      <UnlockBar until={unlockedUntil} onChanged={() => router.refresh()} />

      {sessions.length ? (
        <div className="sticky top-0 z-30 -mx-4 mt-6 space-y-3 bg-canvas/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search by name</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-label-2" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
                className="h-11 w-full rounded-full bg-surface pl-10 pr-10 text-[15px] shadow-1 outline-none placeholder:text-label-2 focus-visible:shadow-[0_0_0_3px_var(--focus-ring)] [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-label-2 hover:bg-fill-1">
                  <X className="size-4" />
                </button>
              ) : null}
            </label>
            <label className="relative shrink-0">
              <span className="sr-only">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-11 appearance-none rounded-full bg-surface pl-4 pr-9 text-[14px] font-medium shadow-1 outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              >
                {sorts.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-label-2" aria-hidden />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Verification status">
              {statusFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="radio"
                  aria-checked={status === f.key}
                  onClick={() => setStatus(f.key)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition-colors",
                    status === f.key ? "bg-label text-white" : "bg-surface text-label shadow-1 hover:bg-fill-1",
                  )}
                >
                  {f.label}
                  <span className={cn("tabular-nums", status === f.key ? "text-white/70" : "text-label-2")}>{counts[f.key]}</span>
                </button>
              ))}
            </div>
            <span className="flex-1" />
            {chosen.length && !locked ? (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSelected(new Set())} className="h-9 rounded-full px-3 text-[13.5px] font-semibold text-label-2 hover:bg-fill-1">
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(chosen)}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-danger-subtle px-4 text-[13.5px] font-semibold text-danger hover:bg-[#fad9d5]"
                >
                  <Trash2 className="size-4" />
                  Delete {chosen.length}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl bg-surface px-6 py-16 text-center shadow-1">
          <span className="flex size-16 items-center justify-center rounded-[20px] bg-accent-soft text-accent-text">
            <InboxFilled className="size-7" />
          </span>
          <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.015em]">No checks yet</h2>
          <p className="mt-1 max-w-sm text-[15px] text-label-2">When someone completes the verification flow, they appear here.</p>
          <Link href="/verify" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-on-accent">
            Run a test
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-3 px-1 text-[13px] text-label-2">
            <label className={cn("flex size-8 cursor-pointer items-center justify-center", locked && "hidden")}>
              <input
                type="checkbox"
                checked={allChosen}
                disabled={!visibleIds.length}
                onChange={() => setSelected(allChosen ? new Set() : new Set(visibleIds))}
                className="size-[18px] accent-[#c2550a]"
                aria-label="Select every student shown"
              />
            </label>
            <span>
              {visible.length} {visible.length === 1 ? "student" : "students"}
              {q ? ` matching “${query.trim()}”` : ""}
            </span>
          </div>

          {visible.length ? (
            <ul className="mt-1 space-y-2.5">
              {visible.map((r) => (
                <StudentRow
                  key={r.session.id}
                  session={r.session}
                  title={r.title}
                  flags={r.flags}
                  match={r.match}
                  decision={decisionOf(r.session)}
                  selected={selected.has(r.session.id)}
                  aiEnabled={aiEnabled}
                  locked={locked}
                  onSelect={() => toggle(r.session.id)}
                  onDecide={(d) => decide(r.session, d, r.title.known ? r.title.name : "This test")}
                  onOpen={(a) => setOpen({ session: r.session, artifact: a })}
                  onDelete={() => setDeleting([r.session.id])}
                  onChanged={() => router.refresh()}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl bg-surface px-6 py-12 text-center shadow-1">
              <p className="text-[16px] font-semibold">No students found</p>
              <p className="mt-1 text-[14px] text-label-2">Try another name or status.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
                className="mt-4 h-10 rounded-full bg-fill-1 px-4 text-[14px] font-semibold hover:bg-fill-2"
              >
                Show everyone
              </button>
            </div>
          )}
        </>
      )}

      {open && !locked ? <Viewer session={sessions.find((s) => s.id === open.session.id) ?? open.session} artifact={open.artifact} onClose={() => setOpen(null)} onChanged={() => router.refresh()} /> : null}

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-3">
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-danger-subtle text-danger">
              <Trash2 className="size-6" />
            </span>
            <h2 id="delete-title" className="mt-4 text-[22px] font-semibold tracking-[-0.018em]">
              {deleting.length === 1 ? "Delete this test permanently?" : `Delete ${deleting.length} tests permanently?`}
            </h2>
            <p className="mt-2 text-[15px] leading-[22px] text-label-2">Every photo, video and result in {deleting.length === 1 ? "it" : "them"} is removed. This can&rsquo;t be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleting(null)} className="h-11 rounded-full bg-fill-1 px-5 text-[15px] font-semibold hover:bg-fill-2">
                Cancel
              </button>
              <button type="button" onClick={() => runDelete(deleting)} disabled={busy} className="h-11 rounded-full bg-danger px-5 text-[15px] font-semibold text-white disabled:opacity-60">
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-full bg-label/90 py-2.5 pl-5 pr-2.5 text-[14px] font-medium text-white shadow-3 backdrop-blur-xl">
          <span className="truncate">{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              onClick={() => {
                const undo = toast.undo!;
                setToast(null);
                undo();
              }}
              className="h-8 shrink-0 rounded-full bg-white/15 px-3.5 text-[13.5px] font-semibold hover:bg-white/25"
            >
              Undo
            </button>
          ) : (
            <span className="w-2.5" />
          )}
        </div>
      ) : null}
    </main>
  );
}

/** Two buttons: Verified and Not verified. Pressing the chosen one again takes the decision back. */
function DecisionToggle({ decision, onDecide }: { decision: Decision; onDecide: (d: Decision) => void }) {
  const options = [
    { key: "verified" as const, label: "Verified", icon: Check, on: "bg-success text-white shadow-[0_2px_6px_rgba(36,138,61,0.3)]" },
    { key: "not_verified" as const, label: "Not verified", icon: X, on: "bg-danger text-white shadow-[0_2px_6px_rgba(196,43,28,0.3)]" },
  ];
  return (
    <div className="flex w-full shrink-0 rounded-full bg-fill-1 p-[3px] sm:w-auto" role="group" aria-label="Decision">
      {options.map(({ key, label, icon: Icon, on }) => {
        const active = decision === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onDecide(active ? null : key)}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 sm:h-8 sm:flex-none sm:text-[13px]",
              active ? on : "text-label-2 hover:bg-surface hover:text-label",
            )}
          >
            <Icon className="size-3.5" strokeWidth={2.75} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function StudentRow({
  session,
  title,
  flags,
  match,
  decision,
  selected,
  aiEnabled,
  locked,
  onSelect,
  onDecide,
  onOpen,
  onDelete,
  onChanged,
}: {
  session: VerificationSession;
  title: { name: string; known: boolean };
  flags: string[];
  match: ReturnType<typeof matchPill>;
  decision: Decision;
  selected: boolean;
  aiEnabled: boolean;
  locked: boolean;
  onSelect: () => void;
  onDecide: (d: Decision) => void;
  onOpen: (a: Artifact) => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [expandedState, setExpanded] = useState(false);
  const expanded = expandedState && !locked;
  const face = locked ? undefined : session.artifacts.find((a) => a.kind === "face");
  const attention = attentionPill(session, flags.length);
  const panelId = `row-${session.id}`;

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl bg-surface shadow-1 transition-shadow",
        selected && "shadow-[0_0_0_2px_var(--accent),var(--shadow-1)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 py-3 pl-2 pr-3 sm:pr-4">
        <label className={cn("flex size-9 shrink-0 cursor-pointer items-center justify-center", locked && "invisible")}>
          <input type="checkbox" checked={selected} onChange={onSelect} disabled={locked} className="size-[18px] accent-[#c2550a]" aria-label={`Select ${title.name}`} />
        </label>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          disabled={locked}
          aria-expanded={locked ? undefined : expanded}
          aria-controls={locked ? undefined : panelId}
          className="flex min-w-0 flex-1 basis-[220px] items-center gap-3 rounded-[12px] py-0.5 text-left outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        >
          <span className="relative size-11 shrink-0">
            <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-accent-soft text-[15px] font-semibold text-accent-ink">
              {face ? (
                // eslint-disable-next-line @next/next/no-img-element -- local test capture
                <img src={fileUrl(session.id, face.file)} alt="" className="size-full object-cover" />
              ) : title.known ? (
                initials(title.name)
              ) : (
                "?"
              )}
            </span>
            {/* The decision at a glance, on the photo (the toggle on the right says it in words). */}
            {decision ? (
              <span
                aria-hidden
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full text-white ring-2 ring-surface",
                  decision === "verified" ? "bg-success" : "bg-danger",
                )}
              >
                {decision === "verified" ? <Check className="size-3" strokeWidth={3.5} /> : <X className="size-3" strokeWidth={3.5} />}
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-[16px] font-semibold tracking-[-0.01em]", !title.known && "text-label-2")}>{title.name}</span>
            <span className="block truncate text-[13px] tabular-nums text-label-2">
              <LocalTime iso={session.createdAt} /> · {deviceSummary(session.device.userAgent)}
            </span>
          </span>
        </button>

        {/* A second way to open the row, where people expect it (the name area is the keyboard target). */}
        {locked ? (
          <span className="flex size-9 shrink-0 items-center justify-center text-label-3 sm:order-last" title="Unlock to see the photos" aria-hidden>
            <Lock className="size-[18px]" />
          </span>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setExpanded((e) => !e)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-label-2 hover:bg-fill-1 sm:order-last"
          >
            <ChevronDown className={cn("size-5 transition-transform duration-200", expanded && "rotate-180")} />
          </button>
        )}

        {/* Fixed-width slots on wider screens so the pills line up from row to row. */}
        <div className="flex w-full flex-wrap items-center gap-2 pl-[52px] sm:w-auto sm:flex-nowrap sm:pl-0">
          <span className="flex sm:w-[124px] sm:justify-end">
            {match ? (
              <Badge tone={match.tone} className="h-7 px-3 text-[13px] font-semibold">
                {match.label}
              </Badge>
            ) : null}
          </span>
          <span className="flex sm:w-[124px] sm:justify-end">
            {attention ? (
              <Badge tone={attention.tone} className="h-7 px-3 text-[13px]">
                {attention.label}
              </Badge>
            ) : null}
          </span>
          {locked ? (
            <span className="flex sm:w-[190px] sm:justify-end">
              <Badge tone={decision === "verified" ? "success" : decision === "not_verified" ? "danger" : "neutral"} className="h-7 px-3 text-[13px]">
                {decision === "verified" ? "Verified" : decision === "not_verified" ? "Not verified" : "To review"}
              </Badge>
            </span>
          ) : (
            <DecisionToggle decision={decision} onDecide={onDecide} />
          )}
        </div>
      </div>

      {expanded ? (
        <div id={panelId} className="border-t border-separator">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {slots.map((slot) => {
              const a = session.artifacts.find((x) => x.kind === slot.kind);
              const outcome = session.steps[slot.step]?.outcome;
              const note =
                outcome && outcome !== "passed" && outcome !== "manual"
                  ? outcomeMeta[outcome].label
                  : a?.straightening && a.straightening !== "corrected"
                    ? straighteningMeta[a.straightening].label
                    : null;
              return (
                <div key={slot.kind}>
                  {a ? (
                    <button
                      type="button"
                      onClick={() => onOpen(a)}
                      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-[#141416] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                      aria-label={`Open ${slot.label}`}
                    >
                      {a.mime.startsWith("video/") ? (
                        <>
                          <video src={`${fileUrl(session.id, a.file)}#t=0.5`} muted playsInline preload="metadata" className="size-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
                              <Play className="size-4 translate-x-px" fill="currentColor" />
                            </span>
                          </span>
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- local test capture
                        <img src={fileUrl(session.id, a.file)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      )}
                    </button>
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[12px] bg-fill-1 text-[13px] text-label-2">Not captured</div>
                  )}
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium">
                    {slot.label}
                    {note ? <span className="text-[12px] font-normal text-warning">· {note}</span> : null}
                  </p>
                </div>
              );
            })}
          </div>

          {flags.length || session.blockedReason ? (
            <ul className="mx-4 mb-4 space-y-1 rounded-[12px] bg-warning-subtle px-3.5 py-2.5 text-[13.5px] text-warning">
              {session.blockedReason ? <li>Camera problem: {session.blockedReason}</li> : null}
              {flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : null}

          <AiCheckPanel sessionId={session.id} check={session.aiCheck} eligible={aiEnabled && eligibleForAi(session)} onChanged={onChanged} />

          <div className="flex justify-end border-t border-separator px-4 py-2.5">
            <button type="button" onClick={onDelete} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-danger hover:bg-danger-subtle">
              <Trash2 className="size-4" />
              Delete this test
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Viewer({ session, artifact, onClose, onChanged }: { session: VerificationSession; artifact: Artifact; onClose: () => void; onChanged: () => void }) {
  const [running, setRunning] = useState(false);
  const current = session.artifacts.find((a) => a.id === artifact.id) ?? artifact;
  const original = current.sourceId ? session.artifacts.find((a) => a.id === current.sourceId) : current;
  const derived = original?.derivedId ? session.artifacts.find((a) => a.id === original.derivedId) : undefined;
  const isId = original && (original.kind === "id-front" || original.kind === "id-back");
  const details = captureDetails(current);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function rerun() {
    if (!original) return;
    setRunning(true);
    await reprocess(session.id, original.id).catch(() => undefined);
    setRunning(false);
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0f11]/95 text-white backdrop-blur" role="dialog" aria-modal="true" aria-label={kindLabel[current.kind]}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold">{kindLabel[current.kind]}</p>
          <p className="truncate text-[12.5px] text-white/60">
            <LocalTime iso={current.createdAt} /> · {formatBytes(current.bytes)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`${fileUrl(session.id, current.file)}?download`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[14px] font-semibold hover:bg-white/20">
            <Download className="size-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-6 sm:px-6 lg:flex-row">
        {isId && original ? (
          <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
            <figure className="flex min-h-0 flex-col">
              <figcaption className="mb-2 text-[13px] font-semibold text-white/70">Original · detected corners</figcaption>
              <div className="relative flex min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-[16px] bg-black">
                <QuadOverlay src={fileUrl(session.id, original.file)} width={original.width} height={original.height} quad={derived?.quad ?? null} guide={original.guide} />
              </div>
            </figure>
            <figure className="flex min-h-0 flex-col">
              <figcaption className="mb-2 text-[13px] font-semibold text-white/70">
                {derived ? straighteningMeta[derived.straightening ?? "corrected"].label : straighteningMeta[original.straightening ?? "pending"].label}
              </figcaption>
              <div className="flex min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-[16px] bg-black p-3">
                {derived ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local test capture
                  <img src={fileUrl(session.id, derived.file)} alt="Straightened ID" className="max-h-full max-w-full rounded-[10px] object-contain" />
                ) : (
                  <p className="text-[14px] text-white/60">{straighteningMeta[original.straightening ?? "pending"].description}</p>
                )}
              </div>
            </figure>
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-[16px] bg-black">
            {current.mime.startsWith("video/") ? (
              <video src={fileUrl(session.id, current.file)} controls autoPlay playsInline className="max-h-full max-w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- local test capture
              <img src={fileUrl(session.id, current.file)} alt={kindLabel[current.kind]} className="max-h-full max-w-full object-contain" />
            )}
          </div>
        )}

        {isId || details.length ? (
          <aside className="w-full shrink-0 space-y-3 lg:w-72">
            {isId ? (
              <button
                type="button"
                onClick={rerun}
                disabled={running}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-label disabled:opacity-60"
              >
                <RefreshCw className={cn("size-4", running && "animate-spin")} />
                {running ? "Straightening…" : "Straighten again"}
              </button>
            ) : null}
            {details.length ? (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-[14px] bg-white/[0.06] p-3.5 text-[12.5px] leading-[17px]">
                {details.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-white/55">{label}</dt>
                    <dd className="break-words text-white/85">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** An image with the detected card outline (and the on-screen frame) drawn over it. */
function QuadOverlay({ src, width, height, quad, guide }: { src: string; width?: number; height?: number; quad: { x: number; y: number }[] | null | undefined; guide?: { x: number; y: number; w: number; h: number } }) {
  if (!width || !height) {
    // eslint-disable-next-line @next/next/no-img-element -- local test capture
    return <img src={src} alt="Original ID photo" className="max-h-full max-w-full object-contain" />;
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="max-h-full max-w-full" role="img" aria-label="Original ID photo with detected corners">
      <image href={src} width={width} height={height} />
      {guide ? <rect x={guide.x} y={guide.y} width={guide.w} height={guide.h} fill="none" stroke="white" strokeOpacity={0.5} strokeDasharray="12 10" strokeWidth={Math.max(2, width / 400)} /> : null}
      {quad ? (
        <>
          <polygon points={quad.map((p) => `${p.x},${p.y}`).join(" ")} fill="rgba(76,213,138,0.15)" stroke="#4cd58a" strokeWidth={Math.max(3, width / 250)} strokeLinejoin="round" />
          {quad.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={Math.max(6, width / 120)} fill="#4cd58a" stroke="white" strokeWidth={Math.max(2, width / 500)} />
          ))}
        </>
      ) : null}
    </svg>
  );
}
