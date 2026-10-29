import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronRight, Info } from "lucide-react";
import { AiBadge, Badge } from "@/components/ui/badge";
import { previewData } from "@/lib/preview-data";
import { isRoleSlug, roleConfigs, roleSlugs } from "@/lib/roles";

export function generateStaticParams() {
  return roleSlugs.map((role) => ({ role }));
}

export async function generateMetadata({ params }: PageProps<"/workspace/[role]">): Promise<Metadata> {
  const { role } = await params;
  return { title: isRoleSlug(role) ? `${roleConfigs[role].label} workspace` : "Workspace" };
}

// URL data is read inside <Suspense> so the shell can render instantly (Cache Components).
export default function RoleOverviewPage({ params }: PageProps<"/workspace/[role]">) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <RoleOverview params={params} />
    </Suspense>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-hidden className="space-y-8">
      <div className="h-24 w-2/3 animate-pulse rounded-md bg-black/5 dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-md bg-black/5 dark:bg-white/10" />
        ))}
      </div>
    </div>
  );
}

async function RoleOverview({ params }: { params: PageProps<"/workspace/[role]">["params"] }) {
  const { role } = await params;
  if (!isRoleSlug(role)) notFound();

  const config = roleConfigs[role];
  const data = previewData[role];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">{config.label} workspace</p>
        <h1 className="mt-2 text-[34px] font-bold leading-[41px] tracking-[-0.022em]">Welcome back.</h1>
        <p className="mt-1 text-[17px] text-label-2">{config.greeting}</p>
      </div>

      <div role="note" className="flex items-start gap-3 rounded-md bg-accent-subtle px-4 py-3 text-[14px] leading-[20px] text-accent-ink">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p>Preview with synthetic data. Real cases, permissions and actions arrive in the upcoming milestones.</p>
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        {data.stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-[13px] font-medium text-label-2">{stat.label}</p>
            <p className="mt-2 text-[28px] font-semibold leading-[34px] tracking-[-0.02em] tabular-nums">{stat.value}</p>
            <p className="mt-1 text-[13px] text-label-2">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="tasks-heading" className="card overflow-hidden">
        <h2 id="tasks-heading" className="border-b border-separator px-6 py-4 text-[17px] font-semibold">
          {data.tasksTitle}
        </h2>
        <ul>
          {data.tasks.map((task) => (
            <li key={task.title} className="flex items-center gap-4 border-b border-separator px-6 py-4 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{task.title}</p>
                <p className="mt-0.5 text-[13px] text-label-2">{task.meta}</p>
              </div>
              {task.ai ? <AiBadge>AI assist</AiBadge> : null}
              <Badge tone={task.tone}>{task.status}</Badge>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-label-3" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
