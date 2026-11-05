import "server-only";

import type { Viewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, formatSlot, stageOrder, todayISO, type CaseStage, type TaskStatus } from "@/lib/format";
import type { RoleSlug } from "@/lib/roles";

// Loads what each workspace shows. Every query runs as the signed-in person, so row-level security
// decides what comes back: these functions only shape it for display.

export type Stat = { label: string; value: string; unit?: string; hint: string };
export type TaskItem = { id: string; title: string; detail: string | null; status: TaskStatus; dueOn: string | null; ai: boolean; reference: string | null };
export type CaseItem = {
  id: string;
  reference: string;
  student: string;
  program: string;
  stage: CaseStage;
  dueOn: string | null;
  advisor?: string;
  assessorRole?: "chair" | "writer";
  interviewAt?: string;
};
export type EventItem = { id: string; title: string; detail: string | null; at: string; reference: string | null; actor: string | null };
export type StudentCase = {
  reference: string;
  program: string;
  level: string;
  stage: CaseStage;
  advisor: string | null;
  dueOn: string | null;
  sectionsDone: number;
  sectionsTotal: number;
  evidence: number;
  journey: EventItem[];
};

export type Overview = {
  stats: Stat[];
  tasks: TaskItem[];
  cases: CaseItem[];
  casesTitle: string;
  activity: EventItem[];
  studentCase?: StudentCase;
  pipeline?: { stage: CaseStage; count: number }[];
};

type Client = Awaited<ReturnType<typeof createClient>>;
type One<T> = T | T[] | null;
const one = <T,>(value: One<T>): T | null => (Array.isArray(value) ? (value[0] ?? null) : value);

const OPEN: CaseStage[] = ["readiness", "portfolio", "feedback", "approval", "interview", "assessment", "decision"];
const CASE_FIELDS =
  "id, reference, stage, due_on, started_on, program:programs(code), student:profiles!cases_student_id_fkey(full_name), advisor:profiles!cases_advisor_id_fkey(full_name)";

type CaseRow = {
  id: string;
  reference: string;
  stage: CaseStage;
  due_on: string | null;
  started_on: string;
  program: One<{ code: string }>;
  student: One<{ full_name: string }>;
  advisor: One<{ full_name: string }>;
};

function toCase(row: CaseRow): CaseItem {
  return {
    id: row.id,
    reference: row.reference,
    stage: row.stage,
    dueOn: row.due_on,
    program: one(row.program)?.code ?? "",
    student: one(row.student)?.full_name ?? "Student",
    advisor: one(row.advisor)?.full_name,
  };
}

const byStage = (a: CaseItem, b: CaseItem) => stageOrder.indexOf(b.stage) - stageOrder.indexOf(a.stage) || a.reference.localeCompare(b.reference);

async function myTasks(supabase: Client, viewer: Viewer): Promise<TaskItem[]> {
  const { data } = await supabase
    .from("tasks")
    .select("id, title, detail, status, due_on, ai_assisted, case:cases(reference)")
    .eq("assignee_id", viewer.id)
    .order("due_on", { ascending: true, nullsFirst: false });
  return (data ?? [])
    .map((t) => ({ id: t.id, title: t.title, detail: t.detail, status: t.status, dueOn: t.due_on, ai: t.ai_assisted, reference: one(t.case)?.reference ?? null }))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
}

async function recentActivity(supabase: Client, caseId?: string): Promise<EventItem[]> {
  let query = supabase
    .from("case_events")
    .select("id, title, detail, occurred_at, case:cases(reference), actor:profiles!case_events_actor_id_fkey(full_name)")
    .order("occurred_at", { ascending: false })
    .limit(6);
  if (caseId) query = query.eq("case_id", caseId);
  const { data } = await query;
  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    detail: e.detail,
    at: e.occurred_at,
    reference: one(e.case)?.reference ?? null,
    actor: one(e.actor)?.full_name ?? null,
  }));
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

