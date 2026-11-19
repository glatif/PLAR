import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Check, Minus } from "lucide-react";
import {
  CheckCircleFilled,
  GraduationFilled,
  InfoFilled,
  KeyFilled,
  LandmarkFilled,
  UserFilled,
  UsersFilled,
  type FilledIcon,
} from "@/components/ui/filled-icons";
import { getViewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { capabilityGroups, otherOffices, roleProfiles, toConfirm, type Access } from "@/lib/role-access";
import { roleConfigs, type RoleSlug } from "@/lib/roles";

export const metadata: Metadata = { title: "Roles and access" };

const roleIcons: Record<RoleSlug, FilledIcon> = {
  student: UserFilled,
  advisor: GraduationFilled,
  assessor: UsersFilled,
  manager: CheckCircleFilled,
  director: LandmarkFilled,
  admin: KeyFilled,
};

// Admin only. The URL and session are read inside <Suspense> (Cache Components).
export default function RolesPage({ params }: PageProps<"/workspace/[role]/roles">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 animate-pulse rounded-lg bg-fill-1" />}>
      <Roles params={params} />
    </Suspense>
  );
}

async function Roles({ params }: { params: PageProps<"/workspace/[role]/roles">["params"] }) {
  const { role } = await params;
  if (role !== "admin") notFound();
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.workspaces.includes("admin")) redirect("/workspace");

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-text">Admin · Roles and access</p>
        <h1 className="mt-2 font-serif text-[36px] font-semibold leading-[42px] tracking-[-0.025em] sm:text-[40px] sm:leading-[46px]">
          Who does what in PLAR
        </h1>
        <p className="mt-3 max-w-3xl text-[17px] leading-[26px] text-label-2">
          The platform has six roles. Each person signs in once and sees only what their role needs. What each role does comes from the
          department&rsquo;s PLAR documents; who can see and do what is how the platform proposes to set it up.
        </p>
      </header>

      <RoleGrid />
      <AccessMatrix />
      <RoleDetails />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="offices" className="card p-6">
          <h2 id="offices" className="text-[19px] font-semibold tracking-[-0.015em]">Other TRU offices involved</h2>
          <p className="mt-1 text-[14px] leading-[20px] text-label-2">They take part in the process but don&rsquo;t sign in to the platform for now.</p>
          <dl className="mt-5 space-y-3.5">
            {otherOffices.map((o) => (
              <div key={o.name}>
                <dt className="text-[15px] font-semibold">{o.name}</dt>
                <dd className="text-[14px] leading-[20px] text-label-2">{o.part}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="confirm" className="card p-6">
          <h2 id="confirm" className="flex items-center gap-2 text-[19px] font-semibold tracking-[-0.015em]">
            <InfoFilled className="size-5 text-info" />
            Still to confirm
          </h2>
          <p className="mt-1 text-[14px] leading-[20px] text-label-2">Until these are answered, the platform will let either role hold these steps.</p>
          <ul className="mt-5 space-y-3">
            {toConfirm.map((item) => (
              <li key={item} className="flex gap-3 text-[14.5px] leading-[21px]">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-info" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function RoleTile({ slug, size = "md" }: { slug: RoleSlug; size?: "md" | "lg" }) {
  const Icon = roleIcons[slug];
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center text-white", size === "lg" ? "size-12 rounded-[14px]" : "size-10 rounded-[11px]")}
      style={{ background: roleConfigs[slug].tile }}
    >
      <Icon className={size === "lg" ? "size-6" : "size-5"} />
    </span>
  );
}

function RoleGrid() {
  return (
    <section aria-labelledby="six-roles">
      <h2 id="six-roles" className="sr-only">The six roles</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roleProfiles.map((r) => (
          <li key={r.slug}>
            <a
              href={`#role-${r.slug}`}
              className="card flex h-full flex-col gap-3 p-5 transition-[box-shadow,transform] hover:shadow-2 active:scale-[0.99]"
            >
              <RoleTile slug={r.slug} />
              <span className="text-[17px] font-semibold">{r.name}</span>
              <span className="text-[14px] leading-[20px] text-label-2">{r.purpose}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

const cellLabel: Record<Exclude<Access, null>, string> = {
  yes: "Yes",
  part: "Involved",
  confirm: "To confirm",
};

function Cell({ value }: { value: Access }) {
  if (value === "yes")
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-success-subtle text-success">
        <Check aria-hidden className="size-4 [stroke-width:2.75]" />
        <span className="sr-only">{cellLabel.yes}</span>
      </span>
    );
  if (value === "part")
    return (
      <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full bg-fill-1 px-2 text-[11.5px] font-medium text-neutral-chip-ink">{cellLabel.part}</span>
    );
  if (value === "confirm")
    return (
      <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full bg-info-subtle px-2 text-[11.5px] font-medium text-info">{cellLabel.confirm}</span>
    );
  return (
    <span className="inline-flex text-label-3">
      <Minus aria-hidden className="size-4" />
      <span className="sr-only">No</span>
    </span>
  );
}

function AccessMatrix() {
  return (
    <section aria-labelledby="access" className="card overflow-hidden">
      <div className="border-b border-separator px-6 py-5">
        <h2 id="access" className="text-[19px] font-semibold tracking-[-0.015em]">What each role can do</h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-label-2">
          <span className="inline-flex items-center gap-2">
            <Cell value="yes" /> Holds this
          </span>
          <span className="inline-flex items-center gap-2">
            <Cell value="part" /> Gives input or is involved
          </span>
          <span className="inline-flex items-center gap-2">
            <Cell value="confirm" /> May hold this, to be confirmed
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-2">
              <th scope="col" className="w-[32%] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-label-2">
                <span className="sr-only">Capability</span>
              </th>
              {roleProfiles.map((r) => (
                <th key={r.slug} scope="col" className="px-1.5 py-3 text-center text-[13px] font-semibold leading-[16px]">
                  <span className="flex flex-col items-center gap-1.5">
                    <span aria-hidden className="size-2.5 rounded-full" style={{ background: roleConfigs[r.slug].tile }} />
                    {r.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {capabilityGroups.map((group) => (
            <tbody key={group.title}>
              <tr>
                <th colSpan={7} scope="colgroup" className="border-t border-separator px-6 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-text">
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.label} className="border-t border-separator first:border-t-0 hover:bg-surface-2">
                  <th scope="row" className="px-5 py-3 text-[14px] font-medium leading-[20px]">
                    {row.label}
                  </th>
                  {roleProfiles.map((r) => (
                    <td key={r.slug} className="px-1.5 py-3 text-center">
                      <Cell value={row.access[r.slug]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

function RoleDetails() {
  return (
    <section aria-labelledby="in-detail" className="space-y-4">
      <h2 id="in-detail" className="font-serif text-[26px] font-semibold leading-[32px] tracking-[-0.02em]">Each role in detail</h2>
      {roleProfiles.map((r) => (
        <article key={r.slug} id={`role-${r.slug}`} aria-labelledby={`role-${r.slug}-name`} className="card scroll-mt-24 p-6">
          <div className="flex items-start gap-4">
            <RoleTile slug={r.slug} size="lg" />
            <div className="min-w-0">
              <h3 id={`role-${r.slug}-name`} className="text-[20px] font-semibold tracking-[-0.015em]">{r.name}</h3>
              <p className="mt-0.5 text-[15px] leading-[22px] text-label-2">{r.purpose}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">What they do</p>
              <ul className="space-y-2">
                {r.does.map((d) => (
                  <li key={d} className="flex gap-3 text-[14.5px] leading-[21px]">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: roleConfigs[r.slug].tile }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md bg-surface-2 p-4 shadow-[inset_0_0_0_1px_var(--separator)]">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">What they can see and do</p>
              <ul className="space-y-2">
                {r.access.map((a) => (
                  <li key={a} className="flex gap-2.5 text-[14.5px] leading-[21px]">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success [stroke-width:2.5]" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {r.note ? <p className="mt-4 text-[13.5px] leading-[19px] text-label-2">{r.note}</p> : null}
        </article>
      ))}
    </section>
  );
}
