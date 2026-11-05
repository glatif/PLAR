import { Check, ChevronRight } from "lucide-react";
import { AiBadge, Badge } from "@/components/ui/badge";
import { CalendarFilled, CheckCircleFilled, ClockFilled, InboxFilled } from "@/components/ui/filled-icons";
import { toggleTask } from "@/app/workspace/actions";
import { cn } from "@/lib/cn";
import { dueLabel, formatDate, formatSlot, initials, stageMeta, stageOrder, taskMeta, timeAgo } from "@/lib/format";
import type { CaseItem, EventItem, Overview, Stat, StudentCase, TaskItem } from "@/lib/workspace-data";

// Workspace overview building blocks. Server components: task completion posts a Server Action.

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-5">
          <p className="text-[13px] font-medium text-label-2">{stat.label}</p>
          <p className="mt-2 text-[32px] font-semibold leading-[38px] tracking-[-0.03em] tabular-nums">
            {stat.value}
            {stat.unit ? <span className="ml-1.5 text-[17px] font-medium tracking-[-0.01em] text-label-2">{stat.unit}</span> : null}
          </p>
          <p className="mt-1 text-[13px] text-label-2">{stat.hint}</p>
        </div>
      ))}
    </section>
  );
}

const statusIcon: Partial<Record<TaskItem["status"], React.ReactNode>> = {
  due_soon: <ClockFilled />,
  done: <CheckCircleFilled />,
};