async function student(supabase: Client, viewer: Viewer): Promise<Overview> {
  const today = todayISO();
  const [{ data: row }, tasks] = await Promise.all([
    supabase
      .from("cases")
      .select("id, reference, stage, due_on, sections_done, sections_total, evidence_count, credit_level, program:programs(name), advisor:profiles!cases_advisor_id_fkey(full_name)")
      .eq("student_id", viewer.id)
      .maybeSingle(),
    myTasks(supabase, viewer),
  ]);

  if (!row) return { stats: [], tasks, cases: [], casesTitle: "", activity: [] };

  const { data: events } = await supabase
    .from("case_events")
    .select("id, title, detail, occurred_at, actor:profiles!case_events_actor_id_fkey(full_name)")
    .eq("case_id", row.id)
    .order("occurred_at", { ascending: true });

  const weeksLeft = row.due_on ? Math.max(0, Math.ceil(daysBetween(today, row.due_on) / 7)) : null;
  const journey = (events ?? []).map((e) => ({ id: e.id, title: e.title, detail: e.detail, at: e.occurred_at, reference: row.reference, actor: one(e.actor)?.full_name ?? null }));

  return {
    stats: [
      { label: "Weeks remaining", value: weeksLeft === null ? "—" : String(weeksLeft), hint: row.due_on ? `Due date: ${new Date(`${row.due_on}T12:00:00Z`).toLocaleDateString("en-CA", { day: "numeric", month: "long", timeZone: "UTC" })}` : "No due date yet" },
      { label: "Sections drafted", value: `${row.sections_done}`, unit: `of ${row.sections_total}`, hint: row.sections_done >= row.sections_total ? "Every section drafted" : `${row.sections_total - row.sections_done} still to draft` },
      { label: "Evidence pieces", value: String(row.evidence_count), hint: "Most portfolios have 16–24" },
    ],
    tasks,
    cases: [],
    casesTitle: "",
    activity: [...journey].reverse().slice(0, 6),
    studentCase: {
      reference: row.reference,
      program: one(row.program)?.name ?? "",
      level: row.credit_level === "upper" ? "Upper level" : "Lower level",
      stage: row.stage,
      advisor: one(row.advisor)?.full_name ?? null,
      dueOn: row.due_on,
      sectionsDone: row.sections_done,
      sectionsTotal: row.sections_total,
      evidence: row.evidence_count,
      journey,
    },
  };
}

async function advisor(supabase: Client, viewer: Viewer): Promise<Overview> {
  const today = todayISO();
  const [{ data: rows }, tasks, activity] = await Promise.all([
    supabase.from("cases").select(CASE_FIELDS).eq("advisor_id", viewer.id),
    myTasks(supabase, viewer),
    recentActivity(supabase),
  ]);
  const cases = ((rows ?? []) as CaseRow[]).map(toCase);
  const open = cases.filter((c) => OPEN.includes(c.stage));
  const recent = ((rows ?? []) as CaseRow[]).filter((r) => daysBetween(r.started_on, today) <= 30).length;
  const toReview = tasks.filter((t) => t.status === "review" || t.status === "ready");
  const approval = cases.filter((c) => c.stage === "approval").length;
  const soonest = toReview.map((t) => t.dueOn).filter(Boolean).sort()[0];

  return {
    stats: [
      { label: "Active students", value: String(open.length), hint: `${recent} started in the last 30 days` },
      { label: "Awaiting your review", value: String(toReview.length), hint: soonest ? `Next due ${new Date(`${soonest}T12:00:00Z`).toLocaleDateString("en-CA", { day: "numeric", month: "short", timeZone: "UTC" })}` : "Nothing due" },
      { label: "Ready for approval", value: String(approval), hint: approval ? "Sent to the manager" : "None waiting" },
    ],
    tasks,
    cases: open.sort(byStage),
    casesTitle: "Your caseload",
    activity,
  };
}

