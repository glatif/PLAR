import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { InfoFilled } from "@/components/ui/filled-icons";
import { ActivityFeed, CaseTable, JourneyCard, StagePipeline, StatGrid, TaskList } from "@/components/app/overview";
import { getViewer, roleLabels } from "@/lib/auth";
import { firstName } from "@/lib/format";
import { isRoleSlug, roleConfigs, roleSlugs } from "@/lib/roles";
import { loadOverview } from "@/lib/workspace-data";

export function generateStaticParams() {
  return roleSlugs.map((role) => ({ role }));
}

export async function generateMetadata({ params }: PageProps<"/workspace/[role]">): Promise<Metadata> {
  const { role } = await params;
  return { title: isRoleSlug(role) ? `${roleConfigs[role].label} workspace` : "Workspace" };
}

// URL and session data are read inside <Suspense> so the shell renders instantly (Cache Components).
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
      <div className="h-24 w-2/3 animate-pulse rounded-md bg-fill-1" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-fill-1" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-fill-1" />
    </div>
  );
}

async function RoleOverview({ params }: { params: PageProps<"/workspace/[role]">["params"] }) {
  const { role } = await params;
  if (!isRoleSlug(role)) notFound();

  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.workspaces.includes(role)) redirect(viewer.workspaces[0] ? `/workspace/${viewer.workspaces[0]}` : "/sign-in");

  const config = roleConfigs[role];
  const data = await loadOverview(role, viewer);
  const roleNames = viewer.roles.map((r) => roleLabels[r]).join(" · ");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-text">{roleNames} workspace</p>
        <h1 className="mt-2 font-serif text-[40px] font-semibold leading-[46px] tracking-[-0.025em]">Welcome back, {firstName(viewer.name)}.</h1>
        <p className="mt-1 text-[17px] text-label-2">{config.greeting}</p>
      </div>

      <div role="note" className="flex items-start gap-3 rounded-md bg-accent-subtle px-4 py-3 text-[14px] leading-[20px] text-accent-ink shadow-[inset_0_0_0_1px_var(--color-tangerine-200)]">
        <InfoFilled className="mt-0.5 size-4 shrink-0 text-accent-text" />
        <p>Demo environment. Every person and case is synthetic. Tick a task to try it: changes save to the dev database.</p>
      </div>

      {data.stats.length ? <StatGrid stats={data.stats} /> : null}

      {data.studentCase ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <TaskList title="Your next steps" tasks={data.tasks} />
          <JourneyCard studentCase={data.studentCase} />
        </div>
      ) : (
        <>
          {data.pipeline ? <StagePipeline pipeline={data.pipeline} /> : null}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <TaskList title="Needs your attention" tasks={data.tasks} />
            <ActivityFeed events={data.activity} />
          </div>
          {data.cases.length ? <CaseTable title={data.casesTitle} cases={data.cases} showAdvisor={role === "admin"} /> : null}
        </>
      )}
    </div>
  );
}
