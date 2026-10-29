"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isRoleSlug, roleConfigs } from "@/lib/roles";

/** Sidebar navigation for the current role. Items not built yet are shown, but disabled, with their milestone. */
export function WorkspaceNav({ variant = "sidebar" }: { variant?: "sidebar" | "tabs" }) {
  const pathname = usePathname();
  const slug = pathname.split("/")[2] ?? "";
  const role = isRoleSlug(slug) ? roleConfigs[slug] : null;
  if (!role) return null;

  if (variant === "tabs") {
    return (
      <nav aria-label={`${role.label} navigation`} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {role.nav.map((item) => (
            <li key={item.label} className="shrink-0">
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium",
                    pathname === item.href ? "bg-accent text-on-accent" : "bg-black/5 text-label dark:bg-white/10",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-disabled="true" className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[14px] text-label-2 shadow-[inset_0_0_0_1px_var(--separator)]">
                  {item.label}
                  <span className="text-[11px] font-medium">{item.milestone}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={`${role.label} navigation`} className="space-y-1">
      <p className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-label-2">{role.label}</p>
      {role.nav.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "flex h-10 items-center rounded-sm px-3 text-[14px] font-medium transition-colors",
              pathname === item.href ? "bg-accent-subtle text-accent-ink" : "text-label hover:bg-black/5 dark:hover:bg-white/10",
            )}
          >
            {item.label}
          </Link>
        ) : (
          <span
            key={item.label}
            aria-disabled="true"
            className="flex h-10 items-center justify-between rounded-sm px-3 text-[14px] text-label-2"
          >
            {item.label}
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium dark:bg-white/10">{item.milestone}</span>
          </span>
        ),
      )}
    </nav>
  );
}
