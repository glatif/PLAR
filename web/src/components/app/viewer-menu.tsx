import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/app/sign-in/actions";
import { getViewer, roleLabels } from "@/lib/auth";
import { initials } from "@/lib/format";
import { roleConfigs } from "@/lib/roles";

/** Signed-in person, their other workspaces (if any) and sign-out. Reads the session, so render it inside <Suspense>. */
export async function ViewerMenu() {
  const viewer = await getViewer();
  if (!viewer) return null;

  return (
    <div className="flex items-center gap-2">
      {viewer.workspaces.length > 1
        ? viewer.workspaces.map((slug) => (
            <Link key={slug} href={`/workspace/${slug}`} className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-label-2 hover:bg-fill-1 hover:text-label md:inline-flex">
              {roleConfigs[slug].label}
            </Link>
          ))
        : null}
      <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 sm:pr-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-ink" aria-hidden>
          {initials(viewer.name)}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-[13px] font-semibold">{viewer.name}</span>
          <span className="block text-[11.5px] text-label-2">{viewer.roles.map((r) => roleLabels[r]).join(" · ")}</span>
        </span>
      </div>
      <Link
        href="/account/password"
        aria-label="Change password"
        title="Change password"
        className="flex size-9 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-fill-1 hover:text-label"
      >
        <KeyRound aria-hidden className="size-[18px]" />
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-accent-text transition-colors hover:bg-accent-subtle"
        >
          <LogOut aria-hidden className="size-4" />
          <span className="hidden sm:inline">Sign out</span>
          <span className="sr-only sm:hidden">Sign out</span>
        </button>
      </form>
    </div>
  );
}