async function assessor(supabase: Client, viewer: Viewer): Promise<Overview> {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const [{ data: rows }, { data: interviews }, tasks, activity] = await Promise.all([
    supabase.from("case_assessors").select(`role, case:cases(${CASE_FIELDS})`).eq("assessor_id", viewer.id),
    supabase.from("interviews").select("case_id, scheduled_at").gte("scheduled_at", now.toISOString()).order("scheduled_at"),
    myTasks(supabase, viewer),
    recentActivity(supabase),
  ]);

  const nextInterview = new Map<string, string>();
  for (const i of interviews ?? []) if (!nextInterview.has(i.case_id)) nextInterview.set(i.case_id, i.scheduled_at);

  const cases = (rows ?? [])
    .map((r): CaseItem | null => {
      const c = one(r.case as One<CaseRow>);
      return c ? { ...toCase(c), assessorRole: r.role, interviewAt: nextInterview.get(c.id) } : null;
    })
    .filter((c): c is CaseItem => c !== null);

  const active = cases.filter((c) => ["interview", "assessment", "decision"].includes(c.stage));
  const chair = active.filter((c) => c.assessorRole === "chair").length;
  const thisWeek = cases.filter((c) => c.interviewAt && new Date(c.interviewAt) <= weekAhead).sort((a, b) => a.interviewAt!.localeCompare(b.interviewAt!));
  const reports = tasks.filter((t) => t.status === "review" && t.title.toLowerCase().includes("report"));

  return {
    stats: [
      { label: "Active assessments", value: String(active.length), hint: `${chair} as chair, ${active.length - chair} as writer` },
      { label: "Interviews this week", value: String(thisWeek.length), hint: thisWeek.length ? thisWeek.map((c) => formatSlot(c.interviewAt!)).join(" · ") : "None scheduled" },
      { label: "Reports to finalise", value: String(reports.length), hint: reports.length ? "Chair review requested" : "Nothing waiting" },
    ],
    tasks,
    cases: cases.filter((c) => c.stage !== "closed").sort(byStage),
    casesTitle: "Your assessments",
    activity,
  };
}

async function overseer(supabase: Client, viewer: Viewer): Promise<Overview> {
  const today = todayISO();
  const [{ data: rows }, tasks, activity] = await Promise.all([
    supabase.from("cases").select(CASE_FIELDS),
    myTasks(supabase, viewer),
    recentActivity(supabase),
  ]);
  const all = (rows ?? []) as CaseRow[];
  const open = all.filter((r) => OPEN.includes(r.stage));
  const advisors = new Set(open.map((r) => one(r.advisor)?.full_name).filter(Boolean)).size;
  const approval = all.filter((r) => r.stage === "approval").length;
  const decision = all.filter((r) => r.stage === "decision").length;
  const ages = open.map((r) => daysBetween(r.started_on, today)).sort((a, b) => a - b);
  const median = ages.length ? ages[Math.floor(ages.length / 2)] : 0;

  return {
    stats: [
      { label: "Open cases", value: String(open.length), hint: `Across ${plural(advisors, "advisor")}` },
      { label: "Awaiting approval", value: String(approval + decision), hint: `${plural(approval, "portfolio")} · ${plural(decision, "decision")}` },
      { label: "Median time open", value: String(median), unit: "days", hint: "From start to today" },
    ],
    tasks,
    cases: open.map(toCase).sort(byStage),
    casesTitle: "Open cases",
    activity,
    pipeline: stageOrder.map((stage) => ({ stage, count: all.filter((r) => r.stage === stage).length })),
  };
}

export async function loadOverview(slug: RoleSlug, viewer: Viewer): Promise<Overview> {
  const supabase = await createClient();
  if (slug === "student") return student(supabase, viewer);
  if (slug === "advisor") return advisor(supabase, viewer);
  if (slug === "assessor") return assessor(supabase, viewer);
  return overseer(supabase, viewer);
}
