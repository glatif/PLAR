"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isRoleSlug, roleConfigs, type NavItem } from "@/lib/roles";

/** The selected item swaps its outline icon for the filled one, so selection never relies on colour alone. */
function NavIcon({ item, selected, className }: { item: NavItem; selected: boolean; className?: string }) {
  const Icon = selected ? item.iconSelected : item.icon;
  return <Icon aria-hidden className={className} />;
}

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
          {role.nav.map((item) => {
            const selected = pathname === item.href;
            return (
              <li key={item.label} className="shrink-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors",
                      selected ? "bg-accent text-on-accent" : "bg-fill-1 text-label hover:bg-fill-2",
                    )}
                  >
                    <NavIcon item={item} selected={selected} className="size-4" />
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[14px] text-label-2 shadow-[inset_0_0_0_1px_var(--separator-strong)]"
                  >
                    <NavIcon item={item} selected={false} className="size-4" />
                    {item.label}
                    <span className="font-mono text-[11px]">{item.milestone}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={`${role.label} navigation`} className="space-y-0.5">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">{role.label}</p>
      {role.nav.map((item) => {
        const selected = pathname === item.href;
        return item.href ? (
          <Link
            key={item.label}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-[9px] px-3 text-[14px] transition-colors",
              selected ? "bg-accent-soft font-semibold text-accent-ink" : "font-medium text-label hover:bg-fill-1",
            )}
          >
            <NavIcon item={item} selected={selected} className={cn("size-[18px]", selected ? "text-accent-text" : "text-label-2")} />
            {item.label}
          </Link>
        ) : (
          <span
            key={item.label}
            aria-disabled="true"
            className="flex h-10 items-center gap-3 rounded-[9px] px-3 text-[14px] text-label-2"
          >
            <NavIcon item={item} selected={false} className="size-[18px]" />
            <span className="flex-1">{item.label}</span>
            <span className="rounded-full bg-fill-1 px-2 py-0.5 font-mono text-[11px]">{item.milestone}</span>
          </span>
        );
      })}
    </nav>
  );
}