export function TaskList({ title, tasks }: { title: string; tasks: TaskItem[] }) {
  const open = tasks.filter((t) => t.status !== "done").length;
  return (
    <section aria-labelledby="tasks-heading" className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-separator px-6 py-4">
        <h2 id="tasks-heading" className="text-[17px] font-semibold">{title}</h2>
        <span className="text-[13px] text-label-2 tabular-nums">{open} open</span>
      </div>
      {tasks.length ? (
        <ul>
          {tasks.map((task) => {
            const done = task.status === "done";
            const due = dueLabel(task.dueOn);
            return (
              <li key={task.id} className="flex items-center gap-4 border-b border-separator px-6 py-4 transition-colors last:border-b-0 hover:bg-surface-2">
                <form action={toggleTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="done" value={String(done)} />
                  <button
                    type="submit"
                    aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} done`}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full transition-[background-color,box-shadow,transform] active:scale-90",
                      done ? "bg-accent text-on-accent" : "text-transparent shadow-[inset_0_0_0_1.5px_var(--border-strong)] hover:text-accent-text hover:shadow-[inset_0_0_0_1.5px_var(--accent)]",
                    )}
                  >
                    <Check aria-hidden className="size-3.5 [stroke-width:3]" />
                  </button>
                </form>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[15px] font-medium", done && "text-label-2 line-through decoration-label-3")}>{task.title}</p>
                  <p className="mt-0.5 truncate text-[13px] text-label-2">
                    {[task.detail, task.reference, done ? null : due].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {task.ai && !done ? <span className="hidden sm:inline-flex"><AiBadge>AI assist</AiBadge></span> : null}
                <Badge tone={taskMeta[task.status].tone} icon={statusIcon[task.status]}>
                  {taskMeta[task.status].label}
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-[18px] bg-accent-soft text-accent-text">
            <InboxFilled className="size-6" />
          </span>
          <p className="mt-4 text-[17px] font-semibold">Nothing waiting on you</p>
          <p className="mt-1 text-[14px] text-label-2">New tasks appear here as cases move along.</p>
        </div>
      )}
    </section>
  );
}

export function ActivityFeed({ events, title = "Recent activity" }: { events: EventItem[]; title?: string }) {
  return (
    <section aria-labelledby="activity-heading" className="card overflow-hidden">
      <h2 id="activity-heading" className="border-b border-separator px-6 py-4 text-[17px] font-semibold">{title}</h2>
      <ol className="px-6 py-2">
        {events.map((e) => (
          <li key={e.id} className="flex gap-3 py-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-fill-1 text-[11px] font-semibold text-label-2">
              {e.actor ? initials(e.actor) : "PL"}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-medium leading-[20px]">{e.title}</p>
              <p className="text-[12.5px] leading-[18px] text-label-2">
                {[e.actor ?? "PLAR team", e.reference, timeAgo(e.at)].filter(Boolean).join(" · ")}
              </p>
            </div>
          </li>
        ))}
        {events.length === 0 ? <li className="py-6 text-[14px] text-label-2">No activity yet.</li> : null}
      </ol>
    </section>
  );
}

export function CaseTable({ title, cases, showAdvisor }: { title: string; cases: CaseItem[]; showAdvisor?: boolean }) {
  const showRole = cases.some((c) => c.assessorRole);
  return (
    <section aria-labelledby="cases-heading" className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-separator px-6 py-4">
        <h2 id="cases-heading" className="text-[17px] font-semibold">{title}</h2>
        <span className="text-[13px] text-label-2 tabular-nums">{cases.length} cases</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="border-b border-separator text-left text-[13px] text-label-2">
              <th className="h-11 px-6 font-medium">Student</th>
              <th className="h-11 px-3 font-medium">Program</th>
              <th className="h-11 px-3 font-medium">Stage</th>
              {showRole ? <th className="h-11 px-3 font-medium">Your role</th> : null}
              {showAdvisor ? <th className="h-11 px-3 font-medium">Advisor</th> : null}
              <th className="h-11 px-3 font-medium">{showRole ? "Interview" : "Due"}</th>
              <th className="h-11 w-12 px-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b border-separator transition-colors last:border-b-0 hover:bg-surface-2">
                <td className="h-14 px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">{initials(c.student)}</span>
                    <div>
                      <p className="font-[550]">{c.student}</p>
                      <p className="font-mono text-[11.5px] text-label-2">{c.reference}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 text-label-2">{c.program}</td>
                <td className="px-3"><Badge tone={stageMeta[c.stage].tone}>{stageMeta[c.stage].label}</Badge></td>
                {showRole ? (
                  <td className="px-3"><Badge tone={c.assessorRole === "chair" ? "accent" : "neutral"}>{c.assessorRole === "chair" ? "Chair" : "Writer"}</Badge></td>
                ) : null}
                {showAdvisor ? <td className="px-3 text-label-2">{c.advisor ?? "—"}</td> : null}
                <td className="px-3 whitespace-nowrap text-label-2 tabular-nums">
                  {showRole ? (c.interviewAt ? formatSlot(c.interviewAt) : "—") : formatDate(c.dueOn)}
                </td>
                <td className="px-3 text-right"><ChevronRight aria-hidden className="inline size-4 text-label-3" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const journeySteps = stageOrder.filter((s) => s !== "closed");

export function JourneyCard({ studentCase }: { studentCase: StudentCase }) {
  // A closed case shows every step as done.
  const current = studentCase.stage === "closed" ? journeySteps.length : stageOrder.indexOf(studentCase.stage);
  return (
    <section aria-labelledby="journey-heading" className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-separator px-6 py-5">
        <div>
          <p className="font-mono text-[12px] text-label-2">{studentCase.reference}</p>
          <h2 id="journey-heading" className="mt-0.5 font-serif text-[22px] font-semibold tracking-[-0.018em]">{studentCase.program}</h2>
          <p className="text-[14px] text-label-2">
            {studentCase.level}
            {studentCase.advisor ? ` · Advisor: ${studentCase.advisor}` : ""}
          </p>
        </div>
        <Badge tone={stageMeta[studentCase.stage].tone} className="h-7 px-3 text-[13px]">
          {stageMeta[studentCase.stage].label}
        </Badge>
      </div>

      <div className="px-6 pt-5">
        <ol className="flex items-center" aria-label="Journey stages">
          {journeySteps.map((step, i) => (
            <li key={step} className="flex flex-1 items-center last:flex-none" aria-current={i === current ? "step" : undefined} title={stageMeta[step].label}>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  i < current && "bg-accent text-on-accent",
                  i === current && "bg-accent-subtle shadow-[inset_0_0_0_2px_var(--accent),0_0_0_4px_var(--focus-ring)]",
                  i > current && "shadow-[inset_0_0_0_1.5px_var(--separator-strong)]",
                )}
              >
                {i < current ? <Check aria-hidden className="size-3.5 [stroke-width:3]" /> : null}
                <span className="sr-only">{stageMeta[step].label}</span>
              </span>
              {i < journeySteps.length - 1 ? <span aria-hidden className={cn("mx-1 h-0.5 flex-1 rounded-full", i < current ? "bg-accent" : "bg-fill-2")} /> : null}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[13px] text-label-2">
          {current < journeySteps.length ? (
            <>
              Step {current + 1} of {journeySteps.length}: <span className="font-semibold text-label">{stageMeta[journeySteps[current]].label}</span>
              {current + 1 < journeySteps.length ? ` · next: ${stageMeta[journeySteps[current + 1]].label}` : ""}
            </>
          ) : (
            "Every step complete"
          )}
        </p>
      </div>

      <div className="px-6 py-5">
        <div className="mb-2 flex justify-between text-[13px] text-label-2">
          <span>Portfolio sections</span>
          <span className="font-semibold text-label tabular-nums">
            {studentCase.sectionsDone} of {studentCase.sectionsTotal}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-fill-2">
          <div className="h-full rounded-full bg-linear-to-r from-tangerine-500 to-accent" style={{ width: `${(studentCase.sectionsDone / studentCase.sectionsTotal) * 100}%` }} />
        </div>
      </div>

      <div className="border-t border-separator px-6 py-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">Your journey so far</p>
        <ol className="relative space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-tangerine-200">
          {studentCase.journey.map((e) => (
            <li key={e.id} className="relative flex gap-3 pl-6">
              <span className="absolute left-0 top-1.5 size-4 rounded-full bg-surface shadow-[inset_0_0_0_3px_var(--accent)]" aria-hidden />
              <div>
                <p className="text-[14px] font-medium leading-[20px]">{e.title}</p>
                <p className="text-[12.5px] text-label-2">{formatDate(e.at, { day: "numeric", month: "long" })}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function StagePipeline({ pipeline }: { pipeline: NonNullable<Overview["pipeline"]> }) {
  const max = Math.max(1, ...pipeline.map((p) => p.count));
  return (
    <section aria-labelledby="pipeline-heading" className="card p-6">
      <div className="flex items-center justify-between">
        <h2 id="pipeline-heading" className="text-[17px] font-semibold">Cases by stage</h2>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-label-2">
          <CalendarFilled className="size-3.5" />
          Today
        </span>
      </div>
      <ol className="mt-5 grid grid-cols-9 items-end gap-2" style={{ height: 150 }}>
        {pipeline.map((p) => (
          <li key={p.stage} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className="text-[12px] font-semibold tabular-nums">{p.count}</span>
            <span
              className="w-full rounded-t-[6px] rounded-b-[2px] bg-linear-to-t from-accent to-tangerine-400"
              style={{ height: `${Math.max(4, (p.count / max) * 100)}%`, opacity: p.count ? 1 : 0.25 }}
              title={`${stageMeta[p.stage].label}: ${p.count}`}
            />
          </li>
        ))}
      </ol>
      <ol className="mt-2 grid grid-cols-9 gap-2" aria-hidden>
        {pipeline.map((p) => (
          <li key={p.stage} className="truncate text-center text-[10.5px] text-label-2">{stageMeta[p.stage].label}</li>
        ))}
      </ol>
    </section>
  );
}
