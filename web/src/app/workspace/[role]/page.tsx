import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, ScanFace, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { IdCardFilled, InfoFilled, KeyFilled } from "@/components/ui/filled-icons";
import { labEnabled } from "@/lib/verification/storage";
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
  const oversees = role === "manager" || role === "director" || role === "admin";

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

      {role === "admin" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <RolesShortcut />
          {labEnabled() ? <VerificationShortcut /> : null}
        </div>
      ) : null}

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
          {data.cases.length ? <CaseTable title={data.casesTitle} cases={data.cases} showAdvisor={oversees} /> : null}
        </>
      )}
    </div>
  );
}

/** Admin only: opens the page that explains each role's purpose and access. */
function RolesShortcut() {
  return (
    <section aria-labelledby="roles-shortcut" className="card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] text-white" style={{ background: roleConfigs.admin.tile }}>
          <KeyFilled className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 id="roles-shortcut" className="text-[17px] font-semibold">Roles and access</h2>
          <p className="mt-0.5 text-[14px] leading-[20px] text-label-2">The six roles in PLAR, what each one is for and what each can see and do.</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <ButtonLink href="/workspace/admin/roles" variant="secondary" className="w-full sm:w-auto">
          Open roles and access
          <ArrowRight aria-hidden className="size-4" />
        </ButtonLink>
      </div>
    </section>
  );
}

/** Admin only, when the verification lab is on: run the face, head-movement and ID check, then review it. */
function VerificationShortcut() {
  return (
    <section aria-labelledby="verify-shortcut" className="card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#0F8C82] text-white">
          <IdCardFilled className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 id="verify-shortcut" className="text-[17px] font-semibold">Test the identity check</h2>
          <p className="mt-0.5 text-[14px] leading-[20px] text-label-2">Take the face photo, head-movement video and ID photos, then review the result.</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <ButtonLink href="/verify" className="w-full sm:w-auto">
          <ScanFace aria-hidden className="size-4" />
          Start a test
        </ButtonLink>
        <ButtonLink href="/testing" variant="neutral" className="w-full sm:w-auto">
          <ShieldCheck aria-hidden className="size-4" />
          Identity checks
        </ButtonLink>
      </div>
    </section>
  );
}
